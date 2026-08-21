import os
import random
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model

from core.models import StoreSetting, CashRegisterEntry, BankTransaction, ActivityLog
from inventory.models import Category, Brand, Unit, Product, StockMovement
from customers.models import Customer, CustomerFeedback
from suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from orders.models import Order, OrderItem, PaymentTransaction
from expenses.models import ExpenseCategory, Expense
from offers.models import Coupon, FestivalOffer

User = get_user_model()

def seed_database():
    print("--- Seeding Tulsi Mart Store Data ---")

    # 1. Update Store Settings
    store_setting = StoreSetting.get_settings()
    store_setting.store_name = "Tulsi Super Mart"
    store_setting.tagline = "Fresh Groceries, Spices & Daily Needs"
    store_setting.phone = "+91 98250 12345"
    store_setting.email = "contact@tulsimart.com"
    store_setting.address = "Shop No. 4-6, Ground Floor, Tulsi Complex, Station Road, Ahmedabad, GJ - 380001"
    store_setting.gstin = "24AABCT9876F1Z5"
    store_setting.currency_symbol = "₹"
    store_setting.invoice_prefix = "TM-INV-"
    store_setting.tax_percentage_default = Decimal('5.00')
    store_setting.delivery_charge_flat = Decimal('30.00')
    store_setting.free_delivery_above = Decimal('500.00')
    store_setting.low_stock_threshold_default = 10
    store_setting.home_cash_amount = Decimal('45000.00')
    store_setting.save()
    print("[OK] Store settings configured.")

    # 2. Seed Users / Staff
    users_data = [
        {'username': 'admin', 'email': 'admin@tulsimart.com', 'role': 'STORE_OWNER', 'first_name': 'Rajesh', 'last_name': 'Patel', 'phone': '+91 98250 11111', 'salary': 60000},
        {'username': 'manager1', 'email': 'manager@tulsimart.com', 'role': 'STORE_MANAGER', 'first_name': 'Ketan', 'last_name': 'Shah', 'phone': '+91 98250 22222', 'salary': 35000},
        {'username': 'cashier1', 'email': 'cashier1@tulsimart.com', 'role': 'CASHIER', 'first_name': 'Pooja', 'last_name': 'Joshi', 'phone': '+91 98250 33333', 'salary': 18000},
        {'username': 'delivery1', 'email': 'delivery1@tulsimart.com', 'role': 'DELIVERY', 'first_name': 'Ramesh', 'last_name': 'Rathod', 'phone': '+91 98250 44444', 'salary': 15000},
    ]
    created_users = {}
    for udata in users_data:
        user, created = User.objects.get_or_create(
            username=udata['username'],
            defaults={
                'email': udata['email'],
                'role': udata['role'],
                'first_name': udata['first_name'],
                'last_name': udata['last_name'],
                'phone': udata['phone'],
                'salary': Decimal(str(udata['salary'])),
                'is_staff': True if udata['role'] in ['STORE_OWNER', 'STORE_MANAGER'] else False,
                'is_superuser': True if udata['role'] == 'STORE_OWNER' else False
            }
        )
        if created or not user.check_password('password123'):
            user.set_password('password123')
            user.save()
        created_users[udata['username']] = user
    print(f"[OK] Staff Users created ({len(created_users)} users). Default password: password123")

    # 3. Seed Units
    units_data = [
        ('Kilogram', 'kg'),
        ('Gram', 'g'),
        ('Litre', 'L'),
        ('Millilitre', 'ml'),
        ('Packet', 'pkt'),
        ('Piece', 'pc'),
        ('Box', 'box'),
    ]
    created_units = {}
    for name, short in units_data:
        u, _ = Unit.objects.get_or_create(name=name, defaults={'short_name': short})
        created_units[short] = u
    print("[OK] Units seeded.")

    # 4. Seed Brands
    brands_list = [
        'Amul', 'Fortune', 'Aashirvaad', 'Tata Sampann', 'Surf Excel', 
        'Maggi', 'Dabur', 'Parle', 'Britannia', 'Cadbury', 'Everest', 'Patanjali'
    ]
    created_brands = {}
    for bname in brands_list:
        b, _ = Brand.objects.get_or_create(name=bname, defaults={'description': f'Premium quality products by {bname}'})
        created_brands[bname] = b
    print("[OK] Brands seeded.")

    # 5. Seed Categories
    categories_data = [
        ('Dairy & Bakery', 'Milk, Butter, Cheese, Bread & Bakery Products', 'Coffee'),
        ('Atta, Rice & Dal', 'Flour, Basmati Rice, Toor Dal, Chana Dal', 'Wheat'),
        ('Edible Oils & Spices', 'Cooking Oil, Ghee, Spices, Salt & Sugar', 'Flame'),
        ('Snacks & Instant Food', 'Biscuits, Wafers, Maggi Noodles, Chocolates', 'Cookie'),
        ('Beverages & Tea', 'Tea Powder, Coffee, Soft Drinks, Juices', 'CupSoda'),
        ('Personal Care & Hygiene', 'Soaps, Shampoos, Toothpaste, Handwash', 'Sparkles'),
        ('Household & Cleaning', 'Detergent, Floor Cleaners, Dishwash', 'Home'),
    ]
    created_categories = {}
    for cname, cdesc, cicon in categories_data:
        c, _ = Category.objects.get_or_create(name=cname, defaults={'description': cdesc, 'icon': cicon})
        created_categories[cname] = c
    print("[OK] Categories seeded.")

    # 6. Seed Products
    products_data = [
        # (name, cat, brand, unit, mrp, selling, cost, stock, min_alert, expiry_days, barcode)
        ("Amul Taaza Toned Milk 500ml", "Dairy & Bakery", "Amul", "pkt", 27.00, 27.00, 24.50, 45, 10, 2, "8901262010011"),
        ("Amul Butter 500g Pack", "Dairy & Bakery", "Amul", "pkt", 275.00, 260.00, 235.00, 28, 5, 60, "8901262020022"),
        ("Amul Malai Paneer 200g", "Dairy & Bakery", "Amul", "pkt", 95.00, 90.00, 78.00, 18, 5, 10, "8901262030033"),
        ("Aashirvaad Shudh Chakki Atta 10kg", "Atta, Rice & Dal", "Aashirvaad", "pkt", 440.00, 410.00, 370.00, 35, 8, 120, "8901058000010"),
        ("Fortune Sunlite Sunflower Oil 1L", "Edible Oils & Spices", "Fortune", "L", 165.00, 148.00, 132.00, 50, 10, 180, "8906007280015"),
        ("Tata Salt Vacuum Evaporated 1kg", "Edible Oils & Spices", "Tata Sampann", "pkt", 28.00, 26.00, 22.00, 80, 15, 365, "8901058010020"),
        ("Tata Sampann Toor Dal Unpolished 1kg", "Atta, Rice & Dal", "Tata Sampann", "kg", 185.00, 168.00, 145.00, 24, 6, 150, "8901058020030"),
        ("Fortune Everyday Basmati Rice 5kg", "Atta, Rice & Dal", "Fortune", "pkt", 499.00, 450.00, 395.00, 15, 5, 240, "8906007280022"),
        ("Maggi 2-Minute Masala Noodles 280g", "Snacks & Instant Food", "Maggi", "pkt", 56.00, 52.00, 44.00, 60, 12, 180, "8901058030040"),
        ("Parle-G Gold Biscuits 1kg Family Pack", "Snacks & Instant Food", "Parle", "pkt", 140.00, 125.00, 105.00, 40, 10, 120, "8901030000011"),
        ("Britannia Good Day Butter Biscuits 600g", "Snacks & Instant Food", "Britannia", "pkt", 120.00, 108.00, 92.00, 32, 8, 120, "8901067000022"),
        ("Cadbury Dairy Milk Silk 150g", "Snacks & Instant Food", "Cadbury", "pc", 175.00, 160.00, 138.00, 22, 5, 180, "8901233000033"),
        ("Wagh Bakri Premium Tea Leaf 1kg", "Beverages & Tea", "Everest", "pkt", 580.00, 540.00, 480.00, 18, 5, 365, "8901234000044"),
        ("Everest Tikhalal Red Chilli Powder 200g", "Edible Oils & Spices", "Everest", "pkt", 98.00, 90.00, 76.00, 30, 8, 180, "8901235000055"),
        ("Everest Garam Masala 100g", "Edible Oils & Spices", "Everest", "pkt", 82.00, 75.00, 62.00, 25, 6, 180, "8901236000066"),
        ("Surf Excel Easy Wash Detergent Powder 1kg", "Household & Cleaning", "Surf Excel", "pkt", 155.00, 142.00, 120.00, 42, 10, 365, "8901030010022"),
        ("Vim Dishwash Liquid Gel 500ml", "Household & Cleaning", "Surf Excel", "L", 125.00, 112.00, 94.00, 36, 8, 365, "8901030020033"),
        ("Dabur Red Ayurvedic Toothpaste 300g", "Personal Care & Hygiene", "Dabur", "pkt", 145.00, 130.00, 110.00, 28, 6, 365, "8901207000011"),
        ("Patanjali Honey 500g Glass Jar", "Personal Care & Hygiene", "Patanjali", "pc", 220.00, 198.00, 165.00, 14, 4, 365, "8904109000022"),
        ("Amul Pure Ghee 1L Tin Pack", "Edible Oils & Spices", "Amul", "L", 650.00, 615.00, 550.00, 4, 8, 240, "8901262040044"), # Low stock item (4 <= min_alert 8)
        ("Mother Dairy Fresh Dahi 400g Pouch", "Dairy & Bakery", "Amul", "pkt", 35.00, 35.00, 30.00, 2, 6, 1, "8901262050055"), # Low stock item (2 <= min_alert 6)
    ]

    created_products = []
    today = timezone.now().date()

    for item in products_data:
        pname, cname, bname, ushort, mrp, selling, cost, stock, min_alert, expiry_days, bcode = item
        cat_obj = created_categories.get(cname)
        brand_obj = created_brands.get(bname)
        unit_obj = created_units.get(ushort)
        
        p, created = Product.objects.get_or_create(
            barcode=bcode,
            defaults={
                'name': pname,
                'category': cat_obj,
                'brand': brand_obj,
                'unit': unit_obj,
                'mrp': Decimal(str(mrp)),
                'selling_price': Decimal(str(selling)),
                'cost_price': Decimal(str(cost)),
                'discount_percent': Decimal(str(round(((mrp - selling) / mrp) * 100, 2))) if mrp > selling else Decimal('0.00'),
                'gst_percent': Decimal('5.00'),
                'stock_quantity': stock,
                'min_stock_alert': min_alert,
                'expiry_date': today + timedelta(days=expiry_days),
                'batch_number': f"BATCH-{random.randint(100, 999)}",
                'is_featured': True if stock > 20 else False
            }
        )
        created_products.append(p)
    print(f"[OK] Products seeded ({len(created_products)} products with live stock & low-stock alerts).")

    # 7. Seed Customers (including Khata Udhari Customers)
    customers_data = [
        ("Patel Ramesh Bhai", "+91 98790 12345", "ramesh.patel@gmail.com", "B-201, Shanti Heights, Satellite", "Ahmedabad", "ACTIVE", "Regular wholesale buyer, Khata trusted customer"),
        ("Sonalben Mehta", "+91 98790 23456", "sonal.mehta@yahoo.com", "A-12, Green Park Society, Bodakdev", "Ahmedabad", "ACTIVE", "Daily milk and dairy buyer"),
        ("Jignesh Kumar Shah", "+91 98790 34567", "jignesh.shah@hotmail.com", "15, Royal Bungalows, SG Highway", "Ahmedabad", "ACTIVE", "Monthly ration buyer"),
        ("Priya Sharma", "+91 98790 45678", "priya.sharma@gmail.com", "C-404, Maple Tree Apartments, Thaltej", "Ahmedabad", "ACTIVE", "Prefers UPI payments"),
        ("Amit Verma", "+91 98790 56789", "amit.verma@outlook.com", "Plot 88, Sector 1, Gandhinagar", "Gandhinagar", "ACTIVE", "Online / WhatsApp ordering"),
        ("Sunil Joshi", "+91 98790 67890", "sunil.joshi@gmail.com", "House 45, Swastik Cross Road, Navrangpura", "Ahmedabad", "ACTIVE", "Khata udhar customer"),
        ("Kavita Trivedi", "+91 98790 78901", "kavita.t@gmail.com", "D-102, Sun Real Homes, Prahlad Nagar", "Ahmedabad", "ACTIVE", "Snacks & organic items buyer"),
        ("Deepak Bhai Vora", "+91 98790 89012", "deepak.vora@gmail.com", "Shop 2, Vora Provision, Ellisbridge", "Ahmedabad", "ACTIVE", "Retail shop buyer"),
    ]

    created_customers = []
    for cdata in customers_data:
        name, phone, email, addr, city, status, notes = cdata
        cust, _ = Customer.objects.get_or_create(
            phone=phone,
            defaults={
                'name': name,
                'email': email,
                'address': addr,
                'city': city,
                'status': status,
                'notes': notes
            }
        )
        created_customers.append(cust)
    print(f"[OK] Customers seeded ({len(created_customers)} customers).")

    # Seed Customer Feedback
    for i, cust in enumerate(created_customers[:4]):
        CustomerFeedback.objects.get_or_create(
            customer=cust,
            defaults={
                'rating': 5 if i % 2 == 0 else 4,
                'comment': 'Always fresh goods and excellent quick delivery!' if i % 2 == 0 else 'Great staff behavior and fair pricing.',
                'order_ref': f'TM-INV-100{i+1}'
            }
        )

    # 8. Seed Suppliers
    suppliers_data = [
        ("Amul Dairy Federation", "Gujarat Co-op Milk Marketing Fed", "+91 79 2658 0000", "amul@dairy.coop", "24AAAAA0000A1Z1", "Anand Dairy Campus, Anand", "Dairy & Milk", "Net 7", 250000.00),
        ("Fortune Agro Supplies", "Adani Wilmar Limited", "+91 79 2555 1111", "sales@adaniwilmar.in", "24AABCA1234F1Z9", "Fortune House, SG Highway, Ahmedabad", "Edible Oils & Grains", "Net 15", 500000.00),
        ("Aashirvaad ITC Wholesale", "ITC Limited Spices & Atta Div", "+91 79 2666 2222", "wholesalediv@itc.in", "24AAACI5678G1Z2", "ITC Centre, CG Road, Ahmedabad", "Atta & Staples", "Net 30", 400000.00),
        ("Hindustan Unilever Distributor", "HUL Consumer Goods Agency", "+91 79 2777 3333", "hul.orders@distributor.com", "24AAACH9012H1Z5", "GIDC Estate, Naroda, Ahmedabad", "Household & Soaps", "Net 15", 300000.00),
        ("Nestle & Parle Wholesale Agency", "Gujarat Food Distributors", "+91 79 2888 4444", "orders@gujaratfooddist.com", "24AAACG3456K1Z8", "Aslali Logistics Park, Ahmedabad", "Snacks & Chocolates", "Net 7", 200000.00),
    ]

    created_suppliers = []
    for sdata in suppliers_data:
        sname, ccompany, sphone, semail, sgstin, saddr, scats, sterms, climit = sdata
        supp, _ = Supplier.objects.get_or_create(
            name=sname,
            defaults={
                'company_name': ccompany,
                'phone': sphone,
                'email': semail,
                'gstin': sgstin,
                'address': saddr,
                'category': scats,
                'payment_terms': sterms,
                'credit_limit': Decimal(str(climit)),
                'bank_details': f"HDFC Bank A/C: 5020001234{random.randint(100,999)} | IFSC: HDFC0000012"
            }
        )
        created_suppliers.append(supp)
    print(f"[OK] Suppliers seeded ({len(created_suppliers)} suppliers).")

    # 9. Seed Purchase Orders & Goods Receipts
    po1, _ = PurchaseOrder.objects.get_or_create(
        po_number="PO-2026-001",
        defaults={
            'supplier': created_suppliers[0], # Amul
            'order_date': today - timedelta(days=5),
            'expected_delivery': today - timedelta(days=3),
            'received_date': today - timedelta(days=3),
            'status': 'RECEIVED',
            'total_amount': Decimal('15400.00'),
            'paid_amount': Decimal('15400.00'),
            'notes': 'Weekly fresh milk and butter supply'
        }
    )
    if po1.items.count() == 0:
        PurchaseOrderItem.objects.create(purchase_order=po1, product=created_products[0], product_name=created_products[0].name, unit_cost=Decimal('24.50'), quantity=200, subtotal=Decimal('4900.00'))
        PurchaseOrderItem.objects.create(purchase_order=po1, product=created_products[1], product_name=created_products[1].name, unit_cost=Decimal('235.00'), quantity=40, subtotal=Decimal('9400.00'))
        GoodsReceiptNote.objects.create(grn_number="GRN-2026-001", purchase_order=po1, supplier=created_suppliers[0], total_valuation=Decimal('15400.00'), received_by="Ketan Shah")
        SupplierPayment.objects.create(supplier=created_suppliers[0], purchase_order=po1, amount=Decimal('15400.00'), payment_method='BANK_TRANSFER', reference_number='NEFT-HDFC-991238', payment_date=today - timedelta(days=3), notes='Full payment via HDFC NetBanking')

    po2, _ = PurchaseOrder.objects.get_or_create(
        po_number="PO-2026-002",
        defaults={
            'supplier': created_suppliers[1], # Fortune
            'order_date': today - timedelta(days=2),
            'expected_delivery': today + timedelta(days=1),
            'status': 'ORDERED',
            'total_amount': Decimal('28500.00'),
            'paid_amount': Decimal('10000.00'),
            'notes': 'Advance paid for oil stock'
        }
    )
    if po2.items.count() == 0:
        PurchaseOrderItem.objects.create(purchase_order=po2, product=created_products[4], product_name=created_products[4].name, unit_cost=Decimal('132.00'), quantity=150, subtotal=Decimal('19800.00'))
        PurchaseOrderItem.objects.create(purchase_order=po2, product=created_products[7], product_name=created_products[7].name, unit_cost=Decimal('395.00'), quantity=22, subtotal=Decimal('8690.00'))
        SupplierPayment.objects.create(supplier=created_suppliers[1], purchase_order=po2, amount=Decimal('10000.00'), payment_method='UPI', reference_number='UPI-FORTUNE-88712', payment_date=today - timedelta(days=2), notes='50% Advance via PhonePe UPI')

    print("[OK] Purchase Orders & Supplier Payments seeded.")

    # 10. Seed Expense Categories & Store Expenses
    exp_cats_data = [
        ('Store Rent & Maintenance', 'Building', '#e74c3c'),
        ('Electricity & Utilities', 'Zap', '#f1c40f'),
        ('Staff Salaries & Wages', 'UserCheck', '#2ecc71'),
        ('Transportation & Delivery', 'Truck', '#3498db'),
        ('Tea & Refreshments', 'Coffee', '#e67e22'),
        ('Packaging & Polythene Bags', 'Package', '#9b59b6'),
    ]
    created_exp_cats = {}
    for cname, cicon, ccol in exp_cats_data:
        ec, _ = ExpenseCategory.objects.get_or_create(name=cname, defaults={'icon': cicon, 'color': ccol})
        created_exp_cats[cname] = ec

    expenses_list = [
        ("Store Shop Rent August 2026", "Store Rent & Maintenance", 25000.00, today - timedelta(days=10), "BANK_TRANSFER", "Landlord Ramesh Patel"),
        ("Torrent Power Electricity Bill", "Electricity & Utilities", 8450.00, today - timedelta(days=5), "UPI", "Torrent Power Ltd"),
        ("Monthly Delivery Staff Incentive", "Staff Salaries & Wages", 4500.00, today - timedelta(days=3), "CASH", "Delivery Staff Ramesh"),
        ("Daily Staff Tea & Snacks", "Tea & Refreshments", 350.00, today, "CASH", "Tulsi Tea Stall"),
        ("Plastic & Eco Carry Bags Batch", "Packaging & Polythene Bags", 1800.00, today - timedelta(days=1), "UPI", "Gujarat Packaging Store"),
    ]

    for etitle, ecatname, eamt, edate, emode, epaidto in expenses_list:
        ecat = created_exp_cats.get(ecatname)
        Expense.objects.get_or_create(
            title=etitle,
            date=edate,
            defaults={
                'category': ecat,
                'amount': Decimal(str(eamt)),
                'payment_method': emode,
                'paid_to': epaidto,
                'created_by': created_users['admin']
            }
        )
    print("[OK] Expense Categories & Expenses seeded.")

    # 11. Seed Offers & Coupons
    Coupon.objects.get_or_create(
        code="WELCOME50",
        defaults={
            'title': "Flat Rs. 50 OFF on First Order",
            'description': "Valid for new customers on minimum order of Rs. 300",
            'offer_type': 'FLAT',
            'discount_value': Decimal('50.00'),
            'min_order_amount': Decimal('300.00'),
            'valid_from': today - timedelta(days=15),
            'valid_to': today + timedelta(days=45),
            'usage_limit': 500,
            'used_count': 34,
            'is_active': True
        }
    )
    Coupon.objects.get_or_create(
        code="FREESHIP",
        defaults={
            'title': "Free Home Delivery",
            'description': "Free delivery for orders above Rs. 400",
            'offer_type': 'FLAT',
            'discount_value': Decimal('30.00'),
            'min_order_amount': Decimal('400.00'),
            'valid_from': today - timedelta(days=30),
            'valid_to': today + timedelta(days=60),
            'usage_limit': 1000,
            'used_count': 128,
            'is_active': True
        }
    )
    FestivalOffer.objects.get_or_create(
        title="Monsoon Grocery Mahotsav",
        defaults={
            'subtitle': "Big discounts on Oils, Ghee, Atta & Household Essentials!",
            'tag_text': "MEGA MONSOON SALE",
            'discount_info': "Up to 25% OFF",
            'start_date': today - timedelta(days=5),
            'end_date': today + timedelta(days=10),
            'is_active': True
        }
    )
    print("[OK] Coupons & Festival Offers seeded.")

    # 12. Seed Gulla / Cash Register Entries for Today & Yesterday
    # Morning Opening Float
    CashRegisterEntry.objects.get_or_create(
        entry_type='OPENING_FLOAT',
        amount=Decimal('5000.00'),
        date=today,
        defaults={
            'notes': 'Morning Store Opening Float',
            'denomination_counts': {'500': 6, '200': 5, '100': 8, '50': 4, '20': 0, '10': 0, '5': 0, '1': 0}, # 3000+1000+800+200 = 5000
            'created_by': created_users['cashier1']
        }
    )
    # Mid-day Cash In
    CashRegisterEntry.objects.get_or_create(
        entry_type='CASH_IN',
        amount=Decimal('2000.00'),
        date=today,
        defaults={
            'notes': 'Added Cash for Change / Denominations',
            'denomination_counts': {'100': 10, '50': 12, '20': 15, '10': 10}, # 1000+600+300+100 = 2000
            'created_by': created_users['admin']
        }
    )
    # Supplier Cash Pay from Gulla
    CashRegisterEntry.objects.get_or_create(
        entry_type='SUPPLIER_PAYMENT',
        amount=Decimal('1500.00'),
        date=today,
        defaults={
            'notes': 'Paid Amul Milk Van Vendor Cash',
            'denomination_counts': {'500': 3},
            'created_by': created_users['cashier1']
        }
    )
    # Store Cash Expense from Gulla
    CashRegisterEntry.objects.get_or_create(
        entry_type='EXPENSE',
        amount=Decimal('350.00'),
        date=today,
        defaults={
            'notes': 'Paid Store Tea Stall Bill (Paid from Gulla)',
            'denomination_counts': {'100': 3, '50': 1},
            'created_by': created_users['cashier1']
        }
    )
    print("[OK] Gulla Cash Register entries seeded.")

    # 13. Seed Historical & Live Sales Orders (Past 3 Days + Today)
    print("--- Creating Real-time Sales Orders & Invoices ---")
    order_dates = [
        today - timedelta(days=3),
        today - timedelta(days=2),
        today - timedelta(days=1),
        today
    ]

    orders_count = 0
    inv_seq = 1001

    for od in order_dates:
        # Create 4-6 orders per day
        daily_orders_n = 5
        for idx in range(daily_orders_n):
            cust = random.choice(created_customers)
            pmethod = random.choice(['CASH', 'CASH', 'UPI', 'CARD', 'KHATA'])
            pstatus = 'PAID' if pmethod != 'KHATA' else 'PENDING'
            
            # Select 2 to 4 products
            selected_prods = random.sample(created_products, random.randint(2, 4))
            
            subtotal = Decimal('0.00')
            tax_amt = Decimal('0.00')
            order_items_payload = []

            for prd in selected_prods:
                qty = random.randint(1, 4)
                item_sub = prd.selling_price * qty
                item_tax = item_sub * (prd.gst_percent / Decimal('100.00'))
                subtotal += item_sub
                tax_amt += item_tax
                order_items_payload.append({
                    'product': prd,
                    'product_name': prd.name,
                    'sku': prd.sku,
                    'unit_price': prd.selling_price,
                    'quantity': qty,
                    'gst_percent': prd.gst_percent,
                    'subtotal': item_sub
                })

            del_charge = Decimal('30.00') if subtotal < Decimal('500.00') else Decimal('0.00')
            disc_amt = Decimal('20.00') if subtotal > Decimal('600.00') else Decimal('0.00')
            total_amt = subtotal + tax_amt + del_charge - disc_amt

            # Denomination notes if CASH
            cash_tend = Decimal('0.00')
            change_ret = Decimal('0.00')
            t_notes = {}
            c_notes = {}

            if pmethod == 'CASH':
                # Round up to next 100 or 500
                tot_val = float(total_amt)
                if tot_val <= 500:
                    cash_tend = Decimal('500.00')
                else:
                    cash_tend = Decimal(str(int(tot_val // 500 + 1) * 500))
                change_ret = cash_tend - total_amt
                t_notes = {'500': int(cash_tend // 500)}
                
                # greedy change notes
                rem_chg = int(round(float(change_ret)))
                for d in [500, 200, 100, 50, 20, 10, 5, 1]:
                    if rem_chg >= d:
                        c_notes[str(d)] = rem_chg // d
                        rem_chg = rem_chg % d

            onum = f"ORD-{od.strftime('%Y%m%d')}-{idx+1:03d}"
            invnum = f"TM-INV-{inv_seq}"
            inv_seq += 1

            ord_obj, created = Order.objects.get_or_create(
                order_number=onum,
                defaults={
                    'invoice_number': invnum,
                    'customer': cust,
                    'customer_name': cust.name,
                    'customer_phone': cust.phone,
                    'customer_address': cust.address,
                    'status': 'DELIVERED' if od < today else 'PROCESSING',
                    'payment_method': pmethod,
                    'payment_status': pstatus,
                    'subtotal': subtotal,
                    'tax_amount': tax_amt,
                    'discount_amount': disc_amt,
                    'delivery_charge': del_charge,
                    'total_amount': total_amt,
                    'cash_tendered': cash_tend,
                    'change_returned': change_ret,
                    'tendered_notes': t_notes,
                    'change_notes': c_notes,
                    'created_by': created_users['cashier1'],
                }
            )

            if created:
                # Update created_at timestamp artificially
                order_time = timezone.datetime.combine(od, timezone.datetime.min.time()) + timedelta(hours=9+idx*2, minutes=random.randint(5, 50))
                Order.objects.filter(id=ord_obj.id).update(created_at=order_time)

                for item in order_items_payload:
                    OrderItem.objects.create(
                        order=ord_obj,
                        product=item['product'],
                        product_name=item['product_name'],
                        sku=item['sku'],
                        unit_price=item['unit_price'],
                        quantity=item['quantity'],
                        gst_percent=item['gst_percent'],
                        subtotal=item['subtotal']
                    )
                    # Stock Movement Out
                    StockMovement.objects.create(
                        product=item['product'],
                        movement_type='OUT_SALE',
                        quantity=-item['quantity'],
                        balance_after=max(0, item['product'].stock_quantity - item['quantity']),
                        reason=f"POS Sale Bill #{onum}",
                        reference_no=onum,
                        performed_by=created_users['cashier1']
                    )

                # Payment Transaction entry
                if pstatus == 'PAID':
                    pt = PaymentTransaction.objects.create(
                        order=ord_obj,
                        transaction_id=f"TXN-{onum}",
                        amount=total_amt,
                        payment_method=pmethod,
                        status='PAID',
                        notes=f"Full Payment received via {pmethod}"
                    )
                    PaymentTransaction.objects.filter(id=pt.id).update(created_at=order_time)

                orders_count += 1

    print(f"[OK] Sales Orders & Transactions seeded ({orders_count} orders created across past 4 days).")

    # 14. Sync Bank & UPI Transactions Register
    from core.gulla_services import sync_all_transactions_to_bank_register
    synced_bank = sync_all_transactions_to_bank_register()
    print(f"[OK] Bank & UPI Register synchronized ({synced_bank} transactions synced).")

    print("\n=======================================================")
    print("[SUCCESS] TULSI MART DEMO DATA SEEDED SUCCESSFULLY!")
    print("=======================================================")
    print("Logins for testing:")
    print(" - Admin/Owner Username: admin      Password: password123")
    print(" - Cashier Username:     cashier1   Password: password123")
    print(" - Manager Username:     manager1   Password: password123")
    print("=======================================================")

if __name__ == '__main__':
    seed_database()
