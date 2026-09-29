from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CouponCreate(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    offer_type: str = "PERCENTAGE"  # PERCENTAGE, FLAT, BOGO, MIN_ORDER
    discount_value: float
    min_order_amount: float = 0.00
    max_discount_amount: Optional[float] = None
    valid_from: date
    valid_to: date
    usage_limit: int = 100
    is_active: bool = True


class CouponResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    title: str
    description: Optional[str] = None
    offer_type: str
    discount_value: float
    min_order_amount: float
    max_discount_amount: Optional[float] = None
    valid_from: date
    valid_to: date
    usage_limit: int
    used_count: int
    is_active: bool
    is_valid: bool = True
    created_at: datetime


class ValidateCouponRequest(BaseModel):
    code: str
    cart_amount: float = 0.00


class FestivalOfferCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    banner_image: Optional[str] = None
    tag_text: Optional[str] = "Special Offer"
    discount_info: Optional[str] = "Up to 30% OFF"
    start_date: date
    end_date: date
    is_active: bool = True


class FestivalOfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    subtitle: Optional[str] = None
    banner_image: Optional[str] = None
    tag_text: Optional[str] = None
    discount_info: Optional[str] = None
    start_date: date
    end_date: date
    is_active: bool
    created_at: datetime
