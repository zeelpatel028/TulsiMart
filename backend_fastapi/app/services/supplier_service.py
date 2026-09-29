from typing import List, Tuple, Optional
import time, random
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.supplier_repository import SupplierRepository
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, SupplierPayment
from app.schemas.supplier import SupplierCreate, SupplierUpdate, PurchaseOrderCreate, SupplierPaymentCreate


class SupplierService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SupplierRepository(db)

    async def list_suppliers(
        self,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Supplier], int]:
        return await self.repo.list_suppliers(search=search, is_active=is_active, page=page, limit=limit)

    async def get_supplier(self, supplier_id: int) -> Supplier:
        supplier = await self.repo.get_by_id(supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return supplier

    async def create_supplier(self, data: SupplierCreate) -> Supplier:
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
        return await self.repo.create_supplier(supplier)

    async def update_supplier(self, supplier_id: int, data: SupplierUpdate) -> Supplier:
        supplier = await self.get_supplier(supplier_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(supplier, key, value)
        await self.db.flush()
        return await self.get_supplier(supplier_id)

    # Purchase Orders
    async def list_purchase_orders(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20):
        return await self.repo.list_purchase_orders(supplier_id=supplier_id, page=page, limit=limit)

    async def create_purchase_order(self, data: PurchaseOrderCreate) -> PurchaseOrder:
        po_number = f"PO-{int(time.time())}-{random.randint(10,99)}"

        total_amount = sum(item.subtotal for item in data.items)

        po = PurchaseOrder(
            po_number=po_number,
            supplier_id=data.supplier_id,
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
                product_id=item.product_id,
                product_name=item.product_name,
                unit_cost=item.unit_cost,
                quantity=item.quantity,
                discount_rate=item.discount_rate,
                tax_rate=item.tax_rate,
                subtotal=item.subtotal
            ) for item in data.items
        ]
        po.items = items
        return await self.repo.create_purchase_order(po)

    async def update_po_status(self, po_id: int, status: str) -> PurchaseOrder:
        po = await self.repo.get_po_by_id(po_id)
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        po.status = status
        await self.db.flush()
        return po

    async def create_supplier_payment(self, data: SupplierPaymentCreate) -> SupplierPayment:
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
            po = await self.repo.get_po_by_id(data.purchase_order_id)
            if po:
                po.paid_amount += data.amount
                if po.paid_amount >= po.total_amount:
                    po.status = "RECEIVED"

        return await self.repo.create_supplier_payment(payment)

    async def list_supplier_payments(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20):
        return await self.repo.list_supplier_payments(supplier_id=supplier_id, page=page, limit=limit)
