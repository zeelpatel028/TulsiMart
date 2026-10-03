from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Numeric, Integer, Date, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.product import Product


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    company_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(254), nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), default="Mumbai")
    category: Mapped[Optional[str]] = mapped_column(String(100), default="General Grocery")
    payment_terms: Mapped[Optional[str]] = mapped_column(String(50), default="Net 15")
    credit_limit: Mapped[float] = mapped_column(Numeric(12, 2), default=100000.00)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bank_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now())

    purchase_orders: Mapped[List[PurchaseOrder]] = relationship("PurchaseOrder", back_populates="supplier")
    payments: Mapped[List[SupplierPayment]] = relationship("SupplierPayment", back_populates="supplier")

    @property
    def total_purchases(self) -> float:
        try:
            if not self.purchase_orders:
                return 0.0
            return sum(float(po.total_amount or 0) for po in self.purchase_orders)
        except Exception:
            return 0.0

    @property
    def total_paid(self) -> float:
        try:
            if not self.payments:
                return 0.0
            return sum(float(p.amount or 0) for p in self.payments)
        except Exception:
            return 0.0

    @property
    def pending_balance(self) -> float:
        return max(0.0, self.total_purchases - self.total_paid)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    po_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id", ondelete="CASCADE"), index=True, nullable=False)
    order_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    expected_delivery: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    received_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ORDERED", index=True, nullable=False)
    gst_mode: Mapped[Optional[str]] = mapped_column(String(20), default="EXCLUSIVE")
    tax_type: Mapped[Optional[str]] = mapped_column(String(20), default="INTRA_STATE")

    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    paid_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)

    supplier: Mapped[Supplier] = relationship("Supplier", back_populates="purchase_orders")
    items: Mapped[List[PurchaseOrderItem]] = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    grns: Mapped[List[GoodsReceiptNote]] = relationship("GoodsReceiptNote", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    discount_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)
    received_quantity: Mapped[int] = mapped_column(Integer, default=0)
    damaged_quantity: Mapped[int] = mapped_column(Integer, default=0)
    batch_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    mfg_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    purchase_order: Mapped[PurchaseOrder] = relationship("PurchaseOrder", back_populates="items")
    product: Mapped[Optional[Product]] = relationship("Product")


class GoodsReceiptNote(Base):
    __tablename__ = "goods_receipts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    grn_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    received_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    received_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    total_valuation: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now())

    purchase_order: Mapped[PurchaseOrder] = relationship("PurchaseOrder", back_populates="grns")


class SupplierPayment(Base):
    __tablename__ = "supplier_payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id", ondelete="CASCADE"), index=True, nullable=False)
    purchase_order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), default="BANK_TRANSFER")
    reference_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now())

    supplier: Mapped[Supplier] = relationship("Supplier", back_populates="payments")
