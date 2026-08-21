from django.db import models
from django.conf import settings

class ExpenseCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='Receipt')
    color = models.CharField(max_length=20, default='#384959')

    class Meta:
        verbose_name_plural = 'Expense Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Expense(models.Model):
    PAYMENT_METHODS = (
        ('CASH', 'Cash'),
        ('UPI', 'UPI'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CARD', 'Card / Debit'),
        ('CHEQUE', 'Cheque'),
    )

    title = models.CharField(max_length=255)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='UPI')
    paid_to = models.CharField(max_length=150, blank=True, null=True)
    receipt_url = models.CharField(max_length=500, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.title} - ₹{self.amount} ({self.category.name})"
