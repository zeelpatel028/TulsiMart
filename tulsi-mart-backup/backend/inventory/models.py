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
        db_table = 'categories'
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
        db_table = 'brands'
        ordering = ['name']

    def __str__(self):
        return self.name


class Unit(models.Model):
    name = models.CharField(max_length=50, unique=True) # Kilogram, Gram, Litre, Packet, Piece, Box
    short_name = models.CharField(max_length=20, unique=True) # kg, g, L, pkt, pc, box
    base_unit = models.CharField(max_length=20, blank=True, null=True) # e.g. g, ml, pcs
    conversion_factor = models.DecimalField(max_digits=12, decimal_places=4, default=1.0) # e.g. 1000 for kg->g

    class Meta:
        db_table = 'units'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.short_name})"


class Product(models.Model):
    product_code = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=255, db_index=True)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products', db_column='category_id')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', db_column='brand_id')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, related_name='products', db_column='unit_id')
    selling_unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, related_name='selling_unit_products')
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
        db_table = 'products'
        ordering = ['-id']
        indexes = [
            models.Index(fields=['is_active', 'stock_quantity']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"


class StockMovement(models.Model):
    MOVEMENT_TYPES = (
        ('PURCHASE_IN', 'Stock Received (PO / GRN)'),
        ('POS_SALE', 'POS Bill Sale'),
        ('RETURN_IN', 'Customer Return'),
        ('SUPPLIER_RETURN', 'Supplier Return / Out'),
        ('DAMAGE_OUT', 'Damaged / Expired Removal'),
        ('ADJUSTMENT', 'Manual Adjustment'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements', db_column='product_id')
    movement_type = models.CharField(max_length=30, choices=MOVEMENT_TYPES)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    balance_after = models.DecimalField(max_digits=12, decimal_places=3)
    reason = models.CharField(max_length=255, blank=True, null=True)
    reference_no = models.CharField(max_length=100, blank=True, null=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, db_column='performed_by_id')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} ({self.movement_type}: {self.quantity})"
