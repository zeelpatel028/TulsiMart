from datetime import datetime, date
from typing import Optional, Dict, Any
from sqlalchemy import String, Text, Boolean, Numeric, Integer, Date, DateTime, JSON, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class StoreSetting(Base):
    __tablename__ = "store_settings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    store_name: Mapped[str] = mapped_column(String(200), default="Tulsi Mart", nullable=False)
    tagline: Mapped[Optional[str]] = mapped_column(String(300), default="Fresh Groceries & Supermarket")
    store_logo: Mapped[Optional[str]] = mapped_column(String(500), default="/logo.png")
    address: Mapped[Optional[str]] = mapped_column(Text, default="Shop No. 12-14, Heritage Plaza, MG Road")
    city: Mapped[Optional[str]] = mapped_column(String(100), default="Mumbai")
    state: Mapped[Optional[str]] = mapped_column(String(100), default="Maharashtra")
    country: Mapped[Optional[str]] = mapped_column(String(100), default="India")
    pincode: Mapped[Optional[str]] = mapped_column(String(20), default="400001")
    phone: Mapped[Optional[str]] = mapped_column(String(50), default="+91 98765 43210")
    email: Mapped[Optional[str]] = mapped_column(String(254), default="contact@tulsimart.com")

    # Tax & Billing
    gst_number: Mapped[Optional[str]] = mapped_column(String(50), default="27AABCT8899F1Z4")
    pan_number: Mapped[Optional[str]] = mapped_column(String(50), default="AABCT8899F")
    invoice_prefix: Mapped[Optional[str]] = mapped_column(String(30), default="TM-INV-")
    invoice_terms: Mapped[Optional[str]] = mapped_column(Text, default="Thank you for shopping at Tulsi Mart!")
    show_logo_on_invoice: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_print_invoice: Mapped[bool] = mapped_column(Boolean, default=False)
    tax_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    default_gst_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=18.00)
    prices_include_tax: Mapped[bool] = mapped_column(Boolean, default=False)

    # Currency & Localization
    currency_symbol: Mapped[Optional[str]] = mapped_column(String(10), default="₹")
    currency_code: Mapped[Optional[str]] = mapped_column(String(10), default="INR")

    # Payment & Banking
    payment_cash_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    payment_upi_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    payment_card_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(150), default="HDFC Bank")
    account_number: Mapped[Optional[str]] = mapped_column(String(100), default="50200012345678")
    ifsc_code: Mapped[Optional[str]] = mapped_column(String(50), default="HDFC0001234")
    upi_id: Mapped[Optional[str]] = mapped_column(String(100), default="tulsimart@hdfcbank")

    # Theme & Security
    theme_mode: Mapped[Optional[str]] = mapped_column(String(20), default="light")
    primary_color: Mapped[Optional[str]] = mapped_column(String(30), default="#384959")
    security_require_otp: Mapped[bool] = mapped_column(Boolean, default=False)
    security_session_timeout: Mapped[int] = mapped_column(Integer, default=30)
    home_cash_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    auto_1130_sweep_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), onupdate=datetime.now)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    module: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)


class CashRegisterEntry(Base):
    __tablename__ = "cash_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    entry_type: Mapped[str] = mapped_column("transaction_type", String(30), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column("transaction_date", Date, default=date.today, server_default=func.current_date(), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    denomination_counts: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    reference_id: Mapped[Optional[str]] = mapped_column("reference_number", String(100), nullable=True)
    created_by_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    reference_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(100), default="HDFC Store Primary Bank")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[date] = mapped_column("transaction_date", Date, default=date.today, server_default=func.current_date(), nullable=False)
    created_by_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)


class HomeCashTransaction(Base):
    __tablename__ = "home_cash_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    entry_type: Mapped[str] = mapped_column("transaction_type", String(30), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    denomination_counts: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_name: Mapped[Optional[str]] = mapped_column(String(150), default="Store Owner")
    balance_after: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, server_default=func.now(), index=True)
