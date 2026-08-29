import os
import sys
import django
from datetime import datetime, date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tulsimart_backend.settings')
django.setup()

from django.db import connection
from django.utils import timezone
from core.models import StoreSetting, LoginAccount, Staff, ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction
from inventory.models import Category, Brand, Unit, Product, StockMovement
from orders.models import Order, OrderItem, PaymentTransaction
from customers.models import Customer, CustomerFeedback
from suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from expenses.models import ExpenseCategory, Expense
from offers.models import Coupon, FestivalOffer

def clear_all_demo_data():
    print("[Cleaning] Removing all existing data from tables...")
    with connection.cursor() as cursor:
        cursor.execute('PRAGMA foreign_keys = OFF;')

    models_to_clear = [
        OrderItem, PaymentTransaction, Order,
        StockMovement, Product, Category, Brand, Unit,
        CustomerFeedback, Customer,
        GoodsReceiptNote, PurchaseOrderItem, SupplierPayment, PurchaseOrder, Supplier,
        Expense, ExpenseCategory, Coupon, FestivalOffer,
        ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction,
        Staff, LoginAccount, StoreSetting
    ]
    for m in models_to_clear:
        try:
            m.objects.all().delete()
        except Exception:
            pass

def seed_data():
    print("[Starting] Tulsi Mart Database Data Seeding...")

    # Clear existing rows first to prevent duplicate key or clean slate issues
    clear_all_demo_data()

    today = date.today()
    now = timezone.now()

    # 1. Store Setting
    setting, _ = StoreSetting.objects.update_or_create(id=1, defaults={
        'store_name': 'Tulsi Mart Supermarket',
        'tagline': 'Supermarket & Grocery Management System',
        'address': 'Plot No. 45, Main Market Road, Sector 11',
        'city': 'Gandhinagar',
        'state': 'Gujarat',
        'country': 'India',
        'pincode': '382011',
        'phone': '+91 98790 12345',
        'email': 'contact@tulsimart.com',
        'gst_number': '24AABCT1234F1Z5',
        'pan_number': 'AABCT1234F',
        'currency_symbol': '₹',
        'currency_code': 'INR',
        'bank_name': 'HDFC Bank',
        'account_number': '50200012345678',
        'ifsc_code': 'HDFC0000123',
        'upi_id': 'tulsimart@hdfcbank',
        'security_require_otp': True,
        'tax_enabled': True,
        'default_gst_rate': Decimal('18.00'),
    })

    # 1.5 Django Auth Users for FK relations
    from django.contrib.auth.models import User
    admin_user, _ = User.objects.get_or_create(id=1, defaults={'username': 'admin', 'email': 'zeelptl028@gmail.com', 'first_name': 'Zeel Patel', 'is_staff': True, 'is_superuser': True})
    cashier_user, _ = User.objects.get_or_create(id=2, defaults={'username': 'cashier', 'email': 'cashier@tulsimart.com', 'first_name': 'Rahul Sharma', 'is_staff': True})
    manager_user, _ = User.objects.get_or_create(id=3, defaults={'username': 'manager', 'email': 'manager@tulsimart.com', 'first_name': 'Suresh Manager', 'is_staff': True})

    # 2. Login Accounts
    LoginAccount.objects.update_or_create(id=1, defaults={
        'username': 'admin',
        'password': 'password123',
        'full_name': 'Zeel Patel (Admin)',
        'email': 'zeelptl028@gmail.com',
        'role': 'ADMIN',
        'require_otp': True,
        'is_active': True
    })

    LoginAccount.objects.update_or_create(id=2, defaults={
        'username': 'cashier',
        'password': 'password123',
        'full_name': 'Rahul Sharma (Cashier)',
        'email': 'cashier@tulsimart.com',
        'role': 'CASHIER',
        'require_otp': False,
        'is_active': True
    })

    LoginAccount.objects.update_or_create(id=3, defaults={
        'username': 'manager',
        'password': 'password123',
        'full_name': 'Suresh Manager',
        'email': 'manager@tulsimart.com',
        'role': 'STORE_MANAGER',
        'require_otp': False,
        'is_active': True
    })

    # 3. Staff Members
    Staff.objects.update_or_create(id=1, defaults={
        'name': 'Zeel Patel',
        'role': 'STORE_MANAGER',
        'phone': '+91 98790 12345',
        'email': 'zeelptl028@gmail.com',
        'salary': Decimal('35000.00'),
        'is_active': True
    })

    Staff.objects.update_or_create(id=2, defaults={
        'name': 'Rahul Sharma',
        'role': 'CASHIER',
        'phone': '+91 98790 54321',
        'email': 'rahul@tulsimart.com',
        'salary': Decimal('18000.00'),
        'is_active': True
    })

    Staff.objects.update_or_create(id=3, defaults={
        'name': 'Suresh Kumar',
        'role': 'HELPER',
        'phone': '+91 98790 66778',
        'email': 'suresh@tulsimart.com',
        'salary': Decimal('12000.00'),
        'is_active': True
    })

    Staff.objects.update_or_create(id=4, defaults={
        'name': 'Vijay Singh',
        'role': 'DELIVERY',
        'phone': '+91 98790 11223',
        'email': 'vijay@tulsimart.com',
        'salary': Decimal('15000.00'),
        'is_active': True
    })

    # 4. Units
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
        Unit.objects.update_or_create(id=uid, defaults={'name': uname, 'short_name': ushort})

    # 5. Categories
    categories_data = [
        (1, 'Atta, Rice & Dal', 'atta-rice-dal', 'Wheat', 'Flour, Basmati Rice, Toor Dal, Chana Dal'),
        (2, 'Oil, Ghee & Spices', 'oil-ghee-spices', 'Flame', 'Edible Oil, Cow Ghee, Garam Masala, Turmeric'),
        (3, 'Dairy, Milk & Bakery', 'dairy-milk-bakery', 'Milk', 'Fresh Milk, Butter, Cheese, Bread, Paneer'),
        (4, 'Snacks & Biscuits', 'snacks-biscuits', 'Cookie', 'Namkeen, Chips, Biscuits, Chocolates'),
        (5, 'Beverages & Drinks', 'beverages-drinks', 'Coffee', 'Tea, Coffee, Soft Drinks, Fruit Juices'),
        (6, 'Personal Care & Hygiene', 'personal-care-hygiene', 'Smile', 'Soaps, Shampoos, Toothpaste, Handwash'),
        (7, 'Household & Cleaning', 'household-cleaning', 'Home', 'Detergent, Floor Cleaner, Dishwash Liquid'),
        (8, 'Instant & Frozen Food', 'instant-frozen-food', 'Zap', 'Noodles, Sauces, Ready to Eat, Frozen Snacks'),
    ]
    for cid, cname, cslug, cicon, cdesc in categories_data:
        Category.objects.update_or_create(id=cid, defaults={'name': cname, 'slug': cslug, 'icon': cicon, 'description': cdesc, 'is_active': True})

    # 6. Brands
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
        Brand.objects.update_or_create(id=bid, defaults={'name': bname, 'description': bdesc, 'is_active': True})

    # 7. Products (25 rich supermarket items)
    products_list = [
        (1, 'Aashirvaad Shuddh Chakki Atta 5kg', 'TM-ATT-001', '8901058000011', 1, 2, 5, 275.0, 245.0, 220.0, 5.0, 45, 10, True),
        (2, 'Fortune Sunlite Sunflower Oil 1L Pouch', 'TM-OIL-002', '8906007280022', 2, 3, 3, 165.0, 148.0, 132.0, 5.0, 60, 12, True),
        (3, 'Amul Taaza Toned Milk 500ml Pouch', 'TM-MLK-003', '8901262010033', 3, 1, 4, 27.0, 27.0, 24.5, 0.0, 80, 20, False),
        (4, 'Amul Butter Pasteurised 100g Box', 'TM-BTR-004', '8901262020044', 3, 1, 7, 58.0, 56.0, 50.0, 0.0, 50, 10, True),
        (5, 'Everest Garam Masala 100g Box', 'TM-SPC-005', '8901786000055', 2, 5, 2, 85.0, 78.0, 68.0, 5.0, 35, 8, False),
        (6, 'Tata Salt Vacuum Evaporated 1kg', 'TM-SLT-006', '8901058030066', 2, 4, 1, 28.0, 28.0, 24.0, 0.0, 100, 25, False),
        (7, 'Britannia Good Day Cashew Biscuits 120g', 'TM-BSC-007', '8901063000077', 4, 7, 5, 30.0, 28.0, 23.0, 18.0, 75, 15, True),
        (8, 'Surf Excel Easy Wash Detergent Powder 1kg', 'TM-DET-008', '8901030000088', 7, 8, 1, 145.0, 135.0, 115.0, 18.0, 40, 10, False),
        (9, 'Colgate Strong Teeth Toothpaste 150g', 'TM-TP-009', '8901314000099', 6, 9, 2, 98.0, 89.0, 75.0, 18.0, 50, 10, False),
        (10, 'Mother Dairy Fresh Paneer 200g Pack', 'TM-PNR-010', '8901262050100', 3, 6, 5, 95.0, 90.0, 78.0, 0.0, 25, 8, True),
        (11, 'Maggi 2-Minute Masala Noodles 280g Pack', 'TM-MAG-011', '8901058880111', 8, 10, 5, 56.0, 52.0, 44.0, 12.0, 90, 20, True),
        (12, 'Haldiram\'s Nagpur Bhujia Sev 400g', 'TM-HAL-012', '8901058880122', 4, 12, 5, 120.0, 110.0, 92.0, 12.0, 45, 10, True),
        (13, 'Dabur Red Ayurvedic Toothpaste 200g', 'TM-DAB-013', '8901058880133', 6, 11, 2, 115.0, 102.0, 86.0, 18.0, 30, 8, False),
        (14, 'Tata Tea Gold Premium Tea 500g Pack', 'TM-TEA-014', '8901058880144', 5, 4, 5, 330.0, 295.0, 255.0, 5.0, 35, 10, True),
        (15, 'Amul Pure Cow Ghee 1L Tin', 'TM-GHE-015', '8901262010155', 2, 1, 8, 650.0, 590.0, 520.0, 12.0, 20, 5, True),
        (16, 'Fortune Premium Kachi Ghani Mustard Oil 1L', 'TM-OIL-016', '8906007280166', 2, 3, 8, 175.0, 155.0, 135.0, 5.0, 40, 10, False),
        (17, 'Aashirvaad Select Sharbati Atta 5kg', 'TM-ATT-017', '8901058000177', 1, 2, 5, 340.0, 310.0, 275.0, 5.0, 30, 8, True),
        (18, 'Britannia Bourbon Chocolate Biscuits 150g', 'TM-BSC-018', '8901063000188', 4, 7, 5, 40.0, 36.0, 30.0, 18.0, 60, 12, False),
        (19, 'Everest Red Chilli Powder 200g', 'TM-SPC-019', '8901786000199', 2, 5, 2, 110.0, 98.0, 82.0, 5.0, 40, 10, False),
        (20, 'Surf Excel Matic Front Load Liquid 1L', 'TM-DET-020', '8901030000200', 7, 8, 8, 260.0, 235.0, 195.0, 18.0, 18, 5, True),
        (21, 'Amul Masti Dahi Pouch 400g', 'TM-DAH-021', '8901262010211', 3, 1, 5, 35.0, 35.0, 30.0, 0.0, 40, 10, False),
        (22, 'Colgate Plax Fresh Mint Mouthwash 250ml', 'TM-MW-022', '8901314000222', 6, 9, 8, 160.0, 145.0, 120.0, 18.0, 15, 5, False),
        (23, 'Maggi Hot & Sweet Tomato Chilli Sauce 1kg', 'TM-SAU-023', '8901058880233', 8, 10, 8, 170.0, 150.0, 128.0, 12.0, 22, 6, False),
        (24, 'Dabur 100% Pure Honey Squeezy 500g', 'TM-HNY-024', '8901058880244', 4, 11, 8, 240.0, 215.0, 180.0, 5.0, 25, 6, True),
        (25, 'Haldiram\'s Royal Soan Papdi 500g Box', 'TM-HAL-025', '8901058880255', 4, 12, 7, 140.0, 125.0, 105.0, 12.0, 35, 8, False),
    ]

    for pid, pname, psku, pbar, cid, bid, uid, mrp, sp, cp, gst, qty, alert, feat in products_list:
        Product.objects.update_or_create(id=pid, defaults={
            'name': pname,
            'sku': psku,
            'barcode': pbar,
            'category_id': cid,
            'brand_id': bid,
            'unit_id': uid,
            'mrp': Decimal(str(mrp)),
            'selling_price': Decimal(str(sp)),
            'cost_price': Decimal(str(cp)),
            'gst_percent': Decimal(str(gst)),
            'stock_quantity': qty,
            'min_stock_alert': alert,
            'is_featured': feat,
            'is_active': True
        })

    # 7.5 Stock Movements
    for pid in range(1, 26):
        prod = Product.objects.get(id=pid)
        StockMovement.objects.create(
            product=prod,
            movement_type='IN_PURCHASE',
            quantity=prod.stock_quantity + 10,
            balance_after=prod.stock_quantity + 10,
            reason='Initial Stock Arrival from Wholesale Supplier',
            reference_no=f'PO-INIT-2026-{pid:03d}',
            performed_by=admin_user
        )

    # 8. Customers
    customers_list = [
        (1, 'Ramesh Shah', '+91 98980 11223', 'ramesh@gmail.com', 'Plot 12, Sector 21, Gandhinagar'),
        (2, 'Priya Patel', '+91 98250 44556', 'priya@gmail.com', 'Flat 402, Shivalik Heights, Ahmedabad'),
        (3, 'Amit Sharma', '+91 97120 77889', 'amit@gmail.com', 'House 88, Green Park Society, Gandhinagar'),
        (4, 'Neha Gupta', '+91 99090 33445', 'neha.g@gmail.com', 'Sector 7/B, Villa No. 14, Gandhinagar'),
        (5, 'Vikram Verma', '+91 98760 99887', 'vikram.v@gmail.com', 'B-301, Royal Enclave, Kudasan, Gandhinagar'),
        (6, 'Anjali Mehta', '+91 98241 22334', 'anjali.m@gmail.com', 'Shree Ram Residency, Sargasan, Gandhinagar'),
    ]
    for cust_id, cname, cphone, cemail, caddr in customers_list:
        Customer.objects.update_or_create(id=cust_id, defaults={
            'name': cname,
            'phone': cphone,
            'email': cemail,
            'address': caddr,
            'city': 'Gandhinagar',
            'status': 'ACTIVE'
        })

    # 8.5 Customer Feedback
    feedbacks_data = [
        (1, 5, 'Great supermarket experience! Quick billing and excellent variety of snacks and grocery items.', 'ORD-20260810-001'),
        (2, 4, 'Fresh dairy products every morning. Very polite staff and neat store layout.', 'ORD-20260815-003'),
        (3, 5, 'Best prices and discount offers on Aashirvaad Atta and Fortune Oils in Gandhinagar.', 'ORD-20260820-005'),
    ]
    for cid, crating, ccomment, cref in feedbacks_data:
        cust = Customer.objects.get(id=cid)
        CustomerFeedback.objects.create(
            customer=cust,
            rating=crating,
            comment=ccomment,
            order_ref=cref
        )

    # 9. Suppliers
    suppliers_list = [
        (1, 'Amul Gujarat Co-op Milk Federation', 'Amul Depot Anand', '+91 98240 10001', 'amul.supply@amul.coop', '24AAACA0123A1Z1', 'Anand Dairy Campus, Anand', 'Dairy & Frozen', 'Net 7', 200000.0),
        (2, 'Fortune Adani Wilmar Depot', 'Fortune Depot Ahmedabad', '+91 98240 10002', 'orders@adaniwilmar.com', '24AABCA5678B1Z2', 'Mithakhali, Ahmedabad', 'Edible Oils', 'Net 15', 150000.0),
        (3, 'Tata Consumer Products Distributor', 'Tata Consumer Dist', '+91 98240 10003', 'tata.dist@gmail.com', '24AABCT9988C1Z3', 'GIDC Sector 28, Gandhinagar', 'Tea & Staples', 'Net 30', 100000.0),
        (4, 'Nestlé India Wholesale Agency', 'Nestlé Wholesale Agency', '+91 98240 10004', 'nestle.wholesaler@gmail.com', '24AAACN1122D1Z4', 'Asarwa, Ahmedabad', 'Packaged Food', 'Net 15', 120000.0),
    ]
    for sid, sname, scompany, sphone, semail, sgst, saddr, scat, sterms, climit in suppliers_list:
        Supplier.objects.update_or_create(id=sid, defaults={
            'name': sname,
            'company_name': scompany,
            'phone': sphone,
            'email': semail,
            'gstin': sgst,
            'address': saddr,
            'city': 'Gandhinagar',
            'category': scat,
            'payment_terms': sterms,
            'credit_limit': Decimal(str(climit)),
            'rating': 5,
            'is_active': True
        })

    # 9.5 Purchase Orders, GRNs & Supplier Payments
    po1 = PurchaseOrder.objects.create(
        id=1,
        po_number='PO-2026-001',
        supplier_id=1,
        order_date=today - timedelta(days=20),
        expected_delivery=today - timedelta(days=18),
        received_date=today - timedelta(days=18),
        status='RECEIVED',
        total_amount=Decimal('15400.00'),
        paid_amount=Decimal('15400.00'),
        notes='Monthly fresh dairy and ghee bulk purchase'
    )
    PurchaseOrderItem.objects.create(
        purchase_order=po1,
        product_id=4,
        product_name='Amul Butter Pasteurised 100g Box',
        unit_cost=Decimal('50.00'),
        quantity=100,
        tax_rate=Decimal('0.00'),
        received_quantity=100,
        subtotal=Decimal('5000.00')
    )
    PurchaseOrderItem.objects.create(
        purchase_order=po1,
        product_id=15,
        product_name='Amul Pure Cow Ghee 1L Tin',
        unit_cost=Decimal('520.00'),
        quantity=20,
        tax_rate=Decimal('12.00'),
        received_quantity=20,
        subtotal=Decimal('10400.00')
    )
    GoodsReceiptNote.objects.create(
        id=1,
        grn_number='GRN-2026-001',
        purchase_order=po1,
        supplier_id=1,
        received_by='Zeel Patel (Store Manager)',
        total_valuation=Decimal('15400.00'),
        notes='All items verified and received in good condition.'
    )
    SupplierPayment.objects.create(
        id=1,
        supplier_id=1,
        purchase_order=po1,
        amount=Decimal('15400.00'),
        payment_method='BANK_TRANSFER',
        reference_number='HDFC-NEFT-99881122',
        payment_date=today - timedelta(days=17),
        notes='Full payment cleared via HDFC Netbanking'
    )

    po2 = PurchaseOrder.objects.create(
        id=2,
        po_number='PO-2026-002',
        supplier_id=2,
        order_date=today - timedelta(days=10),
        expected_delivery=today - timedelta(days=8),
        received_date=today - timedelta(days=8),
        status='RECEIVED',
        total_amount=Decimal('24800.00'),
        paid_amount=Decimal('20000.00'),
        notes='Edible oils restock order'
    )
    PurchaseOrderItem.objects.create(
        purchase_order=po2,
        product_id=2,
        product_name='Fortune Sunlite Sunflower Oil 1L Pouch',
        unit_cost=Decimal('132.00'),
        quantity=100,
        tax_rate=Decimal('5.00'),
        received_quantity=100,
        subtotal=Decimal('13200.00')
    )
    PurchaseOrderItem.objects.create(
        purchase_order=po2,
        product_id=16,
        product_name='Fortune Premium Kachi Ghani Mustard Oil 1L',
        unit_cost=Decimal('135.00'),
        quantity=80,
        tax_rate=Decimal('5.00'),
        received_quantity=80,
        subtotal=Decimal('10800.00')
    )
    GoodsReceiptNote.objects.create(
        id=2,
        grn_number='GRN-2026-002',
        purchase_order=po2,
        supplier_id=2,
        received_by='Zeel Patel',
        total_valuation=Decimal('24800.00'),
        notes='Oil cartons verified.'
    )
    SupplierPayment.objects.create(
        id=2,
        supplier_id=2,
        purchase_order=po2,
        amount=Decimal('20000.00'),
        payment_method='BANK_TRANSFER',
        reference_number='HDFC-RTGS-77665544',
        payment_date=today - timedelta(days=7),
        notes='Partial payment made. Remaining ₹4,800 due on Net 15 terms.'
    )

    po3 = PurchaseOrder.objects.create(
        id=3,
        po_number='PO-2026-003',
        supplier_id=4,
        order_date=today - timedelta(days=2),
        expected_delivery=today + timedelta(days=3),
        status='ORDERED',
        total_amount=Decimal('12500.00'),
        paid_amount=Decimal('0.00'),
        notes='Maggi noodles and sauces restock in transit'
    )
    PurchaseOrderItem.objects.create(
        purchase_order=po3,
        product_id=11,
        product_name='Maggi 2-Minute Masala Noodles 280g Pack',
        unit_cost=Decimal('44.00'),
        quantity=200,
        tax_rate=Decimal('12.00'),
        received_quantity=0,
        subtotal=Decimal('8800.00')
    )

    # 10. Expenses
    exp_cats = [
        (1, 'Electricity & Utilities', 'Zap', '#88BDF2'),
        (2, 'Store Rent & Maintenance', 'Home', '#384959'),
        (3, 'Staff Welfare & Tea', 'Coffee', '#6A89A7'),
        (4, 'Marketing & Advertising', 'Smile', '#4CAF50'),
        (5, 'Packaging & Stationary', 'Receipt', '#FF9800'),
    ]
    for ecid, ecname, ecicon, eccolor in exp_cats:
        ExpenseCategory.objects.update_or_create(id=ecid, defaults={'name': ecname, 'icon': ecicon, 'color': eccolor})

    expenses_list = [
        (1, 1, 'UGVCL Electricity Bill August 2026', 6450.00, today - timedelta(days=12), 'BANK_TRANSFER', 'Paid via HDFC Netbanking'),
        (2, 2, 'Supermarket Shop Rent Sector 11 (Aug 2026)', 25000.00, today - timedelta(days=25), 'BANK_TRANSFER', 'Paid to Landlord Ramesh Patel'),
        (3, 3, 'Staff Daily Tea, Snacks & Water', 1850.00, today - timedelta(days=5), 'CASH', 'Gulla Cash expense'),
        (4, 4, 'Tulsi Mart Promotional Pamphlets Printing & Distribution', 3500.00, today - timedelta(days=18), 'UPI', 'Paid via Store GPay UPI'),
        (5, 5, 'Eco-friendly Groceries Carry Bags (500 Pcs)', 4200.00, today - timedelta(days=15), 'UPI', 'Paid to Packaging Wholesaler'),
        (6, 2, 'Air Conditioner Service & Filter Repair', 2200.00, today - timedelta(days=8), 'CASH', 'Technician Service Charges'),
    ]
    for eid, ecid, etitle, eamt, edate, epay, enotes in expenses_list:
        Expense.objects.update_or_create(id=eid, defaults={
            'category_id': ecid,
            'title': etitle,
            'amount': Decimal(str(eamt)),
            'date': edate,
            'payment_method': epay,
            'notes': enotes,
            'created_by': admin_user
        })

    # 11. Offers & Coupons
    Coupon.objects.update_or_create(id=1, defaults={
        'code': 'TULSI10',
        'title': '10% Discount on Supermarket Items',
        'description': 'Flat 10% OFF on total bill above ₹500',
        'offer_type': 'PERCENTAGE',
        'discount_value': Decimal('10.00'),
        'min_order_amount': Decimal('500.00'),
        'max_discount_amount': Decimal('150.00'),
        'valid_from': today - timedelta(days=30),
        'valid_to': today + timedelta(days=60),
        'usage_limit': 500,
        'used_count': 42,
        'is_active': True
    })

    Coupon.objects.update_or_create(id=2, defaults={
        'code': 'WELCOME50',
        'title': 'Welcome Discount for New Customers',
        'description': 'Flat ₹50 OFF on your first purchase above ₹300',
        'offer_type': 'FLAT',
        'discount_value': Decimal('50.00'),
        'min_order_amount': Decimal('300.00'),
        'valid_from': today - timedelta(days=30),
        'valid_to': today + timedelta(days=90),
        'usage_limit': 200,
        'used_count': 18,
        'is_active': True
    })

    Coupon.objects.update_or_create(id=3, defaults={
        'code': 'DIWALI200',
        'title': 'Diwali Festive Shopping Special',
        'description': 'Flat ₹200 OFF on festive grocery shopping above ₹2,000',
        'offer_type': 'FLAT',
        'discount_value': Decimal('200.00'),
        'min_order_amount': Decimal('2000.00'),
        'valid_from': today - timedelta(days=5),
        'valid_to': today + timedelta(days=45),
        'usage_limit': 100,
        'used_count': 7,
        'is_active': True
    })

    FestivalOffer.objects.update_or_create(id=1, defaults={
        'title': 'Diwali Grocery Mahotsav Offer',
        'subtitle': 'Special Supermarket Savings & Festival Hampers',
        'tag_text': 'FESTIVAL SPECIAL',
        'discount_info': 'Flat ₹100 Instant Discount',
        'start_date': today - timedelta(days=5),
        'end_date': today + timedelta(days=30),
        'is_active': True
    })

    FestivalOffer.objects.update_or_create(id=2, defaults={
        'title': 'Super Weekend Grocery Sale',
        'subtitle': 'Unbeatable Discounts on Staples & Beverages',
        'tag_text': 'WEEKEND SPECIAL',
        'discount_info': 'Up to 30% OFF',
        'start_date': today - timedelta(days=2),
        'end_date': today + timedelta(days=2),
        'is_active': True
    })

    # 12. POS Orders & Order Items across last 30 days (Richer sales trends)
    orders_data = [
        # (id, order_no, inv_no, cust_id, cust_name, cust_phone, status, pay_method, pay_status, subtotal, tax, disc, deliv, total, cash_t, chg_r, days_ago)
        (1, 'ORD-20260801-001', 'TM-INV-1001', 1, 'Ramesh Shah', '+91 98980 11223', 'DELIVERED', 'CASH', 'PAID', 638.00, 16.25, 20.00, 0.00, 634.25, 700.00, 65.75, 28),
        (2, 'ORD-20260805-002', 'TM-INV-1002', 2, 'Priya Patel', '+91 98250 44556', 'DELIVERED', 'UPI', 'PAID', 407.00, 22.50, 0.00, 0.00, 429.50, 0.00, 0.00, 24),
        (3, 'ORD-20260810-003', 'TM-INV-1003', 3, 'Amit Sharma', '+91 97120 77889', 'DELIVERED', 'CARD', 'PAID', 1250.00, 45.00, 100.00, 0.00, 1195.00, 0.00, 0.00, 19),
        (4, 'ORD-20260812-004', 'TM-INV-1004', 4, 'Neha Gupta', '+91 99090 33445', 'DELIVERED', 'UPI', 'PAID', 890.00, 35.00, 50.00, 0.00, 875.00, 0.00, 0.00, 17),
        (5, 'ORD-20260815-005', 'TM-INV-1005', 5, 'Vikram Verma', '+91 98760 99887', 'DELIVERED', 'CASH', 'PAID', 1580.00, 72.00, 150.00, 0.00, 1502.00, 2000.00, 498.00, 14),
        (6, 'ORD-20260818-006', 'TM-INV-1006', 6, 'Anjali Mehta', '+91 98241 22334', 'DELIVERED', 'NET_BANKING', 'PAID', 740.00, 28.00, 0.00, 0.00, 768.00, 0.00, 0.00, 11),
        (7, 'ORD-20260820-007', 'TM-INV-1007', 1, 'Ramesh Shah', '+91 98980 11223', 'DELIVERED', 'CASH', 'PAID', 980.00, 42.00, 50.00, 0.00, 972.00, 1000.00, 28.00, 9),
        (8, 'ORD-20260822-008', 'TM-INV-1008', 2, 'Priya Patel', '+91 98250 44556', 'DELIVERED', 'UPI', 'PAID', 1340.00, 65.00, 100.00, 0.00, 1305.00, 0.00, 0.00, 7),
        (9, 'ORD-20260825-009', 'TM-INV-1009', 3, 'Amit Sharma', '+91 97120 77889', 'PROCESSING', 'UPI', 'PAID', 620.00, 24.00, 0.00, 30.00, 674.00, 0.00, 0.00, 4),
        (10, 'ORD-20260827-010', 'TM-INV-1010', 4, 'Neha Gupta', '+91 99090 33445', 'OUT_FOR_DELIVERY', 'COD', 'PENDING', 1150.00, 55.00, 100.00, 40.00, 1145.00, 0.00, 0.00, 2),
        (11, 'ORD-20260828-011', 'TM-INV-1011', 5, 'Vikram Verma', '+91 98760 99887', 'DELIVERED', 'CASH', 'PAID', 530.00, 20.00, 30.00, 0.00, 520.00, 600.00, 80.00, 1),
        (12, 'ORD-20260829-012', 'TM-INV-1012', 6, 'Anjali Mehta', '+91 98241 22334', 'DELIVERED', 'UPI', 'PAID', 2250.00, 110.00, 200.00, 0.00, 2160.00, 0.00, 0.00, 0),
    ]

    for oid, o_num, i_num, cid, c_name, c_phone, o_status, p_meth, p_stat, subt, tax, disc, deliv, tot, cash_t, chg_r, days_ago in orders_data:
        ord_obj, _ = Order.objects.update_or_create(id=oid, defaults={
            'order_number': o_num,
            'invoice_number': i_num,
            'customer_id': cid,
            'customer_name': c_name,
            'customer_phone': c_phone,
            'customer_address': Customer.objects.get(id=cid).address,
            'status': o_status,
            'payment_method': p_meth,
            'payment_status': p_stat,
            'subtotal': Decimal(str(subt)),
            'tax_amount': Decimal(str(tax)),
            'discount_amount': Decimal(str(disc)),
            'delivery_charge': Decimal(str(deliv)),
            'total_amount': Decimal(str(tot)),
            'cash_tendered': Decimal(str(cash_t)),
            'change_returned': Decimal(str(chg_r)),
            'created_by': admin_user
        })

        # Update created_at timestamp for realistic historical charts
        created_dt = now - timedelta(days=days_ago)
        Order.objects.filter(id=oid).update(created_at=created_dt)

        # Create PaymentTransaction record
        PaymentTransaction.objects.update_or_create(id=oid, defaults={
            'order': ord_obj,
            'transaction_id': f'TXN-{p_meth}-{1000 + oid}',
            'amount': Decimal(str(tot)),
            'payment_method': p_meth,
            'status': p_stat if p_stat == 'PAID' else 'PENDING',
            'notes': f'Payment for invoice {i_num}'
        })

    # Order Items matching items
    items_list = [
        # (id, order_id, product_id, pname, sku, price, qty, gst, subt)
        (1, 1, 1, 'Aashirvaad Shuddh Chakki Atta 5kg', 'TM-ATT-001', 245.00, 2, 5.0, 490.00),
        (2, 1, 2, 'Fortune Sunlite Sunflower Oil 1L Pouch', 'TM-OIL-002', 148.00, 1, 5.0, 148.00),
        (3, 2, 4, 'Amul Butter Pasteurised 100g Box', 'TM-BTR-004', 56.00, 2, 0.0, 112.00),
        (4, 2, 8, 'Surf Excel Easy Wash Detergent Powder 1kg', 'TM-DET-008', 135.00, 1, 18.0, 135.00),
        (5, 3, 15, 'Amul Pure Cow Ghee 1L Tin', 'TM-GHE-015', 590.00, 2, 12.0, 1180.00),
        (6, 4, 14, 'Tata Tea Gold Premium Tea 500g Pack', 'TM-TEA-014', 295.00, 2, 5.0, 590.00),
        (7, 4, 11, 'Maggi 2-Minute Masala Noodles 280g Pack', 'TM-MAG-011', 52.00, 4, 12.0, 208.00),
        (8, 5, 17, 'Aashirvaad Select Sharbati Atta 5kg', 'TM-ATT-017', 310.00, 3, 5.0, 930.00),
        (9, 5, 16, 'Fortune Premium Kachi Ghani Mustard Oil 1L', 'TM-OIL-016', 155.00, 3, 5.0, 465.00),
        (10, 6, 12, 'Haldiram\'s Nagpur Bhujia Sev 400g', 'TM-HAL-012', 110.00, 4, 12.0, 440.00),
        (11, 7, 1, 'Aashirvaad Shuddh Chakki Atta 5kg', 'TM-ATT-001', 245.00, 3, 5.0, 735.00),
        (12, 8, 20, 'Surf Excel Matic Front Load Liquid 1L', 'TM-DET-020', 235.00, 4, 18.0, 940.00),
        (13, 9, 24, 'Dabur 100% Pure Honey Squeezy 500g', 'TM-HNY-024', 215.00, 2, 5.0, 430.00),
        (14, 10, 25, 'Haldiram\'s Royal Soan Papdi 500g Box', 'TM-HAL-025', 125.00, 6, 12.0, 750.00),
        (15, 11, 7, 'Britannia Good Day Cashew Biscuits 120g', 'TM-BSC-007', 28.00, 10, 18.0, 280.00),
        (16, 12, 15, 'Amul Pure Cow Ghee 1L Tin', 'TM-GHE-015', 590.00, 3, 12.0, 1770.00),
    ]

    for item_id, oid, pid, pname, psku, pprice, pqty, pgst, psubt in items_list:
        OrderItem.objects.update_or_create(id=item_id, defaults={
            'order_id': oid,
            'product_id': pid,
            'product_name': pname,
            'sku': psku,
            'unit_price': Decimal(str(pprice)),
            'quantity': pqty,
            'gst_percent': Decimal(str(pgst)),
            'subtotal': Decimal(str(psubt))
        })

    # 13. Cash Register Entries (Gulla Register)
    CashRegisterEntry.objects.create(
        entry_type='OPENING_FLOAT',
        amount=Decimal('5000.00'),
        notes='Daily morning opening float cash in Gulla register',
        created_by_name='Zeel Patel (Admin)'
    )
    CashRegisterEntry.objects.create(
        entry_type='BILL_SALE',
        amount=Decimal('634.25'),
        reference_id='ORD-20260801-001',
        notes='POS bill cash collection',
        created_by_name='Rahul Sharma (Cashier)'
    )
    CashRegisterEntry.objects.create(
        entry_type='EXPENSE',
        amount=Decimal('1850.00'),
        reference_id='EXP-003',
        notes='Staff daily snacks & tea paid from cash register',
        created_by_name='Rahul Sharma (Cashier)'
    )

    # 14. Bank Transactions
    BankTransaction.objects.create(
        transaction_type='DEPOSIT',
        amount=Decimal('50000.00'),
        reference_number='DEP-HDFC-001',
        bank_name='HDFC Store Primary Bank',
        notes='Initial store operational capital deposit',
        created_by_name='Zeel Patel (Admin)'
    )
    BankTransaction.objects.create(
        transaction_type='UPI_IN',
        amount=Decimal('2160.00'),
        reference_number='UPI-HDFC-99882211',
        bank_name='HDFC Store Primary Bank',
        notes='Customer UPI payment received for ORD-20260829-012',
        created_by_name='POS Counter'
    )
    BankTransaction.objects.create(
        transaction_type='SUPPLIER_PAYOUT',
        amount=Decimal('15400.00'),
        reference_number='HDFC-NEFT-99881122',
        bank_name='HDFC Store Primary Bank',
        notes='Supplier payment cleared for Amul Dairy PO-2026-001',
        created_by_name='Zeel Patel (Admin)'
    )

    # 15. Home Cash Transactions (Vault)
    HomeCashTransaction.objects.create(
        entry_type='DEPOSIT',
        amount=Decimal('25000.00'),
        notes='Initial reserve cash kept in store home safe vault',
        created_by_name='Zeel Patel',
        balance_after=Decimal('25000.00')
    )
    HomeCashTransaction.objects.create(
        entry_type='SWEEP',
        amount=Decimal('10000.00'),
        notes='End of week Gulla excess cash transfer to home safe vault',
        created_by_name='Zeel Patel',
        balance_after=Decimal('35000.00')
    )

    # 16. Activity Logs
    logs_data = [
        ('Admin', 'LOGIN', 'Core Auth', 'Admin Zeel Patel logged in successfully'),
        ('Cashier', 'POS_BILL', 'Orders', 'Created POS Order ORD-20260829-012 for ₹2,160.00'),
        ('Admin', 'STOCK_UPDATE', 'Inventory', 'Updated stock quantity for Aashirvaad Chakki Atta 5kg (+10 kg)'),
        ('Admin', 'SUPPLIER_PO', 'Procurement', 'Created Purchase Order PO-2026-003 for Nestlé India Wholesale'),
        ('Admin', 'EXPENSE_ADD', 'Expenses', 'Added new expense UGVCL Electricity Bill for ₹6,450.00'),
    ]
    for u_name, act, mod, det in logs_data:
        ActivityLog.objects.create(
            user_name=u_name,
            action=act,
            module=mod,
            details=det
        )

    print("[SUCCESS] Tulsi Mart Database Demo Data Seeding Complete!")

if __name__ == '__main__':
    seed_data()
