from rest_framework import serializers
from .models import Coupon, FestivalOffer

class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.ReadOnlyField()

    class Meta:
        model = Coupon
        fields = '__all__'


class FestivalOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = FestivalOffer
        fields = '__all__'
