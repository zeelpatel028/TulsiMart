from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.core.logging_config import logger
from app.models.user import LoginAccount
from app.models.store import StoreSetting
from app.models.product import Category, Product, Unit


def init_db():
    """
    Creates tables if they don't exist and seeds default admin user & store settings.
    If database is SQLite (Localhost development), seeds initial demo products & categories.
    """
    try:
        Base.metadata.create_all(bind=engine)
        is_sqlite_db = settings.DATABASE_URL.strip().startswith("sqlite")
        active_db_type = "SQLite3 (Localhost)" if is_sqlite_db else "MySQL (Aiven Cloud Host)"
        logger.info(f"Database connection established and tables verified on {active_db_type}.")
        print(f"[ACTIVE DATABASE ENGINE: {active_db_type}]")

        with SessionLocal() as db:
            # Seed Store Settings if missing
            settings_obj = db.query(StoreSetting).filter(StoreSetting.id == 1).first()
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
            admin_user = db.query(LoginAccount).filter(LoginAccount.username == "admin").first()
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

            # Seed Default Grocery Units if empty
            existing_unit = db.query(Unit).first()
            if not existing_unit:
                default_units = [
                    Unit(name="Kilogram", short_name="kg", base_unit="g", conversion_factor=1000.0),
                    Unit(name="Gram", short_name="g", base_unit="g", conversion_factor=1.0),
                    Unit(name="Milligram", short_name="mg", base_unit="g", conversion_factor=0.001),
                    Unit(name="Quintal", short_name="q", base_unit="g", conversion_factor=100000.0),
                    Unit(name="Litre", short_name="L", base_unit="ml", conversion_factor=1000.0),
                    Unit(name="Millilitre", short_name="ml", base_unit="ml", conversion_factor=1.0),
                    Unit(name="Piece", short_name="pc", base_unit="pc", conversion_factor=1.0),
                    Unit(name="Packet", short_name="pkt", base_unit="pkt", conversion_factor=1.0),
                    Unit(name="Pack", short_name="pack", base_unit="pack", conversion_factor=1.0),
                    Unit(name="Box", short_name="box", base_unit="box", conversion_factor=1.0),
                    Unit(name="Bottle", short_name="btl", base_unit="btl", conversion_factor=1.0),
                    Unit(name="Jar", short_name="jar", base_unit="jar", conversion_factor=1.0),
                    Unit(name="Can", short_name="can", base_unit="can", conversion_factor=1.0),
                    Unit(name="Pouch", short_name="pouch", base_unit="pouch", conversion_factor=1.0),
                    Unit(name="Bag", short_name="bag", base_unit="bag", conversion_factor=1.0),
                    Unit(name="Dozen", short_name="dz", base_unit="pc", conversion_factor=12.0),
                    Unit(name="Half Dozen", short_name="hdz", base_unit="pc", conversion_factor=6.0),
                    Unit(name="Bundle", short_name="bdl", base_unit="bdl", conversion_factor=1.0),
                    Unit(name="Sachet", short_name="sachet", base_unit="sachet", conversion_factor=1.0),
                    Unit(name="Strip", short_name="strip", base_unit="strip", conversion_factor=1.0),
                    Unit(name="Carton", short_name="ctn", base_unit="ctn", conversion_factor=1.0),
                    Unit(name="Set", short_name="set", base_unit="set", conversion_factor=1.0),
                    Unit(name="Tray", short_name="tray", base_unit="tray", conversion_factor=1.0),
                    Unit(name="Roll", short_name="roll", base_unit="roll", conversion_factor=1.0),
                    Unit(name="Meter", short_name="m", base_unit="m", conversion_factor=1.0)
                ]
                db.add_all(default_units)
                db.flush()
                logger.info("Seeded default grocery units.")

            # Seed demo products ONLY when using SQLite3 database (Localhost development)
            is_sqlite = settings.DATABASE_URL.strip().startswith("sqlite")
            if is_sqlite:
                existing_cat = db.query(Category).first()
                if not existing_cat:
                    cat1 = Category(name="Groceries & Staples", slug="groceries-staples", is_active=True)
                    cat2 = Category(name="Fresh Vegetables & Fruits", slug="fresh-vegetables-fruits", is_active=True)
                    cat3 = Category(name="Beverages & Drinks", slug="beverages-drinks", is_active=True)
                    cat4 = Category(name="Dairy & Bakery", slug="dairy-bakery", is_active=True)
                    cat5 = Category(name="Snacks & Munchies", slug="snacks-munchies", is_active=True)
                    db.add_all([cat1, cat2, cat3, cat4, cat5])
                    db.flush()

                    demo_products = [
                        Product(
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
                        ),
                        Product(
                            name="India Gate Basmati Rice 5kg",
                            sku="RICE-005",
                            barcode="8901234567891",
                            category_id=cat1.id,
                            cost_price=450.00,
                            selling_price=520.00,
                            mrp=580.00,
                            stock_quantity=30.0,
                            min_stock_alert=5.0,
                            is_active=True
                        ),
                        Product(
                            name="Amul Pasteurised Butter 500g",
                            sku="BUTTER-500",
                            barcode="8901234567892",
                            category_id=cat4.id,
                            cost_price=240.00,
                            selling_price=275.00,
                            mrp=285.00,
                            stock_quantity=40.0,
                            min_stock_alert=8.0,
                            is_active=True
                        ),
                        Product(
                            name="Coca-Cola Original Taste 750ml",
                            sku="COKE-750",
                            barcode="8901234567893",
                            category_id=cat3.id,
                            cost_price=32.00,
                            selling_price=40.00,
                            mrp=40.00,
                            stock_quantity=60.0,
                            min_stock_alert=15.0,
                            is_active=True
                        ),
                        Product(
                            name="Lays Magic Masala Potato Chips 50g",
                            sku="LAYS-050",
                            barcode="8901234567894",
                            category_id=cat5.id,
                            cost_price=16.00,
                            selling_price=20.00,
                            mrp=20.00,
                            stock_quantity=100.0,
                            min_stock_alert=20.0,
                            is_active=True
                        ),
                        Product(
                            name="Fresh Farm Tomatoes 1kg",
                            sku="TOM-001",
                            barcode="8901234567895",
                            category_id=cat2.id,
                            cost_price=25.00,
                            selling_price=35.00,
                            mrp=40.00,
                            stock_quantity=25.0,
                            min_stock_alert=5.0,
                            is_active=True
                        )
                    ]
                    db.add_all(demo_products)
                    logger.info("Seeded demo products for SQLite3 local development.")

            db.commit()
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")


