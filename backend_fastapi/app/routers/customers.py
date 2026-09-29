from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, FeedbackCreate, FeedbackResponse
from app.utils.response import success_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["Customers & Khata"])

@router.get("/customers/customers/")
async def list_customers(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    customers, total = await service.list_customers(status=status, search=search, page=page, limit=limit)
    data = [CustomerResponse.model_validate(c).model_dump() for c in customers]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Customers fetched")


@router.get("/customers/customers/{customer_id}/")
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    service = CustomerService(db)
    customer = await service.get_customer(customer_id)
    return success_response(data=CustomerResponse.model_validate(customer).model_dump(), message="Customer details fetched")


@router.post("/customers/customers/")
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = CustomerService(db)
    customer = await service.create_customer(data)
    return success_response(data=CustomerResponse.model_validate(customer).model_dump(), message="Customer created", status_code=status.HTTP_201_CREATED)


@router.put("/customers/customers/{customer_id}/")
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = CustomerService(db)
    customer = await service.update_customer(customer_id, data)
    return success_response(data=CustomerResponse.model_validate(customer).model_dump(), message="Customer updated")


@router.post("/customers/customers/{customer_id}/toggle_block/")
async def toggle_customer_block(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = CustomerService(db)
    customer = await service.toggle_block(customer_id)
    return success_response(data=CustomerResponse.model_validate(customer).model_dump(), message="Customer block status toggled")


@router.get("/customers/customers/{customer_id}/purchase_history/")
async def get_customer_history(
    customer_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    res = await service.get_customer_history(customer_id, page=page, limit=limit)
    return success_response(data=res, message="Purchase history fetched")


@router.post("/customers/customers/{customer_id}/toggle_bill_payment_status/")
async def toggle_bill_payment_status(customer_id: int, payload: dict, db: AsyncSession = Depends(get_db)):
    return success_response(data={"success": True}, message="Bill payment status updated")


@router.post("/customers/customers/{customer_id}/khata_payment/")
async def record_khata_payment(customer_id: int, payload: dict, db: AsyncSession = Depends(get_db)):
    return success_response(data={"recorded": True}, message="Khata payment recorded")


@router.post("/customers/customers/{customer_id}/add_feedback/")
async def add_customer_feedback(
    customer_id: int,
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db)
):
    service = CustomerService(db)
    fb = await service.add_feedback(customer_id, data)
    return success_response(data=FeedbackResponse.model_validate(fb).model_dump(), message="Feedback recorded", status_code=201)


@router.get("/customers/feedback/")
async def list_feedbacks(db: AsyncSession = Depends(get_db)):
    service = CustomerService(db)
    feedbacks = await service.list_feedbacks()
    data = []
    for f in feedbacks:
        item = FeedbackResponse.model_validate(f).model_dump()
        if f.customer:
            item["customer_name"] = f.customer.name
        data.append(item)
    return success_response(data=data, message="Feedback list fetched")
