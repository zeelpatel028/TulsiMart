from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_

from app.models.product import Category, Brand, Unit, Product, StockMovement


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    # Category
    def list_categories(self, is_active_only: bool = False) -> List[Category]:
        query = self.db.query(Category)
        if is_active_only:
            query = query.filter(Category.is_active == True)
        return query.order_by(Category.name.asc()).all()

    def get_category_by_id(self, cat_id: int) -> Optional[Category]:
        return self.db.query(Category).filter(Category.id == cat_id).first()

    def get_category_by_name(self, name: str) -> Optional[Category]:
        return self.db.query(Category).filter(Category.name == name).first()

    def create_category(self, category: Category) -> Category:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    # Brand
    def list_brands(self) -> List[Brand]:
        return self.db.query(Brand).order_by(Brand.name.asc()).all()

    def create_brand(self, brand: Brand) -> Brand:
        self.db.add(brand)
        self.db.commit()
        self.db.refresh(brand)
        return brand

    # Unit
    def list_units(self) -> List[Unit]:
        return self.db.query(Unit).order_by(Unit.name.asc()).all()

    def create_unit(self, unit: Unit) -> Unit:
        self.db.add(unit)
        self.db.commit()
        self.db.refresh(unit)
        return unit

    # Product
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
        offset = (page - 1) * limit
        
        # Base query with eager loading to prevent N+1 queries
        query = self.db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.brand),
            joinedload(Product.unit)
        )
        count_query = self.db.query(func.count(Product.id))

        filters = []
        if category_id:
            filters.append(Product.category_id == category_id)
        if brand_id:
            filters.append(Product.brand_id == brand_id)
        if is_active is not None:
            filters.append(Product.is_active == is_active)
        if barcode:
            filters.append(Product.barcode == barcode)
        if sku:
            filters.append(Product.sku == sku)
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.sku.ilike(search_pattern),
                    Product.barcode.ilike(search_pattern),
                    Product.product_code.ilike(search_pattern)
                )
            )

        if filters:
            query = query.filter(and_(*filters))
            count_query = count_query.filter(and_(*filters))

        total = count_query.scalar() or 0
        products = query.order_by(Product.id.desc()).offset(offset).limit(limit).all()
        return products, total

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return (
            self.db.query(Product)
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
                joinedload(Product.unit)
            )
            .filter(Product.id == product_id)
            .first()
        )

    def get_by_sku_or_barcode(self, identifier: str) -> Optional[Product]:
        return (
            self.db.query(Product)
            .options(
                joinedload(Product.category),
                joinedload(Product.brand),
                joinedload(Product.unit)
            )
            .filter(
                or_(
                    Product.sku == identifier,
                    Product.barcode == identifier,
                    Product.product_code == identifier
                )
            )
            .first()
        )

    def get_max_product_id(self) -> int:
        res = self.db.query(func.coalesce(func.max(Product.id), 0)).scalar()
        return int(res or 0)

    def create_product(self, product: Product) -> Product:
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    # Stock Movement
    def add_stock_movement(self, movement: StockMovement) -> StockMovement:
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        return movement

    def list_stock_movements(self, product_id: Optional[int] = None, page: int = 1, limit: int = 20) -> Tuple[List[StockMovement], int]:
        offset = (page - 1) * limit
        query = self.db.query(StockMovement).options(joinedload(StockMovement.product))
        count_query = self.db.query(func.count(StockMovement.id))

        if product_id:
            query = query.filter(StockMovement.product_id == product_id)
            count_query = count_query.filter(StockMovement.product_id == product_id)

        total = count_query.scalar() or 0
        movements = query.order_by(StockMovement.created_at.desc()).offset(offset).limit(limit).all()
        return movements, total
