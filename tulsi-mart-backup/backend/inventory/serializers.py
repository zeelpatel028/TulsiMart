from rest_framework import serializers
from .models import Category, Brand, Unit, Product, StockMovement
from suppliers.models import Supplier

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = '__all__'


class BrandSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Brand
        fields = '__all__'


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True, allow_null=True)
    unit_name = serializers.CharField(source='unit.short_name', read_only=True, allow_null=True)
    product_unit_name = serializers.CharField(source='unit.name', read_only=True, allow_null=True)
    selling_unit_name = serializers.CharField(source='selling_unit.short_name', read_only=True, allow_null=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, allow_null=True)
    formatted_product_id = serializers.ReadOnlyField()
    stock_status = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = '__all__'

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            for key in ['category', 'brand', 'unit', 'selling_unit', 'supplier']:
                val = data.get(key)
                if isinstance(val, dict) and 'id' in val:
                    data[key] = val['id']
                elif isinstance(val, str) and val.isdigit():
                    data[key] = int(val)
                elif val == '' or val == 'null':
                    data[key] = None
        return super().to_internal_value(data)

    def validate(self, data):
        mfg = data.get('manufacturing_date')
        exp = data.get('expiry_date')
        if mfg and exp and exp < mfg:
            raise serializers.ValidationError({'expiry_date': 'Expiry date cannot be before manufacturing date.'})

        mrp = data.get('mrp')
        selling_price = data.get('selling_price')
        if mrp is not None and selling_price is not None:
            if mrp > 0 and selling_price > mrp:
                raise serializers.ValidationError({'selling_price': 'Selling price cannot exceed MRP.'})
            if mrp > 0 and selling_price < mrp:
                data['discount_percent'] = round(((mrp - selling_price) / mrp) * 100, 2)
            elif selling_price >= mrp:
                data['discount_percent'] = 0.00

        for price_field in ['purchase_non_tax_price', 'selling_non_tax_price', 'mrp', 'selling_price', 'cost_price']:
            val = data.get(price_field)
            if val is not None and val < 0:
                raise serializers.ValidationError({price_field: 'Price cannot be negative.'})

        return data


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True, default='System')

    class Meta:
        model = StockMovement
        fields = '__all__'
