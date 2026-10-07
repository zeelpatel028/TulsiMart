from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Numeric, Date, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier
    from app.models.user import LoginAccount


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), default="ShoppingBag")
    image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), nullable=False)

    products: Mapped[List[Product]] = relationship("Product", back_populates="category", cascade="all, delete-orphan")


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), nullable=False)

    products: Mapped[List[Product]] = relationship("Product", back_populates="brand")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    short_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    base_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    conversion_factor: Mapped[float] = mapped_column(Numeric(12, 4), default=1.0, nullable=False)

    products: Mapped[List[Product]] = relationship("Product", foreign_keys="Product.unit_id", back_populates="unit")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_code: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    barcode: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), index=True, nullable=True)
    brand_id: Mapped[Optional[int]] = mapped_column(ForeignKey("brands.id", ondelete="SET NULL"), index=True, nullable=True)
    unit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("units.id", ondelete="SET NULL"), nullable=True)
    supplier_id: Mapped[Optional[int]] = mapped_column(ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)

    # Purchase Pricing & Tax
    purchase_gst_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)
    purchase_non_tax_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    purchase_tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    purchase_final_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)

    # Selling Pricing & Tax
    selling_gst_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)
    selling_non_tax_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    selling_tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    selling_tax_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)

    mrp: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    selling_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    cost_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    discount_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)
    gst_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)

    # Inventory
    stock_quantity: Mapped[float] = mapped_column(Numeric(12, 3), default=0.000, index=True)
    min_stock_alert: Mapped[float] = mapped_column(Numeric(12, 3), default=10.000)
    manufacturing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, index=True, nullable=True)
    batch_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Media & Meta
    image: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), onupdate=datetime.now)

    # Relationships
    category: Mapped[Optional[Category]] = relationship("Category", back_populates="products")
    brand: Mapped[Optional[Brand]] = relationship("Brand", back_populates="products")
    unit: Mapped[Optional[Unit]] = relationship("Unit", foreign_keys=[unit_id], back_populates="products")
    supplier: Mapped[Optional[Supplier]] = relationship("Supplier", foreign_keys=[supplier_id])
    stock_movements: Mapped[List[StockMovement]] = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_product_active_stock", "is_active", "stock_quantity"),
        Index("idx_product_name_barcode", "name", "barcode"),
    )


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    movement_type: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    balance_after: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reference_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    performed_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("login.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)

    product: Mapped[Product] = relationship("Product", back_populates="stock_movements")
    performed_by: Mapped[Optional[LoginAccount]] = relationship("LoginAccount", foreign_keys=[performed_by_id])
