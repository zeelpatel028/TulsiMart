from django.db import models
from django.conf import settings
from customers.models import Customer
from inventory.models import Product

class Order(models.Model):
    ORDER_STATUS = (
        ('NEW', 'New Order'),
        ('PROCESSING', 'Processing'),
        ('PACKED', 'Packed'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('RETURNED', 'Returned'),
    )

    PAYMENT_METHODS = (
        ('CASH', 'Cash'),
        ('UPI', 'UPI / QR'),
        ('CARD', 'Debit / Credit Card'),
        ('NET_BANKING', 'Net Banking'),
        ('COD', 'Cash on Delivery'),
        ('KHATA', 'Khata / Customer Credit'),
    )

    PAYMENT_STATUS = (
        ('PAID', 'Paid'),
        ('PENDING', 'Pending'),
        ('REFUNDED', 'Refunded'),
        ('FAILED', 'Failed'),
    )

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_address = models.TextField(blank=True, null=True)
    
    status = models.CharField(max_length=25, choices=ORDER_STATUS, default='NEW', db_index=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='CASH')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PAID', db_index=True)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_charge = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    cash_tendered = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, blank=True, null=True)
    change_returned = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, blank=True, null=True)
    tendered_notes = models.JSONField(default=dict, blank=True, null=True)
    change_notes = models.JSONField(default=dict, blank=True, null=True)
    
    coupon_applied = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    delivery_partner = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} - {self.customer_name} (₹{self.total_amount})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='order_items')
    product_name = models.CharField(max_length=255)
    sku = models.CharField(max_length=50, blank=True, null=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class PaymentTransaction(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=Order.PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=Order.PAYMENT_STATUS, default='PAID')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_id} - ₹{self.amount} ({self.status})"
