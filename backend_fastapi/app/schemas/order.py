from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.product import ProductResponse


from pydantic import BaseModel, Field, ConfigDict, model_validator


class OrderItemCreate(BaseModel):
    product_id: Optional[int] = None
    product: Optional[int] = None
    product_name: str
    sku: Optional[str] = None
    unit_price: float
    quantity: float = 1.000
    gst_percent: float = 0.00
    subtotal: Optional[float] = None
    total_price: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if not values.get("product_id") and values.get("product") is not None:
                try:
                    values["product_id"] = int(values["product"])
                except (ValueError, TypeError):
                    pass
            if values.get("subtotal") is None:
                if values.get("total_price") is not None:
                    values["subtotal"] = float(values["total_price"])
                elif values.get("unit_price") is not None and values.get("quantity") is not None:
                    values["subtotal"] = float(values["unit_price"]) * float(values["quantity"])
                else:
                    values["subtotal"] = 0.0
        return values



class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    product_id: Optional[int] = None
    product_name: str
    sku: Optional[str] = None
    unit_price: float
    quantity: float
    gst_percent: float
    subtotal: float
    product: Optional[ProductResponse] = None


class OrderCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: str = "Walk-in Customer"
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    
    payment_method: str = "CASH"
    payment_status: str = "PAID"
    status: str = "NEW"
    
    subtotal: float = 0.00
    tax_amount: float = 0.00
    discount_amount: float = 0.00
    delivery_charge: float = 0.00
    total_amount: float = 0.00
    
    cash_tendered: Optional[float] = None
    change_returned: Optional[float] = None
    tendered_notes: Optional[Dict[str, Any]] = None
    change_notes: Optional[Dict[str, Any]] = None
    
    coupon_code: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(default_factory=list)


class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    delivery_partner: Optional[str] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    invoice_number: Optional[str] = None
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    status: str
    payment_method: str
    payment_status: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    delivery_charge: float
    total_amount: float
    cash_tendered: Optional[float] = None
    change_returned: Optional[float] = None
    tendered_notes: Optional[Dict[str, Any]] = None
    change_notes: Optional[Dict[str, Any]] = None
    coupon_applied: Optional[str] = None
    notes: Optional[str] = None
    delivery_partner: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = Field(default_factory=list)


class PaymentTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    transaction_id: str
    amount: float
    payment_method: str
    status: str
    created_at: datetime
