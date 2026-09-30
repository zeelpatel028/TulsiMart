from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, or_, and_

from app.models.order import Order, OrderItem, PaymentTransaction
from app.models.product import Product


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_by_id(self, order_id: int) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product).options(
                    selectinload(Product.category),
                    selectinload(Product.brand),
                    selectinload(Product.unit)
                ),
                selectinload(Order.transactions)
            )
            .filter(Order.id == order_id)
            .first()
        )

    def get_by_order_number(self, order_number: str) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product).options(
                    selectinload(Product.category),
                    selectinload(Product.brand),
                    selectinload(Product.unit)
                ),
                selectinload(Order.transactions)
            )
            .filter(Order.order_number == order_number)
            .first()
        )

    def list_orders(
        self,
        customer_id: Optional[int] = None,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        from datetime import datetime
        offset = (page - 1) * limit
        query = self.db.query(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product).options(
                selectinload(Product.category),
                selectinload(Product.brand),
                selectinload(Product.unit)
            )
        )
        count_query = self.db.query(func.count(Order.id))

        filters = []
        if customer_id:
            filters.append(Order.customer_id == customer_id)
        if status:
            filters.append(Order.status == status)
        if payment_status:
            filters.append(Order.payment_status == payment_status)
        if date_from:
            try:
                filters.append(Order.created_at >= datetime.fromisoformat(date_from))
            except Exception:
                pass
        if date_to:
            try:
                filters.append(Order.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))
            except Exception:
                pass
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
            query = query.filter(and_(*filters))
            count_query = count_query.filter(and_(*filters))

        total = count_query.scalar() or 0
        orders = query.order_by(Order.id.desc()).offset(offset).limit(limit).all()
        return orders, total

    def list_payments(self, page: int = 1, limit: int = 20) -> Tuple[List[PaymentTransaction], int]:
        offset = (page - 1) * limit
        total = self.db.query(func.count(PaymentTransaction.id)).scalar() or 0
        payments = (
            self.db.query(PaymentTransaction)
            .order_by(PaymentTransaction.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return payments, total

    def get_product_for_update(self, product_id: int) -> Optional[Product]:
        """Fetch product with MySQL row locking (FOR UPDATE)"""
        return self.db.query(Product).filter(Product.id == product_id).with_for_update().first()
