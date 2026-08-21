from rest_framework import serializers
from django.db.models import Sum, Count
from .models import Customer, CustomerFeedback

class CustomerFeedbackSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = CustomerFeedback
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    pending_payments = serializers.SerializerMethodField()
    recent_feedbacks = CustomerFeedbackSerializer(source='feedbacks', many=True, read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'

    def get_total_orders(self, obj):
        return getattr(obj, 'order_count', obj.orders.count())

    def get_total_spent(self, obj):
        total = obj.orders.filter(payment_status='PAID').aggregate(total=Sum('total_amount'))['total']
        return float(total or 0.00)

    def get_pending_payments(self, obj):
        from decimal import Decimal
        pending_orders = obj.orders.filter(payment_status='PENDING')
        total_due = Decimal('0.00')
        for order in pending_orders:
            paid_sum = order.transactions.filter(status='PAID').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
            total_due += max(Decimal('0.00'), order.total_amount - paid_sum)
        return float(total_due)
