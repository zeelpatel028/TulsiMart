import os
import sys
import django
from datetime import datetime, date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tulsimart_backend.settings')
django.setup()

from django.db import connection
from core.models import StoreSetting, LoginAccount, Staff
from inventory.models import Category, Brand, Unit, Product, StockMovement
from orders.models import Order, OrderItem, PaymentTransaction
from customers.models import Customer, CustomerFeedback
from suppliers.models import Supplier, PurchaseOrder
from expenses.models import ExpenseCategory, Expense
from offers.models import Coupon, FestivalOffer

def seed_data():
    print("[Starting] Tulsi Mart Database Data Seeding...")

    # Disable foreign key checks for clean seeding
    with connection.cursor() as cursor:
        cursor.execute('PRAGMA foreign_keys = OFF;')

    # Clear existing SQLite rows first
    models_to_clear = [OrderItem, PaymentTransaction, StockMovement, Order, Product, Category, Brand, Unit, CustomerFeedback, Customer, PurchaseOrder, Supplier, Expense, ExpenseCategory, Coupon, FestivalOffer, Staff, LoginAccount, StoreSetting]
    for m in models_to_clear:
        try:
            m.objects.all().delete()
        except Exception:
            pass

    # 1. Store Setting
    setting, _ = StoreSetting.objects.update_or_create(id=1, defaults={
        'store_name': 'Tulsi Mart Supermarket',
        'tagline': 'Supermarket & Grocery Management System',
        'address': 'Plot No. 45, Main Market Road, Sector 11, Gandhinagar',
        'city': 'Gandhinagar',
        'state': 'Gujarat',
        'country': 'India',
        'pincode': '382011',
        'phone': '+91 98790 12345',
        'email': 'contact@tulsimart.com',
        'gst_number': '24AABCT1234F1Z5',
        'pan_number': 'AABCT1234F',
        'currency_symbol': '₹',
        'bank_name': 'HDFC Bank',
        'account_number': '50200012345678',
        'ifsc_code': 'HDFC0000123',
        'upi_id': 'tulsimart@hdfcbank',
        'security_require_otp': True,
    })

    # 1.5 Django Auth Users for FK relations
    from django.contrib.auth.models import User
    User.objects.get_or_create(id=1, defaults={'username': 'admin', 'email': 'zeelptl028@gmail.com', 'first_name': 'Zeel Patel', 'is_staff': True, 'is_superuser': True})
    User.objects.get_or_create(id=2, defaults={'username': 'cashier', 'email': 'cashier@tulsimart.com', 'first_name': 'Rahul Sharma', 'is_staff': True})

    # 2. Login Accounts
    admin_acc, _ = LoginAccount.objects.update_or_create(id=1, defaults={
        'username': 'admin',
        'password': 'password123',
        'full_name': 'Zeel Patel (Admin)',
        'email': 'zeelptl028@gmail.com',
        'role': 'ADMIN',
        'require_otp': True,
        'is_active': True
    })

    cashier_acc, _ = LoginAccount.objects.update_or_create(id=2, defaults={
        'username': 'cashier',
        'password': 'password123',
        'full_name': 'Rahul Sharma (Cashier)',
        'email': 'cashier@tulsimart.com',
        'role': 'CASHIER',
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
        (1, 'Atta, Rice & Dal', 'Wheat', 'Flour, Basmati Rice, Toor Dal, Chana Dal'),
        (2, 'Oil, Ghee & Spices', 'Flame', 'Edible Oil, Cow Ghee, Garam Masala, Turmeric'),
        (3, 'Dairy, Milk & Bakery', 'Milk', 'Fresh Milk, Butter, Cheese, Bread, Paneer'),
        (4, 'Snacks & Biscuits', 'Cookie', 'Namkeen, Chips, Biscuits, Chocolates'),
        (5, 'Beverages & Drinks', 'Coffee', 'Tea, Coffee, Soft Drinks, Fruit Juices'),
        (6, 'Personal Care & Hygiene', 'Smile', 'Soaps, Shampoos, Toothpaste, Handwash'),
        (7, 'Household & Cleaning', 'Home', 'Detergent, Floor Cleaner, Dishwash Liquid'),
    ]
    for cid, cname, cicon, cdesc in categories_data:
        Category.objects.update_or_create(id=cid, defaults={'name': cname, 'icon': cicon, 'description': cdesc, 'is_active': True})

    # 6. Brands
    brands_data = [
        (1, 'Amul', 'The Taste of India'),
        (2, 'Aashirvaad', 'ITC Quality Food Products'),
        (3, 'Fortune', 'Adani Wilmar Edible Oils'),
        (4, 'Tata', 'Tata Salt & Tea Products'),
        (5, 'Everest', 'Everest Spices & Masala'),
        (6, 'Mother Dairy', 'Fresh Dairy & Ice Creams'),
        (7, 'Britannia', 'Biscuits & Bakery Products'),
        (8, 'Surf Excel', 'Hindustan Unilever Detergents'),
        (9, 'Colgate', 'Oral Care Hygiene Products'),
    ]
    for bid, bname, bdesc in brands_data:
        Brand.objects.update_or_create(id=bid, defaults={'name': bname, 'description': bdesc, 'is_active': True})

    # 7. Products
    products_list = [
        (1, 'Aashirvaad Shuddh Chakki Atta 5kg', 'TM-ATT-001', '8901058000011', 1, 2, 5, 275.0, 245.0, 220.0, 5.0, 15, 5),
        (2, 'Fortune Sunlite Sunflower Oil 1L Pouch', 'TM-OIL-002', '8906007280022', 2, 3, 3, 165.0, 148.0, 132.0, 5.0, 24, 8),
        (3, 'Amul Taaza Toned Milk 500ml Pouch', 'TM-MLK-003', '8901262010033', 3, 1, 4, 27.0, 27.0, 24.5, 0.0, 40, 10),
        (4, 'Amul Butter Pasteurised 100g Box', 'TM-BTR-004', '8901262020044', 3, 1, 7, 58.0, 56.0, 50.0, 0.0, 30, 8),
        (5, 'Everest Garam Masala 100g Box', 'TM-SPC-005', '8901786000055', 2, 5, 2, 85.0, 78.0, 68.0, 5.0, 20, 5),
        (6, 'Tata Salt Vacuum Evaporated 1kg', 'TM-SLT-006', '8901058030066', 2, 4, 1, 28.0, 28.0, 24.0, 0.0, 50, 15),
        (7, 'Britannia Good Day Cashew Biscuits 120g', 'TM-BSC-007', '8901063000077', 4, 7, 5, 30.0, 28.0, 23.0, 18.0, 35, 10),
        (8, 'Surf Excel Easy Wash Detergent Powder 1kg', 'TM-DET-008', '8901030000088', 7, 8, 1, 145.0, 135.0, 115.0, 18.0, 18, 5),
        (9, 'Colgate Strong Teeth Toothpaste 150g', 'TM-TP-009', '8901314000099', 6, 9, 2, 98.0, 89.0, 75.0, 18.0, 25, 6),
        (10, 'Mother Dairy Fresh Paneer 200g Pack', 'TM-PNR-010', '8901262050100', 3, 6, 5, 95.0, 90.0, 78.0, 0.0, 12, 4),
    ]

    for pid, pname, psku, pbar, cid, bid, uid, mrp, sp, cp, gst, qty, alert in products_list:
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
            'is_active': True
        })

    # 8. Customers
    customers_list = [
        (1, 'Ramesh Shah', '+91 98980 11223', 'ramesh@gmail.com', 'Plot 12, Sector 21, Gandhinagar'),
        (2, 'Priya Patel', '+91 98250 44556', 'priya@gmail.com', 'Flat 402, Shivalik Heights, Ahmedabad'),
        (3, 'Amit Sharma', '+91 97120 77889', 'amit@gmail.com', 'House 88, Green Park Society, Gandhinagar'),
    ]
    for cust_id, cname, cphone, cemail, caddr in customers_list:
        Customer.objects.update_or_create(id=cust_id, defaults={
            'name': cname,
            'phone': cphone,
            'email': cemail,
            'address': caddr,
            'status': 'ACTIVE'
        })

    # 9. Suppliers
    suppliers_list = [
        (1, 'Amul Gujarat Co-op Milk Federation', 'Amul Depot Anand', '+91 98240 10001', 'amul.supply@amul.coop', 'Anand Dairy Campus, Anand'),
        (2, 'Fortune Adani Wilmar Depot', 'Fortune Depot Ahmedabad', '+91 98240 10002', 'orders@adaniwilmar.com', 'Mithakhali, Ahmedabad'),
        (3, 'Tata Consumer Products Distributor', 'Tata Consumer Dist', '+91 98240 10003', 'tata.dist@gmail.com', 'GIDC Sector 28, Gandhinagar'),
    ]
    for sid, sname, scompany, sphone, semail, saddr in suppliers_list:
        Supplier.objects.update_or_create(id=sid, defaults={
            'name': sname,
            'company_name': scompany,
            'phone': sphone,
            'email': semail,
            'address': saddr,
            'is_active': True
        })

    # 10. Expenses
    exp_cats = [
        (1, 'Electricity & Utilities', 'Zap', '#88BDF2'),
        (2, 'Store Rent & Maintenance', 'Home', '#384959'),
        (3, 'Staff Welfare & Tea', 'Coffee', '#6A89A7'),
    ]
    for ecid, ecname, ecicon, eccolor in exp_cats:
        ExpenseCategory.objects.update_or_create(id=ecid, defaults={'name': ecname, 'icon': ecicon, 'color': eccolor})

    Expense.objects.update_or_create(id=1, defaults={
        'category_id': 1,
        'title': 'UGVCL Electricity Bill August 2026',
        'amount': Decimal('6450.00'),
        'payment_method': 'BANK_TRANSFER',
        'date': date.today(),
        'notes': 'Paid via HDFC Netbanking'
    })

    # 11. Offers & Coupons
    Coupon.objects.update_or_create(id=1, defaults={
        'code': 'TULSI10',
        'title': '10% Discount on Supermarket Items',
        'description': 'Flat 10% OFF on bill above ₹500',
        'offer_type': 'PERCENTAGE',
        'discount_value': Decimal('10.00'),
        'min_order_amount': Decimal('500.00'),
        'valid_from': date.today(),
        'valid_to': date.today() + timedelta(days=60),
        'is_active': True
    })

    FestivalOffer.objects.update_or_create(id=1, defaults={
        'title': 'Diwali Grocery Mahotsav Offer',
        'subtitle': 'Special Supermarket Savings',
        'tag_text': 'FESTIVAL SPECIAL',
        'discount_info': 'Flat ₹100 Instant Discount',
        'start_date': date.today(),
        'end_date': date.today() + timedelta(days=30),
        'is_active': True
    })

    # 12. POS Orders & Order Items
    ord1, _ = Order.objects.update_or_create(id=1, defaults={
        'order_number': 'ORD-20260827-001',
        'invoice_number': 'TM-INV-1001',
        'customer_id': 1,
        'customer_name': 'Ramesh Shah',
        'customer_phone': '+91 98980 11223',
        'customer_address': 'Plot 12, Sector 21, Gandhinagar',
        'status': 'DELIVERED',
        'payment_method': 'CASH',
        'payment_status': 'PAID',
        'subtotal': Decimal('638.00'),
        'tax_amount': Decimal('16.25'),
        'discount_amount': Decimal('20.00'),
        'delivery_charge': Decimal('0.00'),
        'total_amount': Decimal('634.25'),
        'cash_tendered': Decimal('700.00'),
        'change_returned': Decimal('65.75'),
        'created_by_id': 1
    })

    OrderItem.objects.update_or_create(id=1, defaults={
        'order': ord1,
        'product_id': 1,
        'product_name': 'Aashirvaad Shuddh Chakki Atta 5kg',
        'sku': 'TM-ATT-001',
        'unit_price': Decimal('245.00'),
        'quantity': 2,
        'gst_percent': Decimal('5.00'),
        'subtotal': Decimal('490.00')
    })

    OrderItem.objects.update_or_create(id=2, defaults={
        'order': ord1,
        'product_id': 2,
        'product_name': 'Fortune Sunlite Sunflower Oil 1L Pouch',
        'sku': 'TM-OIL-002',
        'unit_price': Decimal('148.00'),
        'quantity': 1,
        'gst_percent': Decimal('5.00'),
        'subtotal': Decimal('148.00')
    })

    PaymentTransaction.objects.update_or_create(id=1, defaults={
        'order': ord1,
        'payment_method': 'CASH',
        'amount': Decimal('634.25'),
        'status': 'SUCCESS',
        'transaction_id': 'TXN-CASH-1001'
    })

    ord2, _ = Order.objects.update_or_create(id=2, defaults={
        'order_number': 'ORD-20260827-002',
        'invoice_number': 'TM-INV-1002',
        'customer_id': 2,
        'customer_name': 'Priya Patel',
        'customer_phone': '+91 98250 44556',
        'customer_address': 'Flat 402, Shivalik Heights, Ahmedabad',
        'status': 'DELIVERED',
        'payment_method': 'UPI',
        'payment_status': 'PAID',
        'subtotal': Decimal('407.00'),
        'tax_amount': Decimal('22.50'),
        'discount_amount': Decimal('0.00'),
        'delivery_charge': Decimal('0.00'),
        'total_amount': Decimal('429.50'),
        'created_by_id': 2
    })

    OrderItem.objects.update_or_create(id=3, defaults={
        'order': ord2,
        'product_id': 4,
        'product_name': 'Amul Butter Pasteurised 100g Box',
        'sku': 'TM-BTR-004',
        'unit_price': Decimal('56.00'),
        'quantity': 2,
        'gst_percent': Decimal('0.00'),
        'subtotal': Decimal('112.00')
    })

    OrderItem.objects.update_or_create(id=4, defaults={
        'order': ord2,
        'product_id': 8,
        'product_name': 'Surf Excel Easy Wash Detergent Powder 1kg',
        'sku': 'TM-DET-008',
        'unit_price': Decimal('135.00'),
        'quantity': 1,
        'gst_percent': Decimal('18.00'),
        'subtotal': Decimal('135.00')
    })

    PaymentTransaction.objects.update_or_create(id=2, defaults={
        'order': ord2,
        'payment_method': 'UPI',
        'amount': Decimal('429.50'),
        'status': 'SUCCESS',
        'transaction_id': 'UPI-HDFC-99882211'
    })

    print("[SUCCESS] Tulsi Mart Database Seeding Complete!")

if __name__ == '__main__':
    seed_data()
