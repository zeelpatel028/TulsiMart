from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

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
def list_suppliers(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = SupplierService(db)
    suppliers, total = service.list_suppliers(search=search, is_active=is_active, page=page, limit=limit)
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
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    supplier = service.create_supplier(data)
    return success_response(data=SupplierResponse.model_validate(supplier).model_dump(), message="Supplier created", status_code=status.HTTP_201_CREATED)


@router.put("/suppliers/suppliers/{supplier_id}/")
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    supplier = service.update_supplier(supplier_id, data)
    return success_response(data=SupplierResponse.model_validate(supplier).model_dump(), message="Supplier updated")


@router.delete("/suppliers/suppliers/{supplier_id}/")
@router.delete("/suppliers/{supplier_id}/")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    service.delete_supplier(supplier_id)
    return success_response(message="Supplier deleted successfully")


# --- PURCHASE ORDERS ---

@router.get("/suppliers/purchase-orders/")
def list_purchase_orders(
    supplier_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = SupplierService(db)
    pos, total = service.list_purchase_orders(supplier_id=supplier_id, page=page, limit=limit)
    data = []
    for po in pos:
        item = PurchaseOrderResponse.model_validate(po).model_dump()
        if po.supplier:
            item["supplier_name"] = po.supplier.name
        data.append(item)

    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Purchase orders fetched")


@router.post("/suppliers/purchase-orders/")
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    po = service.create_purchase_order(data)
    return success_response(data=PurchaseOrderResponse.model_validate(po).model_dump(), message="Purchase order created", status_code=201)


@router.post("/suppliers/purchase-orders/{po_id}/update_status/")
def update_po_status(
    po_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    po_status = payload.get("status", "RECEIVED")
    po = service.update_po_status(po_id, po_status)
    return success_response(data=PurchaseOrderResponse.model_validate(po).model_dump(), message="Purchase order status updated")


# --- SUPPLIER PAYMENTS ---

@router.get("/suppliers/payments/")
def list_supplier_payments(
    supplier_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = SupplierService(db)
    payments, total = service.list_supplier_payments(supplier_id=supplier_id, page=page, limit=limit)
    data = [SupplierPaymentResponse.model_validate(p).model_dump() for p in payments]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Supplier payments fetched")


@router.post("/suppliers/payments/")
def create_supplier_payment(
    data: SupplierPaymentCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = SupplierService(db)
    payment = service.create_supplier_payment(data)
    return success_response(data=SupplierPaymentResponse.model_validate(payment).model_dump(), message="Supplier payment recorded", status_code=201)
