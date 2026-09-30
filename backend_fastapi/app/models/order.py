from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, DateTime, JSON, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.product import Product
    from app.models.user import LoginAccount


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    invoice_number: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)

    customer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"), index=True, nullable=True)
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    customer_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(25), default="NEW", index=True, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), default="CASH", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(20), default="PAID", index=True, nullable=False)

    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00, nullable=False)
    delivery_charge: Mapped[float] = mapped_column(Numeric(8, 2), default=0.00, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)

    cash_tendered: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    change_returned: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    tendered_notes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    change_notes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    coupon_applied: Mapped[Optional[str]] = mapped_column("coupon_code", String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("login.id", ondelete="SET NULL"), nullable=True)
    delivery_partner: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), onupdate=datetime.now, nullable=False)

    customer: Mapped[Optional[Customer]] = relationship("Customer", back_populates="orders")
    items: Mapped[List[OrderItem]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    transactions: Mapped[List[PaymentTransaction]] = relationship("PaymentTransaction", back_populates="order", cascade="all, delete-orphan")
    created_by: Mapped[Optional[LoginAccount]] = relationship("LoginAccount", foreign_keys=[created_by_id])

    __table_args__ = (
        Index("idx_orders_status_created", "status", "created_at"),
        Index("idx_orders_payment_created", "payment_status", "created_at"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), default=1.000, nullable=False)
    gst_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    order: Mapped[Order] = relationship("Order", back_populates="items")
    product: Mapped[Optional[Product]] = relationship("Product")


class PaymentTransaction(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PAID", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)

    order: Mapped[Order] = relationship("Order", back_populates="transactions")
