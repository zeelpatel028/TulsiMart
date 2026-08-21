from rest_framework import serializers
from .models import Category, Brand, Unit, Product, StockMovement

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = '__all__'


class BrandSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

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
    stock_status = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = '__all__'

    def validate(self, data):
        # Auto calculate discount if mrp and selling_price provided
        mrp = data.get('mrp')
        selling_price = data.get('selling_price')
        if mrp is not None and selling_price is not None:
            if mrp > 0 and selling_price < mrp:
                data['discount_percent'] = round(((mrp - selling_price) / mrp) * 100, 2)
            elif selling_price >= mrp:
                data['discount_percent'] = 0.00
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True, default='System')

    class Meta:
        model = StockMovement
        fields = '__all__'
