import csv
import io
import datetime
from decimal import Decimal
from django.db import transaction
from django.db.models import Q, F
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Brand, Unit, Product, StockMovement
from .serializers import (
    CategorySerializer, 
    BrandSerializer, 
    UnitSerializer, 
    ProductSerializer, 
    StockMovementSerializer
)

DEFAULT_UNITS = [
    ('Kilogram', 'kg'),
    ('Gram', 'g'),
    ('Liter', 'L'),
    ('Milliliter', 'ml'),
    ('Piece / Pcs', 'pc'),
    ('Packet / Pack', 'pkt'),
    ('Box / Case', 'box'),
    ('Dozen', 'dz'),
    ('Bottle', 'btl'),
    ('Can', 'can'),
    ('Jar', 'jar'),
    ('Bag / Pouch', 'bag'),
    ('Sachet', 'sachet'),
    ('Meter', 'm'),
]

DEFAULT_CATEGORIES = [
    ('Atta, Rice & Grains (આટો, ચોખા અને અનાજ)', 'ShoppingBag'),
    ('Dal & Pulses (કઠોળ અને દાળ)', 'ShoppingBag'),
    ('Edible Oils & Ghee (તેલ અને ઘી)', 'Droplet'),
    ('Spices, Masala & Salt (મસાલા અને મીઠું)', 'Flame'),
    ('Sugar, Jaggery & Sweeteners (ખાંડ અને ગોળ)', 'Heart'),
    ('Snacks, Namkeen & Chips (નાસ્તો અને વેફર્સ)', 'Cookie'),
    ('Biscuits, Bakery & Cookies (બિસ્કિટ અને બેકરી)', 'Cookie'),
    ('Beverages, Tea & Coffee (ચા, કોફી અને પીણા)', 'Coffee'),
    ('Dairy, Milk & Butter (દૂધ અને ડેરી પ્રોડક્ટ્સ)', 'Milk'),
    ('Dry Fruits, Nuts & Seeds (ડ્રાય ફ્રૂટ્સ)', 'Nut'),
    ('Sauces, Spreads & Ketchup (સોસ અને કેચઅપ)', 'Bottle'),
    ('Personal Care & Soap (સાબુ અને પર્સનલ કેર)', 'Sparkles'),
    ('Cleaning & Household (સફાઈ અને હાઉસહોલ્ડ)', 'Sparkles'),
    ('Pooja Needs & Agarbatti (પૂજા સામગ્રી)', 'Flame'),
    ('Chocolates & Sweets (ચોકલેટ અને સ્વીટ્સ)', 'Heart'),
]

def ensure_grocery_defaults():
    try:
        if Unit.objects.count() < len(DEFAULT_UNITS):
            for name, short in DEFAULT_UNITS:
                Unit.objects.get_or_create(short_name=short, defaults={'name': name})
        if Category.objects.count() < len(DEFAULT_CATEGORIES):
            for name, icon in DEFAULT_CATEGORIES:
                Category.objects.get_or_create(name=name, defaults={'icon': icon})
    except Exception:
        pass


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        ensure_grocery_defaults()
        return super().get_queryset()


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        ensure_grocery_defaults()
        return super().get_queryset()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category', 'brand', 'unit')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        brand_id = self.request.query_params.get('brand')
        stock_status = self.request.query_params.get('stock_status')
        search = self.request.query_params.get('search')
        is_active = self.request.query_params.get('is_active')
        expiry = self.request.query_params.get('expiry') # 'expired', 'near_expiry'

        if category_id:
            qs = qs.filter(category_id=category_id)
        if brand_id:
            qs = qs.filter(brand_id=brand_id)
        if is_active is not None:
            qs = qs.filter(is_active=(is_active == 'true'))
            
        if stock_status == 'out_of_stock':
            qs = qs.filter(stock_quantity__lte=0)
        elif stock_status == 'low_stock':
            qs = qs.filter(stock_quantity__gt=0, stock_quantity__lte=F('min_stock_alert'))
        elif stock_status == 'in_stock':
            qs = qs.filter(stock_quantity__gt=F('min_stock_alert'))

        today = timezone.now().date()
        if expiry == 'expired':
            qs = qs.filter(expiry_date__lt=today)
        elif expiry == 'near_expiry':
            near_date = today + datetime.timedelta(days=30)
            qs = qs.filter(expiry_date__gte=today, expiry_date__lte=near_date)

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(barcode__icontains=search) |
                Q(category__name__icontains=search) |
                Q(brand__name__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        product = serializer.save()
        # Initial stock movement log if stock > 0
        if product.stock_quantity > 0:
            StockMovement.objects.create(
                product=product,
                movement_type='IN_PURCHASE',
                quantity=product.stock_quantity,
                balance_after=product.stock_quantity,
                reason='Initial Stock on Product Creation',
                performed_by=self.request.user if self.request.user.is_authenticated else None
            )

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        action_type = request.data.get('type') # 'ADD', 'SUBTRACT', 'SET'
        qty = int(request.data.get('quantity', 0))
        reason = request.data.get('reason', 'Stock Adjustment')
        
        old_stock = product.stock_quantity
        if action_type == 'ADD':
            product.stock_quantity += qty
            movement_type = 'ADJUSTMENT_ADD'
            movement_qty = qty
        elif action_type == 'SUBTRACT':
            product.stock_quantity = max(0, product.stock_quantity - qty)
            movement_type = 'ADJUSTMENT_SUB'
            movement_qty = -qty
        elif action_type == 'SET':
            diff = qty - old_stock
            product.stock_quantity = qty
            movement_type = 'ADJUSTMENT_ADD' if diff >= 0 else 'ADJUSTMENT_SUB'
            movement_qty = diff
        else:
            return Response({'error': 'Invalid action type'}, status=status.HTTP_400_BAD_REQUEST)
        
        product.save()
        
        StockMovement.objects.create(
            product=product,
            movement_type=movement_type,
            quantity=movement_qty,
            balance_after=product.stock_quantity,
            reason=reason,
            performed_by=request.user if request.user.is_authenticated else None
        )
        
        return Response({
            'status': 'Stock adjusted successfully',
            'product_id': product.id,
            'old_stock': old_stock,
            'new_stock': product.stock_quantity
        })

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_upload(self, request):
        """
        Accepts CSV or JSON list of products for bulk import.
        """
        file_obj = request.FILES.get('file')
        raw_items = request.data.get('items')
        created_count = 0
        errors = []

        if file_obj:
            try:
                decoded_file = file_obj.read().decode('utf-8')
                io_string = io.StringIO(decoded_file)
                reader = csv.DictReader(io_string)
                for row in reader:
                    name = row.get('name', '').strip()
                    sku = row.get('sku', '').strip()
                    if not name or not sku:
                        continue
                    
                    cat_name = row.get('category', 'General')
                    category, _ = Category.objects.get_or_create(name=cat_name)
                    
                    unit_name = row.get('unit', 'pc')
                    unit, _ = Unit.objects.get_or_create(short_name=unit_name, defaults={'name': unit_name.capitalize()})
                    
                    mrp = Decimal(row.get('mrp', '0') or '0')
                    price = Decimal(row.get('selling_price', '0') or mrp)
                    stock = int(row.get('stock_quantity', '0') or '0')
                    
                    p, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults={
                            'name': name,
                            'category': category,
                            'unit': unit,
                            'mrp': mrp,
                            'selling_price': price,
                            'cost_price': Decimal(row.get('cost_price', '0') or str(mrp * Decimal('0.8'))),
                            'stock_quantity': stock,
                            'min_stock_alert': int(row.get('min_stock_alert', '10') or '10'),
                            'barcode': row.get('barcode', sku),
                        }
                    )
                    created_count += 1
            except Exception as e:
                return Response({'error': f'Failed to process file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        elif raw_items:
            # Handle JSON array bulk insert
            for item in raw_items:
                try:
                    category, _ = Category.objects.get_or_create(name=item.get('category_name', 'General'))
                    unit, _ = Unit.objects.get_or_create(short_name=item.get('unit_name', 'pc'), defaults={'name': 'Piece'})
                    
                    Product.objects.create(
                        name=item['name'],
                        sku=item['sku'],
                        category=category,
                        unit=unit,
                        mrp=Decimal(str(item.get('mrp', 0))),
                        selling_price=Decimal(str(item.get('selling_price', item.get('mrp', 0)))),
                        stock_quantity=int(item.get('stock_quantity', 0)),
                        min_stock_alert=int(item.get('min_stock_alert', 10)),
                        barcode=item.get('barcode', item['sku'])
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(str(e))
        
        return Response({
            'status': 'success',
            'imported_count': created_count,
            'errors': errors
        })


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.all().select_related('product', 'performed_by')
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get('product')
        movement_type = self.request.query_params.get('movement_type')
        if product_id:
            qs = qs.filter(product_id=product_id)
        if movement_type:
            qs = qs.filter(movement_type=movement_type)
        return qs
