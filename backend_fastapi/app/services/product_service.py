from typing import List, Tuple, Optional
import random, string
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.product_repository import ProductRepository
from app.models.product import Category, Brand, Unit, Product, StockMovement
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, BrandCreate, UnitCreate, StockAdjustmentRequest


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProductRepository(db)

    async def list_products(
        self,
        category_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Product], int]:
        return await self.repo.list_products(
            category_id=category_id,
            brand_id=brand_id,
            search=search,
            is_active=is_active,
            page=page,
            limit=limit
        )

    async def get_product(self, product_id: int) -> Product:
        product = await self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    async def get_next_product_id(self) -> str:
        max_id = await self.repo.get_max_product_id()
        next_id = max_id + 1
        return f"PRD-{next_id:04d}"

    async def create_product(self, data: ProductCreate) -> Product:
        existing = await self.repo.get_by_sku_or_barcode(data.sku)
        if existing:
            raise HTTPException(status_code=400, detail=f"Product with SKU '{data.sku}' already exists")

        product_code = data.product_code or await self.get_next_product_id()

        product = Product(
            product_code=product_code,
            name=data.name,
            sku=data.sku,
            barcode=data.barcode or product_code,
            category_id=data.category_id,
            brand_id=data.brand_id,
            unit_id=data.unit_id,
            selling_unit_id=data.selling_unit_id,
            supplier_id=data.supplier_id,
            cost_price=data.cost_price,
            mrp=data.mrp,
            selling_price=data.selling_price,
            discount_percent=data.discount_percent,
            gst_percent=data.gst_percent,
            stock_quantity=data.stock_quantity,
            min_stock_alert=data.min_stock_alert,
            manufacturing_date=data.manufacturing_date,
            expiry_date=data.expiry_date,
            batch_number=data.batch_number,
            image=data.image,
            description=data.description,
            short_description=data.short_description,
            is_featured=data.is_featured,
            is_active=data.is_active
        )
        created_product = await self.repo.create_product(product)

        # Log initial stock movement if stock > 0
        if data.stock_quantity > 0:
            movement = StockMovement(
                product_id=created_product.id,
                movement_type="PURCHASE_IN",
                quantity=data.stock_quantity,
                balance_after=data.stock_quantity,
                reason="Initial Stock Setup",
                reference_no="INIT"
            )
            await self.repo.add_stock_movement(movement)

        return await self.get_product(created_product.id)

    async def update_product(self, product_id: int, data: ProductUpdate) -> Product:
        product = await self.get_product(product_id)

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(product, key, value)

        await self.db.flush()
        return await self.get_product(product_id)

    async def delete_product(self, product_id: int) -> None:
        product = await self.get_product(product_id)
        await self.db.delete(product)
        await self.db.flush()

    async def adjust_stock(self, product_id: int, data: StockAdjustmentRequest, user_id: Optional[int] = None) -> Product:
        product = await self.get_product(product_id)

        old_stock = float(product.stock_quantity)
        qty_change = float(data.quantity)

        if data.adjustment_type in ["POS_SALE", "SUPPLIER_RETURN", "DAMAGE_OUT"]:
            new_stock = old_stock - abs(qty_change)
            movement_qty = -abs(qty_change)
        else:
            new_stock = old_stock + abs(qty_change)
            movement_qty = abs(qty_change)

        if new_stock < 0:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product '{product.name}'. Current stock: {old_stock}")

        product.stock_quantity = new_stock

        movement = StockMovement(
            product_id=product.id,
            movement_type=data.adjustment_type,
            quantity=movement_qty,
            balance_after=new_stock,
            reason=data.reason or "Manual Adjustment",
            reference_no=data.reference_no,
            performed_by_id=user_id
        )
        await self.repo.add_stock_movement(movement)
        await self.db.flush()
        return await self.get_product(product_id)

    # Categories, Brands, Units
    async def list_categories(self) -> List[Category]:
        return await self.repo.list_categories()

    async def create_category(self, data: CategoryCreate) -> Category:
        slug = data.slug or data.name.lower().replace(" ", "-")
        category = Category(
            name=data.name,
            slug=slug,
            icon=data.icon or "ShoppingBag",
            image=data.image,
            description=data.description,
            is_active=data.is_active
        )
        return await self.repo.create_category(category)

    async def list_brands(self) -> List[Brand]:
        return await self.repo.list_brands()

    async def create_brand(self, data: BrandCreate) -> Brand:
        brand = Brand(name=data.name, description=data.description, is_active=data.is_active)
        return await self.repo.create_brand(brand)

    async def list_units(self) -> List[Unit]:
        return await self.repo.list_units()

    async def create_unit(self, data: UnitCreate) -> Unit:
        unit = Unit(
            name=data.name,
            short_name=data.short_name,
            base_unit=data.base_unit,
            conversion_factor=data.conversion_factor
        )
        return await self.repo.create_unit(unit)

    async def list_stock_movements(self, product_id: Optional[int] = None, page: int = 1, limit: int = 20):
        return await self.repo.list_stock_movements(product_id=product_id, page=page, limit=limit)
