from typing import List, Tuple, Optional
from datetime import date
from decimal import Decimal
import time, random
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.supplier_repository import SupplierRepository
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, SupplierPayment
from app.schemas.supplier import SupplierCreate, SupplierUpdate, PurchaseOrderCreate, SupplierPaymentCreate


class SupplierService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SupplierRepository(db)

    def list_suppliers(
        self,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Supplier], int]:
        return self.repo.list_suppliers(search=search, is_active=is_active, page=page, limit=limit)

    def get_supplier(self, supplier_id: int) -> Supplier:
        supplier = self.repo.get_by_id(supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return supplier

    def create_supplier(self, data: SupplierCreate) -> Supplier:
        supplier = Supplier(
            name=data.name,
            company_name=data.company_name,
            phone=data.phone,
            email=data.email,
            gstin=data.gstin,
            address=data.address,
            city=data.city or "Mumbai",
            category=data.category,
            payment_terms=data.payment_terms,
            credit_limit=data.credit_limit,
            rating=data.rating,
            notes=data.notes,
            bank_details=data.bank_details
        )
        return self.repo.create_supplier(supplier)

    def update_supplier(self, supplier_id: int, data: SupplierUpdate) -> Supplier:
        supplier = self.get_supplier(supplier_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(supplier, key, value)
        self.db.flush()
        return self.get_supplier(supplier_id)

    def delete_supplier(self, supplier_id: int) -> bool:
        deleted = self.repo.delete_supplier(supplier_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return True

    # Purchase Orders
    def list_purchase_orders(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20):
        return self.repo.list_purchase_orders(supplier_id=supplier_id, page=page, limit=limit)

    def create_purchase_order(self, data: PurchaseOrderCreate) -> PurchaseOrder:
        supplier_id = data.supplier_id or data.supplier
        if not supplier_id:
            raise HTTPException(status_code=400, detail="supplier_id is required")

        po_number = data.po_number or f"PO-{int(time.time())}-{random.randint(10,99)}"
        total_amount = sum(item.subtotal for item in data.items)

        po = PurchaseOrder(
            po_number=po_number,
            supplier_id=supplier_id,
            order_date=data.order_date,
            expected_delivery=data.expected_delivery,
            status=data.status or "ORDERED",
            gst_mode=data.gst_mode or "EXCLUSIVE",
            tax_type=data.tax_type or "INTRA_STATE",
            total_amount=total_amount,
            notes=data.notes
        )

        items = [
            PurchaseOrderItem(
                product_id=item.product_id or item.product,
                product_name=item.product_name,
                unit_cost=item.unit_cost,
                quantity=item.quantity,
                discount_rate=item.discount_rate,
                tax_rate=item.tax_rate,
                subtotal=item.subtotal
            ) for item in data.items
        ]
        po.items = items
        return self.repo.create_purchase_order(po)

    def update_po_status(self, po_id: int, status: str) -> PurchaseOrder:
        po = self.repo.get_po_by_id(po_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        po.status = status
        if status.upper() == "RECEIVED" and not po.received_date:
            po.received_date = date.today()
        self.db.commit()
        self.db.refresh(po)
        return po

    def create_supplier_payment(self, data: SupplierPaymentCreate) -> SupplierPayment:
        payment = SupplierPayment(
            supplier_id=data.supplier_id,
            purchase_order_id=data.purchase_order_id,
            amount=data.amount,
            payment_method=data.payment_method,
            reference_number=data.reference_number,
            payment_date=data.payment_date,
            notes=data.notes
        )

        if data.purchase_order_id:
            po = self.repo.get_po_by_id(data.purchase_order_id)
            if po:
                current_paid = Decimal(str(po.paid_amount or 0))
                payment_amt = Decimal(str(data.amount or 0))
                total_amt = Decimal(str(po.total_amount or 0))
                
                po.paid_amount = current_paid + payment_amt
                if po.paid_amount >= total_amt:
                    po.status = "RECEIVED"
                    if not po.received_date:
                        po.received_date = date.today()

        return self.repo.create_supplier_payment(payment)

    def list_supplier_payments(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20):
        return self.repo.list_supplier_payments(supplier_id=supplier_id, page=page, limit=limit)
