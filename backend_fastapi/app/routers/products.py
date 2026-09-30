from typing import Optional, List
from fastapi import APIRouter, Depends, Query, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import LoginAccount
from app.services.product_service import ProductService
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, CategoryCreate, CategoryResponse,
    BrandCreate, BrandResponse, UnitCreate, UnitResponse, StockAdjustmentRequest,
    StockMovementResponse
)
from app.utils.response import success_response, error_response
from app.utils.pagination import get_pagination_meta

router = APIRouter(tags=["Inventory & Products"])

# --- CATEGORIES ---

@router.get("/inventory/categories/")
def list_categories(db: Session = Depends(get_db)):
    service = ProductService(db)
    cats = service.list_categories()
    data = [CategoryResponse.model_validate(c).model_dump() for c in cats]
    return success_response(data=data, message="Categories fetched")


@router.post("/inventory/categories/")
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    cat = service.create_category(data)
    return success_response(data=CategoryResponse.model_validate(cat).model_dump(), message="Category created", status_code=201)


# --- BRANDS ---

@router.get("/inventory/brands/")
def list_brands(db: Session = Depends(get_db)):
    service = ProductService(db)
    brands = service.list_brands()
    data = [BrandResponse.model_validate(b).model_dump() for b in brands]
    return success_response(data=data, message="Brands fetched")


@router.post("/inventory/brands/")
def create_brand(
    data: BrandCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    brand = service.create_brand(data)
    return success_response(data=BrandResponse.model_validate(brand).model_dump(), message="Brand created", status_code=201)


# --- UNITS ---

@router.get("/inventory/units/")
def list_units(db: Session = Depends(get_db)):
    service = ProductService(db)
    units = service.list_units()
    data = [UnitResponse.model_validate(u).model_dump() for u in units]
    return success_response(data=data, message="Units fetched")


@router.post("/inventory/units/")
def create_unit(
    data: UnitCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    unit = service.create_unit(data)
    return success_response(data=UnitResponse.model_validate(unit).model_dump(), message="Unit created", status_code=201)


def safe_iso(val):
    if not val:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)


def serialize_product_fast(p) -> dict:
    return {
        "id": p.id,
        "product_code": p.product_code or p.sku,
        "name": p.name,
        "sku": p.sku,
        "barcode": p.barcode,
        "category_id": p.category_id,
        "brand_id": p.brand_id,
        "unit_id": p.unit_id,
        "cost_price": float(p.cost_price or 0.0),
        "mrp": float(p.mrp or 0.0),
        "selling_price": float(p.selling_price or 0.0),
        "discount_percent": float(p.discount_percent or 0.0),
        "gst_percent": float(p.gst_percent or 0.0),
        "stock_quantity": float(p.stock_quantity or 0.0),
        "min_stock_alert": float(p.min_stock_alert or 10.0),
        "manufacturing_date": safe_iso(getattr(p, "manufacturing_date", None)),
        "expiry_date": safe_iso(getattr(p, "expiry_date", None)),
        "batch_number": p.batch_number,
        "image": p.image,
        "description": p.description,
        "short_description": getattr(p, "short_description", None),
        "is_featured": bool(getattr(p, "is_featured", False)),
        "is_active": bool(p.is_active if p.is_active is not None else True),
        "created_at": safe_iso(getattr(p, "created_at", None)),
        "updated_at": safe_iso(getattr(p, "updated_at", None)),
        "category": {
            "id": p.category.id,
            "name": p.category.name,
            "code": getattr(p.category, "code", None),
            "description": getattr(p.category, "description", None),
            "is_active": getattr(p.category, "is_active", True)
        } if getattr(p, "category", None) else None,
        "unit": {
            "id": p.unit.id,
            "name": p.unit.name,
            "short_name": getattr(p.unit, "short_name", None) or p.unit.name,
            "allow_decimal": getattr(p.unit, "allow_decimal", False)
        } if getattr(p, "unit", None) else None,
        "brand": {
            "id": p.brand.id,
            "name": p.brand.name
        } if getattr(p, "brand", None) else None,
    }


# --- PRODUCTS ---

@router.get("/inventory/products/")
def list_products(
    category_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    barcode: Optional[str] = Query(None),
    sku: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: Optional[int] = Query(None),
    page_size: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    eff_limit = limit or page_size or 500
    if eff_limit > 1000:
        eff_limit = 1000
    service = ProductService(db)
    products, total = service.list_products(
        category_id=category_id,
        brand_id=brand_id,
        search=search,
        barcode=barcode,
        sku=sku,
        is_active=is_active,
        page=page,
        limit=eff_limit
    )
    data = [serialize_product_fast(p) for p in products]
    pagination = get_pagination_meta(total, page, eff_limit)
    return success_response(data=data, pagination=pagination, message="Products fetched")


@router.get("/inventory/products/next_id/")
def get_next_product_id(db: Session = Depends(get_db)):
    service = ProductService(db)
    next_id = service.get_next_product_id()
    return success_response(data={"next_id": next_id}, message="Next product ID generated")


@router.get("/inventory/products/{product_id}/")
def get_product(product_id: int, db: Session = Depends(get_db)):
    service = ProductService(db)
    product = service.get_product(product_id)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Product details fetched")


@router.post("/inventory/products/")
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = ProductService(db)
    product = service.create_product(data)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Product created", status_code=201)


@router.put("/inventory/products/{product_id}/")
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = ProductService(db)
    product = service.update_product(product_id, data)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Product updated")


@router.delete("/inventory/products/{product_id}/")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    service.delete_product(product_id)
    return success_response(data=None, message="Product deleted")


@router.post("/inventory/products/{product_id}/adjust_stock/")
def adjust_stock(
    product_id: int,
    data: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = ProductService(db)
    product = service.adjust_stock(product_id, data, user_id=current_user.id)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Stock adjusted")


@router.post("/inventory/products/bulk_upload/")
def bulk_upload_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    return success_response(data={"uploaded": True, "count": 0}, message="Bulk upload processed")


# --- STOCK MOVEMENTS ---

@router.get("/inventory/movements/")
def list_stock_movements(
    product_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = ProductService(db)
    movements, total = service.list_stock_movements(product_id=product_id, page=page, limit=limit)
    data = []
    for m in movements:
        item = StockMovementResponse.model_validate(m).model_dump()
        if m.product:
            item["product_name"] = m.product.name
        data.append(item)

    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Stock movements fetched")
