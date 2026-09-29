from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.core.logging_config import logger
from app.models.user import LoginAccount
from app.models.store import StoreSetting
from app.models.product import Category, Product


async def init_db():
    """
    Creates tables if they don't exist and seeds default admin user & store settings.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database connection established and tables verified.")

        async with AsyncSessionLocal() as db:
            # Seed Store Settings if missing
            res = await db.execute(select(StoreSetting).where(StoreSetting.id == 1))
            settings_obj = res.scalars().first()
            if not settings_obj:
                settings_obj = StoreSetting(
                    id=1,
                    store_name="Tulsi Mart",
                    tagline="Fresh Groceries & Supermarket",
                    address="Shop No. 12-14, Heritage Plaza, MG Road",
                    city="Mumbai",
                    state="Maharashtra",
                    phone="+91 98765 43210",
                    email="contact@tulsimart.com"
                )
                db.add(settings_obj)
                logger.info("Seeded initial StoreSetting.")

            # Seed Admin User if missing
            res = await db.execute(select(LoginAccount).where(LoginAccount.username == "admin"))
            admin_user = res.scalars().first()
            if not admin_user:
                hashed_pw = get_password_hash("admin123")
                admin_user = LoginAccount(
                    username="admin",
                    password=hashed_pw,
                    full_name="Tulsi Mart Admin",
                    email="admin@tulsimart.com",
                    role="ADMIN",
                    is_active=True,
                    require_otp=False
                )
                db.add(admin_user)
                logger.info("Seeded initial Admin User (username: admin, password: admin123).")

            # Seed sample categories and products if empty
            res = await db.execute(select(Category))
            existing_cat = res.scalars().first()
            if not existing_cat:
                cat1 = Category(name="Groceries & Staples", slug="groceries-staples", is_active=True)
                cat2 = Category(name="Fresh Vegetables", slug="fresh-vegetables", is_active=True)
                cat3 = Category(name="Beverages & Drinks", slug="beverages-drinks", is_active=True)
                db.add_all([cat1, cat2, cat3])
                await db.flush()

                p1 = Product(
                    name="Fortune Sunflower Oil 1L",
                    sku="OIL-001",
                    barcode="8901234567890",
                    category_id=cat1.id,
                    cost_price=120.00,
                    selling_price=145.00,
                    mrp=160.00,
                    stock_quantity=50.0,
                    min_stock_alert=10.0,
                    is_active=True
                )
                p2 = Product(
                    name="Basmati Rice 5kg",
                    sku="RICE-005",
                    barcode="8901234567891",
                    category_id=cat1.id,
                    cost_price=450.00,
                    selling_price=520.00,
                    mrp=580.00,
                    stock_quantity=30.0,
                    min_stock_alert=5.0,
                    is_active=True
                )
                db.add_all([p1, p2])
                logger.info("Seeded sample categories and products.")

            await db.commit()
    except Exception as e:
        logger.error(f"Error during database initialization/seeding: {str(e)}")

