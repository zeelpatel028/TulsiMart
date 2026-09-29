from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    icon: Optional[str] = "ShoppingBag"
    image: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: Optional[str] = None
    icon: Optional[str] = "ShoppingBag"
    image: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime


class BrandCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True


class BrandResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    is_active: bool


class UnitCreate(BaseModel):
    name: str
    short_name: str
    base_unit: Optional[str] = None
    conversion_factor: float = 1.0


class UnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    short_name: str
    base_unit: Optional[str] = None
    conversion_factor: float


class ProductCreate(BaseModel):
    name: str
    sku: str
    product_code: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    unit_id: Optional[int] = None
    selling_unit_id: Optional[int] = None
    supplier_id: Optional[int] = None

    cost_price: float = 0.00
    mrp: float = 0.00
    selling_price: float = 0.00
    discount_percent: float = 0.00
    gst_percent: float = 0.00

    stock_quantity: float = 0.000
    min_stock_alert: float = 10.000
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None

    image: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    product_code: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    unit_id: Optional[int] = None

    cost_price: Optional[float] = None
    mrp: Optional[float] = None
    selling_price: Optional[float] = None
    discount_percent: Optional[float] = None
    gst_percent: Optional[float] = None

    stock_quantity: Optional[float] = None
    min_stock_alert: Optional[float] = None
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None

    image: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_code: Optional[str] = None
    name: str
    sku: str
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    unit_id: Optional[int] = None

    cost_price: float
    mrp: float
    selling_price: float
    discount_percent: float
    gst_percent: float

    stock_quantity: float
    min_stock_alert: float
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None

    image: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    is_featured: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    category: Optional[CategoryResponse] = None
    brand: Optional[BrandResponse] = None
    unit: Optional[UnitResponse] = None


class StockAdjustmentRequest(BaseModel):
    quantity: float
    adjustment_type: str = "ADJUSTMENT"  # PURCHASE_IN, POS_SALE, RETURN_IN, SUPPLIER_RETURN, DAMAGE_OUT, ADJUSTMENT
    reason: Optional[str] = None
    reference_no: Optional[str] = None


class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    movement_type: str
    quantity: float
    balance_after: float
    reason: Optional[str] = None
    reference_no: Optional[str] = None
    created_at: datetime
    product_name: Optional[str] = None
