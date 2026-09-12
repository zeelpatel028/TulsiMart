import os
import sys
import random
import django
from datetime import datetime, date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tulsimart_backend.settings')
django.setup()

from django.db import connection, transaction
from django.utils import timezone
from core.models import StoreSetting, LoginAccount, Staff, ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction
from inventory.models import Category, Brand, Unit, Product, StockMovement
from orders.models import Order, OrderItem, PaymentTransaction
from customers.models import Customer, CustomerFeedback
from suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from expenses.models import ExpenseCategory, Expense
from offers.models import Coupon, FestivalOffer

def log(msg):
    try:
        print(msg, flush=True)
    except Exception:
        safe_msg = str(msg).encode('ascii', errors='replace').decode('ascii')
        print(safe_msg, flush=True)

def clear_all_demo_data():
    log("[Cleaning] Removing existing operational data from Cloud MySQL database...")
    tables_to_clear = [
        'orders_orderitem', 'orders_paymenttransaction', 'orders_order',
        'inventory_stockmovement', 'inventory_product', 'inventory_category', 'inventory_brand', 'inventory_unit',
        'customers_customerfeedback', 'customers_customer',
        'suppliers_goodsreceiptnote', 'suppliers_purchaseorderitem', 'suppliers_supplierpayment', 'suppliers_purchaseorder', 'suppliers_supplier',
        'expenses_expense', 'expenses_expensecategory', 'offers_coupon', 'offers_festivaloffer',
        'core_activitylog', 'core_cashregisterentry', 'core_banktransaction', 'core_homecashtransaction', 'core_storesetting'
    ]
    with transaction.atomic():
        with connection.cursor() as cursor:
            if connection.vendor == 'mysql':
                cursor.execute('SET FOREIGN_KEY_CHECKS = 0;')
                for table in tables_to_clear:
                    cursor.execute(f'DELETE FROM `{table}`;')
                cursor.execute('SET FOREIGN_KEY_CHECKS = 1;')
            else:
                try:
                    cursor.execute('PRAGMA foreign_keys = OFF;')
                    for table in tables_to_clear:
                        cursor.execute(f'DELETE FROM "{table}";')
                    cursor.execute('PRAGMA foreign_keys = ON;')
                except Exception as e:
                    log(f"Warning clearing SQLite tables: {e}")
    log("[Cleaning Complete] All tables wiped cleanly.")

def seed_data():
    log("=" * 70)
    log("      TULSI MART 30-DAY OPERATIONAL DEMO DATA SEEDING SCRIPT      ")
    log("=" * 70)

    # Clear existing rows first
    clear_all_demo_data()

    # Wrap initial setup phase in atomic transaction
    with transaction.atomic():
        today = date.today()
        now = timezone.now()

        # 1. Store Setting
        log(" -> Seeding Store Settings...")
        setting = StoreSetting.objects.create(id=1,
            store_name='Tulsi Mart Supermarket',
            tagline='Fresh Groceries & Everyday Supermarket',
            address='Plot No. 45, Main Market Road, Sector 11',
            city='Gandhinagar',
            state='Gujarat',
            country='India',
            pincode='382011',
            phone='+91 98790 12345',
            email='contact@tulsimart.com',
            gst_number='24AABCT1234F1Z5',
            pan_number='AABCT1234F',
            currency_symbol='₹',
            currency_code='INR',
            bank_name='HDFC Bank',
            account_number='50200012345678',
            ifsc_code='HDFC0000123',
            upi_id='tulsimart@hdfcbank',
            security_require_otp=True,
            tax_enabled=True,
            default_gst_rate=Decimal('18.00'),
        )

        # 1.5 Django Auth Users for FK relations
        log(" -> Seeding Auth Users & Login Accounts...")
        from django.contrib.auth.models import User
        if not User.objects.filter(id=1).exists():
            admin_user = User.objects.create(id=1, username='admin', email='zeelptl028@gmail.com', first_name='Zeel Patel', is_staff=True, is_superuser=True)
        else:
            admin_user = User.objects.get(id=1)

        if not User.objects.filter(id=2).exists():
            cashier_user = User.objects.create(id=2, username='cashier', email='cashier@tulsimart.com', first_name='Rahul Sharma', is_staff=True)
        else:
            cashier_user = User.objects.get(id=2)

        if not User.objects.filter(id=3).exists():
            manager_user = User.objects.create(id=3, username='manager', email='manager@tulsimart.com', first_name='Suresh Manager', is_staff=True)
        else:
            manager_user = User.objects.get(id=3)

        # 2. Login Accounts
        LoginAccount.objects.create(id=1, username='admin', password='password123', full_name='Zeel Patel (Admin)', email='zeelptl028@gmail.com', role='ADMIN', require_otp=True, is_active=True)
        LoginAccount.objects.create(id=2, username='cashier', password='password123', full_name='Rahul Sharma (Cashier)', email='cashier@tulsimart.com', role='CASHIER', require_otp=False, is_active=True)
        LoginAccount.objects.create(id=3, username='manager', password='password123', full_name='Suresh Manager', email='manager@tulsimart.com', role='STORE_MANAGER', require_otp=False, is_active=True)

        # 3. Staff Members
        log(" -> Seeding Staff Members...")
        staff_members = [
            (1, 'Zeel Patel', 'STORE_MANAGER', '+91 98790 12345', 'zeelptl028@gmail.com', 35000.00),
            (2, 'Rahul Sharma', 'CASHIER', '+91 98790 54321', 'rahul@tulsimart.com', 18000.00),
            (3, 'Suresh Kumar', 'HELPER', '+91 98790 66778', 'suresh@tulsimart.com', 12000.00),
            (4, 'Vijay Singh', 'DELIVERY', '+91 98790 11223', 'vijay@tulsimart.com', 15000.00),
        ]
        for sid, sname, srole, sphone, semail, ssal in staff_members:
            Staff.objects.create(id=sid, name=sname, role=srole, phone=sphone, email=semail, salary=Decimal(str(ssal)), is_active=True)

        # 4. Units
        log(" -> Seeding Measurement Units...")
        units_data = [
            (1, 'Kilogram', 'kg'),
            (2, 'Gram', 'gm'),
            (3, 'Liter', 'ltr'),
            (4, 'Milliliter', 'ml'),
            (5, 'Pack / Pouch', 'pack'),
            (6, 'Piece / Item', 'pcs'),
            (7, 'Box / Carton', 'box'),
            (8, 'Bottle', 'btl'),
        ]
        for uid, uname, ushort in units_data:
            Unit.objects.create(id=uid, name=uname, short_name=ushort)

        # 5. Categories
        log(" -> Seeding Categories...")
        categories_data = [
            (1, 'Atta, Rice & Dal', 'atta-rice-dal', 'Wheat', 'Flour, Basmati Rice, Toor Dal, Chana Dal, Moong Dal'),
            (2, 'Oil, Ghee & Spices', 'oil-ghee-spices', 'Flame', 'Edible Oils, Cow Ghee, Garam Masala, Turmeric, Salt'),
            (3, 'Dairy, Milk & Bakery', 'dairy-milk-bakery', 'Milk', 'Fresh Milk, Butter, Cheese, Bread, Paneer, Dahi'),
            (4, 'Snacks & Biscuits', 'snacks-biscuits', 'Cookie', 'Namkeen, Chips, Biscuits, Chocolates, Soan Papdi'),
            (5, 'Beverages & Drinks', 'beverages-drinks', 'Coffee', 'Tea, Coffee, Soft Drinks, Fruit Juices, Energy Drinks'),
            (6, 'Personal Care & Hygiene', 'personal-care-hygiene', 'Smile', 'Soaps, Shampoos, Toothpaste, Handwash, Mouthwash'),
            (7, 'Household & Cleaning', 'household-cleaning', 'Home', 'Detergent, Floor Cleaner, Dishwash Liquid, Toilet Cleaner'),
            (8, 'Instant & Frozen Food', 'instant-frozen-food', 'Zap', 'Noodles, Sauces, Pure Honey, Soups, Frozen Snacks'),
        ]
        for cid, cname, cslug, cicon, cdesc in categories_data:
            Category.objects.create(id=cid, name=cname, slug=cslug, icon=cicon, description=cdesc, is_active=True)

        # 6. Brands
        log(" -> Seeding Brands...")
        brands_data = [
            (1, 'Amul', 'The Taste of India - Pure Dairy Products'),
            (2, 'Aashirvaad', 'ITC Premium Quality Food Products'),
            (3, 'Fortune', 'Adani Wilmar Premium Edible Oils'),
            (4, 'Tata', 'Tata Salt, Tea & Pulses'),
            (5, 'Everest', 'Everest Spices & Masala'),
            (6, 'Mother Dairy', 'Fresh Dairy & Ice Creams'),
            (7, 'Britannia', 'Biscuits, Cakes & Bakery'),
            (8, 'Surf Excel', 'Hindustan Unilever Detergents'),
            (9, 'Colgate', 'Oral Care & Hygiene Products'),
            (10, 'Maggi', 'Nestle Instant Noodles & Sauces'),
            (11, 'Dabur', 'Ayurvedic Health & Personal Care'),
            (12, 'Haldiram\'s', 'Traditional Indian Snacks & Sweets'),
        ]
        for bid, bname, bdesc in brands_data:
            Brand.objects.create(id=bid, name=bname, description=bdesc, is_active=True)

        # 7. Products (50 rich supermarket items across 8 categories)
        log(" -> Seeding 50 Grocery Products...")
        products_list = [
            # Atta, Rice & Dal (Cat 1)
            (1, 'Aashirvaad Shuddh Chakki Atta 5kg', 'TM-ATT-001', '8901058000011', 1, 2, 5, 275.0, 245.0, 210.0, 5.0, 45, 10, True, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop'),
            (2, 'Fortune Premium Basmati Rice 5kg', 'TM-RCE-002', '8906007280022', 1, 3, 5, 599.0, 520.0, 440.0, 5.0, 35, 8, True, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop'),
            (3, 'Tata Sampann Toor Dal 1kg', 'TM-DAL-003', '8901058030033', 1, 4, 1, 185.0, 165.0, 140.0, 5.0, 40, 10, False, 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop'),
            (4, 'Tata Sampann Chana Dal 1kg', 'TM-DAL-004', '8901058030044', 1, 4, 1, 110.0, 98.0, 82.0, 5.0, 50, 12, False, 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop'),
            (5, 'Aashirvaad Select Sharbati Atta 5kg', 'TM-ATT-005', '8901058000055', 1, 2, 5, 340.0, 310.0, 270.0, 5.0, 30, 8, True, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop'),
            (6, 'Rajdhani Moong Dal Dhuli 1kg', 'TM-DAL-006', '8901058030066', 1, 4, 1, 150.0, 132.0, 112.0, 5.0, 28, 8, False, 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop'),

            # Oil, Ghee & Spices (Cat 2)
            (7, 'Fortune Sunlite Sunflower Oil 1L Pouch', 'TM-OIL-007', '8906007280077', 2, 3, 3, 165.0, 148.0, 130.0, 5.0, 60, 12, True, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop'),
            (8, 'Amul Pure Cow Ghee 1L Tin', 'TM-GHE-008', '8901262010088', 2, 1, 8, 650.0, 590.0, 515.0, 12.0, 3, 5, True, 'https://images.unsplash.com/photo-1589927986076-255861070803?w=500&auto=format&fit=crop'),
            (9, 'Everest Garam Masala 100g Box', 'TM-SPC-009', '8901786000099', 2, 5, 2, 85.0, 78.0, 65.0, 5.0, 35, 8, False, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop'),
            (10, 'Tata Salt Vacuum Evaporated 1kg', 'TM-SLT-010', '8901058030100', 2, 4, 1, 28.0, 28.0, 23.0, 0.0, 100, 25, False, 'https://images.unsplash.com/photo-1518110168401-f28435863619?w=500&auto=format&fit=crop'),
            (11, 'Fortune Premium Kachi Ghani Mustard Oil 1L', 'TM-OIL-011', '8906007280111', 2, 3, 8, 175.0, 155.0, 132.0, 5.0, 40, 10, False, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop'),
            (12, 'Everest Red Chilli Powder 200g', 'TM-SPC-012', '8901786000122', 2, 5, 2, 110.0, 98.0, 80.0, 5.0, 40, 10, False, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop'),
            (13, 'Everest Turmeric Powder 200g', 'TM-SPC-013', '8901786000133', 2, 5, 2, 75.0, 68.0, 55.0, 5.0, 45, 10, False, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop'),
            (14, 'Everest Coriander Powder 200g', 'TM-SPC-014', '8901786000144', 2, 5, 2, 70.0, 62.0, 50.0, 5.0, 38, 10, False, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop'),

            # Dairy, Milk & Bakery (Cat 3)
            (15, 'Amul Taaza Toned Milk 500ml Pouch', 'TM-MLK-015', '8901262010155', 3, 1, 4, 27.0, 27.0, 24.5, 0.0, 80, 20, False, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop'),
            (16, 'Amul Butter Pasteurised 100g Box', 'TM-BTR-016', '8901262020166', 3, 1, 7, 58.0, 56.0, 49.0, 0.0, 50, 10, True, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop'),
            (17, 'Mother Dairy Fresh Paneer 200g Pack', 'TM-PNR-017', '8901262050177', 3, 6, 5, 95.0, 90.0, 76.0, 0.0, 4, 8, True, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop'),
            (18, 'Amul Masti Dahi Pouch 400g', 'TM-DAH-018', '8901262010188', 3, 1, 5, 35.0, 35.0, 29.5, 0.0, 45, 10, False, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop'),
            (19, 'Britannia Whole Wheat Bread 400g', 'TM-BRD-019', '8901063000199', 3, 7, 5, 45.0, 42.0, 35.0, 0.0, 30, 8, False, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop'),
            (20, 'Amul Cheese Slices 200g', 'TM-CHS-020', '8901262020200', 3, 1, 7, 150.0, 138.0, 118.0, 12.0, 25, 6, True, 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&auto=format&fit=crop'),
            (21, 'Mother Dairy Cow Milk 1L Bottle', 'TM-MLK-021', '8901262050211', 3, 6, 8, 62.0, 60.0, 52.0, 0.0, 40, 10, False, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop'),

            # Snacks & Biscuits (Cat 4)
            (22, 'Britannia Good Day Cashew Biscuits 120g', 'TM-BSC-022', '8901063000222', 4, 7, 5, 30.0, 28.0, 22.0, 18.0, 75, 15, True, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop'),
            (23, 'Haldiram\'s Nagpur Bhujia Sev 400g', 'TM-HAL-023', '8901058880233', 4, 12, 5, 120.0, 110.0, 90.0, 12.0, 45, 10, True, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281318?w=500&auto=format&fit=crop'),
            (24, 'Britannia Bourbon Chocolate Biscuits 150g', 'TM-BSC-024', '8901063000244', 4, 7, 5, 40.0, 36.0, 28.0, 18.0, 60, 12, False, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop'),
            (25, 'Haldiram\'s Royal Soan Papdi 500g Box', 'TM-HAL-025', '8901058880255', 4, 12, 7, 140.0, 125.0, 100.0, 12.0, 35, 8, False, 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop'),
            (26, 'Lays Spanish Tomato Chips 52g', 'TM-CHP-026', '8901058880266', 4, 7, 5, 20.0, 20.0, 15.5, 18.0, 90, 20, False, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop'),
            (27, 'Kurkure Masala Munch 85g', 'TM-SNK-027', '8901058880277', 4, 7, 5, 20.0, 20.0, 15.5, 18.0, 85, 20, False, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281318?w=500&auto=format&fit=crop'),
            (28, 'Haldiram\'s Khatta Meetha Namkeen 350g', 'TM-HAL-028', '8901058880288', 4, 12, 5, 95.0, 88.0, 70.0, 12.0, 40, 10, False, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281318?w=500&auto=format&fit=crop'),

            # Beverages & Drinks (Cat 5)
            (29, 'Tata Tea Gold Premium Tea 500g Pack', 'TM-TEA-029', '8901058880299', 5, 4, 5, 330.0, 295.0, 250.0, 5.0, 35, 10, True, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop'),
            (30, 'Nescafe Classic Instant Coffee 50g Jar', 'TM-COF-030', '8901058880300', 5, 10, 8, 190.0, 175.0, 145.0, 18.0, 28, 6, True, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop'),
            (31, 'Coca-Cola Original Taste 750ml Bottle', 'TM-DRK-031', '8901058880311', 5, 10, 8, 40.0, 38.0, 30.0, 28.0, 70, 15, False, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop'),
            (32, 'Real Fruit Power Mixed Fruit Juice 1L', 'TM-JUC-032', '8901058880322', 5, 11, 7, 130.0, 115.0, 92.0, 12.0, 30, 8, False, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop'),
            (33, 'Tata Tea Premium Leaf 250g', 'TM-TEA-033', '8901058880333', 5, 4, 5, 160.0, 145.0, 120.0, 5.0, 40, 10, False, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop'),
            (34, 'Red Bull Energy Drink 250ml Can', 'TM-DRK-034', '8901058880344', 5, 10, 6, 125.0, 120.0, 98.0, 28.0, 0, 5, False, 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=500&auto=format&fit=crop'),

            # Personal Care & Hygiene (Cat 6)
            (35, 'Colgate Strong Teeth Toothpaste 150g', 'TM-TP-035', '8901314000355', 6, 9, 2, 98.0, 89.0, 72.0, 18.0, 50, 10, False, 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&auto=format&fit=crop'),
            (36, 'Dabur Red Ayurvedic Toothpaste 200g', 'TM-DAB-036', '8901058880366', 6, 11, 2, 115.0, 102.0, 82.0, 18.0, 30, 8, False, 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&auto=format&fit=crop'),
            (37, 'Colgate Plax Fresh Mint Mouthwash 250ml', 'TM-MW-037', '8901314000377', 6, 9, 8, 160.0, 145.0, 115.0, 18.0, 15, 5, False, 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&auto=format&fit=crop'),
            (38, 'Dettol Original Bathing Soap 125g (3+1 Pack)', 'TM-SOP-038', '8901314000388', 6, 11, 5, 195.0, 175.0, 140.0, 18.0, 32, 8, True, 'https://images.unsplash.com/photo-1607006482602-76ca22197f88?w=500&auto=format&fit=crop'),
            (39, 'Head & Shoulders Anti-Dandruff Shampoo 180ml', 'TM-SHP-039', '8901314000399', 6, 8, 8, 180.0, 162.0, 130.0, 18.0, 22, 6, False, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop'),
            (40, 'Nivea Soft Refreshing Cream 100ml', 'TM-CRM-040', '8901314000400', 6, 11, 7, 225.0, 199.0, 160.0, 18.0, 4, 5, False, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop'),

            # Household & Cleaning (Cat 7)
            (41, 'Surf Excel Easy Wash Detergent Powder 1kg', 'TM-DET-041', '8901030000411', 7, 8, 1, 145.0, 135.0, 110.0, 18.0, 40, 10, False, 'https://images.unsplash.com/photo-1585832770485-e68a5fc88240?w=500&auto=format&fit=crop'),
            (42, 'Surf Excel Matic Front Load Liquid 1L', 'TM-DET-042', '8901030000422', 7, 8, 8, 260.0, 235.0, 188.0, 18.0, 18, 5, True, 'https://images.unsplash.com/photo-1585832770485-e68a5fc88240?w=500&auto=format&fit=crop'),
            (43, 'Vim Dishwash Gel Lemon 500ml Bottle', 'TM-VIM-043', '8901030000433', 7, 8, 8, 125.0, 112.0, 88.0, 18.0, 45, 10, False, 'https://images.unsplash.com/photo-1585832770485-e68a5fc88240?w=500&auto=format&fit=crop'),
            (44, 'Lizol Disinfectant Floor Cleaner Citrus 1L', 'TM-LZL-044', '8901030000444', 7, 8, 8, 220.0, 195.0, 155.0, 18.0, 25, 6, False, 'https://images.unsplash.com/photo-1585832770485-e68a5fc88240?w=500&auto=format&fit=crop'),
            (45, 'Harpic Power Plus Toilet Cleaner 1L', 'TM-HRP-045', '8901030000455', 7, 8, 8, 215.0, 190.0, 150.0, 18.0, 28, 6, False, 'https://images.unsplash.com/photo-1585832770485-e68a5fc88240?w=500&auto=format&fit=crop'),

            # Instant & Frozen Food (Cat 8)
            (46, 'Maggi 2-Minute Masala Noodles 280g Pack', 'TM-MAG-046', '8901058880466', 8, 10, 5, 56.0, 52.0, 42.0, 12.0, 90, 20, True, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop'),
            (47, 'Maggi Hot & Sweet Tomato Chilli Sauce 1kg', 'TM-SAU-047', '8901058880477', 8, 10, 8, 170.0, 150.0, 120.0, 12.0, 22, 6, False, 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=500&auto=format&fit=crop'),
            (48, 'Dabur 100% Pure Honey Squeezy 500g', 'TM-HNY-048', '8901058880488', 8, 11, 8, 240.0, 215.0, 172.0, 5.0, 25, 6, True, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop'),
            (49, 'Knorr Classic Tomato Soup 53g', 'TM-SOP-049', '8901058880499', 8, 10, 5, 55.0, 50.0, 38.0, 12.0, 35, 8, False, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop'),
            (50, 'McCain French Fries 420g Pack', 'TM-MCF-050', '8901058880500', 8, 10, 5, 125.0, 110.0, 85.0, 12.0, 18, 5, False, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop'),
        ]

        product_objs = []
        for pid, pname, psku, pbar, cid, bid, uid, mrp, sp, cp, gst, qty, alert, feat, img in products_list:
            product_objs.append(Product(
                id=pid,
                name=pname,
                sku=psku,
                barcode=pbar,
                category_id=cid,
                brand_id=bid,
                unit_id=uid,
                mrp=Decimal(str(mrp)),
                selling_price=Decimal(str(sp)),
                cost_price=Decimal(str(cp)),
                gst_percent=Decimal(str(gst)),
                stock_quantity=qty,
                min_stock_alert=alert,
                is_featured=feat,
                image=img,
                is_active=True
            ))
        Product.objects.bulk_create(product_objs)

        # 7.5 Stock Movements for Products
        log(" -> Seeding Initial Stock Movements...")
        sm_objs = []
        for prod in Product.objects.all():
            sm_objs.append(StockMovement(
                product=prod,
                movement_type='IN_PURCHASE',
                quantity=prod.stock_quantity + 25,
                balance_after=prod.stock_quantity + 25,
                reason='Initial Bulk Stock Arrival from Wholesale Supplier',
                reference_no=f'PO-INIT-2026-{prod.id:03d}',
                performed_by=admin_user,
                created_at=now - timedelta(days=32)
            ))
        StockMovement.objects.bulk_create(sm_objs)

        # 8. Customers (18 realistic customer profiles)
        log(" -> Seeding 18 Customers & Profiles...")
        customers_list = [
            (1, 'Ramesh Shah', '+91 98980 11223', 'ramesh.shah@gmail.com', 'Plot 12, Sector 21', 'Gandhinagar', '382021'),
            (2, 'Priya Patel', '+91 98250 44556', 'priya.patel@gmail.com', 'Flat 402, Shivalik Heights, Kudasan', 'Gandhinagar', '382421'),
            (3, 'Amit Sharma', '+91 97120 77889', 'amit.sharma@gmail.com', 'House 88, Green Park Society, Sector 11', 'Gandhinagar', '382011'),
            (4, 'Neha Gupta', '+91 99090 33445', 'neha.gupta@gmail.com', 'Sector 7/B, Villa No. 14', 'Gandhinagar', '382007'),
            (5, 'Vikram Verma', '+91 98760 99887', 'vikram.v@gmail.com', 'B-301, Royal Enclave, Sargasan', 'Gandhinagar', '382421'),
            (6, 'Anjali Mehta', '+91 98241 22334', 'anjali.m@gmail.com', 'Shree Ram Residency, Raysan', 'Gandhinagar', '382007'),
            (7, 'Suresh Joshi', '+91 98981 33445', 'suresh.j@gmail.com', 'A-102, Silicon Valley, Infocity', 'Gandhinagar', '382009'),
            (8, 'Kavita Desai', '+91 98252 55667', 'kavita.desai@gmail.com', 'Flat 201, Swagat Blossom, Sargasan', 'Gandhinagar', '382421'),
            (9, 'Rajesh Trivedi', '+91 97123 88990', 'rajesh.trivedi@yahoo.com', 'House 45, Pramukh Tangent, Kudasan', 'Gandhinagar', '382421'),
            (10, 'Pooja Bhatt', '+91 99094 44556', 'pooja.bhatt@gmail.com', 'B-504, Titanium City Center', 'Ahmedabad', '380015'),
            (11, 'Manish Pandya', '+91 98765 11223', 'manish.p@gmail.com', '12, Shanti Nagar Society, Drive-In', 'Ahmedabad', '380054'),
            (12, 'Deepa Shah', '+91 98246 33445', 'deepa.shah@gmail.com', 'C-702, Godrej Garden City', 'Ahmedabad', '382470'),
            (13, 'Hiren Rathod', '+91 98987 66778', 'hiren.r@gmail.com', 'Block E, Sun Real Home, Sector 24', 'Gandhinagar', '382024'),
            (14, 'Bhavna Dave', '+91 98258 88990', 'bhavna.dave@gmail.com', 'House 19, Super City Township', 'Ahmedabad', '380060'),
            (15, 'Gaurav Solanki', '+91 97129 00112', 'gaurav.s@gmail.com', 'A-303, Shaligram Square', 'Ahmedabad', '380054'),
            (16, 'Sunita Rao', '+91 99099 22334', 'sunita.rao@gmail.com', 'Plot 55, Sector 8', 'Gandhinagar', '382008'),
            (17, 'Tarun Chawla', '+91 98769 44556', 'tarun.chawla@gmail.com', 'Flat 104, Maple Tree Garden Homes', 'Ahmedabad', '380054'),
            (18, 'Meena Chaudhari', '+91 98249 66778', 'meena.c@gmail.com', 'House 22, Sector 16', 'Gandhinagar', '382016'),
        ]
        for cust_id, cname, cphone, cemail, caddr, ccity, cpincode in customers_list:
            Customer.objects.create(id=cust_id, name=cname, phone=cphone, email=cemail, address=caddr, city=ccity, pincode=cpincode, status='ACTIVE')

        # 8.5 Customer Feedback (12 records)
        log(" -> Seeding Customer Feedback...")
        feedbacks_data = [
            (1, 5, 'Great supermarket experience! Quick billing at POS counter and excellent product variety.', 'ORD-20260801-001'),
            (2, 4, 'Fresh dairy products every morning. Very polite staff and clean store layout.', 'ORD-20260805-002'),
            (3, 5, 'Best prices and discount offers on Aashirvaad Atta and Fortune Oils in Gandhinagar.', 'ORD-20260810-003'),
            (4, 5, 'Very quick home delivery within 30 minutes! All groceries were well packed.', 'ORD-20260812-004'),
            (5, 5, 'Superb offers during weekend grocery sales. Saved over ₹200 on my total bill!', 'ORD-20260815-005'),
            (6, 4, 'Wide range of branded snacks and juices. UPI payment was instant.', 'ORD-20260818-006'),
            (7, 5, 'Very clean store and friendly cashiers. Amul products are always fresh.', 'ORD-20260822-010'),
            (8, 5, 'Tulsi Mart is our go-to supermarket for monthly staples.', 'ORD-20260825-015'),
            (9, 4, 'Good discounts on household detergents and cleaners.', 'ORD-20260828-020'),
            (10, 5, 'Fast order processing and clear digital GST invoice.', 'ORD-20260901-025'),
            (11, 5, 'Excellent customer support when I wanted to exchange a product.', 'ORD-20260905-032'),
            (12, 4, 'Top quality Basmati rice and pulses at wholesale rates.', 'ORD-20260908-040'),
        ]
        for cid, crating, ccomment, cref in feedbacks_data:
            cust = Customer.objects.get(id=cid)
            CustomerFeedback.objects.create(
                customer=cust,
                rating=crating,
                comment=ccomment,
                order_ref=cref,
                created_at=now - timedelta(days=random.randint(1, 28))
            )

        # 9. Suppliers (5 major wholesale distributors)
        log(" -> Seeding Suppliers...")
        suppliers_list = [
            (1, 'Amul Gujarat Co-op Milk Federation', 'Amul Depot Anand', '+91 98240 10001', 'amul.supply@amul.coop', '24AAACA0123A1Z1', 'Anand Dairy Campus, Anand', 'Dairy & Frozen', 'Net 7', 250000.0),
            (2, 'Fortune Adani Wilmar Depot', 'Fortune Depot Ahmedabad', '+91 98240 10002', 'orders@adaniwilmar.com', '24AABCA5678B1Z2', 'Mithakhali, Ahmedabad', 'Edible Oils', 'Net 15', 200000.0),
            (3, 'Tata Consumer Products Distributor', 'Tata Consumer Dist', '+91 98240 10003', 'tata.dist@gmail.com', '24AABCT9988C1Z3', 'GIDC Sector 28, Gandhinagar', 'Tea & Staples', 'Net 30', 150000.0),
            (4, 'Nestlé India Wholesale Agency', 'Nestlé Wholesale Agency', '+91 98240 10004', 'nestle.wholesaler@gmail.com', '24AAACN1122D1Z4', 'Asarwa, Ahmedabad', 'Packaged Food', 'Net 15', 180000.0),
            (5, 'Dabur India Distribution Ltd', 'Dabur Dist Agency', '+91 98240 10005', 'dabur.agency@gmail.com', '24AAACD4455E1Z5', 'Sarkhej, Ahmedabad', 'Personal Care & Honey', 'Net 15', 120000.0),
        ]
        for sid, sname, scompany, sphone, semail, sgst, saddr, scat, sterms, climit in suppliers_list:
            Supplier.objects.create(id=sid, name=sname, company_name=scompany, phone=sphone, email=semail, gstin=sgst, address=saddr, city='Gandhinagar', category=scat, payment_terms=sterms, credit_limit=Decimal(str(climit)), rating=5, is_active=True)

        # 9.5 Purchase Orders, GRNs & Supplier Payments across 30 days
        log(" -> Seeding Purchase Orders, GRNs & Supplier Payments...")
        po_records = [
            (1, 'PO-2026-001', 1, today - timedelta(days=28), today - timedelta(days=26), today - timedelta(days=26), 'RECEIVED', 18500.00, 18500.00, 'Monthly fresh dairy & butter bulk supply', 'GRN-2026-001', 'HDFC-NEFT-99881122', 18500.00, today - timedelta(days=25)),
            (2, 'PO-2026-002', 2, today - timedelta(days=22), today - timedelta(days=20), today - timedelta(days=20), 'RECEIVED', 28400.00, 24000.00, 'Edible sunflower & mustard oil restock', 'GRN-2026-002', 'HDFC-RTGS-77665544', 24000.00, today - timedelta(days=19)),
            (3, 'PO-2026-003', 3, today - timedelta(days=18), today - timedelta(days=16), today - timedelta(days=16), 'RECEIVED', 19800.00, 19800.00, 'Tata Tea & Pulses restock order', 'GRN-2026-003', 'HDFC-NEFT-66554433', 19800.00, today - timedelta(days=15)),
            (4, 'PO-2026-004', 4, today - timedelta(days=14), today - timedelta(days=12), today - timedelta(days=12), 'RECEIVED', 14200.00, 14200.00, 'Maggi noodles & sauces bulk supply', 'GRN-2026-004', 'HDFC-NEFT-55443322', 14200.00, today - timedelta(days=11)),
            (5, 'PO-2026-005', 5, today - timedelta(days=10), today - timedelta(days=8), today - timedelta(days=8), 'RECEIVED', 12600.00, 10000.00, 'Dabur Honey & Ayurvedic toothpaste restock', 'GRN-2026-005', 'HDFC-UPI-44332211', 10000.00, today - timedelta(days=7)),
            (6, 'PO-2026-006', 1, today - timedelta(days=5), today - timedelta(days=3), today - timedelta(days=3), 'RECEIVED', 15400.00, 15400.00, 'Mid-month fresh dairy & paneer supply', 'GRN-2026-006', 'HDFC-NEFT-33221100', 15400.00, today - timedelta(days=2)),
            (7, 'PO-2026-007', 2, today - timedelta(days=2), today + timedelta(days=2), None, 'ORDERED', 16500.00, 0.00, 'Fortune Basmati Rice & Sunflower oil in transit', None, None, 0.00, None),
        ]

        for poid, ponum, supid, odate, edate, rdate, pstat, totamt, paidamt, pnotes, grnnum, refnum, payamt, paydate in po_records:
            po_obj = PurchaseOrder.objects.create(
                id=poid,
                po_number=ponum,
                supplier_id=supid,
                order_date=odate,
                expected_delivery=edate,
                received_date=rdate,
                status=pstat,
                total_amount=Decimal(str(totamt)),
                paid_amount=Decimal(str(paidamt)),
                notes=pnotes
            )

            # PO Items
            if supid == 1:
                PurchaseOrderItem.objects.create(purchase_order=po_obj, product_id=16, product_name='Amul Butter Pasteurised 100g Box', unit_cost=Decimal('49.00'), quantity=100, received_quantity=100 if rdate else 0, subtotal=Decimal('4900.00'))
                PurchaseOrderItem.objects.create(purchase_order=po_obj, product_id=8, product_name='Amul Pure Cow Ghee 1L Tin', unit_cost=Decimal('515.00'), quantity=25, received_quantity=25 if rdate else 0, subtotal=Decimal('12875.00'))
            elif supid == 2:
                PurchaseOrderItem.objects.create(purchase_order=po_obj, product_id=7, product_name='Fortune Sunlite Sunflower Oil 1L Pouch', unit_cost=Decimal('130.00'), quantity=100, received_quantity=100 if rdate else 0, subtotal=Decimal('13000.00'))
                PurchaseOrderItem.objects.create(purchase_order=po_obj, product_id=2, product_name='Fortune Premium Basmati Rice 5kg', unit_cost=Decimal('440.00'), quantity=30, received_quantity=30 if rdate else 0, subtotal=Decimal('13200.00'))
            elif supid == 3:
                PurchaseOrderItem.objects.create(purchase_order=po_obj, product_id=29, product_name='Tata Tea Gold Premium Tea 500g Pack', unit_cost=Decimal('250.00'), quantity=50, received_quantity=50 if rdate else 0, subtotal=Decimal('12500.00'))
                PurchaseOrderItem.objects.create(purchase_order=po_obj, product_id=3, product_name='Tata Sampann Toor Dal 1kg', unit_cost=Decimal('140.00'), quantity=50, received_quantity=50 if rdate else 0, subtotal=Decimal('7000.00'))
            else:
                PurchaseOrderItem.objects.create(purchase_order=po_obj, product_id=46, product_name='Maggi 2-Minute Masala Noodles 280g Pack', unit_cost=Decimal('42.00'), quantity=150, received_quantity=150 if rdate else 0, subtotal=Decimal('6300.00'))

            # GRN if received
            if grnnum and rdate:
                GoodsReceiptNote.objects.create(
                    id=poid,
                    grn_number=grnnum,
                    purchase_order=po_obj,
                    supplier_id=supid,
                    received_by='Zeel Patel (Store Manager)',
                    total_valuation=Decimal(str(totamt)),
                    notes='Verified against delivery challan. Quality check passed.'
                )

            # Supplier Payment if paid
            if payamt > 0 and paydate:
                SupplierPayment.objects.create(
                    id=poid,
                    supplier_id=supid,
                    purchase_order=po_obj,
                    amount=Decimal(str(payamt)),
                    payment_method='BANK_TRANSFER',
                    reference_number=refnum,
                    payment_date=paydate,
                    notes='Payment cleared via HDFC Store Bank Account'
                )

        # 10. Expenses & Expense Categories across 30 days
        log(" -> Seeding Expense Categories & 18 Expenses...")
        exp_cats = [
            (1, 'Electricity & Utilities', 'Zap', '#88BDF2'),
            (2, 'Store Rent & Maintenance', 'Home', '#384959'),
            (3, 'Staff Welfare & Tea', 'Coffee', '#6A89A7'),
            (4, 'Marketing & Advertising', 'Smile', '#4CAF50'),
            (5, 'Packaging & Stationary', 'Receipt', '#FF9800'),
        ]
        for ecid, ecname, ecicon, eccolor in exp_cats:
            ExpenseCategory.objects.create(id=ecid, name=ecname, icon=ecicon, color=eccolor)

        expenses_list = [
            (1, 1, 'UGVCL Electricity Bill August 2026', 6850.00, today - timedelta(days=28), 'BANK_TRANSFER', 'Paid via HDFC Netbanking'),
            (2, 2, 'Supermarket Shop Rent Sector 11 (Aug 2026)', 25000.00, today - timedelta(days=27), 'BANK_TRANSFER', 'Paid to Landlord Ramesh Patel'),
            (3, 3, 'Staff Daily Tea, Snacks & Water (Week 1)', 1850.00, today - timedelta(days=24), 'CASH', 'Gulla Cash expense'),
            (4, 4, 'Tulsi Mart Promotional Pamphlets Printing', 3500.00, today - timedelta(days=22), 'UPI', 'Paid via Store GPay UPI'),
            (5, 5, 'Eco-friendly Groceries Carry Bags (500 Pcs)', 4200.00, today - timedelta(days=20), 'UPI', 'Paid to Packaging Wholesaler'),
            (6, 2, 'Air Conditioner Annual Maintenance & Filter Repair', 2200.00, today - timedelta(days=18), 'CASH', 'Technician Service Charges'),
            (7, 3, 'Staff Daily Tea, Snacks & Water (Week 2)', 1920.00, today - timedelta(days=17), 'CASH', 'Gulla Cash expense'),
            (8, 5, 'Thermal Invoice Roll Paper (50 Rolls)', 1500.00, today - timedelta(days=15), 'UPI', 'POS Invoice printer paper'),
            (9, 4, 'Local Newspaper Banner Ad Insertion', 2800.00, today - timedelta(days=14), 'BANK_TRANSFER', 'Diwali promotional offer ad'),
            (10, 1, 'Drinking Water 20L Can Refills (15 Cans)', 1200.00, today - timedelta(days=12), 'CASH', 'Bisleri delivery boy cash payment'),
            (11, 3, 'Staff Daily Tea, Snacks & Water (Week 3)', 1980.00, today - timedelta(days=10), 'CASH', 'Gulla Cash expense'),
            (12, 2, 'CCTV Security Camera Repair & Wiring', 1800.00, today - timedelta(days=8), 'UPI', 'Paid to Tech Security System'),
            (13, 5, 'Barcode Label Sticker Rolls (10 Packs)', 1100.00, today - timedelta(days=7), 'CASH', 'Gulla Cash expense'),
            (14, 1, 'Broadband Internet Bill (Fiber 200Mbps)', 1499.00, today - timedelta(days=5), 'UPI', 'Airtel Broadband online bill payment'),
            (15, 3, 'Staff Daily Tea, Snacks & Water (Week 4)', 2050.00, today - timedelta(days=3), 'CASH', 'Gulla Cash expense'),
            (16, 2, 'Pest Control & Store Sanitization Service', 2500.00, today - timedelta(days=2), 'BANK_TRANSFER', 'Quarterly pest control treatment'),
            (17, 4, 'Social Media Sponsored Ads Campaign', 2000.00, today - timedelta(days=1), 'CARD', 'Instagram & FB promotion for Tulsi Mart'),
            (18, 5, 'Store Cleaning Supplies & Disinfectants', 1350.00, today, 'CASH', 'Store floor cleaning items'),
        ]
        for eid, ecid, etitle, eamt, edate, epay, enotes in expenses_list:
            Expense.objects.create(id=eid, category_id=ecid, title=etitle, amount=Decimal(str(eamt)), date=edate, payment_method=epay, notes=enotes, created_by=admin_user)

        # 11. Offers & Coupons
        log(" -> Seeding Coupons & Festival Offers...")
        Coupon.objects.create(id=1, code='TULSI10', title='10% Discount on Supermarket Items', description='Flat 10% OFF on total bill above ₹500', offer_type='PERCENTAGE', discount_value=Decimal('10.00'), min_order_amount=Decimal('500.00'), max_discount_amount=Decimal('150.00'), valid_from=today - timedelta(days=30), valid_to=today + timedelta(days=60), usage_limit=500, used_count=64, is_active=True)
        Coupon.objects.create(id=2, code='WELCOME50', title='Welcome Discount for New Customers', description='Flat ₹50 OFF on your first purchase above ₹300', offer_type='FLAT', discount_value=Decimal('50.00'), min_order_amount=Decimal('300.00'), valid_from=today - timedelta(days=30), valid_to=today + timedelta(days=90), usage_limit=200, used_count=32, is_active=True)
        Coupon.objects.create(id=3, code='DIWALI200', title='Diwali Festive Shopping Special', description='Flat ₹200 OFF on festive grocery shopping above ₹2,000', offer_type='FLAT', discount_value=Decimal('200.00'), min_order_amount=Decimal('2000.00'), valid_from=today - timedelta(days=10), valid_to=today + timedelta(days=45), usage_limit=100, used_count=14, is_active=True)
        Coupon.objects.create(id=4, code='GROCERY100', title='Monthly Grocery Savings Pack', description='Flat ₹100 Instant Discount on orders above ₹1,000', offer_type='FLAT', discount_value=Decimal('100.00'), min_order_amount=Decimal('1000.00'), valid_from=today - timedelta(days=30), valid_to=today + timedelta(days=30), usage_limit=300, used_count=48, is_active=True)

        FestivalOffer.objects.create(id=1, title='Diwali Grocery Mahotsav Offer', subtitle='Special Supermarket Savings & Festival Hampers', tag_text='FESTIVAL SPECIAL', discount_info='Flat ₹100 Instant Discount', start_date=today - timedelta(days=10), end_date=today + timedelta(days=30), is_active=True)
        FestivalOffer.objects.create(id=2, title='Super Weekend Grocery Sale', subtitle='Unbeatable Discounts on Staples & Beverages', tag_text='WEEKEND SPECIAL', discount_info='Up to 30% OFF', start_date=today - timedelta(days=2), end_date=today + timedelta(days=2), is_active=True)

    # 12. 60+ Realistic Orders across the last 30 days
    log(" -> Generating 60+ Orders distributed across 30 days...")

    payment_methods = ['CASH', 'UPI', 'CARD', 'NET_BANKING', 'COD', 'KHATA']
    product_pool = list(Product.objects.all())
    customer_pool = list(Customer.objects.all())

    order_counter = 1
    total_revenue_accumulated = Decimal('0.00')

    # Spread orders across days 30 to 0 (today)
    for day_offset in range(30, -1, -1):
            with transaction.atomic():
                order_date = today - timedelta(days=day_offset)

                is_weekend = order_date.weekday() in [5, 6]
                num_orders_today = random.randint(2, 4) if is_weekend else random.randint(1, 3)
                daily_order_counter = 1

                for _ in range(num_orders_today):
                    cust = random.choice(customer_pool)
                    
                    if day_offset > 3:
                        status = random.choice(['DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'CANCELLED'])
                    elif day_offset >= 1:
                        status = random.choice(['DELIVERED', 'DELIVERED', 'OUT_FOR_DELIVERY', 'PACKED', 'PROCESSING'])
                    else:
                        status = random.choice(['NEW', 'PROCESSING', 'DELIVERED', 'PACKED'])

                    payment_method = random.choice(payment_methods)
                    if status in ['DELIVERED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY']:
                        payment_status = 'PAID'
                    elif status == 'CANCELLED':
                        payment_status = 'REFUNDED' if payment_method != 'COD' else 'FAILED'
                    elif payment_method == 'COD':
                        payment_status = 'PENDING'
                    else:
                        payment_status = 'PAID'

                    num_items = random.randint(2, 5)
                    selected_products = random.sample(product_pool, num_items)

                    items_data = []
                    order_subtotal = Decimal('0.00')
                    order_tax = Decimal('0.00')

                    for prod in selected_products:
                        qty = random.randint(1, 3)
                        unit_price = prod.selling_price
                        subtotal = unit_price * qty
                        gst_val = (subtotal * prod.gst_percent) / Decimal('100.00')

                        order_subtotal += subtotal
                        order_tax += gst_val

                        items_data.append({
                            'product': prod,
                            'pname': prod.name,
                            'sku': prod.sku,
                            'unit_price': unit_price,
                            'qty': qty,
                            'gst_percent': prod.gst_percent,
                            'subtotal': subtotal
                        })

                    discount_amount = Decimal('0.00')
                    coupon_applied = None
                    if order_subtotal >= Decimal('1000.00'):
                        discount_amount = Decimal('100.00')
                        coupon_applied = 'GROCERY100'
                    elif order_subtotal >= Decimal('500.00'):
                        discount_amount = (order_subtotal * Decimal('0.10')).quantize(Decimal('0.01'))
                        coupon_applied = 'TULSI10'

                    delivery_charge = Decimal('30.00') if order_subtotal < Decimal('500.00') else Decimal('0.00')
                    total_amount = (order_subtotal + order_tax - discount_amount + delivery_charge).quantize(Decimal('0.01'))

                    cash_tendered = Decimal('0.00')
                    change_returned = Decimal('0.00')
                    if payment_method == 'CASH' and payment_status == 'PAID':
                        cash_tendered = Decimal(str(int((total_amount + 99) // 100) * 100))
                        change_returned = cash_tendered - total_amount

                    order_num_str = f"ORD-{order_date.strftime('%Y%m%d')}-{daily_order_counter:03d}"
                    inv_num_str = f"TM-INV-{1000 + order_counter}"
                    daily_order_counter += 1

                    ord_obj = Order.objects.create(
                        order_number=order_num_str,
                        invoice_number=inv_num_str,
                        customer=cust,
                        customer_name=cust.name,
                        customer_phone=cust.phone,
                        customer_address=cust.address,
                        status=status,
                        payment_method=payment_method,
                        payment_status=payment_status,
                        subtotal=order_subtotal,
                        tax_amount=order_tax,
                        discount_amount=discount_amount,
                        delivery_charge=delivery_charge,
                        total_amount=total_amount,
                        cash_tendered=cash_tendered,
                        change_returned=change_returned,
                        coupon_applied=coupon_applied,
                        notes=f"Order placed via POS Counter / Tulsi Mart App" if random.random() > 0.5 else None,
                        created_by=admin_user if random.random() > 0.3 else cashier_user,
                        delivery_partner='Vijay Singh (Store Delivery)' if status in ['OUT_FOR_DELIVERY', 'DELIVERED'] else None
                    )

                    hour = random.randint(9, 21)
                    minute = random.randint(0, 59)
                    created_datetime = timezone.make_aware(datetime.combine(order_date, datetime.min.time()).replace(hour=hour, minute=minute))
                    Order.objects.filter(id=ord_obj.id).update(created_at=created_datetime)

                    for item in items_data:
                        OrderItem.objects.create(
                            order=ord_obj,
                            product=item['product'],
                            product_name=item['pname'],
                            sku=item['sku'],
                            unit_price=item['unit_price'],
                            quantity=item['qty'],
                            gst_percent=item['gst_percent'],
                            subtotal=item['subtotal']
                        )

                        if status == 'DELIVERED':
                            StockMovement.objects.create(
                                product=item['product'],
                                movement_type='OUT_SALE',
                                quantity=item['qty'],
                                balance_after=max(0, item['product'].stock_quantity - item['qty']),
                                reason=f'POS Sale Order #{order_num_str}',
                                reference_no=order_num_str,
                                performed_by=cashier_user,
                                created_at=created_datetime
                            )

                    PaymentTransaction.objects.create(
                        order=ord_obj,
                        transaction_id=f'TXN-{payment_method}-{10000 + order_counter}',
                        amount=total_amount,
                        payment_method=payment_method,
                        status='PAID' if payment_status == 'PAID' else ('PENDING' if payment_status == 'PENDING' else 'FAILED'),
                        notes=f'Payment for invoice {inv_num_str}',
                        created_at=created_datetime
                    )

                    if payment_status == 'PAID':
                        total_revenue_accumulated += total_amount

                    order_counter += 1

    log(f" -> Created {order_counter - 1} Orders with total accumulated revenue of Rs. {total_revenue_accumulated:,.2f}")

    # 13. Cash Register Entries (Gulla Register over 30 days)
    log(" -> Seeding Cash Register Entries (Gulla)...")
    CashRegisterEntry.objects.create(
        entry_type='OPENING_FLOAT',
        amount=Decimal('5000.00'),
        date=today - timedelta(days=30),
        notes='Initial monthly opening float cash in Gulla register',
        created_by_name='Zeel Patel (Admin)',
        created_at=now - timedelta(days=30)
    )
    CashRegisterEntry.objects.create(
        entry_type='BILL_SALE',
        amount=Decimal('15420.50'),
        date=today - timedelta(days=15),
        reference_id='POS-CASH-WEEK2',
        notes='Consolidated POS Cash Sales week 2',
        created_by_name='Rahul Sharma (Cashier)',
        created_at=now - timedelta(days=15)
    )
    CashRegisterEntry.objects.create(
        entry_type='EXPENSE',
        amount=Decimal('1850.00'),
        date=today - timedelta(days=10),
        reference_id='EXP-003',
        notes='Staff daily snacks & tea paid from cash register',
        created_by_name='Rahul Sharma (Cashier)',
        created_at=now - timedelta(days=10)
    )
    CashRegisterEntry.objects.create(
        entry_type='KHATA_PAYMENT',
        amount=Decimal('2500.00'),
        date=today - timedelta(days=5),
        reference_id='KHATA-CUST-001',
        notes='Khata customer Ramesh Shah cash clearance',
        created_by_name='Rahul Sharma (Cashier)',
        created_at=now - timedelta(days=5)
    )

    # 14. Bank Transactions across 30 days
    log(" -> Seeding Store Bank Transactions...")
    BankTransaction.objects.create(
        transaction_type='DEPOSIT',
        amount=Decimal('100000.00'),
        reference_number='DEP-HDFC-001',
        bank_name='HDFC Store Primary Bank',
        notes='Initial store operational capital deposit',
        created_by_name='Zeel Patel (Admin)',
        created_at=now - timedelta(days=30)
    )
    BankTransaction.objects.create(
        transaction_type='UPI_IN',
        amount=Decimal('42850.00'),
        reference_number='UPI-SETTLEMENT-W1',
        bank_name='HDFC Store Primary Bank',
        notes='Weekly UPI customer payments auto-settlement from HDFC Merchant QR',
        created_by_name='HDFC Merchant POS',
        created_at=now - timedelta(days=21)
    )
    BankTransaction.objects.create(
        transaction_type='SUPPLIER_PAYOUT',
        amount=Decimal('18500.00'),
        reference_number='HDFC-NEFT-99881122',
        bank_name='HDFC Store Primary Bank',
        notes='Supplier payment cleared for Amul Dairy PO-2026-001',
        created_by_name='Zeel Patel (Admin)',
        created_at=now - timedelta(days=25)
    )
    BankTransaction.objects.create(
        transaction_type='EXPENSE_PAYOUT',
        amount=Decimal('25000.00'),
        reference_number='HDFC-RENT-AUG26',
        bank_name='HDFC Store Primary Bank',
        notes='Supermarket shop rent paid to Ramesh Patel',
        created_by_name='Zeel Patel (Admin)',
        created_at=now - timedelta(days=27)
    )

    # 15. Home Cash Transactions (Vault)
    log(" -> Seeding Home Safe Vault Cash Transactions...")
    HomeCashTransaction.objects.create(
        entry_type='DEPOSIT',
        amount=Decimal('50000.00'),
        notes='Initial reserve cash kept in store home safe vault',
        created_by_name='Zeel Patel',
        balance_after=Decimal('50000.00'),
        created_at=now - timedelta(days=30)
    )
    HomeCashTransaction.objects.create(
        entry_type='SWEEP',
        amount=Decimal('20000.00'),
        notes='End of fortnight Gulla excess cash transfer to home safe vault',
        created_by_name='Zeel Patel',
        balance_after=Decimal('70000.00'),
        created_at=now - timedelta(days=14)
    )

    # 16. Activity Logs across 30 days
    log(" -> Seeding Activity Logs...")
    logs_data = [
        ('Admin', 'LOGIN', 'Core Auth', 'Admin Zeel Patel logged in successfully'),
        ('Cashier', 'POS_BILL', 'Orders', 'Created POS Order ORD-20260801-001 for Ramesh Shah'),
        ('Admin', 'STOCK_UPDATE', 'Inventory', 'Updated stock quantity for Aashirvaad Chakki Atta 5kg (+50 kg)'),
        ('Admin', 'SUPPLIER_PO', 'Procurement', 'Created Purchase Order PO-2026-001 for Amul Dairy Federation'),
        ('Admin', 'EXPENSE_ADD', 'Expenses', 'Added new expense UGVCL Electricity Bill for ₹6,850.00'),
        ('Manager', 'ATTENDANCE', 'Staff', 'Marked staff daily attendance for Rahul Sharma & Vijay Singh'),
        ('Cashier', 'GULLA_OPEN', 'Finance', 'Recorded morning Gulla opening cash float ₹5,000.00'),
        ('Admin', 'COUPON_CREATE', 'Offers', 'Created discount coupon GROCERY100 for ₹100 instant discount'),
        ('Admin', 'SETTINGS_UPDATE', 'Settings', 'Updated store tagline and GST tax rates'),
        ('Cashier', 'POS_BILL', 'Orders', 'Processed UPI sale order for Priya Patel (₹1,305.00)'),
    ]
    for u_name, act, mod, det in logs_data:
        ActivityLog.objects.create(
            user_name=u_name,
            action=act,
            module=mod,
            details=det,
            created_at=now - timedelta(days=random.randint(1, 28))
        )

    log("=" * 70)
    log(" [SUCCESS] Tulsi Mart Database 30-Day Operational Seeding Completed!")
    log("=" * 70)

if __name__ == '__main__':
    seed_data()
