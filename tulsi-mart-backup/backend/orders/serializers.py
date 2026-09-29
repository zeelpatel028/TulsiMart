from rest_framework import serializers
from django.utils import timezone
import random
import uuid
from .models import Order, OrderItem, PaymentTransaction
from inventory.models import Product, StockMovement

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(required=False, allow_blank=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ['order']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='order.customer_name', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = '__all__'


def calculate_greedy_notes(amount):
    try:
        amt = int(round(float(amount or 0)))
        denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1]
        res = {}
        for d in denoms:
            if amt >= d:
                count = amt // d
                res[str(d)] = count
                amt = amt % d
        return res
    except Exception:
        return {}

def format_notes_summary(notes_dict):
    if not isinstance(notes_dict, dict):
        return ""
    parts = []
    try:
        for k in sorted(notes_dict.keys(), key=lambda x: int(x), reverse=True):
            count = int(notes_dict[k] or 0)
            if count > 0:
                parts.append(f"{count}×₹{k}")
        return " + ".join(parts)
    except Exception:
        return ""


class OrderSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(required=False, allow_blank=True)
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    coupon_applied = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    coupon_code = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    items = OrderItemSerializer(many=True, required=False)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default='Admin')

    class Meta:
        model = Order
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            if 'customer' in data:
                val = data.get('customer')
                if isinstance(val, dict) and 'id' in val:
                    data['customer'] = val['id']
                elif isinstance(val, str) and val.isdigit():
                    data['customer'] = int(val)
                elif val == '' or val == 'null':
                    data['customer'] = None
        return super().to_internal_value(data)

    def create(self, validated_data):
        request = self.context.get('request')
        items_data = request.data.get('items', []) if request and hasattr(request, 'data') else self.initial_data.get('items', [])
        coupon_code = validated_data.pop('coupon_code', None)
        if coupon_code and not validated_data.get('coupon_applied'):
            validated_data['coupon_applied'] = coupon_code
        
        # Auto generate order_number if missing
        import uuid
        
        today_str = timezone.now().strftime('%Y%m%d')
        rand_suffix = random.randint(1000, 9999)
        
        if not validated_data.get('order_number'):
            validated_data['order_number'] = f"TM-ORD-{today_str}-{rand_suffix}"
            
        if not validated_data.get('invoice_number'):
            validated_data['invoice_number'] = f"TM-INV-{today_str}-{rand_suffix}"

        # Calculate change_returned if cash_tendered is provided
        cash_tendered_val = validated_data.get('cash_tendered')
        if cash_tendered_val is not None and float(cash_tendered_val) > 0:
            tot = float(validated_data.get('total_amount', 0))
            validated_data['change_returned'] = max(0.0, round(float(cash_tendered_val) - tot, 2))
        elif validated_data.get('payment_method') == 'CASH':
            # Default cash_tendered to total_amount if not specified
            validated_data['cash_tendered'] = validated_data.get('total_amount', 0)
            validated_data['change_returned'] = 0.00

        # Auto compute note breakdowns if missing
        if validated_data.get('payment_method') == 'CASH':
            if not validated_data.get('tendered_notes'):
                validated_data['tendered_notes'] = calculate_greedy_notes(validated_data.get('cash_tendered', 0))
            
            c_ret = validated_data.get('change_returned', 0.0)
            if not validated_data.get('change_notes') and c_ret and float(c_ret) > 0:
                validated_data['change_notes'] = calculate_greedy_notes(c_ret)

        validated_data.pop('items', None)
        order = Order.objects.create(**validated_data)
        
        subtotal = 0
        tax_total = 0
        
        for item in items_data:
            p_id = item.get('product')
            qty = int(item.get('quantity', 1))
            price = float(item.get('unit_price', 0))
            gst = float(item.get('gst_percent', 0))
            line_subtotal = price * qty
            
            product_obj = None
            p_name = item.get('product_name', 'Grocery Item')
            p_sku = item.get('sku', '')
            
            if p_id:
                try:
                    product_obj = Product.objects.get(id=p_id)
                    p_name = product_obj.name
                    p_sku = product_obj.sku
                    # Deduct stock
                    old_stock = product_obj.stock_quantity
                    product_obj.stock_quantity = max(0, product_obj.stock_quantity - qty)
                    product_obj.save()
                    
                    # Log stock movement
                    StockMovement.objects.create(
                        product=product_obj,
                        movement_type='OUT_SALE',
                        quantity=-qty,
                        balance_after=product_obj.stock_quantity,
                        reason=f'Sold via Order #{order.order_number}',
                        reference_no=order.order_number
                    )
                except Product.DoesNotExist:
                    pass

            OrderItem.objects.create(
                order=order,
                product=product_obj,
                product_name=p_name,
                sku=p_sku,
                unit_price=price,
                quantity=qty,
                gst_percent=gst,
                subtotal=line_subtotal
            )
            
            subtotal += line_subtotal
            tax_total += line_subtotal * (gst / 100)

        # Create payment transaction if paid
        if order.payment_status == 'PAID' or order.payment_method in ['CASH', 'UPI', 'CARD']:
            txn_notes = f"Payment for {order.order_number}"
            if order.payment_method == 'CASH' and order.cash_tendered:
                t_str = format_notes_summary(order.tendered_notes)
                c_str = format_notes_summary(order.change_notes)
                t_desc = f" (Tendered: ₹{order.cash_tendered}" + (f" [{t_str}]" if t_str else "")
                c_desc = f", Change: ₹{order.change_returned}" + (f" [{c_str}]" if c_str else "") + ")"
                txn_notes += t_desc + c_desc

            PaymentTransaction.objects.create(
                order=order,
                transaction_id=f"TXN-{today_str}-{rand_suffix}",
                amount=order.total_amount,
                payment_method=order.payment_method,
                status='PAID',
                notes=txn_notes
            )

            if order.payment_method in ['UPI', 'CARD']:
                try:
                    from core.models import BankTransaction
                    BankTransaction.objects.create(
                        transaction_type='UPI_IN',
                        amount=order.total_amount,
                        reference_number=f"UPI-{order.invoice_number or order.order_number}",
                        bank_name='HDFC Store Primary Bank',
                        notes=f"POS UPI Sale #{order.order_number} ({order.customer_name or 'Walk-in Customer'})",
                        created_by=order.created_by
                    )
                except Exception as b_err:
                    print("Bank auto-log error for order:", b_err)

        return order
