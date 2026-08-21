from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StoreSetting, ActivityLog, CashRegisterEntry, BankTransaction

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone', 'avatar', 'address', 'salary', 'hire_date', 'is_staff_active', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']


class StaffCreateUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.CharField(required=False, allow_blank=True, default='CASHIER')

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'password', 'role', 'phone', 'avatar', 'address', 'salary', 'hire_date', 'is_staff_active']

    def validate(self, attrs):
        if not attrs.get('username'):
            phone = attrs.get('phone', '')
            digits = ''.join(filter(str.isdigit, str(phone)))
            import time
            attrs['username'] = f"staff_{digits[-6:]}" if len(digits) >= 4 else f"user_{int(time.time())}"
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', 'Staff@1234')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class StoreSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreSetting
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

