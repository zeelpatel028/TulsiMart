from typing import Optional, List
from fastapi import APIRouter, Depends, Query, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

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
async def list_categories(db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    cats = await service.list_categories()
    data = [CategoryResponse.model_validate(c).model_dump() for c in cats]
    return success_response(data=data, message="Categories fetched")


@router.post("/inventory/categories/")
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    cat = await service.create_category(data)
    return success_response(data=CategoryResponse.model_validate(cat).model_dump(), message="Category created", status_code=201)


# --- BRANDS ---

@router.get("/inventory/brands/")
async def list_brands(db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    brands = await service.list_brands()
    data = [BrandResponse.model_validate(b).model_dump() for b in brands]
    return success_response(data=data, message="Brands fetched")


@router.post("/inventory/brands/")
async def create_brand(
    data: BrandCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    brand = await service.create_brand(data)
    return success_response(data=BrandResponse.model_validate(brand).model_dump(), message="Brand created", status_code=201)


# --- UNITS ---

@router.get("/inventory/units/")
async def list_units(db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    units = await service.list_units()
    data = [UnitResponse.model_validate(u).model_dump() for u in units]
    return success_response(data=data, message="Units fetched")


@router.post("/inventory/units/")
async def create_unit(
    data: UnitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    unit = await service.create_unit(data)
    return success_response(data=UnitResponse.model_validate(unit).model_dump(), message="Unit created", status_code=201)


# --- PRODUCTS ---

@router.get("/inventory/products/")
async def list_products(
    category_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = ProductService(db)
    products, total = await service.list_products(
        category_id=category_id,
        brand_id=brand_id,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit
    )
    data = [ProductResponse.model_validate(p).model_dump() for p in products]
    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Products fetched")


@router.get("/inventory/products/next_id/")
async def get_next_product_id(db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    next_id = await service.get_next_product_id()
    return success_response(data={"next_id": next_id}, message="Next product ID generated")


@router.get("/inventory/products/{product_id}/")
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    product = await service.get_product(product_id)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Product details fetched")


@router.post("/inventory/products/")
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = ProductService(db)
    product = await service.create_product(data)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Product created", status_code=201)


@router.put("/inventory/products/{product_id}/")
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = ProductService(db)
    product = await service.update_product(product_id, data)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Product updated")


@router.delete("/inventory/products/{product_id}/")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    service = ProductService(db)
    await service.delete_product(product_id)
    return success_response(data=None, message="Product deleted")


@router.post("/inventory/products/{product_id}/adjust_stock/")
async def adjust_stock(
    product_id: int,
    data: StockAdjustmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(get_current_user)
):
    service = ProductService(db)
    product = await service.adjust_stock(product_id, data, user_id=current_user.id)
    return success_response(data=ProductResponse.model_validate(product).model_dump(), message="Stock adjusted")


@router.post("/inventory/products/bulk_upload/")
async def bulk_upload_products(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: LoginAccount = Depends(require_admin)
):
    return success_response(data={"uploaded": True, "count": 0}, message="Bulk upload processed")


# --- STOCK MOVEMENTS ---

@router.get("/inventory/movements/")
async def list_stock_movements(
    product_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = ProductService(db)
    movements, total = await service.list_stock_movements(product_id=product_id, page=page, limit=limit)
    data = []
    for m in movements:
        item = StockMovementResponse.model_validate(m).model_dump()
        if m.product:
            item["product_name"] = m.product.name
        data.append(item)

    pagination = get_pagination_meta(total, page, limit)
    return success_response(data=data, pagination=pagination, message="Stock movements fetched")
