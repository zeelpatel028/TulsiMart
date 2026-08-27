from django.db import models

class ActivityLog(models.Model):
    user_name = models.CharField(max_length=150, blank=True, null=True)
    action = models.CharField(max_length=100)
    module = models.CharField(max_length=100)
    details = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_name} - {self.action} on {self.module}"


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
    created_by_name = models.CharField(max_length=150, blank=True, null=True)
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
    created_by_name = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_transaction_type_display()}: ₹{self.amount} ({self.reference_number})"


class Staff(models.Model):
    ROLE_CHOICES = (
        ('STORE_MANAGER', 'Store Manager'),
        ('CASHIER', 'Cashier / Billing Staff'),
        ('DELIVERY', 'Delivery Staff'),
        ('HELPER', 'Helper / Store Staff'),
    )

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='CASHIER')
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    attendance_data = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class StoreSetting(models.Model):
    # Store Profile
    store_name = models.CharField(max_length=200, default='Tulsi Mart')
    tagline = models.CharField(max_length=300, default='Fresh Groceries & Supermarket')
    store_logo = models.CharField(max_length=500, default='/logo.png')
    address = models.TextField(default='Shop No. 12-14, Heritage Plaza, MG Road')
    city = models.CharField(max_length=100, default='Mumbai')
    state = models.CharField(max_length=100, default='Maharashtra')
    country = models.CharField(max_length=100, default='India')
    pincode = models.CharField(max_length=20, default='400001')
    phone = models.CharField(max_length=50, default='+91 98765 43210')
    email = models.EmailField(default='contact@tulsimart.com')

    # Tax & Billing
    gst_number = models.CharField(max_length=50, default='27AABCT8899F1Z4')
    pan_number = models.CharField(max_length=50, default='AABCT8899F')
    invoice_prefix = models.CharField(max_length=30, default='TM-INV-')
    invoice_terms = models.TextField(default='Thank you for shopping at Tulsi Mart! 100% Quality Guarantee. Exchanges valid within 24 hours with original invoice.')
    show_logo_on_invoice = models.BooleanField(default=True)
    auto_print_invoice = models.BooleanField(default=False)
    tax_enabled = models.BooleanField(default=True)
    default_gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    prices_include_tax = models.BooleanField(default=False)

    # Currency & Localization
    currency_symbol = models.CharField(max_length=10, default='₹')
    currency_code = models.CharField(max_length=10, default='INR')

    # Payment & Banking
    payment_cash_enabled = models.BooleanField(default=True)
    payment_upi_enabled = models.BooleanField(default=True)
    payment_card_enabled = models.BooleanField(default=True)
    bank_name = models.CharField(max_length=150, default='HDFC Bank')
    account_number = models.CharField(max_length=100, default='50200012345678')
    ifsc_code = models.CharField(max_length=50, default='HDFC0001234')
    upi_id = models.CharField(max_length=100, default='tulsimart@hdfcbank')

    # Theme & Security
    theme_mode = models.CharField(max_length=20, default='light')
    primary_color = models.CharField(max_length=30, default='#384959')
    security_require_otp = models.BooleanField(default=False)
    security_session_timeout = models.IntegerField(default=30)
    home_cash_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Store Setting'
        verbose_name_plural = 'Store Settings'

    def __str__(self):
        return f"{self.store_name} Settings (ID: {self.id})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj


class LoginAccount(models.Model):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin / Store Owner'),
        ('STORE_MANAGER', 'Store Manager'),
        ('CASHIER', 'Cashier / Billing Staff'),
    )

    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(help_text="Email for OTP delivery")
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='ADMIN')
    is_active = models.BooleanField(default=True)
    require_otp = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'login'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class HomeCashTransaction(models.Model):
    ENTRY_TYPES = (
        ('DEPOSIT', 'Manual Cash Deposit (ઘરે રોકડ જમા)'),
        ('WITHDRAWAL', 'Manual Cash Withdrawal (ઘરેથી રોકડ ઉપાડ)'),
        ('SWEEP', 'Auto EOD Sweep from Gulla (ગલ્લામાંથી ઓટો ટ્રાન્સફર)'),
    )

    entry_type = models.CharField(max_length=30, choices=ENTRY_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    denomination_counts = models.JSONField(default=dict, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by_name = models.CharField(max_length=150, default='Store Owner')
    balance_after = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Home Safe {self.entry_type}: ₹{self.amount} by {self.created_by_name}"




