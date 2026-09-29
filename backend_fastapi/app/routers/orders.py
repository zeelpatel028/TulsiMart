from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import LoginAccount
from app.services.order_service import OrderService
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse, PaymentTransactionResponse
from app.utils.response import success_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["POS Orders & Billing"])

@router.get("/orders/orders/")
async def list_orders(
    customer_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    orders, total = await service.list_orders(
        customer_id=customer_id,
        status=status,
        payment_status=payment_status,
        search=search,
        page=page,
        limit=limit
    )
    data = [OrderResponse.model_validate(o).model_dump() for o in orders]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Orders fetched")


@router.get("/orders/orders/{order_id}/")
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    service = OrderService(db)
    order = await service.get_order(order_id)
    return success_response(data=OrderResponse.model_validate(order).model_dump(), message="Order details fetched")


@router.post("/orders/orders/")
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[LoginAccount] = Depends(get_current_user)
):
    service = OrderService(db)
    user_id = current_user.id if current_user else None
    order = await service.create_order(data, created_by_id=user_id)
    return success_response(data=OrderResponse.model_validate(order).model_dump(), message="Order created successfully", status_code=status.HTTP_201_CREATED)




@router.post("/orders/orders/{order_id}/update_status/")
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = OrderService(db)
    order = await service.update_status(order_id, status_str=data.status, payment_status_str=data.payment_status)
    return success_response(data=OrderResponse.model_validate(order).model_dump(), message="Order status updated")


@router.post("/orders/orders/{order_id}/toggle_payment_status/")
async def toggle_payment_status(
    order_id: int,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = OrderService(db)
    payment_status = payload.get("payment_status", "PAID")
    order = await service.toggle_payment_status(order_id, payment_status)
    return success_response(data=OrderResponse.model_validate(order).model_dump(), message="Payment status updated")


@router.get("/orders/orders/{order_id}/invoice_details/")
async def get_invoice_details(order_id: int, db: AsyncSession = Depends(get_db)):
    service = OrderService(db)
    order = await service.get_order(order_id)
    order_data = OrderResponse.model_validate(order).model_dump()
    return success_response(data={"order": order_data}, message="Invoice details fetched")


@router.get("/orders/payments/")
async def list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    payments, total = await service.list_payments(page=page, limit=limit)
    data = [PaymentTransactionResponse.model_validate(p).model_dump() for p in payments]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Payments fetched")
