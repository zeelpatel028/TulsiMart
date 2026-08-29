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


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    user = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(
        required=True,
        allow_blank=False,
        error_messages={
            'required': 'Password is required.',
            'blank': 'Password cannot be empty.'
        }
    )

    def validate(self, attrs):
        user_identifier = (
            attrs.get('username') or
            attrs.get('email') or
            attrs.get('user') or
            ''
        ).strip()
        
        if not user_identifier:
            raise serializers.ValidationError({
                'username': 'Username or Email address is required.'
            })
        
        attrs['user_identifier'] = user_identifier
        return attrs



class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'


class CashRegisterEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='created_by_name', read_only=True, default='Admin')
    entry_type_label = serializers.CharField(source='get_entry_type_display', read_only=True)

    class Meta:
        model = CashRegisterEntry
        fields = '__all__'


class BankTransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='created_by_name', read_only=True, default='Admin')
    transaction_type_label = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = BankTransaction
        fields = '__all__'
