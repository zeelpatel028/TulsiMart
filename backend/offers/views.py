from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Coupon, FestivalOffer
from .serializers import CouponSerializer, FestivalOfferSerializer

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        active_only = self.request.query_params.get('active_only')
        search = self.request.query_params.get('search')
        if active_only == 'true':
            today = timezone.now().date()
            qs = qs.filter(is_active=True, valid_from__lte=today, valid_to__gte=today)
        if search:
            qs = qs.filter(Q(code__icontains=search) | Q(title__icontains=search))
        return qs

    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        code = request.data.get('code', '').strip().upper()
        order_amount = float(request.data.get('order_amount', 0))
        
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'message': 'Invalid coupon code.'}, status=status.HTTP_404_NOT_FOUND)

        if not coupon.is_valid:
            return Response({'valid': False, 'message': 'Coupon has expired or reached usage limit.'}, status=status.HTTP_400_BAD_REQUEST)

        if order_amount < float(coupon.min_order_amount):
            return Response({
                'valid': False, 
                'message': f'Minimum order amount of ₹{coupon.min_order_amount} required for this coupon.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate discount
        if coupon.offer_type == 'PERCENTAGE':
            calc_discount = (order_amount * float(coupon.discount_value)) / 100
            if coupon.max_discount_amount:
                calc_discount = min(calc_discount, float(coupon.max_discount_amount))
        elif coupon.offer_type == 'FLAT':
            calc_discount = min(order_amount, float(coupon.discount_value))
        else:
            calc_discount = float(coupon.discount_value)

        return Response({
            'valid': True,
            'code': coupon.code,
            'title': coupon.title,
            'offer_type': coupon.offer_type,
            'discount_amount': round(calc_discount, 2),
            'message': f'Coupon {coupon.code} applied successfully!'
        })


class FestivalOfferViewSet(viewsets.ModelViewSet):
    queryset = FestivalOffer.objects.all()
    serializer_class = FestivalOfferSerializer
    permission_classes = [permissions.AllowAny]
