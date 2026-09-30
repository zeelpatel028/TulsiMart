from typing import List, Tuple, Optional
import random, string
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories.product_repository import ProductRepository
from app.models.product import Category, Brand, Unit, Product, StockMovement
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, BrandCreate, UnitCreate, StockAdjustmentRequest


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)

    def list_products(
        self,
        category_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        search: Optional[str] = None,
        barcode: Optional[str] = None,
        sku: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 500
    ) -> Tuple[List[Product], int]:
        return self.repo.list_products(
            category_id=category_id,
            brand_id=brand_id,
            search=search,
            barcode=barcode,
            sku=sku,
            is_active=is_active,
            page=page,
            limit=limit
        )

    def get_product(self, product_id: int) -> Product:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    def get_next_product_id(self) -> str:
        max_id = self.repo.get_max_product_id()
        next_id = max_id + 1
        return f"PRD-{next_id:04d}"

    def create_product(self, data: ProductCreate) -> Product:
        existing = self.repo.get_by_sku_or_barcode(data.sku)
        if existing:
            raise HTTPException(status_code=400, detail=f"Product with SKU '{data.sku}' already exists")

        product_code = data.product_code or self.get_next_product_id()

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
        created_product = self.repo.create_product(product)

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
            self.repo.add_stock_movement(movement)

        return self.get_product(created_product.id)

    def update_product(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get_product(product_id)

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(product, key, value)

        self.db.flush()
        return self.get_product(product_id)

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)
        self.db.delete(product)
        self.db.flush()

    def adjust_stock(self, product_id: int, data: StockAdjustmentRequest, user_id: Optional[int] = None) -> Product:
        product = self.get_product(product_id)

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
        self.repo.add_stock_movement(movement)
        self.db.flush()
        return self.get_product(product_id)

    # Categories, Brands, Units
    def list_categories(self) -> List[Category]:
        return self.repo.list_categories()

    def create_category(self, data: CategoryCreate) -> Category:
        existing = self.repo.get_category_by_name(data.name)
        if existing:
            return existing
        slug = data.slug or data.name.lower().replace(" ", "-")
        category = Category(
            name=data.name,
            slug=slug,
            icon=data.icon or "ShoppingBag",
            image=data.image,
            description=data.description,
            is_active=data.is_active
        )
        return self.repo.create_category(category)

    def list_brands(self) -> List[Brand]:
        return self.repo.list_brands()

    def create_brand(self, data: BrandCreate) -> Brand:
        brand = Brand(name=data.name, description=data.description, is_active=data.is_active)
        return self.repo.create_brand(brand)

    def list_units(self) -> List[Unit]:
        return self.repo.list_units()

    def create_unit(self, data: UnitCreate) -> Unit:
        unit = Unit(
            name=data.name,
            short_name=data.short_name,
            base_unit=data.base_unit,
            conversion_factor=data.conversion_factor
        )
        return self.repo.create_unit(unit)

    def list_stock_movements(self, product_id: Optional[int] = None, page: int = 1, limit: int = 20):
        return self.repo.list_stock_movements(product_id=product_id, page=page, limit=limit)
