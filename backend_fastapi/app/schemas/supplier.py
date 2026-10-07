from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class SupplierCreate(BaseModel):
    name: str
    company_name: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Mumbai"
    category: Optional[str] = "General Grocery"
    payment_terms: Optional[str] = "Net 15"
    credit_limit: float = 100000.00
    rating: int = 5
    notes: Optional[str] = None
    bank_details: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    bank_details: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class SupplierResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company_name: Optional[str] = None
    phone: str
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: float
    rating: int
    notes: Optional[str] = None
    bank_details: Optional[str] = None
    is_active: bool
    created_at: datetime
    total_purchases: float = 0.0
    total_paid: float = 0.0
    pending_balance: float = 0.0


class PurchaseOrderItemCreate(BaseModel):
    product_id: Optional[int] = None
    product_name: str
    unit_cost: float
    quantity: int = 1
    discount_rate: float = 0.00
    tax_rate: float = 0.00
    subtotal: float


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    order_date: date
    expected_delivery: Optional[date] = None
    status: str = "ORDERED"
    gst_mode: Optional[str] = "EXCLUSIVE"
    tax_type: Optional[str] = "INTRA_STATE"
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate] = Field(default_factory=list)


class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    po_number: str
    supplier_id: int
    order_date: date
    expected_delivery: Optional[date] = None
    received_date: Optional[date] = None
    status: str
    gst_mode: Optional[str] = None
    tax_type: Optional[str] = None
    total_amount: float
    paid_amount: float
    notes: Optional[str] = None
    created_at: datetime
    supplier_name: Optional[str] = None


class SupplierPaymentCreate(BaseModel):
    supplier_id: int
    purchase_order_id: Optional[int] = None
    amount: float
    payment_method: str = "BANK_TRANSFER"
    reference_number: Optional[str] = None
    payment_date: date
    notes: Optional[str] = None


class SupplierPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supplier_id: int
    purchase_order_id: Optional[int] = None
    amount: float
    payment_method: str
    reference_number: Optional[str] = None
    payment_date: date
    notes: Optional[str] = None
    created_at: datetime
