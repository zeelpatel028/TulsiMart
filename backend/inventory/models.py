from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True, null=True)
    icon = models.CharField(max_length=50, default='ShoppingBag')
    image = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Unit(models.Model):
    name = models.CharField(max_length=50, unique=True) # Kilogram, Gram, Litre, Packet, Piece, Box
    short_name = models.CharField(max_length=20, unique=True) # kg, g, L, pkt, pc, box
    base_unit = models.CharField(max_length=20, blank=True, null=True) # e.g. g, ml, pcs
    conversion_factor = models.DecimalField(max_digits=12, decimal_places=4, default=1.0) # e.g. 1000 for kg->g

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.short_name})"



class Product(models.Model):
    product_code = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, related_name='products') # Product Unit
    selling_unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, related_name='selling_unit_products') # Selling Unit
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    # Purchase Pricing & Tax
    purchase_gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    purchase_non_tax_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    purchase_tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    purchase_final_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Selling Pricing & Tax
    selling_gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    selling_non_tax_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    selling_tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    selling_tax_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Inventory
    stock_quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0.000, db_index=True)
    min_stock_alert = models.DecimalField(max_digits=12, decimal_places=3, default=10.000)
    manufacturing_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True, db_index=True)
    batch_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Media & Meta
    image = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    short_description = models.TextField(blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-id']
        indexes = [
            models.Index(fields=['is_active', 'stock_quantity']),
            models.Index(fields=['created_at']),
        ]

    def save(self, *args, **kwargs):
        import random
        if not self.product_code:
            max_id = Product.objects.aggregate(max_id=models.Max('id'))['max_id'] or 0
            self.product_code = f"PD-ID-{(max_id + 1):03d}"
        if not self.sku:
            self.sku = self.product_code
        if not self.barcode:
            self.barcode = f"890{random.randint(100000000, 999999999)}"
        super().save(*args, **kwargs)

    @property
    def formatted_product_id(self):
        if self.product_code:
            return self.product_code
        return f"PD-ID-{self.id:03d}"

    @property
    def stock_status(self):
        if self.stock_quantity <= 0:
            return 'OUT_OF_STOCK'
        elif self.stock_quantity <= self.min_stock_alert:
            return 'LOW_STOCK'
        return 'IN_STOCK'


class StockMovement(models.Model):
    MOVEMENT_TYPES = (
        ('IN_PURCHASE', 'Stock In (Purchase)'),
        ('OUT_SALE', 'Stock Out (Sale Order)'),
        ('ADJUSTMENT_ADD', 'Stock Adjustment (+)'),
        ('ADJUSTMENT_SUB', 'Stock Adjustment (-)'),
        ('DAMAGE_LOSS', 'Damage / Expiry Loss'),
        ('RETURN_RESTOCK', 'Customer Return Restock'),
        ('TRANSFER', 'Stock Transfer'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=30, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    balance_after = models.IntegerField()
    reason = models.CharField(max_length=255, blank=True, null=True)
    reference_no = models.CharField(max_length=100, blank=True, null=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.movement_type} {self.quantity} on {self.product.name}"
