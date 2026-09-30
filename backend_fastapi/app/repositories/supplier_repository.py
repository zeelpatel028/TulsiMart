from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_, and_

from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment


class SupplierRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_suppliers(
        self,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Supplier], int]:
        offset = (page - 1) * limit
        query = self.db.query(Supplier)
        count_query = self.db.query(func.count(Supplier.id))

        filters = []
        if is_active is not None:
            filters.append(Supplier.is_active == is_active)
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    Supplier.name.ilike(search_pattern),
                    Supplier.company_name.ilike(search_pattern),
                    Supplier.phone.ilike(search_pattern)
                )
            )

        if filters:
            query = query.filter(and_(*filters))
            count_query = count_query.filter(and_(*filters))

        total = count_query.scalar() or 0
        suppliers = query.order_by(Supplier.name.asc()).offset(offset).limit(limit).all()
        return suppliers, total

    def get_by_id(self, supplier_id: int) -> Optional[Supplier]:
        return (
            self.db.query(Supplier)
            .options(
                selectinload(Supplier.purchase_orders),
                selectinload(Supplier.payments)
            )
            .filter(Supplier.id == supplier_id)
            .first()
        )

    def create_supplier(self, supplier: Supplier) -> Supplier:
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def list_purchase_orders(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20) -> Tuple[List[PurchaseOrder], int]:
        offset = (page - 1) * limit
        query = self.db.query(PurchaseOrder).options(selectinload(PurchaseOrder.items), selectinload(PurchaseOrder.supplier))
        count_query = self.db.query(func.count(PurchaseOrder.id))

        if supplier_id:
            query = query.filter(PurchaseOrder.supplier_id == supplier_id)
            count_query = count_query.filter(PurchaseOrder.supplier_id == supplier_id)

        total = count_query.scalar() or 0
        pos = query.order_by(PurchaseOrder.id.desc()).offset(offset).limit(limit).all()
        return pos, total

    def get_po_by_id(self, po_id: int) -> Optional[PurchaseOrder]:
        return (
            self.db.query(PurchaseOrder)
            .options(
                selectinload(PurchaseOrder.items),
                selectinload(PurchaseOrder.supplier)
            )
            .filter(PurchaseOrder.id == po_id)
            .first()
        )

    def create_purchase_order(self, po: PurchaseOrder) -> PurchaseOrder:
        self.db.add(po)
        self.db.commit()
        self.db.refresh(po)
        return po

    def list_supplier_payments(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20) -> Tuple[List[SupplierPayment], int]:
        offset = (page - 1) * limit
        query = self.db.query(SupplierPayment)
        count_query = self.db.query(func.count(SupplierPayment.id))

        if supplier_id:
            query = query.filter(SupplierPayment.supplier_id == supplier_id)
            count_query = count_query.filter(SupplierPayment.supplier_id == supplier_id)

        total = count_query.scalar() or 0
        payments = query.order_by(SupplierPayment.id.desc()).offset(offset).limit(limit).all()
        return payments, total

    def create_supplier_payment(self, payment: SupplierPayment) -> SupplierPayment:
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment
