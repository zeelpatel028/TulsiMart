import random
from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Sum
from .models import Customer, CustomerFeedback
from .serializers import CustomerSerializer, CustomerFeedbackSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().prefetch_related('feedbacks', 'orders')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        if status_param:
            qs = qs.filter(status=status_param)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search) |
                Q(city__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'])
    def toggle_block(self, request, pk=None):
        customer = self.get_object()
        customer.status = 'BLOCKED' if customer.status == 'ACTIVE' else 'ACTIVE'
        customer.save()
        return Response({'status': customer.status})

    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        customer = self.get_object()
        orders = customer.orders.all().order_by('-created_at')[:30]
        from orders.serializers import OrderSerializer
        return Response(OrderSerializer(orders, many=True).data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def toggle_bill_payment_status(self, request, pk=None):
        customer = self.get_object()
        order_id = request.data.get('order_id')
        target_status = request.data.get('target_status')

        if not order_id:
            return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from orders.models import Order, PaymentTransaction
        from core.models import CashRegisterEntry
        try:
            order = customer.orders.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Bill not found for this customer'}, status=status.HTTP_404_NOT_FOUND)

        if not target_status:
            target_status = 'PENDING' if order.payment_status == 'PAID' else 'PAID'

        if target_status == 'UNPAID':
            target_status = 'PENDING'

        order.payment_status = target_status
        if target_status == 'PENDING':
            order.payment_method = 'KHATA'
            # Delete all payment transaction logs for this order
            PaymentTransaction.objects.filter(order=order).delete()
            # Delete Gulla register entries referencing this order
            CashRegisterEntry.objects.filter(
                Q(reference_id=str(order.id)) | 
                Q(reference_id=order.order_number)
            ).delete()
        elif target_status == 'PAID':
            if order.payment_method == 'KHATA':
                order.payment_method = 'CASH'
            # Create a clean payment transaction log if none exists
            if not PaymentTransaction.objects.filter(order=order).exists():
                ts = timezone.now().strftime('%Y%m%d%H%M%S')
                PaymentTransaction.objects.create(
                    order=order,
                    transaction_id=f"TXN-SETTLE-{ts}-{random.randint(100, 999)}",
                    amount=order.total_amount,
                    payment_method=order.payment_method or 'CASH',
                    status='PAID',
                    notes=f"Bill #{order.order_number} marked as Paid"
                )

        order.save(update_fields=['payment_status', 'payment_method'])

        # Recalculate customer pending balance
        new_pending = customer.orders.filter(payment_status='PENDING').aggregate(total=Sum('total_amount'))['total'] or 0.00

        return Response({
            'success': True,
            'message': f'Bill #{order.order_number} marked as {order.payment_status} and payment logs cleared!',
            'order_id': order.id,
            'payment_status': order.payment_status,
            'payment_method': order.payment_method,
            'new_pending_payments': float(new_pending)
        })

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def khata_payment(self, request, pk=None):
        customer = self.get_object()
        amount_raw = request.data.get('amount', 0)
        cash_tendered_raw = request.data.get('cash_tendered')
        change_returned_raw = request.data.get('change_returned')
        notes = request.data.get('notes', 'Khata Bill Payment')
        denomination_counts = request.data.get('denomination_counts')
        change_notes = request.data.get('change_notes')
        payment_method = request.data.get('payment_method', 'CASH')
        order_id = request.data.get('order_id')

        # Python backend auto-calculation from denomination counts if supplied
        if denomination_counts:
            from core.gulla_services import calculate_denomination_breakdown
            calc_total, calc_notes_str = calculate_denomination_breakdown(denomination_counts)
            if calc_total > 0 and not cash_tendered_raw:
                cash_tendered_raw = calc_total
            if calc_notes_str and calc_notes_str not in notes:
                notes = f"{notes} ({calc_notes_str})" if notes else calc_notes_str

        try:
            amount = Decimal(str(amount_raw))
        except (ValueError, TypeError):
            return Response({'error': 'Invalid payment amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        if amount <= 0:
            return Response({'error': 'Payment amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        cash_tendered = None
        change_returned = Decimal('0.00')
        if payment_method == 'CASH':
            if cash_tendered_raw is not None and str(cash_tendered_raw).strip() != '':
                try:
                    cash_tendered = Decimal(str(cash_tendered_raw))
                    change_returned = max(Decimal('0.00'), cash_tendered - amount)
                except (ValueError, TypeError):
                    cash_tendered = amount
            else:
                cash_tendered = amount

            if change_returned_raw is not None and str(change_returned_raw).strip() != '':
                try:
                    change_returned = Decimal(str(change_returned_raw))
                except (ValueError, TypeError):
                    pass

        from orders.models import Order, PaymentTransaction

        settled_orders = []

        txn_notes = notes
        if payment_method == 'CASH' and cash_tendered is not None:
            tender_info = f" [Tendered: ₹{cash_tendered:.2f}, Change Returned: ₹{change_returned:.2f}]"
            if "Tendered:" not in txn_notes:
                txn_notes = f"{txn_notes}{tender_info}"

        def get_order_paid_total(order_obj):
            return order_obj.transactions.filter(status='PAID').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

        if order_id:
            try:
                target_order = customer.orders.get(id=order_id)
                ts = timezone.now().strftime('%Y%m%d%H%M%S')
                PaymentTransaction.objects.create(
                    order=target_order,
                    transaction_id=f"TXN-KHATA-{ts}-{random.randint(100, 999)}",
                    amount=amount,
                    payment_method=payment_method,
                    status='PAID',
                    notes=txn_notes
                )
                
                total_paid_so_far = get_order_paid_total(target_order)
                if total_paid_so_far >= target_order.total_amount:
                    target_order.payment_status = 'PAID'

                target_order.payment_method = payment_method
                if payment_method == 'CASH':
                    target_order.cash_tendered = cash_tendered
                    target_order.change_returned = change_returned
                    if denomination_counts:
                        target_order.tendered_notes = denomination_counts
                    if change_notes:
                        target_order.change_notes = change_notes
                    target_order.save(update_fields=['payment_status', 'payment_method', 'cash_tendered', 'change_returned', 'tendered_notes', 'change_notes'])
                else:
                    target_order.save(update_fields=['payment_status', 'payment_method'])
                
                settled_orders.append(target_order.order_number)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            remaining_amount = amount
            pending_orders = customer.orders.filter(payment_status='PENDING').order_by('created_at')
            for po in pending_orders:
                if remaining_amount <= 0:
                    break
                
                already_paid = get_order_paid_total(po)
                needed_for_this = max(Decimal('0.00'), po.total_amount - already_paid)
                paid_for_this = min(remaining_amount, needed_for_this)
                if paid_for_this <= 0:
                    continue

                ts = timezone.now().strftime('%Y%m%d%H%M%S')
                PaymentTransaction.objects.create(
                    order=po,
                    transaction_id=f"TXN-KHATA-{ts}-{random.randint(100, 999)}",
                    amount=paid_for_this,
                    payment_method=payment_method,
                    status='PAID',
                    notes=txn_notes
                )

                new_total_paid = already_paid + paid_for_this
                if new_total_paid >= po.total_amount:
                    po.payment_status = 'PAID'

                po.payment_method = payment_method
                if payment_method == 'CASH':
                    po.cash_tendered = cash_tendered or paid_for_this
                    po.change_returned = change_returned
                    if denomination_counts:
                        po.tendered_notes = denomination_counts
                    if change_notes:
                        po.change_notes = change_notes
                    po.save(update_fields=['payment_status', 'payment_method', 'cash_tendered', 'change_returned', 'tendered_notes', 'change_notes'])
                else:
                    po.save(update_fields=['payment_status', 'payment_method'])

                settled_orders.append(po.order_number)
                remaining_amount -= paid_for_this

        # Recalculate remaining pending balance for customer across all PENDING orders
        pending_orders = customer.orders.filter(payment_status='PENDING')
        new_pending_total = Decimal('0.00')
        for po in pending_orders:
            already_paid = get_order_paid_total(po)
            due = max(Decimal('0.00'), po.total_amount - already_paid)
            new_pending_total += due

        if payment_method != 'CASH':
            try:
                from core.models import BankTransaction
                BankTransaction.objects.create(
                    transaction_type='UPI_IN',
                    amount=amount,
                    reference_number=f"KHATA-{customer.id}-{int(timezone.now().timestamp())}",
                    bank_name='HDFC Store Primary Bank',
                    notes=f"Khata Customer Settlement: {customer.name} ({customer.phone})",
                    created_by=request.user if request.user.is_authenticated else None
                )
            except Exception as b_err:
                print("Bank auto-log error for Khata payment:", b_err)

        msg = f'Khata payment of ₹{amount:.2f} received via {payment_method}!'
        if payment_method == 'CASH' and change_returned > 0:
            msg += f' Change to return: ₹{change_returned:.2f}'

        return Response({
            'success': True,
            'message': msg,
            'settled_orders': settled_orders,
            'cash_tendered': float(cash_tendered) if cash_tendered else None,
            'change_returned': float(change_returned),
            'new_pending_payments': float(new_pending_total)
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_feedback(self, request, pk=None):
        customer = self.get_object()
        serializer = CustomerFeedbackSerializer(data={
            'customer': customer.id,
            'rating': request.data.get('rating', 5),
            'comment': request.data.get('comment', ''),
            'order_ref': request.data.get('order_ref', '')
        })
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class CustomerFeedbackViewSet(viewsets.ModelViewSet):
    queryset = CustomerFeedback.objects.all()
    serializer_class = CustomerFeedbackSerializer
    permission_classes = [permissions.AllowAny]
