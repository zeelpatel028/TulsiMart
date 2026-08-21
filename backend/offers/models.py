from django.db import models
from django.utils import timezone

class Coupon(models.Model):
    OFFER_TYPES = (
        ('PERCENTAGE', 'Percentage Discount (%)'),
        ('FLAT', 'Flat Discount (₹)'),
        ('BOGO', 'Buy 1 Get 1 (BOGO)'),
        ('MIN_ORDER', 'Minimum Order Value Discount'),
    )

    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    offer_type = models.CharField(max_length=20, choices=OFFER_TYPES, default='PERCENTAGE')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2) # e.g. 10 for 10% or 50 for ₹50
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    valid_from = models.DateField(default=timezone.now)
    valid_to = models.DateField()
    usage_limit = models.IntegerField(default=100)
    used_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} - {self.title}"

    @property
    def is_valid(self):
        today = timezone.now().date()
        return (
            self.is_active and 
            self.valid_from <= today <= self.valid_to and 
            self.used_count < self.usage_limit
        )


class FestivalOffer(models.Model):
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    banner_image = models.CharField(max_length=500, blank=True, null=True)
    tag_text = models.CharField(max_length=100, default='Special Offer')
    discount_info = models.CharField(max_length=100, default='Up to 30% OFF')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
