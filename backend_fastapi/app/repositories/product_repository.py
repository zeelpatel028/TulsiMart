from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, update, delete
from sqlalchemy.orm import selectinload, joinedload

from app.models.product import Category, Brand, Unit, Product, StockMovement


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Category
    async def list_categories(self, is_active_only: bool = False) -> List[Category]:
        query = select(Category)
        if is_active_only:
            query = query.where(Category.is_active == True)
        query = query.order_by(Category.name.asc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def get_category_by_id(self, cat_id: int) -> Optional[Category]:
        res = await self.db.execute(select(Category).where(Category.id == cat_id))
        return res.scalars().first()

    async def create_category(self, category: Category) -> Category:
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    # Brand
    async def list_brands(self) -> List[Brand]:
        query = select(Brand).order_by(Brand.name.asc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def create_brand(self, brand: Brand) -> Brand:
        self.db.add(brand)
        await self.db.flush()
        await self.db.refresh(brand)
        return brand

    # Unit
    async def list_units(self) -> List[Unit]:
        query = select(Unit).order_by(Unit.name.asc())
        res = await self.db.execute(query)
        return list(res.scalars().all())

    async def create_unit(self, unit: Unit) -> Unit:
        self.db.add(unit)
        await self.db.flush()
        await self.db.refresh(unit)
        return unit

    # Product
    async def list_products(
        self,
        category_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Product], int]:
        offset = (page - 1) * limit
        
        # Base query with eager loading to prevent N+1 queries
        query = select(Product).options(
            joinedload(Product.category),
            joinedload(Product.brand),
            joinedload(Product.unit)
        )
        count_query = select(func.count(Product.id))

        filters = []
        if category_id:
            filters.append(Product.category_id == category_id)
        if brand_id:
            filters.append(Product.brand_id == brand_id)
        if is_active is not None:
            filters.append(Product.is_active == is_active)
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
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(Product.id.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().unique().all()), total

    async def get_by_id(self, product_id: int) -> Optional[Product]:
        query = select(Product).options(
            joinedload(Product.category),
            joinedload(Product.brand),
            joinedload(Product.unit)
        ).where(Product.id == product_id)
        res = await self.db.execute(query)
        return res.scalars().first()

    async def get_by_sku_or_barcode(self, identifier: str) -> Optional[Product]:
        query = select(Product).options(
            joinedload(Product.category),
            joinedload(Product.brand),
            joinedload(Product.unit)
        ).where(
            or_(
                Product.sku == identifier,
                Product.barcode == identifier,
                Product.product_code == identifier
            )
        )
        res = await self.db.execute(query)
        return res.scalars().first()

    async def get_max_product_id(self) -> int:
        res = await self.db.execute(select(func.coalesce(func.max(Product.id), 0)))
        return res.scalar_one()

    async def create_product(self, product: Product) -> Product:
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    # Stock Movement
    async def add_stock_movement(self, movement: StockMovement) -> StockMovement:
        self.db.add(movement)
        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def list_stock_movements(self, product_id: Optional[int] = None, page: int = 1, limit: int = 20) -> Tuple[List[StockMovement], int]:
        offset = (page - 1) * limit
        query = select(StockMovement).options(joinedload(StockMovement.product))
        count_query = select(func.count(StockMovement.id))

        if product_id:
            query = query.where(StockMovement.product_id == product_id)
            count_query = count_query.where(StockMovement.product_id == product_id)

        count_res = await self.db.execute(count_query)
        total = count_res.scalar_one()

        query = query.order_by(StockMovement.created_at.desc()).offset(offset).limit(limit)
        res = await self.db.execute(query)
        return list(res.scalars().all()), total
