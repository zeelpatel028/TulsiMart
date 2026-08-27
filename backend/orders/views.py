from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Sum
from .models import Order, OrderItem, PaymentTransaction
from .serializers import OrderSerializer, OrderItemSerializer, PaymentTransactionSerializer
from inventory.models import StockMovement

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items').select_related('customer', 'created_by')
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        payment_status = self.request.query_params.get('payment_status')
        payment_method = self.request.query_params.get('payment_method')
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_param and status_param != 'ALL':
            qs = qs.filter(status=status_param)
        if payment_status:
            qs = qs.filter(payment_status=payment_status)
        if payment_method:
            qs = qs.filter(payment_method=payment_method)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search) |
                Q(customer_name__icontains=search) |
                Q(customer_phone__icontains=search) |
                Q(invoice_number__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        old_status = order.status

        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        if request.data.get('payment_status'):
            order.payment_status = request.data.get('payment_status')
        order.save()

        # If order is cancelled or returned, restock products
        if new_status in ['CANCELLED', 'RETURNED'] and old_status not in ['CANCELLED', 'RETURNED']:
            for item in order.items.all():
                if item.product:
                    item.product.stock_quantity += item.quantity
                    item.product.save()
                    StockMovement.objects.create(
                        product=item.product,
                        movement_type='RETURN_RESTOCK' if new_status == 'RETURNED' else 'ADJUSTMENT_ADD',
                        quantity=item.quantity,
                        balance_after=item.product.stock_quantity,
                        reason=f'Restocked from {new_status} Order #{order.order_number}',
                        reference_no=order.order_number
                    )

        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def toggle_payment_status(self, request, pk=None):
        order = self.get_object()
        target_status = request.data.get('target_status')
        if not target_status:
            target_status = 'PENDING' if order.payment_status == 'PAID' else 'PAID'
        if target_status == 'UNPAID':
            target_status = 'PENDING'

        order.payment_status = target_status
        if target_status == 'PENDING':
            order.payment_method = 'KHATA'
            PaymentTransaction.objects.filter(order=order).delete()
            from core.models import CashRegisterEntry
            CashRegisterEntry.objects.filter(
                Q(reference_id=str(order.id)) | 
                Q(reference_id=order.order_number)
            ).delete()
        elif target_status == 'PAID':
            if order.payment_method == 'KHATA':
                order.payment_method = 'CASH'
            if not PaymentTransaction.objects.filter(order=order).exists():
                import random
                from django.utils import timezone
                ts = timezone.now().strftime('%Y%m%d%H%M%S')
                PaymentTransaction.objects.create(
                    order=order,
                    transaction_id=f"TXN-SETTLE-{ts}-{random.randint(100, 999)}",
                    amount=order.total_amount,
                    payment_method=order.payment_method or 'CASH',
                    status='PAID',
                    notes=f"Bill #{order.order_number} marked as Paid"
                )

            if order.payment_method in ['UPI', 'CARD', 'BANK', 'ONLINE']:
                try:
                    from core.models import BankTransaction
                    BankTransaction.objects.create(
                        transaction_type='UPI_IN',
                        amount=order.total_amount,
                        reference_number=f"UPI-SETTLE-{order.order_number}",
                        bank_name='HDFC Store Primary Bank',
                        notes=f"Bill Settlement #{order.order_number} ({order.customer_name or 'Customer'})",
                        created_by=request.user if request.user.is_authenticated else None
                    )
                except Exception as b_err:
                    print("Bank auto-log error for toggle payment status:", b_err)

        order.save(update_fields=['payment_status', 'payment_method'])

        return Response({
            'success': True,
            'message': f'Bill #{order.order_number} marked as {order.payment_status} and payment logs updated!',
            'order_id': order.id,
            'payment_status': order.payment_status,
            'payment_method': order.payment_method
        })

    @action(detail=True, methods=['get'])
    def invoice_details(self, request, pk=None):
        order = self.get_object()
        store_info = {
            'name': 'Tulsi Mart',
            'tagline': 'Fresh Groceries & Daily Needs',
            'phone': '+91 98765 43210',
            'email': 'contact@tulsimart.com',
            'address': 'Shop No. 12, Green Park Avenue, Main Market, Mumbai, MH - 400001',
            'gstin': '27AABCT1234F1Z8',
            'logo_url': '/logo.png',
            'footer_terms': 'Thank you for shopping with Tulsi Mart!',
        }
        order_data = OrderSerializer(order).data
        return Response({
            'order': order_data,
            'store': store_info,
            'invoice_prefix': 'TM-INV-'
        })


class PaymentTransactionViewSet(viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all().select_related('order')
    serializer_class = PaymentTransactionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        method = self.request.query_params.get('method')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        if method:
            qs = qs.filter(payment_method=method)
        if status_param:
            qs = qs.filter(status=status_param)
        if search:
            qs = qs.filter(
                Q(transaction_id__icontains=search) |
                Q(order__order_number__icontains=search) |
                Q(order__customer_name__icontains=search)
            )
        return qs
