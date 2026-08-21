from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from .serializers import (
    SupplierSerializer, 
    PurchaseOrderSerializer, 
    PurchaseOrderItemSerializer,
    GoodsReceiptNoteSerializer,
    SupplierPaymentSerializer
)
from inventory.models import StockMovement

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().prefetch_related('purchase_orders', 'payments')
    serializer_class = SupplierSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(company_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(gstin__icontains=search)
            )
        if category and category != 'ALL':
            qs = qs.filter(category=category)
        return qs


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().select_related('supplier').prefetch_related('items', 'grns')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        supplier_id = self.request.query_params.get('supplier')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if supplier_id:
            qs = qs.filter(supplier_id=supplier_id)
        if status_param and status_param != 'ALL':
            qs = qs.filter(status=status_param)
        if search:
            qs = qs.filter(
                Q(po_number__icontains=search) |
                Q(supplier__name__icontains=search) |
                Q(supplier__company_name__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def update_status(self, request, pk=None):
        po = self.get_object()
        data = request.data
        if isinstance(data, str):
            new_status = data
            received_items_data = []
        elif isinstance(data, dict):
            new_status = data.get('status')
            received_items_data = data.get('items', [])
        else:
            new_status = None
            received_items_data = []

        old_status = po.status
        
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)

        po.status = new_status
        if new_status == 'RECEIVED':
            from django.utils import timezone
            po.received_date = timezone.now().date()
        po.save()

        # If PO is marked RECEIVED, add stock to products & generate GRN
        if new_status == 'RECEIVED' and old_status != 'RECEIVED':
            custom_items_map = {}
            if received_items_data:
                for item_d in received_items_data:
                    item_key = item_d.get('id') or item_d.get('item_id') or item_d.get('product')
                    if item_key:
                        custom_items_map[item_key] = item_d

            total_grn_valuation = Decimal('0.00')

            for item in po.items.all():
                c_data = custom_items_map.get(item.id) or (custom_items_map.get(item.product_id) if item.product_id else None)
                recv_qty = int(c_data['received_quantity']) if (c_data and 'received_quantity' in c_data) else item.quantity
                dmg_qty = int(c_data['damaged_quantity']) if (c_data and 'damaged_quantity' in c_data) else 0
                
                if c_data and 'unit_cost' in c_data:
                    item.unit_cost = Decimal(str(c_data['unit_cost']))
                if c_data and 'received_quantity' in c_data:
                    item.received_quantity = recv_qty
                if c_data and 'damaged_quantity' in c_data:
                    item.damaged_quantity = dmg_qty
                if c_data and 'batch_number' in c_data:
                    item.batch_number = c_data['batch_number']
                if c_data and 'mfg_date' in c_data:
                    item.mfg_date = c_data['mfg_date'] if c_data['mfg_date'] else None
                if c_data and 'expiry_date' in c_data:
                    item.expiry_date = c_data['expiry_date'] if c_data['expiry_date'] else None
                
                item.subtotal = item.quantity * item.unit_cost
                item.save()

                total_grn_valuation += (Decimal(str(recv_qty)) * item.unit_cost)

                if item.product:
                    if c_data and 'unit_cost' in c_data and Decimal(str(c_data['unit_cost'])) > Decimal('0.00'):
                        item.product.cost_price = Decimal(str(c_data['unit_cost']))
                    if c_data and 'expiry_date' in c_data and c_data['expiry_date']:
                        item.product.expiry_date = c_data['expiry_date']
                    item.product.stock_quantity += recv_qty
                    item.product.save()

                    StockMovement.objects.create(
                        product=item.product,
                        movement_type='IN_PURCHASE',
                        quantity=recv_qty,
                        balance_after=item.product.stock_quantity,
                        reason=f'GRN Verified for PO #{po.po_number}',
                        reference_no=po.po_number
                    )

            # Auto-create Goods Receipt Note (GRN) record
            grn_num = f"GRN-{po.po_number.replace('PO-', '')}"
            GoodsReceiptNote.objects.get_or_create(
                grn_number=grn_num,
                defaults={
                    'purchase_order': po,
                    'supplier': po.supplier,
                    'total_valuation': total_grn_valuation or po.total_amount,
                    'notes': f"Verified goods for PO {po.po_number}"
                }
            )

        elif new_status != 'RECEIVED' and old_status == 'RECEIVED':
            for item in po.items.all():
                if item.product:
                    item.product.stock_quantity = max(0, item.product.stock_quantity - (item.received_quantity or item.quantity))
                    item.product.save()
                    StockMovement.objects.create(
                        product=item.product,
                        movement_type='OUT_ADJUSTMENT',
                        quantity=item.received_quantity or item.quantity,
                        balance_after=item.product.stock_quantity,
                        reason=f'Reverted PO #{po.po_number} to {new_status}',
                        reference_no=po.po_number
                    )

        return Response(PurchaseOrderSerializer(po).data)


class GoodsReceiptNoteViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceiptNote.objects.all().select_related('purchase_order', 'supplier')
    serializer_class = GoodsReceiptNoteSerializer
    permission_classes = [permissions.AllowAny]


class SupplierPaymentViewSet(viewsets.ModelViewSet):
    queryset = SupplierPayment.objects.all().select_related('supplier', 'purchase_order')
    serializer_class = SupplierPaymentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        supplier_id = self.request.query_params.get('supplier')
        if supplier_id:
            qs = qs.filter(supplier_id=supplier_id)
        return qs

    def perform_create(self, serializer):
        denomination_counts = self.request.data.get('denomination_counts')
        notes = self.request.data.get('notes', '')
        amount = serializer.validated_data.get('amount')

        if denomination_counts:
            from core.gulla_services import calculate_denomination_breakdown
            calc_total, calc_notes_str = calculate_denomination_breakdown(denomination_counts)
            if calc_total > 0:
                amount = calc_total
            if calc_notes_str and calc_notes_str not in notes:
                notes = f"{notes} ({calc_notes_str})" if notes else calc_notes_str

        payment = serializer.save(amount=amount, notes=notes)

        # Update paid_amount on purchase_order if linked
        if payment.purchase_order:
            po = payment.purchase_order
            po.paid_amount = float(po.paid_amount) + float(payment.amount)
            po.save()

        # If payment_method is non-cash (BANK_TRANSFER, UPI, CHEQUE), auto-log to BankTransaction ledger
        if payment.payment_method != 'CASH':
            try:
                from core.models import BankTransaction
                BankTransaction.objects.create(
                    transaction_type='SUPPLIER_PAYOUT',
                    amount=payment.amount,
                    reference_number=payment.reference_number or f"PAY-{payment.id}",
                    notes=f"Supplier payout to {payment.supplier.company_name or payment.supplier.name}"
                )
            except Exception as b_err:
                print("Bank transaction logging error:", b_err)
