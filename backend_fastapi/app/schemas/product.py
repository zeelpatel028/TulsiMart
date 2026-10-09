from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


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


def parse_id(val: Any) -> Optional[int]:
    if val is None or val == "" or val == "null":
        return None
    if isinstance(val, dict):
        val = val.get("id")
    try:
        if val is not None and val != "" and val != "null":
            return int(val)
    except (ValueError, TypeError):
        pass
    return None


class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    product_code: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    unit_id: Optional[int] = None
    supplier_id: Optional[int] = None

    purchase_gst_percent: Optional[float] = 0.00
    purchase_non_tax_price: Optional[float] = 0.00
    purchase_tax_amount: Optional[float] = 0.00
    purchase_final_price: Optional[float] = 0.00

    selling_gst_percent: Optional[float] = 0.00
    selling_non_tax_price: Optional[float] = 0.00
    selling_tax_amount: Optional[float] = 0.00
    selling_tax_price: Optional[float] = 0.00

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

    @model_validator(mode="before")
    @classmethod
    def clean_payload(cls, data: Any) -> Any:
        if isinstance(data, dict):
            cat_val = data.get("category_id") if "category_id" in data else data.get("category")
            data["category_id"] = parse_id(cat_val)

            unit_val = data.get("unit_id") if "unit_id" in data else data.get("unit")
            data["unit_id"] = parse_id(unit_val)

            supp_val = data.get("supplier_id") if "supplier_id" in data else data.get("supplier")
            data["supplier_id"] = parse_id(supp_val)

            brand_val = data.get("brand_id") if "brand_id" in data else data.get("brand")
            data["brand_id"] = parse_id(brand_val)

            for date_field in ["manufacturing_date", "expiry_date"]:
                if data.get(date_field) in ("", "null", None):
                    data[date_field] = None

            if data.get("barcode") == "":
                data["barcode"] = None

        return data


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    product_code: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    unit_id: Optional[int] = None
    supplier_id: Optional[int] = None

    purchase_gst_percent: Optional[float] = None
    purchase_non_tax_price: Optional[float] = None
    purchase_tax_amount: Optional[float] = None
    purchase_final_price: Optional[float] = None

    selling_gst_percent: Optional[float] = None
    selling_non_tax_price: Optional[float] = None
    selling_tax_amount: Optional[float] = None
    selling_tax_price: Optional[float] = None

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

    @model_validator(mode="before")
    @classmethod
    def clean_payload(cls, data: Any) -> Any:
        if isinstance(data, dict):
            mappings = [
                ("category_id", "category"),
                ("unit_id", "unit"),
                ("supplier_id", "supplier"),
                ("brand_id", "brand")
            ]
            for id_field, alias in mappings:
                if id_field in data or alias in data:
                    val = data.get(id_field) if id_field in data else data.get(alias)
                    data[id_field] = parse_id(val)

            for date_field in ["manufacturing_date", "expiry_date"]:
                if date_field in data and data.get(date_field) in ("", "null", None):
                    data[date_field] = None

            if "barcode" in data and data.get("barcode") == "":
                data["barcode"] = None

        return data



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
