from rest_framework import serializers
from .models import ActivityLog, CashRegisterEntry, BankTransaction, Staff, StoreSetting, LoginAccount

class StoreSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSetting
        fields = '__all__'


class LoginAccountSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = LoginAccount
        fields = '__all__'


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'


class CashRegisterEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    entry_type_label = serializers.CharField(source='get_entry_type_display', read_only=True)

    class Meta:
        model = CashRegisterEntry
        fields = '__all__'


class BankTransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    transaction_type_label = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = BankTransaction
        fields = '__all__'
