from django.core.management.base import BaseCommand
from core.models import ActivityLog
from inventory.models import Category, Brand, Unit, Product, StockMovement
from customers.models import Customer, CustomerFeedback
from suppliers.models import Supplier, PurchaseOrder, PurchaseOrderItem, SupplierPayment
from expenses.models import ExpenseCategory, Expense
from offers.models import Coupon, FestivalOffer
from orders.models import Order, OrderItem, PaymentTransaction
from core.mongodb import get_mongo_db, sync_all_data_to_mongodb


class Command(BaseCommand):
    help = 'Removes all records from database tables and resets to clean state with default Admin'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting complete database data cleanup for Tulsi Mart..."))

        # 1. Orders & Transactions
        OrderItem.objects.all().delete()
        PaymentTransaction.objects.all().delete()
        Order.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("[CLEARED] Orders, Order Items & Payment Transactions"))

        # 2. Inventory & Products
        StockMovement.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Brand.objects.all().delete()
        Unit.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("[CLEARED] Products, Stock Movements, Categories, Brands & Units"))

        # 3. Customers & CRM
        CustomerFeedback.objects.all().delete()
        Customer.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("[CLEARED] Customers & Feedback"))

        # 4. Suppliers & Procurement
        try:
            PurchaseOrderItem.objects.all().delete()
        except Exception:
            pass
        try:
            SupplierPayment.objects.all().delete()
        except Exception:
            pass
        PurchaseOrder.objects.all().delete()
        Supplier.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("[CLEARED] Suppliers & Purchase Orders"))

        # 5. Expenses & Financials
        Expense.objects.all().delete()
        ExpenseCategory.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("[CLEARED] Expenses & Expense Categories"))

        # 6. Offers & Discounts
        Coupon.objects.all().delete()
        FestivalOffer.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("[CLEARED] Coupons & Festival Offers"))

        # 7. Activity Logs
        ActivityLog.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("[CLEARED] Activity Logs"))

        # 8. Clear & Sync MongoDB
        try:
            db = get_mongo_db()
            if db is not None:
                for col_name in db.list_collection_names():
                    db[col_name].delete_many({})
                self.stdout.write(self.style.SUCCESS(f"[CLEARED] MongoDB collections in {db.name}"))
                sync_all_data_to_mongodb()
                self.stdout.write(self.style.SUCCESS("[SYNCED] Clean admin state synced to MongoDB"))
        except Exception as e:
            self.stdout.write(self.style.NOTICE(f"[MONGO NOTICE] MongoDB cleanup: {e}"))

        self.stdout.write(self.style.SUCCESS("\n ALL TABLES HAVE BEEN EMPTIED AND RESET SUCCESSFULLY!"))
