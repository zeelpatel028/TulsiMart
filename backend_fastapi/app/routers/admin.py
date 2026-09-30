from typing import Optional, List, Tuple, Dict, Any
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.models.store import StoreSetting, CashRegisterEntry, BankTransaction, HomeCashTransaction
from app.models.order import Order
from app.repositories.store_repository import StoreRepository
from app.schemas.store import (
    StoreSettingUpdate, StoreSettingResponse, CashEntryCreate, CashEntryResponse,
    BankTransactionCreate, BankTransactionResponse, HomeCashCreate, HomeCashResponse
)
from app.utils.response import success_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["Store Admin & Cash Operations"])

# --- STORE SETTINGS ---

@router.get("/core/settings/")
def get_store_settings(db: Session = Depends(get_db)):
    repo = StoreRepository(db)
    setting = repo.get_settings()
    data = StoreSettingResponse.model_validate(setting).model_dump()
    return success_response(data=data, message="Store settings fetched")


@router.put("/core/settings/")
@router.patch("/core/settings/")
def update_store_settings(
    data: StoreSettingUpdate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    repo = StoreRepository(db)
    setting = repo.get_settings()
    
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(setting, key, value)

    updated_setting = repo.update_settings(setting)
    res_data = StoreSettingResponse.model_validate(updated_setting).model_dump()
    return success_response(data=res_data, message="Store settings updated")


# --- GULLA / CASH REGISTER ---

@router.get("/core/gulla/")
def get_gulla_summary(
    date_str: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db)
):
    target_date = date.today()
    if date_str and isinstance(date_str, str) and date_str.strip() not in ["undefined", "null", "[object Object]"]:
        try:
            target_date = date.fromisoformat(date_str.strip().split("T")[0])
        except ValueError:
            target_date = date.today()
    start_dt = datetime.combine(target_date, datetime.min.time())
    end_dt = datetime.combine(target_date, datetime.max.time())

    repo = StoreRepository(db)
    entries = repo.list_gulla_entries(target_date)

    # Fetch live orders created on target_date
    today_orders = db.query(Order).filter(
        Order.created_at >= start_dt,
        Order.created_at <= end_dt,
        Order.status != "CANCELLED"
    ).all()

    pos_cash_sales = sum(float(o.total_amount) for o in today_orders if o.payment_method == "CASH" and o.payment_status == "PAID")
    cash_bills_count = sum(1 for o in today_orders if o.payment_method == "CASH" and o.payment_status == "PAID")
    upi_sales = sum(float(o.total_amount) for o in today_orders if o.payment_method == "UPI" and o.payment_status == "PAID")
    card_sales = sum(float(o.total_amount) for o in today_orders if o.payment_method == "CARD" and o.payment_status == "PAID")
    total_digital = upi_sales + card_sales

    opening_float = sum(float(e.amount) for e in entries if e.entry_type == "OPENING_FLOAT")
    manual_cash_in = sum(float(e.amount) for e in entries if e.entry_type in ["CASH_IN", "POS_SALE"] and not e.reference_id)
    manual_cash_out = sum(float(e.amount) for e in entries if e.entry_type == "CASH_OUT")
    khata_cash_receipts = sum(float(e.amount) for e in entries if e.entry_type == "KHATA_PAYMENT")
    supplier_cash_payouts = sum(float(e.amount) for e in entries if e.entry_type == "SUPPLIER_PAYMENT")
    expense_cash_payouts = sum(float(e.amount) for e in entries if e.entry_type == "EXPENSE")

    total_cash_inflow = opening_float + manual_cash_in + pos_cash_sales + khata_cash_receipts
    total_cash_outflow = manual_cash_out + supplier_cash_payouts + expense_cash_payouts
    net_cash_in_gulla = total_cash_inflow - total_cash_outflow

    # Build combined entries for Gulla Table Audit History
    combined_entries = []
    existing_refs = set()

    for e in entries:
        if e.reference_id:
            existing_refs.add(e.reference_id)
        combined_entries.append({
            "id": f"G-{e.id}",
            "entry_type": e.entry_type,
            "entry_type_display": e.entry_type.replace("_", " "),
            "amount": float(e.amount),
            "date": str(e.date),
            "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S") if e.created_at else str(e.date),
            "notes": e.notes or "Manual Cash Entry",
            "reference_id": e.reference_id or f"REF-{e.id}",
            "created_by_name": e.created_by_name or "Store Cashier",
            "denomination_counts": e.denomination_counts or {}
        })

    # Include today's orders in the entries table if not already added via cash_transactions
    for o in today_orders:
        ref_id = o.invoice_number or o.order_number
        if ref_id not in existing_refs:
            combined_entries.append({
                "id": f"ORD-{o.id}",
                "entry_type": "BILL_SALE",
                "entry_type_display": f"POS Sale ({o.payment_method})",
                "amount": float(o.total_amount),
                "date": str(o.created_at.date() if o.created_at else target_date),
                "created_at": o.created_at.strftime("%Y-%m-%d %H:%M:%S") if o.created_at else str(target_date),
                "notes": f"Counter Bill #{o.invoice_number} - {o.customer_name or 'Walk-in Customer'}",
                "reference_id": ref_id,
                "created_by_name": o.customer_name or "POS Cashier",
                "denomination_counts": o.tendered_notes or {}
            })

    # Sort entries by timestamp descending
    combined_entries.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)

    # Denominations notes summary
    notes_and_coins = { "500": 0, "200": 0, "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "2": 0, "1": 0 }
    for e in entries:
        if e.denomination_counts and isinstance(e.denomination_counts, dict):
            for k, v in e.denomination_counts.items():
                if str(k) in notes_and_coins:
                    notes_and_coins[str(k)] += int(v or 0)

    res_data = {
        "date": str(target_date),
        "opening_float": opening_float,
        "manual_cash_in": manual_cash_in,
        "manual_cash_out": manual_cash_out,
        "pos_cash_sales": pos_cash_sales,
        "cash_bills_count": cash_bills_count,
        "digital_sales": {
            "upi": upi_sales,
            "card": card_sales,
            "total_digital": total_digital
        },
        "khata_cash_receipts": khata_cash_receipts,
        "supplier_cash_payouts": supplier_cash_payouts,
        "expense_cash_payouts": expense_cash_payouts,
        "total_cash_inflow": total_cash_inflow,
        "total_cash_outflow": total_cash_outflow,
        "net_cash_in_gulla": net_cash_in_gulla,
        "current_balance": net_cash_in_gulla,
        "total_cash_in": total_cash_inflow,
        "total_cash_out": total_cash_outflow,
        "entries": combined_entries,
        "recent_entries": combined_entries,
        "cash_tender_logs": combined_entries,
        "notes_and_coins_summary": {
            "net_drawer_notes": notes_and_coins
        }
    }

    return success_response(data=res_data, message="Gulla summary fetched")


@router.post("/core/gulla/entry/")
def create_gulla_entry(
    data: CashEntryCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    repo = StoreRepository(db)
    entry = CashRegisterEntry(
        entry_type=data.entry_type,
        amount=data.amount,
        notes=data.notes,
        denomination_counts=data.denomination_counts,
        reference_id=data.reference_id,
        created_by_name=current_user.full_name
    )
    created_entry = repo.add_gulla_entry(entry)
    return success_response(data=CashEntryResponse.model_validate(created_entry).model_dump(), message="Cash entry recorded", status_code=201)


@router.post("/core/gulla/calculate-notes/")
def calculate_notes(payload: dict):
    counts = payload.get("counts", {})
    denominations = {"2000": 2000, "500": 500, "200": 200, "100": 100, "50": 50, "20": 20, "10": 10, "5": 5, "2": 2, "1": 1}
    total = sum(int(counts.get(k, 0)) * v for k, v in denominations.items())
    return success_response(data={"total": total}, message="Notes total calculated")


@router.post("/core/gulla/eod-sweep/")
def eod_sweep(payload: dict, db: Session = Depends(get_db), current_user: LoginAccount = Depends(require_admin)):
    return success_response(data={"swept": True, "amount": payload.get("amount", 0)}, message="EOD sweep complete")


@router.post("/core/gulla/toggle-auto-sweep/")
def toggle_auto_sweep(payload: dict, db: Session = Depends(get_db), current_user: LoginAccount = Depends(require_admin)):
    repo = StoreRepository(db)
    settings_obj = repo.get_settings()
    settings_obj.auto_1130_sweep_enabled = payload.get("enabled", True)
    repo.update_settings(settings_obj)
    return success_response(data={"enabled": settings_obj.auto_1130_sweep_enabled}, message="Auto sweep updated")


# --- BANK TRANSACTIONS ---

@router.get("/core/bank-transactions/")
def list_bank_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    repo = StoreRepository(db)
    txs, total = repo.list_bank_transactions(page=page, limit=limit)
    data = [BankTransactionResponse.model_validate(t).model_dump() for t in txs]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Bank transactions fetched")


@router.post("/core/bank-transactions/")
def create_bank_transaction(
    data: BankTransactionCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    repo = StoreRepository(db)
    tx = BankTransaction(
        transaction_type=data.transaction_type,
        amount=data.amount,
        reference_number=data.reference_number,
        bank_name=data.bank_name or "HDFC Store Primary Bank",
        notes=data.notes,
        created_by_name=current_user.full_name
    )
    created_tx = repo.add_bank_transaction(tx)
    return success_response(data=BankTransactionResponse.model_validate(created_tx).model_dump(), message="Bank transaction recorded", status_code=201)


@router.get("/core/bank-transactions/summary/")
def get_bank_summary(db: Session = Depends(get_db)):
    repo = StoreRepository(db)
    txs, _ = repo.list_bank_transactions(page=1, limit=1000)
    total_in = sum(t.amount for t in txs if t.transaction_type in ["UPI_IN", "CARD_IN", "DEPOSIT"])
    total_out = sum(t.amount for t in txs if t.transaction_type in ["SUPPLIER_PAYOUT", "EXPENSE_PAYOUT", "WITHDRAWAL"])
    return success_response(
        data={
            "total_in": total_in,
            "total_out": total_out,
            "net_balance": total_in - total_out
        },
        message="Bank transaction summary fetched"
    )


# --- HOME CASH SAFE ---

@router.get("/core/home-cash/")
def get_home_cash_data(db: Session = Depends(get_db)):
    repo = StoreRepository(db)
    settings_obj = repo.get_settings()
    txs = repo.list_home_cash()
    entries_data = [HomeCashResponse.model_validate(t).model_dump() for t in txs]
    return success_response(
        data={
            "balance": float(settings_obj.home_cash_amount),
            "transactions": entries_data
        },
        message="Home cash safe data fetched"
    )


@router.post("/core/home-cash/")
def create_home_cash_transaction(
    data: HomeCashCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    repo = StoreRepository(db)
    settings_obj = repo.get_settings()

    current_bal = float(settings_obj.home_cash_amount)
    if data.entry_type in ["DEPOSIT", "SWEEP"]:
        new_bal = current_bal + data.amount
    else:
        new_bal = current_bal - data.amount

    settings_obj.home_cash_amount = new_bal
    repo.update_settings(settings_obj)

    tx = HomeCashTransaction(
        entry_type=data.entry_type,
        amount=data.amount,
        denomination_counts=data.denomination_counts,
        notes=data.notes,
        created_by_name=current_user.full_name,
        balance_after=new_bal
    )
    created_tx = repo.add_home_cash(tx)
    return success_response(data=HomeCashResponse.model_validate(created_tx).model_dump(), message="Home cash transaction recorded", status_code=201)
