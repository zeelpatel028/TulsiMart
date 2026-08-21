import random
from django.utils import timezone
from rest_framework import serializers
from .models import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceiptNote, SupplierPayment
from inventory.models import Product, StockMovement

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(required=False, allow_blank=True, default='')
    unit_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.00)
    quantity = serializers.IntegerField(required=False, default=1)
    discount_rate = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0.00)
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0.00)
    received_quantity = serializers.IntegerField(required=False, default=0)
    damaged_quantity = serializers.IntegerField(required=False, default=0)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0.00)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), required=False, allow_null=True)

    class Meta:
        model = PurchaseOrderItem
        fields = '__all__'
        read_only_fields = ['purchase_order']


class GoodsReceiptNoteSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_company = serializers.CharField(source='supplier.company_name', read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True)

    class Meta:
        model = GoodsReceiptNote
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(required=False, allow_blank=True)
    order_date = serializers.DateField(required=False)
    items = PurchaseOrderItemSerializer(many=True, required=False)
    grns = GoodsReceiptNoteSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_company = serializers.CharField(source='supplier.company_name', read_only=True)
    due_amount = serializers.ReadOnlyField()

    class Meta:
        model = PurchaseOrder
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        if not items_data and self.context.get('request'):
            items_data = self.context.get('request').data.get('items', [])
        
        # Generate PO number if not given
        if not validated_data.get('po_number'):
            ts = timezone.now().strftime('%Y%m')
            validated_data['po_number'] = f"PO-{ts}-{random.randint(1000, 9999)}"
        if not validated_data.get('order_date'):
            validated_data['order_date'] = timezone.now().date()

        po = PurchaseOrder.objects.create(**validated_data)
        
        computed_total = 0
        for item in items_data:
            if isinstance(item, dict):
                product_obj = item.get('product')
                if isinstance(product_obj, int):
                    try:
                        product_obj = Product.objects.get(id=product_obj)
                    except Product.DoesNotExist:
                        product_obj = None
                
                qty = int(item.get('quantity', 1) or 1)
                cost = float(item.get('unit_cost', 0) or 0)
                subtotal = float(item.get('subtotal', 0) or (qty * cost))
                p_name = item.get('product_name') or (product_obj.name if product_obj else 'Item')
                
                PurchaseOrderItem.objects.create(
                    purchase_order=po,
                    product=product_obj,
                    product_name=p_name,
                    unit_cost=cost,
                    quantity=qty,
                    discount_rate=float(item.get('discount_rate', 0) or 0),
                    tax_rate=float(item.get('tax_rate', 0) or 0),
                    subtotal=subtotal
                )
                computed_total += subtotal

        if not po.total_amount or float(po.total_amount) <= 0:
            po.total_amount = computed_total
            po.save(update_fields=['total_amount'])

        return po


class SupplierPaymentSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = SupplierPayment
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    total_purchases = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()
    pending_balance = serializers.ReadOnlyField()
    recent_po = PurchaseOrderSerializer(source='purchase_orders', many=True, read_only=True)

    class Meta:
        model = Supplier
        fields = '__all__'
