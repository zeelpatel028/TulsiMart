from django.core.management.base import BaseCommand
from core.models import ActivityLog, CashRegisterEntry, BankTransaction, HomeCashTransaction
from inventory.models import Category, Brand, Unit, Product, StockMovement
from customers.models import Customer, CustomerFeedback
from suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from expenses.models import ExpenseCategory, Expense
from offers.models import Coupon, FestivalOffer
from orders.models import Order, OrderItem, PaymentTransaction


class Command(BaseCommand):
    help = 'Removes all records from database tables and resets to clean state'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting complete database data cleanup for Tulsi Mart..."))

        # 1. Orders & Transactions
        try:
            OrderItem.objects.all().delete()
            PaymentTransaction.objects.all().delete()
            Order.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Orders, Order Items & Payment Transactions"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Orders: {e}"))

        # 2. Inventory & Products
        try:
            StockMovement.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            Brand.objects.all().delete()
            Unit.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Products, Stock Movements, Categories, Brands & Units"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Inventory: {e}"))

        # 3. Customers & CRM
        try:
            CustomerFeedback.objects.all().delete()
            Customer.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Customers & Feedback"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Customers: {e}"))

        # 4. Suppliers & Procurement
        try:
            GoodsReceiptNote.objects.all().delete()
            PurchaseOrderItem.objects.all().delete()
            SupplierPayment.objects.all().delete()
            PurchaseOrder.objects.all().delete()
            Supplier.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Suppliers & Purchase Orders"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Suppliers: {e}"))

        # 5. Expenses & Financials
        try:
            Expense.objects.all().delete()
            ExpenseCategory.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Expenses & Expense Categories"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Expenses: {e}"))

        # 6. Offers & Discounts
        try:
            Coupon.objects.all().delete()
            FestivalOffer.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Coupons & Festival Offers"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Offers: {e}"))

        # 7. Cash Drawer, Bank & Home Vault Entries
        try:
            CashRegisterEntry.objects.all().delete()
            BankTransaction.objects.all().delete()
            HomeCashTransaction.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Gulla Cash Register, Bank & Home Cash Transactions"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Cash/Bank Transactions: {e}"))

        # 8. Activity Logs
        try:
            ActivityLog.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("[CLEARED] Activity Logs"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] Clearing Activity Logs: {e}"))

        self.stdout.write(self.style.SUCCESS("\n ALL DATABASE TABLES HAVE BEEN EMPTIED AND RESET SUCCESSFULLY!"))

