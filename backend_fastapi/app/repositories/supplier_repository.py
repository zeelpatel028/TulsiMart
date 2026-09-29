from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment


class SupplierRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_suppliers(
        self,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Supplier], int]:
        offset = (page - 1) * limit
        query = select(Supplier)
        count_query = select(func.count(Supplier.id))

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
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(Supplier.name.asc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().unique().all()), total

    async def get_by_id(self, supplier_id: int) -> Optional[Supplier]:
        query = select(Supplier).options(
            selectinload(Supplier.purchase_orders),
            selectinload(Supplier.payments)
        ).where(Supplier.id == supplier_id)
        res = await self.db.execute(query)
        return res.scalars().first()

    async def create_supplier(self, supplier: Supplier) -> Supplier:
        self.db.add(supplier)
        await self.db.flush()
        await self.db.refresh(supplier)
        return supplier

    async def list_purchase_orders(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20) -> Tuple[List[PurchaseOrder], int]:
        offset = (page - 1) * limit
        query = select(PurchaseOrder).options(selectinload(PurchaseOrder.items), selectinload(PurchaseOrder.supplier))
        count_query = select(func.count(PurchaseOrder.id))

        if supplier_id:
            query = query.where(PurchaseOrder.supplier_id == supplier_id)
            count_query = count_query.where(PurchaseOrder.supplier_id == supplier_id)

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(PurchaseOrder.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().unique().all()), total

    async def get_po_by_id(self, po_id: int) -> Optional[PurchaseOrder]:
        query = select(PurchaseOrder).options(
            selectinload(PurchaseOrder.items),
            selectinload(PurchaseOrder.supplier)
        ).where(PurchaseOrder.id == po_id)
        res = await self.db.execute(query)
        return res.scalars().first()

    async def create_purchase_order(self, po: PurchaseOrder) -> PurchaseOrder:
        self.db.add(po)
        await self.db.flush()
        await self.db.refresh(po)
        return po

    async def list_supplier_payments(self, supplier_id: Optional[int] = None, page: int = 1, limit: int = 20) -> Tuple[List[SupplierPayment], int]:
        offset = (page - 1) * limit
        query = select(SupplierPayment)
        count_query = select(func.count(SupplierPayment.id))

        if supplier_id:
            query = query.where(SupplierPayment.supplier_id == supplier_id)
            count_query = count_query.where(SupplierPayment.supplier_id == supplier_id)

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(SupplierPayment.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def create_supplier_payment(self, payment: SupplierPayment) -> SupplierPayment:
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        return payment
