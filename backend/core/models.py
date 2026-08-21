from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Store Administrator / Owner'),
        ('STORE_OWNER', 'Store Owner'),
        ('STORE_MANAGER', 'Store Manager'),
        ('STORE_MANAGEMENT', 'Store Management'),
        ('CASHIER', 'Cashier / Billing Staff'),
        ('DELIVERY', 'Delivery Staff'),
    )
    
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='CASHIER')
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.CharField(max_length=500, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    hire_date = models.DateField(blank=True, null=True)
    is_staff_active = models.BooleanField(default=True)
    attendance_data = models.JSONField(default=dict, blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class StoreSetting(models.Model):
    store_name = models.CharField(max_length=150, default="Tulsi Mart")
    tagline = models.CharField(max_length=255, default="Fresh Groceries & Daily Needs")
    logo_url = models.CharField(max_length=500, default="/logo.png")
    phone = models.CharField(max_length=30, default="+91 98765 43210")
    email = models.EmailField(default="contact@tulsimart.com")
    otp_email = models.EmailField(default="admin@tulsimart.com", blank=True, null=True)
    address = models.TextField(default="Shop No. 12, Green Park Avenue, Main Market, Mumbai, MH - 400001")
    gstin = models.CharField(max_length=30, default="27AABCT1234F1Z8")
    currency_symbol = models.CharField(max_length=10, default="₹")
    invoice_prefix = models.CharField(max_length=20, default="TM-INV-")
    invoice_footer_terms = models.TextField(default="Thank you for shopping with Tulsi Mart! Fresh goods guarantee. Goods once sold can only be returned within 24 hours with original invoice.")
    tax_percentage_default = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    delivery_charge_flat = models.DecimalField(max_digits=8, decimal_places=2, default=40.00)
    free_delivery_above = models.DecimalField(max_digits=8, decimal_places=2, default=500.00)
    low_stock_threshold_default = models.PositiveIntegerField(default=10)
    home_cash_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    enable_notifications = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj

    def __str__(self):
        return self.store_name


class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    module = models.CharField(max_length=100)
    details = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.action} on {self.module}"


class CashRegisterEntry(models.Model):
    ENTRY_TYPES = (
        ('OPENING_FLOAT', 'Opening Cash / Float'),
        ('CASH_IN', 'Cash Added / Deposit'),
        ('CASH_OUT', 'Cash Withdrawn / Taken Out'),
        ('SUPPLIER_PAYMENT', 'Supplier Cash Payment'),
        ('EXPENSE', 'Expense Cash Payment'),
        ('BILL_SALE', 'POS Cash Bill Sale'),
        ('KHATA_PAYMENT', 'Khata Customer Cash Receipt'),
    )

    entry_type = models.CharField(max_length=30, choices=ENTRY_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    denomination_counts = models.JSONField(default=dict, blank=True, null=True)
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_entry_type_display()}: ₹{self.amount} ({self.created_at.strftime('%H:%M')})"


class BankTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('UPI_IN', 'POS UPI / Customer Payment'),
        ('SUPPLIER_PAYOUT', 'Supplier Bank / UPI Payout'),
        ('EXPENSE_PAYOUT', 'Store Bank / UPI Expense'),
        ('DEPOSIT', 'Admin Capital / Cash Deposit to Bank'),
        ('WITHDRAWAL', 'Admin Bank Withdrawal to Cash'),
    )

    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    bank_name = models.CharField(max_length=100, default='HDFC Store Primary Bank')
    notes = models.TextField(blank=True, null=True)
    date = models.DateField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_transaction_type_display()}: ₹{self.amount} ({self.reference_number})"

