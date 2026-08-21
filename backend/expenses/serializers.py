from rest_framework import serializers
from .models import ExpenseCategory, Expense

class ExpenseCategorySerializer(serializers.ModelSerializer):
    expense_count = serializers.IntegerField(source='expenses.count', read_only=True)

    class Meta:
        model = ExpenseCategory
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=ExpenseCategory.objects.all(), required=False, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default='Admin')

    class Meta:
        model = Expense
        fields = '__all__'

    def validate(self, attrs):
        if not attrs.get('category'):
            cat = ExpenseCategory.objects.filter(name__icontains='Staff').first() or \
                  ExpenseCategory.objects.filter(name__icontains='Payroll').first() or \
                  ExpenseCategory.objects.first()
            if not cat:
                cat, _ = ExpenseCategory.objects.get_or_create(
                    name="Staff & Payroll",
                    defaults={'icon': 'Users', 'color': '#384959'}
                )
            attrs['category'] = cat
        return attrs

    def create(self, validated_data):
        expense = super().create(validated_data)
        if expense.payment_method and expense.payment_method.upper() != 'CASH':
            try:
                from core.models import BankTransaction
                BankTransaction.objects.create(
                    transaction_type='EXPENSE_PAYOUT',
                    amount=expense.amount,
                    reference_number=f"EXP-{expense.id}",
                    bank_name='HDFC Store Primary Bank',
                    notes=f"Expense Payout: {expense.title} ({expense.paid_to or 'Vendor'})",
                    created_by=expense.created_by
                )
            except Exception as b_err:
                print("Bank auto-log error for expense:", b_err)
        return expense
