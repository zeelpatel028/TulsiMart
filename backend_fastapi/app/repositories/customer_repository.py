from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_, and_, case

from app.models.customer import Customer, CustomerFeedback
from app.models.order import Order


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_customers(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Customer], Dict[int, Dict[str, Any]], int]:
        offset = (page - 1) * limit
        query = self.db.query(Customer)
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

        if not customers:
            return [], {}, total

        customer_ids = [c.id for c in customers]
        
        # Fast SQL aggregation for order metrics across all customers on the current page
        stats_rows = (
            self.db.query(
                Order.customer_id,
                func.count(Order.id).label("total_orders"),
                func.coalesce(
                    func.sum(
                        case(
                            (or_(Order.payment_status == "PAID", Order.status == "COMPLETED"), Order.total_amount),
                            else_=0
                        )
                    ),
                    0.0
                ).label("total_spent"),
                func.coalesce(
                    func.sum(
                        case(
                            (and_(Order.payment_status == "PENDING", Order.status != "CANCELLED"), Order.total_amount),
                            else_=0
                        )
                    ),
                    0.0
                ).label("pending_payments")
            )
            .filter(Order.customer_id.in_(customer_ids))
            .group_by(Order.customer_id)
            .all()
        )

        stats_map = {
            row.customer_id: {
                "total_orders": int(row.total_orders or 0),
                "total_spent": float(row.total_spent or 0.0),
                "pending_payments": float(row.pending_payments or 0.0)
            }
            for row in stats_rows
        }

        return customers, stats_map, total

    def get_customer_stats(self, customer_id: int) -> Dict[str, Any]:
        row = (
            self.db.query(
                func.count(Order.id).label("total_orders"),
                func.coalesce(
                    func.sum(
                        case(
                            (or_(Order.payment_status == "PAID", Order.status == "COMPLETED"), Order.total_amount),
                            else_=0
                        )
                    ),
                    0.0
                ).label("total_spent"),
                func.coalesce(
                    func.sum(
                        case(
                            (and_(Order.payment_status == "PENDING", Order.status != "CANCELLED"), Order.total_amount),
                            else_=0
                        )
                    ),
                    0.0
                ).label("pending_payments")
            )
            .filter(Order.customer_id == customer_id)
            .first()
        )

        if not row:
            return {"total_orders": 0, "total_spent": 0.0, "pending_payments": 0.0}

        return {
            "total_orders": int(row.total_orders or 0),
            "total_spent": float(row.total_spent or 0.0),
            "pending_payments": float(row.pending_payments or 0.0)
        }

    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.id == customer_id).first()

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

