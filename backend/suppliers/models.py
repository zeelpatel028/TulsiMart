from django.db import models
from inventory.models import Product

class Supplier(models.Model):
    name = models.CharField(max_length=150)
    company_name = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True, null=True)
    gstin = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, default='Mumbai')
    category = models.CharField(max_length=100, default='General Grocery', blank=True, null=True)
    payment_terms = models.CharField(max_length=50, default='Net 15', blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00)
    rating = models.IntegerField(default=5)
    notes = models.TextField(blank=True, null=True)
    bank_details = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.company_name or 'Supplier'})"

    @property
    def total_purchases(self):
        from django.db.models import Sum
        return float(self.purchase_orders.aggregate(total=Sum('total_amount'))['total'] or 0.0)

    @property
    def total_paid(self):
        from django.db.models import Sum
        return float(self.payments.aggregate(total=Sum('amount'))['total'] or 0.0)

    @property
    def pending_balance(self):
        return max(0.0, self.total_purchases - self.total_paid)


class PurchaseOrder(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('ORDERED', 'Ordered / In Transit'),
        ('PARTIALLY_RECEIVED', 'Partially Received'),
        ('RECEIVED', 'Received / In Stock'),
        ('CANCELLED', 'Cancelled'),
    )

    po_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    order_date = models.DateField()
    expected_delivery = models.DateField(blank=True, null=True)
    received_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ORDERED')
    gst_mode = models.CharField(max_length=20, default='EXCLUSIVE', blank=True, null=True)
    tax_type = models.CharField(max_length=20, default='INTRA_STATE', blank=True, null=True)
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.po_number} - {self.supplier.name} (₹{self.total_amount})"

    @property
    def due_amount(self):
        return max(0.0, float(self.total_amount) - float(self.paid_amount))


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='po_items')
    product_name = models.CharField(max_length=255)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)
    discount_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    received_quantity = models.IntegerField(default=0)
    damaged_quantity = models.IntegerField(default=0)
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    mfg_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class GoodsReceiptNote(models.Model):
    grn_number = models.CharField(max_length=50, unique=True)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='grns')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='grns')
    received_date = models.DateField(auto_now_add=True)
    received_by = models.CharField(max_length=100, blank=True, null=True)
    total_valuation = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.grn_number} - PO #{self.purchase_order.po_number}"


class SupplierPayment(models.Model):
    PAYMENT_METHODS = (
        ('BANK_TRANSFER', 'Bank Transfer (NEFT/RTGS/IMPS)'),
        ('UPI', 'UPI Payment'),
        ('CHEQUE', 'Cheque'),
        ('CASH', 'Cash'),
    )

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='payments')
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='po_payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHODS, default='BANK_TRANSFER')
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    payment_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment ₹{self.amount} to {self.supplier.name}"
