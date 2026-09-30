from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_, and_

from app.models.customer import Customer, CustomerFeedback


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_customers(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Customer], int]:
        offset = (page - 1) * limit
        query = self.db.query(Customer).options(selectinload(Customer.orders))
        count_query = self.db.query(func.count(Customer.id))

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
            query = query.filter(and_(*filters))
            count_query = count_query.filter(and_(*filters))

        total = count_query.scalar() or 0
        customers = query.order_by(Customer.id.desc()).offset(offset).limit(limit).all()
        return customers, total

    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        return self.db.query(Customer).options(selectinload(Customer.orders)).filter(Customer.id == customer_id).first()

    def get_by_phone(self, phone: str) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.phone == phone).first()

    def create_customer(self, customer: Customer) -> Customer:
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer

    def add_feedback(self, feedback: CustomerFeedback) -> CustomerFeedback:
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def list_feedbacks(self) -> List[CustomerFeedback]:
        return (
            self.db.query(CustomerFeedback)
            .options(selectinload(CustomerFeedback.customer))
            .order_by(CustomerFeedback.id.desc())
            .all()
        )
