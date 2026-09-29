from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.services.supplier_service import SupplierService
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierResponse, PurchaseOrderCreate,
    PurchaseOrderResponse, SupplierPaymentCreate, SupplierPaymentResponse
)
from app.utils.response import success_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["Suppliers & Purchase Orders"])

# --- SUPPLIERS ---

@router.get("/suppliers/suppliers/")
async def list_suppliers(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = SupplierService(db)
    suppliers, total = await service.list_suppliers(search=search, is_active=is_active, page=page, limit=limit)
    data = []
    for s in suppliers:
        item = SupplierResponse.model_validate(s).model_dump()
        item["total_purchases"] = getattr(s, "total_purchases", 0.0)
        item["total_paid"] = getattr(s, "total_paid", 0.0)
        item["pending_balance"] = getattr(s, "pending_balance", 0.0)
        data.append(item)

    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Suppliers fetched")


@router.post("/suppliers/suppliers/")
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    supplier = await service.create_supplier(data)
    return success_response(data=SupplierResponse.model_validate(supplier).model_dump(), message="Supplier created", status_code=status.HTTP_201_CREATED)


@router.put("/suppliers/suppliers/{supplier_id}/")
async def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    supplier = await service.update_supplier(supplier_id, data)
    return success_response(data=SupplierResponse.model_validate(supplier).model_dump(), message="Supplier updated")


# --- PURCHASE ORDERS ---

@router.get("/suppliers/purchase-orders/")
async def list_purchase_orders(
    supplier_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = SupplierService(db)
    pos, total = await service.list_purchase_orders(supplier_id=supplier_id, page=page, limit=limit)
    data = []
    for po in pos:
        item = PurchaseOrderResponse.model_validate(po).model_dump()
        if po.supplier:
            item["supplier_name"] = po.supplier.name
        data.append(item)

    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Purchase orders fetched")


@router.post("/suppliers/purchase-orders/")
async def create_purchase_order(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    po = await service.create_purchase_order(data)
    return success_response(data=PurchaseOrderResponse.model_validate(po).model_dump(), message="Purchase order created", status_code=201)


@router.post("/suppliers/purchase-orders/{po_id}/update_status/")
async def update_po_status(
    po_id: int,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    po_status = payload.get("status", "RECEIVED")
    po = await service.update_po_status(po_id, po_status)
    return success_response(data=PurchaseOrderResponse.model_validate(po).model_dump(), message="Purchase order status updated")


# --- SUPPLIER PAYMENTS ---

@router.get("/suppliers/payments/")
async def list_supplier_payments(
    supplier_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = SupplierService(db)
    payments, total = await service.list_supplier_payments(supplier_id=supplier_id, page=page, limit=limit)
    data = [SupplierPaymentResponse.model_validate(p).model_dump() for p in payments]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Supplier payments fetched")


@router.post("/suppliers/payments/")
async def create_supplier_payment(
    data: SupplierPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    payment = await service.create_supplier_payment(data)
    return success_response(data=SupplierPaymentResponse.model_validate(payment).model_dump(), message="Supplier payment recorded", status_code=201)
