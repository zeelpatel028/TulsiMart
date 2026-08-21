from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django.utils import timezone
from .models import ExpenseCategory, Expense
from .serializers import ExpenseCategorySerializer, ExpenseSerializer

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.AllowAny]


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().select_related('category', 'created_by')
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')
        payment_method = self.request.query_params.get('payment_method')

        if category_id:
            qs = qs.filter(category_id=category_id)
        if payment_method:
            qs = qs.filter(payment_method=payment_method)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(paid_to__icontains=search) |
                Q(notes__icontains=search)
            )
        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        
        today_total = Expense.objects.filter(date=today).aggregate(t=Sum('amount'))['t'] or 0.0
        month_total = Expense.objects.filter(date__gte=this_month_start, date__lte=today).aggregate(t=Sum('amount'))['t'] or 0.0
        total_all_time = Expense.objects.aggregate(t=Sum('amount'))['t'] or 0.0

        # Category breakdown for this month
        category_data = (
            Expense.objects.filter(date__gte=this_month_start, date__lte=today)
            .values('category__name', 'category__color')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        return Response({
            'today_expenses': float(today_total),
            'monthly_expenses': float(month_total),
            'total_expenses': float(total_all_time),
            'category_breakdown': category_data
        })
