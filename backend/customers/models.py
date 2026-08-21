from django.db import models

class Customer(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('BLOCKED', 'Blocked'),
    )

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, default='Mumbai')
    pincode = models.CharField(max_length=15, blank=True, null=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.phone})"


class CustomerFeedback(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.IntegerField(default=5) # 1 to 5
    comment = models.TextField(blank=True, null=True)
    order_ref = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Rating {self.rating} by {self.customer.name}"
