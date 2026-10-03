from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, FeedbackCreate, FeedbackResponse
from app.utils.response import success_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["Customers & Khata"])

from app.schemas.order import OrderResponse


def safe_iso(val):
    if not val:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)


def serialize_customer_fast(c, stats: Optional[dict] = None) -> dict:
    if not stats:
        stats = {"total_orders": 0, "total_spent": 0.0, "pending_payments": 0.0}

    return {
        "id": c.id,
        "name": c.name,
        "phone": c.phone,
        "email": c.email,
        "address": c.address,
        "city": c.city,
        "state": getattr(c, "state", "Maharashtra"),
        "pincode": c.pincode,
        "gstin": getattr(c, "gstin", None),
        "status": c.status or "ACTIVE",
        "notes": c.notes,
        "outstanding_balance": float(stats.get("pending_payments", 0.0)),
        "total_orders": stats.get("total_orders", 0),
        "total_spent": stats.get("total_spent", 0.0),
        "pending_payments": stats.get("pending_payments", 0.0),
        "created_at": safe_iso(getattr(c, "created_at", None)),
        "updated_at": safe_iso(getattr(c, "updated_at", None)),
    }


@router.get("/customers/customers/")
@router.get("/customers/")
def list_customers(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: Optional[int] = Query(None),
    page_size: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    eff_limit = page_size or limit or 20
    if eff_limit > 500:
        eff_limit = 500
    service = CustomerService(db)
    customers, stats_map, total = service.list_customers(status=status, search=search, page=page, limit=eff_limit)
    data = [serialize_customer_fast(c, stats_map.get(c.id)) for c in customers]
    pagination = get_pagination_meta(total, page, eff_limit)
    return success_response(data=data, pagination=pagination, message="Customers fetched")


@router.get("/customers/customers/{customer_id}/")
@router.get("/customers/{customer_id}/")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    service = CustomerService(db)
    customer = service.get_customer(customer_id)
    stats = service.get_customer_stats(customer_id)
    item = serialize_customer_fast(customer, stats)
    return success_response(data=item, message="Customer details fetched")


@router.post("/customers/customers/")
@router.post("/customers/")
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = CustomerService(db)
    customer = service.create_customer(data)
    stats = service.get_customer_stats(customer.id)
    return success_response(data=serialize_customer_fast(customer, stats), message="Customer created", status_code=status.HTTP_201_CREATED)


@router.put("/customers/customers/{customer_id}/")
@router.put("/customers/{customer_id}/")
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = CustomerService(db)
    customer = service.update_customer(customer_id, data)
    stats = service.get_customer_stats(customer.id)
    return success_response(data=serialize_customer_fast(customer, stats), message="Customer updated")


@router.delete("/customers/customers/{customer_id}/")
@router.delete("/customers/{customer_id}/")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = CustomerService(db)
    service.delete_customer(customer_id)
    return success_response(data={"id": customer_id}, message="Customer deleted successfully")


@router.post("/customers/customers/{customer_id}/toggle_block/")
def toggle_customer_block(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = CustomerService(db)
    customer = service.toggle_block(customer_id)
    stats = service.get_customer_stats(customer.id)
    return success_response(data=serialize_customer_fast(customer, stats), message="Customer block status toggled")


@router.get("/customers/customers/{customer_id}/purchase_history/")
def get_customer_history(
    customer_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = CustomerService(db)
    res = service.get_customer_history(customer_id, page=page, limit=limit)
    raw_orders = res.get("orders", [])
    orders_data = [OrderResponse.model_validate(o).model_dump() for o in raw_orders]
    customer = res.get("customer")
    stats = res.get("stats", {})
    cust_data = serialize_customer_fast(customer, stats) if customer else None
    return success_response(data={"customer": cust_data, "orders": orders_data, "total_orders": res.get("total_orders", 0)}, message="Purchase history fetched")


@router.post("/customers/customers/{customer_id}/toggle_bill_payment_status/")
def toggle_bill_payment_status(customer_id: int, payload: dict, db: Session = Depends(get_db)):
    service = CustomerService(db)
    order_id = payload.get("order_id")
    target_status = payload.get("target_status", "PAID")
    res = service.toggle_bill_payment_status(customer_id, order_id=order_id, target_status=target_status)
    return success_response(data=res, message=res.get("message", "Bill payment status updated"))


@router.post("/customers/customers/{customer_id}/khata_payment/")
def record_khata_payment(customer_id: int, payload: dict, db: Session = Depends(get_db)):
    service = CustomerService(db)
    res = service.record_khata_payment(customer_id, payload)
    return success_response(data=res, message=res.get("message", "Khata payment recorded"))


@router.post("/customers/customers/{customer_id}/add_feedback/")
def add_customer_feedback(
    customer_id: int,
    data: FeedbackCreate,
    db: Session = Depends(get_db)
):
    service = CustomerService(db)
    fb = service.add_feedback(customer_id, data)
    return success_response(data=FeedbackResponse.model_validate(fb).model_dump(), message="Feedback recorded", status_code=201)


@router.get("/customers/feedback/")
def list_feedbacks(db: Session = Depends(get_db)):
    service = CustomerService(db)
    feedbacks = service.list_feedbacks()
    data = []
    for f in feedbacks:
        item = FeedbackResponse.model_validate(f).model_dump()
        if f.customer:
            item["customer_name"] = f.customer.name
        data.append(item)
    return success_response(data=data, message="Feedback list fetched")

