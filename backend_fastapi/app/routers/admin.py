from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.models.store import StoreSetting, CashRegisterEntry, BankTransaction, HomeCashTransaction
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
async def get_store_settings(db: AsyncSession = Depends(get_db)):
    repo = StoreRepository(db)
    setting = await repo.get_settings()
    data = StoreSettingResponse.model_validate(setting).model_dump()
    return success_response(data=data, message="Store settings fetched")


@router.put("/core/settings/")
@router.patch("/core/settings/")
async def update_store_settings(
    data: StoreSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    repo = StoreRepository(db)
    setting = await repo.get_settings()
    
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(setting, key, value)

    updated_setting = await repo.update_settings(setting)
    res_data = StoreSettingResponse.model_validate(updated_setting).model_dump()
    return success_response(data=res_data, message="Store settings updated")


# --- GULLA / CASH REGISTER ---

@router.get("/core/gulla/")
async def get_gulla_summary(
    date_str: Optional[str] = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db)
):
    repo = StoreRepository(db)
    target_date = date.fromisoformat(date_str) if date_str else date.today()
    entries = await repo.list_gulla_entries(target_date)
    
    total_cash_in = sum(e.amount for e in entries if e.entry_type in ["OPENING_FLOAT", "CASH_IN", "BILL_SALE", "KHATA_PAYMENT"])
    total_cash_out = sum(e.amount for e in entries if e.entry_type in ["CASH_OUT", "SUPPLIER_PAYMENT", "EXPENSE"])
    current_balance = total_cash_in - total_cash_out

    entries_data = [CashEntryResponse.model_validate(e).model_dump() for e in entries]

    return success_response(
        data={
            "date": str(target_date),
            "current_balance": current_balance,
            "total_cash_in": total_cash_in,
            "total_cash_out": total_cash_out,
            "entries": entries_data
        },
        message="Gulla summary fetched"
    )


@router.post("/core/gulla/entry/")
async def create_gulla_entry(
    data: CashEntryCreate,
    db: AsyncSession = Depends(get_db),
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
    created_entry = await repo.add_gulla_entry(entry)
    return success_response(data=CashEntryResponse.model_validate(created_entry).model_dump(), message="Cash entry recorded", status_code=201)


@router.post("/core/gulla/calculate-notes/")
async def calculate_notes(payload: dict):
    counts = payload.get("counts", {})
    denominations = {"2000": 2000, "500": 500, "200": 200, "100": 100, "50": 50, "20": 20, "10": 10, "5": 5, "2": 2, "1": 1}
    total = sum(int(counts.get(k, 0)) * v for k, v in denominations.items())
    return success_response(data={"total": total}, message="Notes total calculated")


@router.post("/core/gulla/eod-sweep/")
async def eod_sweep(payload: dict, db: AsyncSession = Depends(get_db), current_user: LoginAccount = Depends(require_admin)):
    return success_response(data={"swept": True, "amount": payload.get("amount", 0)}, message="EOD sweep complete")


@router.post("/core/gulla/toggle-auto-sweep/")
async def toggle_auto_sweep(payload: dict, db: AsyncSession = Depends(get_db), current_user: LoginAccount = Depends(require_admin)):
    repo = StoreRepository(db)
    settings_obj = await repo.get_settings()
    settings_obj.auto_1130_sweep_enabled = payload.get("enabled", True)
    await repo.update_settings(settings_obj)
    return success_response(data={"enabled": settings_obj.auto_1130_sweep_enabled}, message="Auto sweep updated")


# --- BANK TRANSACTIONS ---

@router.get("/core/bank-transactions/")
async def list_bank_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    repo = StoreRepository(db)
    txs, total = await repo.list_bank_transactions(page=page, limit=limit)
    data = [BankTransactionResponse.model_validate(t).model_dump() for t in txs]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Bank transactions fetched")


@router.post("/core/bank-transactions/")
async def create_bank_transaction(
    data: BankTransactionCreate,
    db: AsyncSession = Depends(get_db),
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
    created_tx = await repo.add_bank_transaction(tx)
    return success_response(data=BankTransactionResponse.model_validate(created_tx).model_dump(), message="Bank transaction recorded", status_code=201)


@router.get("/core/bank-transactions/summary/")
async def get_bank_summary(db: AsyncSession = Depends(get_db)):
    repo = StoreRepository(db)
    txs, _ = await repo.list_bank_transactions(page=1, limit=1000)
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
async def get_home_cash_data(db: AsyncSession = Depends(get_db)):
    repo = StoreRepository(db)
    settings_obj = await repo.get_settings()
    txs = await repo.list_home_cash()
    entries_data = [HomeCashResponse.model_validate(t).model_dump() for t in txs]
    return success_response(
        data={
            "balance": float(settings_obj.home_cash_amount),
            "transactions": entries_data
        },
        message="Home cash safe data fetched"
    )


@router.post("/core/home-cash/")
async def create_home_cash_transaction(
    data: HomeCashCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    repo = StoreRepository(db)
    settings_obj = await repo.get_settings()

    current_bal = float(settings_obj.home_cash_amount)
    if data.entry_type in ["DEPOSIT", "SWEEP"]:
        new_bal = current_bal + data.amount
    else:
        new_bal = current_bal - data.amount

    settings_obj.home_cash_amount = new_bal
    await repo.update_settings(settings_obj)

    tx = HomeCashTransaction(
        entry_type=data.entry_type,
        amount=data.amount,
        denomination_counts=data.denomination_counts,
        notes=data.notes,
        created_by_name=current_user.full_name,
        balance_after=new_bal
    )
    created_tx = await repo.add_home_cash(tx)
    return success_response(data=HomeCashResponse.model_validate(created_tx).model_dump(), message="Home cash transaction recorded", status_code=201)
