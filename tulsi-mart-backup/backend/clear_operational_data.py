import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tulsimart_backend.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Staff, StoreSetting, LoginAccount, ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction
from inventory.models import Product, Category, Brand, Unit, StockMovement
from orders.models import Order, OrderItem, PaymentTransaction
from customers.models import Customer, CustomerFeedback
from suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from expenses.models import Expense, ExpenseCategory
from offers.models import Coupon, FestivalOffer

def clear_all_operational_data():
    print("=" * 60)
    print("Clearing all transactional/operational data in database...")
    print("=" * 60)

    # 1. Orders & Payments
    count_items, _ = OrderItem.objects.all().delete()
    count_pay, _ = PaymentTransaction.objects.all().delete()
    count_orders, _ = Order.objects.all().delete()
    print(f"Cleared Orders, Items & Payments: {count_orders} orders deleted")

    # 2. Inventory & Stock
    count_stock, _ = StockMovement.objects.all().delete()
    count_prods, _ = Product.objects.all().delete()
    count_cats, _ = Category.objects.all().delete()
    count_brands, _ = Brand.objects.all().delete()
    count_units, _ = Unit.objects.all().delete()
    print(f"Cleared Inventory: {count_prods} products, {count_cats} categories, {count_brands} brands, {count_units} units")

    # 3. Customers & Feedback
    count_fb, _ = CustomerFeedback.objects.all().delete()
    count_cust, _ = Customer.objects.all().delete()
    print(f"Cleared Customers & Feedback: {count_cust} customers deleted")

    # 4. Suppliers & Purchase Orders
    count_grn, _ = GoodsReceiptNote.objects.all().delete()
    count_poi, _ = PurchaseOrderItem.objects.all().delete()
    count_po, _ = PurchaseOrder.objects.all().delete()
    count_spay, _ = SupplierPayment.objects.all().delete()
    count_sup, _ = Supplier.objects.all().delete()
    print(f"Cleared Suppliers & POs: {count_sup} suppliers, {count_po} purchase orders deleted")

    # 5. Expenses
    count_exp, _ = Expense.objects.all().delete()
    count_expcat, _ = ExpenseCategory.objects.all().delete()
    print(f"Cleared Expenses: {count_exp} expenses deleted")

    # 6. Offers & Coupons
    count_coup, _ = Coupon.objects.all().delete()
    count_fest, _ = FestivalOffer.objects.all().delete()
    print(f"Cleared Offers & Coupons: {count_coup} coupons deleted")

    # 7. Core Register & Transactions
    count_act, _ = ActivityLog.objects.all().delete()
    count_cash, _ = CashRegisterEntry.objects.all().delete()
    count_bank, _ = BankTransaction.objects.all().delete()
    count_home, _ = HomeCashTransaction.objects.all().delete()
    print(f"Cleared Cash Register & Activity Logs: {count_cash} entries deleted")

    # Reset Gulla balance in StoreSetting
    st = StoreSetting.get_settings()
    st.home_cash_amount = 0.00
    st.save()

    print("=" * 60)
    print("PRESERVED USER & PROFILE DATA:")
    print(f" - Auth Users (django.contrib.auth): {User.objects.count()} users preserved")
    print(f" - Login Accounts (login table): {LoginAccount.objects.count()} accounts preserved")
    print(f" - Store Staff (core.Staff): {Staff.objects.count()} staff preserved")
    print(f" - Store Settings (core.StoreSetting): {StoreSetting.objects.count()} setting record preserved")
    print("=" * 60)
    print("SUCCESS: All operational data successfully wiped from database while preserving user profiles & login credentials!")

if __name__ == '__main__':
    clear_all_operational_data()
