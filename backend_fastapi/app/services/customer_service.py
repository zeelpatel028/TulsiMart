from typing import List, Tuple, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.customer_repository import CustomerRepository
from app.repositories.order_repository import OrderRepository
from app.models.customer import Customer, CustomerFeedback
from app.schemas.customer import CustomerCreate, CustomerUpdate, FeedbackCreate


class CustomerService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CustomerRepository(db)
        self.order_repo = OrderRepository(db)

    async def list_customers(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Customer], int]:
        return await self.repo.list_customers(status=status, search=search, page=page, limit=limit)

    async def get_customer(self, customer_id: int) -> Customer:
        customer = await self.repo.get_by_id(customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    async def create_customer(self, data: CustomerCreate) -> Customer:
        existing = await self.repo.get_by_phone(data.phone)
        if existing:
            raise HTTPException(status_code=400, detail=f"Customer with phone '{data.phone}' already exists")

        customer = Customer(
            name=data.name,
            phone=data.phone,
            email=data.email,
            address=data.address,
            city=data.city or "Mumbai",
            pincode=data.pincode,
            notes=data.notes
        )
        return await self.repo.create_customer(customer)

    async def update_customer(self, customer_id: int, data: CustomerUpdate) -> Customer:
        customer = await self.get_customer(customer_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(customer, key, value)
        await self.db.flush()
        return customer

    async def toggle_block(self, customer_id: int) -> Customer:
        customer = await self.get_customer(customer_id)
        customer.status = "BLOCKED" if customer.status == "ACTIVE" else "ACTIVE"
        await self.db.flush()
        return customer

    async def get_customer_history(self, customer_id: int, page: int = 1, limit: int = 20):
        customer = await self.get_customer(customer_id)
        orders, total = await self.order_repo.list_orders(customer_id=customer_id, page=page, limit=limit)
        return {
            "customer": customer,
            "orders": orders,
            "total_orders": total
        }

    async def add_feedback(self, customer_id: int, data: FeedbackCreate) -> CustomerFeedback:
        customer = await self.get_customer(customer_id)
        feedback = CustomerFeedback(
            customer_id=customer.id,
            rating=data.rating,
            comment=data.comment,
            order_ref=data.order_ref
        )
        return await self.repo.add_feedback(feedback)

    async def list_feedbacks(self) -> List[CustomerFeedback]:
        return await self.repo.list_feedbacks()
