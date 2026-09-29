from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.models.customer import Customer, CustomerFeedback


class CustomerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_customers(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Customer], int]:
        offset = (page - 1) * limit
        query = select(Customer)
        count_query = select(func.count(Customer.id))

        filters = []
        if status:
            filters.append(Customer.status == status)
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    Customer.name.ilike(search_pattern),
                    Customer.phone.ilike(search_pattern),
                    Customer.email.ilike(search_pattern)
                )
            )

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(Customer.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def get_by_id(self, customer_id: int) -> Optional[Customer]:
        res = await self.db.execute(select(Customer).where(Customer.id == customer_id))
        return res.scalars().first()

    async def get_by_phone(self, phone: str) -> Optional[Customer]:
        res = await self.db.execute(select(Customer).where(Customer.phone == phone))
        return res.scalars().first()

    async def create_customer(self, customer: Customer) -> Customer:
        self.db.add(customer)
        await self.db.flush()
        await self.db.refresh(customer)
        return customer

    async def add_feedback(self, feedback: CustomerFeedback) -> CustomerFeedback:
        self.db.add(feedback)
        await self.db.flush()
        await self.db.refresh(feedback)
        return feedback

    async def list_feedbacks(self) -> List[CustomerFeedback]:
        query = select(CustomerFeedback).options(selectinload(CustomerFeedback.customer)).order_by(CustomerFeedback.id.desc())
        res = await self.db.execute(query)
        return list(res.scalars().all())
