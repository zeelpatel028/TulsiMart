from datetime import datetime, date
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


class StoreSettingUpdate(BaseModel):
    store_name: Optional[str] = None
    tagline: Optional[str] = None
    store_logo: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    invoice_prefix: Optional[str] = None
    invoice_terms: Optional[str] = None
    show_logo_on_invoice: Optional[bool] = None
    auto_print_invoice: Optional[bool] = None
    tax_enabled: Optional[bool] = None
    default_gst_rate: Optional[float] = None
    prices_include_tax: Optional[bool] = None
    currency_symbol: Optional[str] = None
    currency_code: Optional[str] = None
    payment_cash_enabled: Optional[bool] = None
    payment_upi_enabled: Optional[bool] = None
    payment_card_enabled: Optional[bool] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    theme_mode: Optional[str] = None
    primary_color: Optional[str] = None
    security_require_otp: Optional[bool] = None
    security_session_timeout: Optional[int] = None
    home_cash_amount: Optional[float] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class StoreSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    store_name: str
    tagline: Optional[str] = None
    store_logo: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    invoice_prefix: Optional[str] = None
    invoice_terms: Optional[str] = None
    show_logo_on_invoice: bool
    auto_print_invoice: bool
    tax_enabled: bool
    default_gst_rate: float
    prices_include_tax: bool
    currency_symbol: str
    currency_code: str
    payment_cash_enabled: bool
    payment_upi_enabled: bool
    payment_card_enabled: bool
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None
    theme_mode: Optional[str] = None
    primary_color: Optional[str] = None
    security_require_otp: bool
    security_session_timeout: int
    home_cash_amount: float
    created_at: datetime
    updated_at: datetime


class CashEntryCreate(BaseModel):
    entry_type: str  # OPENING_FLOAT, CASH_IN, CASH_OUT, SUPPLIER_PAYMENT, EXPENSE, BILL_SALE, KHATA_PAYMENT
    amount: float
    notes: Optional[str] = None
    denomination_counts: Optional[Dict[str, Any]] = None
    reference_id: Optional[str] = None


class CashEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_type: str
    amount: float
    date: date
    notes: Optional[str] = None
    denomination_counts: Optional[Dict[str, Any]] = None
    reference_id: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime


class BankTransactionCreate(BaseModel):
    transaction_type: str  # UPI_IN, CARD_IN, SUPPLIER_PAYOUT, EXPENSE_PAYOUT, DEPOSIT, WITHDRAWAL
    amount: float
    reference_number: Optional[str] = None
    bank_name: Optional[str] = "HDFC Store Primary Bank"
    notes: Optional[str] = None


class BankTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_type: str
    amount: float
    reference_number: Optional[str] = None
    bank_name: Optional[str] = None
    notes: Optional[str] = None
    date: date
    created_by_name: Optional[str] = None
    created_at: datetime


class HomeCashCreate(BaseModel):
    entry_type: str  # DEPOSIT, WITHDRAWAL, SWEEP
    amount: float
    denomination_counts: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class HomeCashResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_type: str
    amount: float
    denomination_counts: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_by_name: str
    balance_after: float
    created_at: datetime


class ActivityLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_name: Optional[str] = None
    action: str
    module: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
