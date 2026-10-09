"""
Tulsi Mart - 3 Months Historical Demo Data Seeding Script
==========================================================
Generates realistic, high-quality supermarket demo data for the last 3 months
(July 1, 2026 to October 9, 2026) in the existing SQLite3 database.

Idempotent: Safe to run multiple times without duplicating records or corrupting existing data.
"""

import os
import sys
import random
from datetime import datetime, date, timedelta

# Ensure parent directory is in sys.path for app imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import LoginAccount
from app.models.staff import Staff
from app.models.store import StoreSetting, ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction
from app.models.product import Category, Brand, Unit, Product, StockMovement
from app.models.customer import Customer, CustomerFeedback
from app.models.order import Order, OrderItem, PaymentTransaction
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from app.models.expense import ExpenseCategory, Expense
from app.models.offer import Coupon, FestivalOffer


def seed_demo_data():
    print("\n========================================================")
    print("   TULSI MART - 3 MONTHS DEMO DATA SEEDER")
    print("========================================================\n")
    
    # Ensure database schema tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Reference dates: Current date Oct 9, 2026
    ref_date = date(2026, 10, 9)
    start_date = date(2026, 7, 1) # 3 months ago (July 1, 2026)
    
    print(f"[*] Reference Date: {ref_date}")
    print(f"[*] Seeding Period: {start_date} to {ref_date} (~101 days)")
    print("[*] Target Database: SQLite3 (tulsimart.db)\n")

    seeded_summary = {}

    try:
        # ----------------------------------------------------
        # 1. STORE SETTINGS & ADMIN USER
        # ----------------------------------------------------
        store = db.query(StoreSetting).filter(StoreSetting.id == 1).first()
        if not store:
            store = StoreSetting(
                id=1,
                store_name="Tulsi Mart",
                tagline="Fresh Groceries & Supermarket",
                address="Shop No. 12-14, Heritage Plaza, MG Road",
                city="Mumbai",
                state="Maharashtra",
                pincode="400001",
                phone="+91 98765 43210",
                email="contact@tulsimart.com",
                gst_number="27AABCT8899F1Z4",
                home_cash_amount=45000.00
            )
            db.add(store)
            db.flush()
            print("[+] Seeded Store Settings")
        
        admin_user = db.query(LoginAccount).filter(LoginAccount.username == "admin").first()
        if not admin_user:
            admin_user = LoginAccount(
                username="admin",
                password=get_password_hash("admin123"),
                full_name="Tulsi Mart Admin",
                email="admin@tulsimart.com",
                role="ADMIN",
                is_active=True
            )
            db.add(admin_user)
            db.flush()
            print("[+] Seeded Admin User (admin / admin123)")

        # ----------------------------------------------------
        # 2. CATEGORIES (8 core grocery categories)
        # ----------------------------------------------------
        categories_data = [
            ("Groceries & Staples", "groceries-staples", "ShoppingBag", "Daily essential grains, pulses, and edible oils"),
            ("Fresh Vegetables & Fruits", "fresh-vegetables-fruits", "Apple", "Farm fresh organic fruits and green vegetables"),
            ("Beverages & Drinks", "beverages-drinks", "Coffee", "Soft drinks, cold juices, teas, and coffee"),
            ("Dairy & Bakery", "dairy-bakery", "Egg", "Fresh milk, butter, cheese, paneer, and fresh bread"),
            ("Snacks & Munchies", "snacks-munchies", "Cookie", "Potato chips, biscuits, namkeen, and chocolates"),
            ("Personal Care & Hygiene", "personal-care-hygiene", "Heart", "Soaps, shampoos, toothpaste, and handwashes"),
            ("Household & Cleaning", "household-cleaning", "Home", "Detergents, dishwash gels, and floor cleaners"),
            ("Spices & Masalas", "spices-masalas", "Flame", "Pure ground spices, whole spices, and seasoning mixes")
        ]
        cat_map = {}
        cat_added = 0
        for name, slug, icon, desc in categories_data:
            cat = db.query(Category).filter(Category.name == name).first()
            if not cat:
                cat = Category(name=name, slug=slug, icon=icon, description=desc, is_active=True)
                db.add(cat)
                db.flush()
                cat_added += 1
            cat_map[name] = cat
        seeded_summary["categories"] = cat_added

        # ----------------------------------------------------
        # 3. BRANDS
        # ----------------------------------------------------
        brands_data = [
            "Amul", "Fortune", "India Gate", "Coca-Cola", "Pepsi", 
            "Lays", "Parle", "Britannia", "Tata", "Nestle", 
            "Dabur", "Surf Excel", "Everest", "Aashirvaad", "Vim"
        ]
        brand_map = {}
        brand_added = 0
        for b_name in brands_data:
            b = db.query(Brand).filter(Brand.name == b_name).first()
            if not b:
                b = Brand(name=b_name, description=f"Top quality products by {b_name}", is_active=True)
                db.add(b)
                db.flush()
                brand_added += 1
            brand_map[b_name] = b
        seeded_summary["brands"] = brand_added

        # ----------------------------------------------------
        # 4. UNITS (Ensure standard units exist)
        # ----------------------------------------------------
        units_count = db.query(Unit).count()
        if units_count == 0:
            default_units = [
                Unit(name="Kilogram", short_name="kg", base_unit="g", conversion_factor=1000.0),
                Unit(name="Gram", short_name="g", base_unit="g", conversion_factor=1.0),
                Unit(name="Litre", short_name="L", base_unit="ml", conversion_factor=1000.0),
                Unit(name="Millilitre", short_name="ml", base_unit="ml", conversion_factor=1.0),
                Unit(name="Piece", short_name="pc", base_unit="pc", conversion_factor=1.0),
                Unit(name="Packet", short_name="pkt", base_unit="pkt", conversion_factor=1.0),
                Unit(name="Pack", short_name="pack", base_unit="pack", conversion_factor=1.0),
                Unit(name="Box", short_name="box", base_unit="box", conversion_factor=1.0),
                Unit(name="Bottle", short_name="btl", base_unit="btl", conversion_factor=1.0)
            ]
            db.add_all(default_units)
            db.flush()
        unit_kg = db.query(Unit).filter(Unit.short_name == "kg").first() or db.query(Unit).first()
        unit_pc = db.query(Unit).filter(Unit.short_name == "pc").first() or db.query(Unit).first()
        unit_l = db.query(Unit).filter(Unit.short_name == "L").first() or db.query(Unit).first()
        unit_pkt = db.query(Unit).filter(Unit.short_name == "pkt").first() or db.query(Unit).first()
        unit_pack = db.query(Unit).filter(Unit.short_name == "pack").first() or unit_pkt

        # ----------------------------------------------------
        # 5. SUPPLIERS
        # ----------------------------------------------------
        suppliers_list = [
            {
                "name": "Reliance Retail Wholesalers",
                "company_name": "Reliance Retail Ltd",
                "phone": "+91 98200 11223",
                "email": "supply@relianceretail.com",
                "gstin": "27AABCR1234F1Z1",
                "city": "Mumbai",
                "category": "FMCG & Groceries",
                "payment_terms": "Net 15",
                "credit_limit": 500000.0,
                "rating": 5
            },
            {
                "name": "Amul Dairy Distributors Agency",
                "company_name": "GCMMF Amul Division",
                "phone": "+91 98201 33445",
                "email": "orders@amuldairy.com",
                "gstin": "27AABCA5678G1Z2",
                "city": "Mumbai",
                "category": "Dairy & Chilled",
                "payment_terms": "Net 7",
                "credit_limit": 250000.0,
                "rating": 5
            },
            {
                "name": "Adani Wilmar Distributing Agency",
                "company_name": "Adani Wilmar Edible Oils",
                "phone": "+91 98202 55667",
                "email": "fortune@adaniwilmar.in",
                "gstin": "27AABCA9988H1Z3",
                "city": "Mumbai",
                "category": "Edible Oils & Staples",
                "payment_terms": "Net 30",
                "credit_limit": 400000.0,
                "rating": 4
            },
            {
                "name": "ITC FMCG Supply Co.",
                "company_name": "ITC Limited India",
                "phone": "+91 98203 77889",
                "email": "fmcg@itc.in",
                "gstin": "27AABCI4321J1Z4",
                "city": "Mumbai",
                "category": "Packaged Foods & Staples",
                "payment_terms": "Net 15",
                "credit_limit": 300000.0,
                "rating": 5
            },
            {
                "name": "Local Farmers Produce Hub",
                "company_name": "Nashik Agro Cooperative",
                "phone": "+91 98204 99001",
                "email": "fresh@nashikagro.org",
                "gstin": "URP",
                "city": "Nashik",
                "category": "Fresh Vegetables & Fruits",
                "payment_terms": "Cash on Delivery",
                "credit_limit": 100000.0,
                "rating": 4
            },
            {
                "name": "Britannia Direct Distribution",
                "company_name": "Britannia Industries Ltd",
                "phone": "+91 98205 12345",
                "email": "orders@britannia.co.in",
                "gstin": "27AABCB8765K1Z5",
                "city": "Mumbai",
                "category": "Bakery & Biscuits",
                "payment_terms": "Net 15",
                "credit_limit": 200000.0,
                "rating": 5
            }
        ]
        supplier_map = {}
        sup_added = 0
        for s_data in suppliers_list:
            sup = db.query(Supplier).filter(Supplier.name == s_data["name"]).first()
            if not sup:
                sup = Supplier(**s_data, is_active=True)
                db.add(sup)
                db.flush()
                sup_added += 1
            supplier_map[s_data["name"]] = sup
        seeded_summary["suppliers"] = sup_added
        
        all_suppliers = db.query(Supplier).all()

        # ----------------------------------------------------
        # 6. PRODUCTS (32 Supermarket items)
        # ----------------------------------------------------
        raw_products = [
            # Groceries & Staples
            ("Aashirvaad Whole Wheat Atta 10kg", "ATTA-010", "8901058000123", "Groceries & Staples", "Aashirvaad", unit_kg.id, 380.0, 440.0, 475.0, 5.0, 80.0, 15.0),
            ("Fortune Sunlite Sunflower Oil 1L", "OIL-001", "8901234567890", "Groceries & Staples", "Fortune", unit_l.id, 118.0, 142.0, 155.0, 5.0, 120.0, 20.0),
            ("India Gate Super Basmati Rice 5kg", "RICE-005", "8901234567891", "Groceries & Staples", "India Gate", unit_kg.id, 440.0, 530.0, 590.0, 5.0, 65.0, 10.0),
            ("Tata Iodised Salt 1kg", "SALT-001", "8901058000124", "Groceries & Staples", "Tata", unit_kg.id, 19.0, 25.0, 28.0, 0.0, 200.0, 30.0),
            ("Toor Dal Premium 1kg", "DAL-TOOR-1", "8901058000125", "Groceries & Staples", "Tata", unit_kg.id, 125.0, 155.0, 170.0, 0.0, 90.0, 15.0),
            ("Sugar Premium Crystal 1kg", "SUGAR-001", "8901058000126", "Groceries & Staples", "Fortune", unit_kg.id, 36.0, 44.0, 48.0, 0.0, 150.0, 25.0),
            
            # Dairy & Bakery
            ("Amul Pasteurised Butter 500g", "BUTTER-500", "8901234567892", "Dairy & Bakery", "Amul", unit_pkt.id, 235.0, 275.0, 285.0, 12.0, 55.0, 10.0),
            ("Amul Taaza Toned Milk 1L", "MILK-1000", "8901058000127", "Dairy & Bakery", "Amul", unit_l.id, 52.0, 64.0, 66.0, 0.0, 40.0, 10.0),
            ("Amul Malai Paneer 200g", "PANEER-200", "8901058000128", "Dairy & Bakery", "Amul", unit_pkt.id, 75.0, 95.0, 105.0, 0.0, 35.0, 8.0),
            ("Amul Cheese Slices 200g", "CHEESE-200", "8901058000129", "Dairy & Bakery", "Amul", unit_pkt.id, 110.0, 138.0, 145.0, 12.0, 45.0, 10.0),
            ("Fresh Brown Bread 400g", "BREAD-400", "8901058000130", "Dairy & Bakery", "Britannia", unit_pkt.id, 32.0, 45.0, 45.0, 0.0, 25.0, 5.0),

            # Beverages & Drinks
            ("Coca-Cola Original Taste 750ml", "COKE-750", "8901234567893", "Beverages & Drinks", "Coca-Cola", unit_pc.id, 30.0, 40.0, 40.0, 18.0, 85.0, 15.0),
            ("Pepsi Soft Drink 1.25L", "PEPSI-125", "8901058000131", "Beverages & Drinks", "Pepsi", unit_pc.id, 45.0, 60.0, 65.0, 18.0, 70.0, 12.0),
            ("Tata Tea Gold Premium 500g", "TEA-500", "8901058000132", "Beverages & Drinks", "Tata", unit_pkt.id, 240.0, 310.0, 340.0, 5.0, 50.0, 10.0),
            ("Nescafe Classic Coffee 100g Jar", "COFFEE-100", "8901058000133", "Beverages & Drinks", "Nestle", unit_pc.id, 260.0, 335.0, 360.0, 18.0, 40.0, 8.0),

            # Snacks & Munchies
            ("Lays Magic Masala Potato Chips 50g", "LAYS-050", "8901234567894", "Snacks & Munchies", "Lays", unit_pkt.id, 15.0, 20.0, 20.0, 12.0, 140.0, 25.0),
            ("Britannia Good Day Cashew 200g", "GOODDAY-200", "8901058000134", "Snacks & Munchies", "Britannia", unit_pkt.id, 38.0, 50.0, 50.0, 18.0, 110.0, 20.0),
            ("Parle-G Gold Biscuits 1kg", "PARLEG-1000", "8901058000135", "Snacks & Munchies", "Parle", unit_pkt.id, 95.0, 120.0, 130.0, 18.0, 75.0, 15.0),
            ("Maggi 2-Min Masala Noodles 420g", "MAGGI-420", "8901058000136", "Snacks & Munchies", "Nestle", unit_pkt.id, 72.0, 92.0, 98.0, 12.0, 125.0, 20.0),

            # Fresh Vegetables & Fruits
            ("Fresh Farm Red Tomatoes 1kg", "TOM-001", "8901234567895", "Fresh Vegetables & Fruits", None, unit_kg.id, 22.0, 34.0, 40.0, 0.0, 45.0, 10.0),
            ("Fresh Nashik Onions 1kg", "ONION-001", "8901058000137", "Fresh Vegetables & Fruits", None, unit_kg.id, 26.0, 38.0, 45.0, 0.0, 60.0, 15.0),
            ("Fresh Potatoes 1kg", "POTATO-001", "8901058000138", "Fresh Vegetables & Fruits", None, unit_kg.id, 20.0, 30.0, 35.0, 0.0, 70.0, 15.0),
            ("Fresh Royal Gala Apples 1kg", "APPLE-001", "8901058000139", "Fresh Vegetables & Fruits", None, unit_kg.id, 120.0, 170.0, 190.0, 0.0, 30.0, 8.0),

            # Spices & Masalas
            ("Everest Turmeric Powder 100g", "SPICE-TURM-100", "8901058000140", "Spices & Masalas", "Everest", unit_pkt.id, 26.0, 35.0, 38.0, 5.0, 80.0, 15.0),
            ("Everest Red Chilli Powder 100g", "SPICE-CHILLI-100", "8901058000141", "Spices & Masalas", "Everest", unit_pkt.id, 42.0, 56.0, 62.0, 5.0, 75.0, 12.0),
            ("Everest Garam Masala 100g", "SPICE-GARAM-100", "8901058000142", "Spices & Masalas", "Everest", unit_pkt.id, 68.0, 88.0, 95.0, 5.0, 60.0, 10.0),

            # Personal Care & Hygiene
            ("Colgate Strong Teeth Toothpaste 200g", "COLGATE-200", "8901058000143", "Personal Care & Hygiene", None, unit_pc.id, 80.0, 105.0, 115.0, 18.0, 65.0, 10.0),
            ("Dettol Soap Original 125g (Pack of 3)", "DETTOL-300", "8901058000144", "Personal Care & Hygiene", None, unit_pack.id, 120.0, 154.0, 165.0, 18.0, 50.0, 10.0),

            # Household & Cleaning
            ("Surf Excel Easy Wash Powder 1kg", "SURF-1000", "8901058000145", "Household & Cleaning", "Surf Excel", unit_pkt.id, 115.0, 142.0, 150.0, 18.0, 80.0, 15.0),
            ("Vim Dishwash Liquid Gel 500ml", "VIM-500", "8901058000146", "Household & Cleaning", "Vim", unit_pc.id, 92.0, 118.0, 125.0, 18.0, 75.0, 12.0)
        ]

        prod_added = 0
        product_list = []
        for p_name, sku, barcode, cat_name, brand_name, unit_id, cost, sell, mrp, gst, stock, min_alert in raw_products:
            prod = db.query(Product).filter(Product.sku == sku).first()
            cat = cat_map.get(cat_name)
            brand = brand_map.get(brand_name) if brand_name else None
            sup = all_suppliers[random.randint(0, len(all_suppliers)-1)] if all_suppliers else None

            if not prod:
                non_tax_sell = round(sell / (1 + (gst / 100.0)), 2)
                tax_amt_sell = round(sell - non_tax_sell, 2)
                non_tax_cost = round(cost / (1 + (gst / 100.0)), 2)
                tax_amt_cost = round(cost - non_tax_cost, 2)

                mfg_d = ref_date - timedelta(days=random.randint(30, 180))
                exp_d = ref_date + timedelta(days=random.randint(60, 365))

                prod = Product(
                    name=p_name,
                    sku=sku,
                    barcode=barcode,
                    category_id=cat.id if cat else None,
                    brand_id=brand.id if brand else None,
                    unit_id=unit_id,
                    supplier_id=sup.id if sup else None,
                    cost_price=cost,
                    selling_price=sell,
                    mrp=mrp,
                    gst_percent=gst,
                    purchase_gst_percent=gst,
                    purchase_non_tax_price=non_tax_cost,
                    purchase_tax_amount=tax_amt_cost,
                    purchase_final_price=cost,
                    selling_gst_percent=gst,
                    selling_non_tax_price=non_tax_sell,
                    selling_tax_amount=tax_amt_sell,
                    selling_tax_price=sell,
                    stock_quantity=stock,
                    min_stock_alert=min_alert,
                    manufacturing_date=mfg_d,
                    expiry_date=exp_d,
                    batch_number=f"BATCH-2026-{random.randint(100, 999)}",
                    is_active=True
                )
                db.add(prod)
                db.flush()
                prod_added += 1
            product_list.append(prod)

        seeded_summary["products"] = prod_added
        all_products = db.query(Product).filter(Product.is_active == True).all()

        # ----------------------------------------------------
        # 7. STAFF MEMBERS
        # ----------------------------------------------------
        staff_data = [
            ("Rahul Verma", "+91 98111 22334", "rahul@tulsimart.com", "STORE_MANAGER", 35000.0),
            ("Priya Sharma", "+91 98222 33445", "priya@tulsimart.com", "CASHIER", 22000.0),
            ("Amit Patel", "+91 98333 44556", "amit@tulsimart.com", "INVENTORY_CLERK", 18000.0),
            ("Sunita Gupta", "+91 98444 55667", "sunita@tulsimart.com", "BILLING_EXECUTIVE", 20000.0)
        ]
        staff_added = 0
        for name, phone, email, role, sal in staff_data:
            st = db.query(Staff).filter(Staff.name == name).first()
            if not st:
                st = Staff(name=name, phone=phone, email=email, role=role, salary=sal, is_active=True)
                db.add(st)
                db.flush()
                staff_added += 1
        seeded_summary["staff"] = staff_added

        # ----------------------------------------------------
        # 8. CUSTOMERS & FEEDBACK
        # ----------------------------------------------------
        customers_raw = [
            ("Rajesh Kumar", "+91 98700 11101", "rajesh.k@gmail.com", "Flat 402, Sai Heights, Andheri West", "Mumbai", "400053"),
            ("Sneha Shah", "+91 98700 11102", "sneha.shah@yahoo.com", "12/B Nilgiri Apartments, Bandra East", "Mumbai", "400051"),
            ("Vikram Singh", "+91 98700 11103", "vikram.s@outlook.com", "Plot 88, Sector 15, Vashi", "Navi Mumbai", "400703"),
            ("Meera Nair", "+91 98700 11104", "meera.nair@gmail.com", "501 Sunshine Towers, Goregaon East", "Mumbai", "400063"),
            ("Sanjay Mehta", "+91 98700 11105", "sanjay.m@rediffmail.com", "B-304 Lake View, Thane West", "Thane", "400601"),
            ("Kavita Joshi", "+91 98700 11106", "kavita.j@gmail.com", "702 Blossom Enclave, Malad West", "Mumbai", "400064"),
            ("Rohan Deshmukh", "+91 98700 11107", "rohan.d@gmail.com", "Flat 101, Green Acres, Powai", "Mumbai", "400076"),
            ("Pooja Agarwal", "+91 98700 11108", "pooja.a@gmail.com", "15 Orchid Park, Borivali West", "Mumbai", "400092"),
            ("Deepak Chaudhari", "+91 98700 11109", "deepak.c@gmail.com", "88 Station Road, Dadar West", "Mumbai", "400028"),
            ("Ananya Rao", "+91 98700 11110", "ananya.r@gmail.com", "G-12 Heritage Apartments, Chembur", "Mumbai", "400071"),
            ("Karan Malhotra", "+91 98700 11111", "karan.m@gmail.com", "Flat 904, Imperial Towers, Lower Parel", "Mumbai", "400013"),
            ("Nisha Kulkarni", "+91 98700 11112", "nisha.k@gmail.com", "23 Sea Breeze Apartments, Worli", "Mumbai", "400018"),
            ("Manish Tiwari", "+91 98700 11113", "manish.t@gmail.com", "Flat 203, Rosewood, Kandivali East", "Mumbai", "400101"),
            ("Shweta Shetty", "+91 98700 11114", "shweta.s@gmail.com", "104 Pearl Residency, Santacruz West", "Mumbai", "400054"),
            ("Alok Pandey", "+91 98700 11115", "alok.p@gmail.com", "55 Park Avenue, Ghatkopar East", "Mumbai", "400077")
        ]
        cust_added = 0
        cust_list = []
        for c_name, phone, email, addr, city, pcode in customers_raw:
            cust = db.query(Customer).filter(Customer.phone == phone).first()
            if not cust:
                cust = Customer(
                    name=c_name,
                    phone=phone,
                    email=email,
                    address=addr,
                    city=city,
                    pincode=pcode,
                    status="ACTIVE"
                )
                db.add(cust)
                db.flush()
                cust_added += 1
            cust_list.append(cust)
        seeded_summary["customers"] = cust_added

        # Customer Feedback
        fb_count = db.query(CustomerFeedback).count()
        if fb_count == 0 and cust_list:
            feedbacks_sample = [
                (5, "Excellent grocery store! Very fast billing and courteous staff."),
                (5, "Fresh vegetables and great pricing on dairy products."),
                (4, "Good stock of all daily items. Clean environment."),
                (5, "Loved the discount coupons on monthly essentials."),
                (4, "Wide variety of beverages and snacks."),
                (5, "Quick checkout process and smooth UPI payments.")
            ]
            for i, (rating, comment) in enumerate(feedbacks_sample):
                c_idx = i % len(cust_list)
                fb = CustomerFeedback(
                    customer_id=cust_list[c_idx].id,
                    rating=rating,
                    comment=comment,
                    order_ref=f"TM-DEMO-INV-{1000 + i}",
                    created_at=datetime.combine(start_date + timedelta(days=i*12), datetime.min.time())
                )
                db.add(fb)
            db.flush()
            seeded_summary["customer_feedback"] = len(feedbacks_sample)
        else:
            seeded_summary["customer_feedback"] = 0

        # ----------------------------------------------------
        # 9. EXPENSE CATEGORIES & EXPENSES
        # ----------------------------------------------------
        exp_categories_raw = [
            ("Store Rent & Lease", "Home", "#E53E3E"),
            ("Electricity & Utilities", "Zap", "#DD6B20"),
            ("Staff Salaries & Wages", "Users", "#319795"),
            ("Maintenance & Repairs", "Wrench", "#D69E2E"),
            ("Packaging & Store Supplies", "Package", "#805AD5"),
            ("Internet & Software Subscriptions", "Wifi", "#3182CE"),
            ("Logistics & Local Transport", "Truck", "#38A169")
        ]
        exp_cat_map = {}
        exp_cat_added = 0
        for name, icon, color in exp_categories_raw:
            ec = db.query(ExpenseCategory).filter(ExpenseCategory.name == name).first()
            if not ec:
                ec = ExpenseCategory(name=name, icon=icon, color=color)
                db.add(ec)
                db.flush()
                exp_cat_added += 1
            exp_cat_map[name] = ec
        seeded_summary["expense_categories"] = exp_cat_added

        # Generate Monthly & Weekly Expenses over 3 months
        exp_added = 0
        curr_d = start_date
        while curr_d <= ref_date:
            # 1st of month: Rent
            if curr_d.day == 1:
                title = f"Store Premises Rent - {curr_d.strftime('%B %Y')} (DEMO)"
                if not db.query(Expense).filter(Expense.title == title).first():
                    e = Expense(
                        title=title,
                        category_id=exp_cat_map["Store Rent & Lease"].id,
                        amount=45000.00,
                        date=curr_d,
                        payment_method="BANK_TRANSFER",
                        paid_to="Heritage Plaza Management",
                        notes="Monthly shop lease payment",
                        created_by_id=admin_user.id
                    )
                    db.add(e)
                    exp_added += 1

            # 5th of month: Staff Salaries
            if curr_d.day == 5:
                title = f"Staff Payroll - {curr_d.strftime('%B %Y')} (DEMO)"
                if not db.query(Expense).filter(Expense.title == title).first():
                    e = Expense(
                        title=title,
                        category_id=exp_cat_map["Staff Salaries & Wages"].id,
                        amount=95000.00,
                        date=curr_d,
                        payment_method="BANK_TRANSFER",
                        paid_to="Tulsi Mart Staff Team",
                        notes="Monthly staff salary disbursement",
                        created_by_id=admin_user.id
                    )
                    db.add(e)
                    exp_added += 1

            # 10th of month: Electricity
            if curr_d.day == 10:
                title = f"Adani Electricity Bill - {curr_d.strftime('%B %Y')} (DEMO)"
                if not db.query(Expense).filter(Expense.title == title).first():
                    e = Expense(
                        title=title,
                        category_id=exp_cat_map["Electricity & Utilities"].id,
                        amount=float(random.randint(11500, 14500)),
                        date=curr_d,
                        payment_method="UPI",
                        paid_to="Adani Electricity Mumbai Ltd",
                        notes="Commercial power bill",
                        created_by_id=admin_user.id
                    )
                    db.add(e)
                    exp_added += 1

            # 15th of month: Internet & Software
            if curr_d.day == 15:
                title = f"High Speed Fiber & POS Cloud License - {curr_d.strftime('%B %Y')} (DEMO)"
                if not db.query(Expense).filter(Expense.title == title).first():
                    e = Expense(
                        title=title,
                        category_id=exp_cat_map["Internet & Software Subscriptions"].id,
                        amount=2499.00,
                        date=curr_d,
                        payment_method="CARD",
                        paid_to="Jio Fiber Business",
                        notes="Monthly broadband & cloud POS software subscription",
                        created_by_id=admin_user.id
                    )
                    db.add(e)
                    exp_added += 1

            # Weekly (Mondays): Packaging & Supplies
            if curr_d.weekday() == 0:
                title = f"Grocery Carry Bags & Bill Paper Rolls ({curr_d.strftime('%d %b')}) (DEMO)"
                if not db.query(Expense).filter(Expense.title == title).first():
                    e = Expense(
                        title=title,
                        category_id=exp_cat_map["Packaging & Store Supplies"].id,
                        amount=float(random.randint(1200, 2800)),
                        date=curr_d,
                        payment_method="CASH",
                        paid_to="Shree Packaging Solutions",
                        notes="Eco carry bags and POS thermal printer rolls",
                        created_by_id=admin_user.id
                    )
                    db.add(e)
                    exp_added += 1

            curr_d += timedelta(days=1)
        
        db.flush()
        seeded_summary["expenses"] = exp_added

        # ----------------------------------------------------
        # 10. COUPONS & FESTIVAL OFFERS
        # ----------------------------------------------------
        coupons_raw = [
            ("WELCOME10", "Welcome 10% Discount", "PERCENTAGE", 10.0, 500.0, 200.0, date(2026, 6, 1), date(2026, 12, 31)),
            ("TULSI100", "Flat Rs 100 OFF", "FIXED", 100.0, 999.0, 100.0, date(2026, 7, 1), date(2026, 11, 30)),
            ("FESTIVE200", "Festival Shopping Rs 200 OFF", "FIXED", 200.0, 1999.0, 200.0, date(2026, 8, 1), date(2026, 10, 31)),
            ("FRESH50", "Fresh Produce Rs 50 OFF", "FIXED", 50.0, 499.0, 50.0, date(2026, 7, 15), date(2026, 12, 31))
        ]
        coup_added = 0
        for code, title, otype, dval, min_ord, max_d, vfrom, vto in coupons_raw:
            cp = db.query(Coupon).filter(Coupon.code == code).first()
            if not cp:
                cp = Coupon(
                    code=code,
                    title=title,
                    offer_type=otype,
                    discount_value=dval,
                    min_order_amount=min_ord,
                    max_discount_amount=max_d,
                    valid_from=vfrom,
                    valid_to=vto,
                    usage_limit=500,
                    used_count=random.randint(15, 65),
                    is_active=True
                )
                db.add(cp)
                coup_added += 1
        seeded_summary["coupons"] = coup_added

        festivals_raw = [
            ("Monsoon Grocery Sale", "Surge discounts on all essential food items!", "/banners/monsoon.jpg", "Monsoon Sale", "Up to 25% OFF", date(2026, 7, 1), date(2026, 7, 31)),
            ("Independence Day Special", "Celebrate with patriotic grocery deals!", "/banners/independence.jpg", "Special Offer", "Flat 15% Cashback", date(2026, 8, 10), date(2026, 8, 20)),
            ("Ganesh Utsav Mega Savings", "Special offers on sweets, ghee & fruits!", "/banners/ganesh.jpg", "Festive Surges", "Up to 30% OFF", date(2026, 9, 10), date(2026, 9, 25)),
            ("Diwali Dhamaka Preview", "Early bird offers on dry fruits and gift packs!", "/banners/diwali.jpg", "Grand Festival", "Buy 1 Get 1 Free", date(2026, 10, 1), date(2026, 10, 31))
        ]
        fest_added = 0
        for title, sub, img, tag, dinfo, sdate, edate in festivals_raw:
            fo = db.query(FestivalOffer).filter(FestivalOffer.title == title).first()
            if not fo:
                fo = FestivalOffer(
                    title=title, subtitle=sub, banner_image=img, tag_text=tag,
                    discount_info=dinfo, start_date=sdate, end_date=edate, is_active=True
                )
                db.add(fo)
                fest_added += 1
        seeded_summary["festival_offers"] = fest_added
        db.flush()

        # ----------------------------------------------------
        # 11. PURCHASE ORDERS & SUPPLIER PAYMENTS
        # ----------------------------------------------------
        po_added = 0
        po_item_added = 0
        grn_added = 0
        sp_added = 0

        # Create 14 supplier purchase orders spaced over July to October
        po_dates = []
        c_po_d = start_date + timedelta(days=3)
        while c_po_d <= ref_date:
            po_dates.append(c_po_d)
            c_po_d += timedelta(days=random.randint(5, 8))

        for idx, p_date in enumerate(po_dates):
            po_num = f"DEMO-PO-2026-{(idx+1):03d}"
            if db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_num).first():
                continue

            sup = all_suppliers[idx % len(all_suppliers)]
            status = "RECEIVED" if p_date <= ref_date - timedelta(days=2) else "ORDERED"
            exp_delivery = p_date + timedelta(days=3)
            rec_date = exp_delivery if status == "RECEIVED" else None

            po = PurchaseOrder(
                po_number=po_num,
                supplier_id=sup.id,
                order_date=p_date,
                expected_delivery=exp_delivery,
                received_date=rec_date,
                status=status,
                gst_mode="EXCLUSIVE",
                tax_type="INTRA_STATE",
                notes=f"Stock replenishment order from {sup.name}",
                created_at=datetime.combine(p_date, datetime.min.time())
            )
            db.add(po)
            db.flush()
            po_added += 1

            # Pick 3 to 6 products for this PO
            po_prods = random.sample(all_products, min(len(all_products), random.randint(3, 6)))
            po_total = 0.0

            for prd in po_prods:
                qty = random.randint(20, 100)
                unit_c = float(prd.cost_price)
                subtot = round(qty * unit_c, 2)
                po_total += subtot

                p_item = PurchaseOrderItem(
                    purchase_order_id=po.id,
                    product_id=prd.id,
                    product_name=prd.name,
                    unit_cost=unit_c,
                    quantity=qty,
                    received_quantity=qty if status == "RECEIVED" else 0,
                    damaged_quantity=0,
                    batch_number=prd.batch_number or f"BATCH-{random.randint(100,999)}",
                    mfg_date=p_date - timedelta(days=10),
                    expiry_date=p_date + timedelta(days=180),
                    subtotal=subtot
                )
                db.add(p_item)
                po_item_added += 1

                # If received, add Stock Movement
                if status == "RECEIVED":
                    current_bal = float(prd.stock_quantity) + qty
                    prd.stock_quantity = current_bal
                    sm = StockMovement(
                        product_id=prd.id,
                        movement_type="PURCHASE",
                        quantity=float(qty),
                        balance_after=current_bal,
                        reason=f"Stock received via {po_num}",
                        reference_no=po_num,
                        created_at=datetime.combine(rec_date, datetime.min.time())
                    )
                    db.add(sm)

            po.total_amount = po_total
            if status == "RECEIVED":
                po.paid_amount = po_total

                # Create Goods Receipt Note
                grn_num = f"DEMO-GRN-2026-{(idx+1):03d}"
                grn = GoodsReceiptNote(
                    grn_number=grn_num,
                    purchase_order_id=po.id,
                    supplier_id=sup.id,
                    received_date=rec_date,
                    received_by="Amit Patel (Inventory Clerk)",
                    total_valuation=po_total,
                    notes=f"Stock received and verified against PO {po_num}",
                    created_at=datetime.combine(rec_date, datetime.min.time())
                )
                db.add(grn)
                grn_added += 1

                # Create Supplier Payment Ledger entry
                sp = SupplierPayment(
                    supplier_id=sup.id,
                    purchase_order_id=po.id,
                    amount=po_total,
                    payment_method="BANK_TRANSFER",
                    reference_number=f"NEFT-{random.randint(100000, 999999)}",
                    payment_date=rec_date,
                    notes=f"Full payment for PO {po_num}",
                    created_at=datetime.combine(rec_date, datetime.min.time())
                )
                db.add(sp)
                sp_added += 1

        db.flush()
        seeded_summary["purchase_orders"] = po_added
        seeded_summary["purchase_items"] = po_item_added
        seeded_summary["goods_receipts"] = grn_added
        seeded_summary["supplier_payments"] = sp_added

        # ----------------------------------------------------
        # 12. POS SALES ORDERS, ITEMS, PAYMENTS
        # ----------------------------------------------------
        order_added = 0
        order_item_added = 0
        payment_added = 0

        # We will generate ~140 realistic orders across 101 days (July 1 - Oct 9)
        # Saturday/Sunday have higher sales volume.
        
        c_day = start_date
        order_counter = 1000

        while c_day <= ref_date:
            is_weekend = c_day.weekday() in [5, 6]
            is_festival = (c_day == date(2026, 8, 15) or (c_day >= date(2026, 9, 15) and c_day <= date(2026, 9, 20)))

            if is_festival:
                num_orders_today = random.randint(3, 5)
            elif is_weekend:
                num_orders_today = random.randint(2, 4)
            else:
                num_orders_today = random.randint(1, 2)

            for _ in range(num_orders_today):
                order_counter += 1
                ord_num = f"DEMO-ORD-2026-{order_counter}"
                inv_num = f"TM-DEMO-INV-{order_counter}"

                if db.query(Order).filter(Order.order_number == ord_num).first():
                    continue

                # Randomize order timestamp (9:30 AM to 9:30 PM)
                hour = random.randint(9, 21)
                minute = random.randint(0, 59)
                ord_dt = datetime.combine(c_day, datetime.min.time()) + timedelta(hours=hour, minutes=minute)

                # Customer assignment (80% registered customer, 20% walk-in)
                if random.random() < 0.8 and cust_list:
                    cust = random.choice(cust_list)
                    c_id = cust.id
                    c_name = cust.name
                    c_phone = cust.phone
                    c_addr = cust.address
                else:
                    c_id = None
                    c_name = "Walk-in Customer"
                    c_phone = "+91 99000 00000"
                    c_addr = "Over the counter POS sale"

                pmethod = random.choices(["UPI", "CASH", "CARD"], weights=[0.50, 0.35, 0.15])[0]

                # Select 2 to 6 line items
                selected_prods = random.sample(all_products, random.randint(2, min(6, len(all_products))))
                
                subtotal = 0.0
                tax_total = 0.0

                temp_items = []
                for prd in selected_prods:
                    # Quantity
                    if prd.unit_id == unit_kg.id:
                        qty = round(random.choice([0.5, 1.0, 1.5, 2.0, 3.0, 5.0]), 2)
                    else:
                        qty = float(random.randint(1, 4))
                    
                    price = float(prd.selling_price)
                    line_subtotal = round(price * qty, 2)
                    subtotal += line_subtotal
                    
                    # Tax calculation
                    gst_rate = float(prd.gst_percent)
                    line_tax = round(line_subtotal - (line_subtotal / (1 + (gst_rate / 100.0))), 2)
                    tax_total += line_tax

                    temp_items.append((prd, qty, price, gst_rate, line_subtotal))

                discount_amt = 0.0
                coupon_code = None
                if subtotal > 1000 and random.random() < 0.25:
                    coupon_code = "TULSI100"
                    discount_amt = 100.0
                
                total_amount = round(max(10.0, subtotal - discount_amt), 2)

                cash_tend = None
                change_ret = None
                if pmethod == "CASH":
                    # Cash tendered round up to nearest 100 or 500
                    cash_tend = float(((int(total_amount) // 100) + 1) * 100)
                    if cash_tend < total_amount:
                        cash_tend += 100.0
                    change_ret = round(cash_tend - total_amount, 2)

                ord_obj = Order(
                    order_number=ord_num,
                    invoice_number=inv_num,
                    customer_id=c_id,
                    customer_name=c_name,
                    customer_phone=c_phone,
                    customer_address=c_addr,
                    status="COMPLETED",
                    payment_method=pmethod,
                    payment_status="PAID",
                    subtotal=subtotal,
                    tax_amount=tax_total,
                    discount_amount=discount_amt,
                    delivery_charge=0.0,
                    total_amount=total_amount,
                    cash_tendered=cash_tend,
                    change_returned=change_ret,
                    coupon_applied=coupon_code,
                    notes="Counter checkout bill (DEMO)",
                    created_by_id=admin_user.id,
                    created_at=ord_dt,
                    updated_at=ord_dt
                )
                db.add(ord_obj)
                db.flush()
                order_added += 1

                # Save OrderItems & Stock movements
                for prd, qty, price, gst_rate, line_subtotal in temp_items:
                    oi = OrderItem(
                        order_id=ord_obj.id,
                        product_id=prd.id,
                        product_name=prd.name,
                        sku=prd.sku,
                        unit_price=price,
                        quantity=qty,
                        gst_percent=gst_rate,
                        subtotal=line_subtotal
                    )
                    db.add(oi)
                    order_item_added += 1

                    # Record POS stock movement
                    cur_stock = max(0.0, float(prd.stock_quantity) - qty)
                    prd.stock_quantity = cur_stock
                    sm = StockMovement(
                        product_id=prd.id,
                        movement_type="POS_SALE",
                        quantity=qty,
                        balance_after=cur_stock,
                        reason=f"POS Sale #{inv_num}",
                        reference_no=inv_num,
                        performed_by_id=admin_user.id,
                        created_at=ord_dt
                    )
                    db.add(sm)

                # Payment Transaction
                pay_tx = PaymentTransaction(
                    order_id=ord_obj.id,
                    transaction_id=f"TXN-2026-{order_counter}",
                    amount=total_amount,
                    payment_method=pmethod,
                    status="PAID",
                    notes=f"Payment for invoice {inv_num}",
                    created_at=ord_dt
                )
                db.add(pay_tx)
                payment_added += 1

            c_day += timedelta(days=1)

        db.flush()
        seeded_summary["orders"] = order_added
        seeded_summary["order_items"] = order_item_added
        seeded_summary["payments"] = payment_added

        # ----------------------------------------------------
        # 13. GULLA / CASH REGISTER TRANSACTIONS
        # ----------------------------------------------------
        gulla_added = 0
        c_gulla_d = start_date
        while c_gulla_d <= ref_date:
            d_str = c_gulla_d.strftime("%Y-%m-%d")
            
            # Opening Float (Daily at 9:00 AM)
            if not db.query(CashRegisterEntry).filter(
                CashRegisterEntry.entry_type == "OPENING_FLOAT",
                CashRegisterEntry.date == c_gulla_d
            ).first():
                e_float = CashRegisterEntry(
                    entry_type="OPENING_FLOAT",
                    amount=5000.00,
                    date=c_gulla_d,
                    notes="Daily morning drawer opening float",
                    reference_id=f"FLOAT-{d_str}",
                    created_by_name="Priya Sharma (Cashier)",
                    created_at=datetime.combine(c_gulla_d, datetime.min.time()) + timedelta(hours=9)
                )
                db.add(e_float)
                gulla_added += 1

            # Cash Inflow (Midday extra change load) on Saturdays
            if c_gulla_d.weekday() == 5:
                if not db.query(CashRegisterEntry).filter(
                    CashRegisterEntry.entry_type == "CASH_IN",
                    CashRegisterEntry.date == c_gulla_d
                ).first():
                    e_in = CashRegisterEntry(
                        entry_type="CASH_IN",
                        amount=2000.00,
                        date=c_gulla_d,
                        notes="Added small change notes to register drawer",
                        reference_id=f"CASHIN-{d_str}",
                        created_by_name="Priya Sharma (Cashier)",
                        created_at=datetime.combine(c_gulla_d, datetime.min.time()) + timedelta(hours=14)
                    )
                    db.add(e_in)
                    gulla_added += 1

            c_gulla_d += timedelta(days=1)

        db.flush()
        seeded_summary["cash_transactions"] = gulla_added

        # ----------------------------------------------------
        # 14. BANK TRANSACTIONS (Settlements & Direct Debits)
        # ----------------------------------------------------
        bank_added = 0
        c_bank_d = start_date
        while c_bank_d <= ref_date:
            # Daily UPI / Card settlements from payment aggregator
            b_ref = f"SETTLE-{c_bank_d.strftime('%Y%m%d')}"
            if not db.query(BankTransaction).filter(BankTransaction.reference_number == b_ref).first():
                settlement_amt = float(random.randint(4500, 18500))
                bt = BankTransaction(
                    transaction_type="DEPOSIT",
                    amount=settlement_amt,
                    reference_number=b_ref,
                    bank_name="HDFC Store Primary Bank",
                    notes=f"Daily POS digital sales settlement for {c_bank_d.strftime('%d %b')}",
                    date=c_bank_d,
                    created_by_name="HDFC POS Gateway Auto-Settlements",
                    created_at=datetime.combine(c_bank_d, datetime.min.time()) + timedelta(hours=23, minutes=30)
                )
                db.add(bt)
                bank_added += 1

            c_bank_d += timedelta(days=1)

        db.flush()
        seeded_summary["bank_transactions"] = bank_added

        # ----------------------------------------------------
        # 15. HOME CASH SAFE TRANSACTIONS & SWEEPS
        # ----------------------------------------------------
        home_cash_added = 0
        c_hc_d = start_date
        current_safe_bal = 45000.00

        while c_hc_d <= ref_date:
            # Weekly Sunday Night Cash Sweep from Gulla to Home Safe
            if c_hc_d.weekday() == 6:
                hc_ref = f"SWEEP-{c_hc_d.strftime('%Y%m%d')}"
                if not db.query(HomeCashTransaction).filter(HomeCashTransaction.notes.like(f"%{hc_ref}%")).first():
                    sweep_amt = float(random.randint(15000, 35000))
                    current_safe_bal += sweep_amt
                    hct = HomeCashTransaction(
                        entry_type="SWEEP",
                        amount=sweep_amt,
                        notes=f"Weekly Sunday EOD Gulla cash sweep to home safe ({hc_ref})",
                        created_by_name="Tulsi Mart Admin",
                        balance_after=current_safe_bal,
                        created_at=datetime.combine(c_hc_d, datetime.min.time()) + timedelta(hours=22)
                    )
                    db.add(hct)
                    home_cash_added += 1

            c_hc_d += timedelta(days=1)

        # Update Store Settings home cash balance
        store.home_cash_amount = current_safe_bal
        db.flush()
        seeded_summary["home_cash_transactions"] = home_cash_added

        # ----------------------------------------------------
        # 16. ACTIVITY LOGS (Audit Log History)
        # ----------------------------------------------------
        activity_added = 0
        activity_samples = [
            ("User Login", "Auth", "Admin logged in from local terminal", "127.0.0.1"),
            ("Inventory Restock", "Products", "Bulk stock updated via Purchase Order", "127.0.0.1"),
            ("EOD Cash Sweep", "Gulla", "Executed 11:30 PM register cash sweep to home safe", "127.0.0.1"),
            ("Price Update", "Products", "Selling price updated for FMCG items", "127.0.0.1"),
            ("Supplier Payment", "Suppliers", "Bank NEFT transfer dispatched for supplier invoice", "127.0.0.1"),
            ("Coupon Created", "Offers", "Created festival promotional coupon code", "127.0.0.1")
        ]
        
        c_act_d = start_date
        while c_act_d <= ref_date:
            if c_act_d.weekday() in [0, 3, 6]:
                act, mod, dtls, ip = random.choice(activity_samples)
                act_time = datetime.combine(c_act_d, datetime.min.time()) + timedelta(hours=random.randint(9, 20))
                # Check if activity for this day/action already exists
                existing_act = db.query(ActivityLog).filter(
                    ActivityLog.action == act,
                    ActivityLog.module == mod,
                    ActivityLog.created_at >= datetime.combine(c_act_d, datetime.min.time()),
                    ActivityLog.created_at <= datetime.combine(c_act_d, datetime.max.time())
                ).first()
                if not existing_act:
                    log_entry = ActivityLog(
                        user_name="Tulsi Mart Admin",
                        action=act,
                        module=mod,
                        details=dtls,
                        ip_address=ip,
                        created_at=act_time
                    )
                    db.add(log_entry)
                    activity_added += 1
            c_act_d += timedelta(days=1)

        db.flush()
        seeded_summary["activity_logs"] = activity_added

        # Final Commit
        db.commit()

        print("--------------------------------------------------------")
        print(" SUCCESS! 3 Months Demo Data Successfully Populated.")
        print("--------------------------------------------------------\n")
        print("Records Inserted / Verified Summary:")
        for tbl, cnt in seeded_summary.items():
            print(f"  - {tbl:<25}: +{cnt} new records")
            
        print("\nAll database tables contain realistic historical records covering")
        print("July 2026, August 2026, September 2026, and October 2026.\n")

    except Exception as e:
        db.rollback()
        print(f"\n[!] ERROR Seeding Demo Data: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

    # Sync seeded database file to app/tulsimart.db for fallback compatibility
    try:
        import shutil
        app_db_path = os.path.join(current_dir, "app", "tulsimart.db")
        main_db_path = os.path.join(current_dir, "tulsimart.db")
        if os.path.exists(main_db_path):
            shutil.copy2(main_db_path, app_db_path)
            print(f"[+] Synchronized database to {app_db_path}")
    except Exception as sync_err:
        print(f"[!] Database sync notice: {sync_err}")


if __name__ == "__main__":
    seed_demo_data()
