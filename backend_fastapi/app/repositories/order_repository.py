from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload, joinedload

from app.models.order import Order, OrderItem, PaymentTransaction
from app.models.product import Product


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, order: Order) -> Order:
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def get_by_id(self, order_id: int) -> Optional[Order]:
        query = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product).options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.unit)
            ),
            selectinload(Order.transactions)
        ).where(Order.id == order_id)
        res = await self.db.execute(query)
        return res.scalars().first()

    async def get_by_order_number(self, order_number: str) -> Optional[Order]:
        query = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product).options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.unit)
            ),
            selectinload(Order.transactions)
        ).where(Order.order_number == order_number)
        res = await self.db.execute(query)
        return res.scalars().first()

    async def list_orders(
        self,
        customer_id: Optional[int] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        offset = (page - 1) * limit
        query = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product).options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.unit)
            )
        )
        count_query = select(func.count(Order.id))

        filters = []
        if customer_id:
            filters.append(Order.customer_id == customer_id)
        if status:
            filters.append(Order.status == status)
        if payment_status:
            filters.append(Order.payment_status == payment_status)
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    Order.order_number.ilike(search_pattern),
                    Order.invoice_number.ilike(search_pattern),
                    Order.customer_name.ilike(search_pattern),
                    Order.customer_phone.ilike(search_pattern)
                )
            )

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(Order.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().unique().all()), total

    async def list_payments(self, page: int = 1, limit: int = 20) -> Tuple[List[PaymentTransaction], int]:
        offset = (page - 1) * limit
        count_res = await self.db.execute(select(func.count(PaymentTransaction.id)))
        total = count_res.scalar_one()

        query = select(PaymentTransaction).order_by(PaymentTransaction.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def get_product_for_update(self, product_id: int) -> Optional[Product]:
        """Fetch product with row locking when DB dialect supports it"""
        query = select(Product).where(Product.id == product_id)
        if self.db.bind and self.db.bind.dialect.name != "sqlite":
            query = query.with_for_update()
        res = await self.db.execute(query)
        return res.scalars().first()

