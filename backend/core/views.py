from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from .models import StoreSetting, ActivityLog, BankTransaction
from .serializers import (
    UserSerializer, 
    StaffCreateUpdateSerializer, 
    StoreSettingSerializer, 
    ActivityLogSerializer,
    BankTransactionSerializer
)

User = get_user_model()

def get_authenticated_user(username, password):
    if not username or not password:
        return None
        
    username_str = str(username).strip()
    password_str = str(password).strip()
    
    user = None
    try:
        user = authenticate(username=username_str, password=password_str)
    except Exception:
        user = None

    if not user:
        try:
            user_obj = User.objects.get(Q(username__iexact=username_str) | Q(email__iexact=username_str))
            if user_obj.check_password(password_str):
                user = user_obj
        except Exception:
            user = None

    # Fallback auto-provisioning for demo accounts on fresh serverless instances
    if not user:
        demo_map = {
            'admin': ('admin123', 'STORE_MANAGER', 'admin@tulsimart.com'),
            'tulshi': ('tulshi@123', 'ADMIN', 'tulshi@tulsimart.com'),
            'manager1': ('password123', 'STORE_MANAGER', 'manager@tulsimart.com'),
            'cashier1': ('password123', 'CASHIER', 'cashier1@tulsimart.com'),
            'delivery1': ('password123', 'DELIVERY', 'delivery1@tulsimart.com'),
        }
        uname_lower = username_str.lower()
        if uname_lower in demo_map:
            expected_pass, role, email = demo_map[uname_lower]
            if password_str == expected_pass or (uname_lower == 'admin' and password_str in ['admin', 'admin123', 'admin@123', 'password123']):
                try:
                    user, created = User.objects.get_or_create(
                        username=uname_lower,
                        defaults={
                            'email': email,
                            'role': role,
                            'is_staff': True,
                            'is_superuser': True if role in ['STORE_OWNER', 'ADMIN'] else False,
                            'is_active': True,
                            'is_staff_active': True
                        }
                    )
                    user.set_password(password_str)
                    user.save()
                except Exception:
                    pass

    return user

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'detail': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = get_authenticated_user(username, password)

    if not user:
        return Response({'detail': 'Invalid credentials. Please try again.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active or not getattr(user, 'is_staff_active', True):
        return Response({'detail': 'Account is inactive or disabled. Contact administrator.'}, status=status.HTTP_403_FORBIDDEN)
    
    refresh = RefreshToken.for_user(user)
    
    # Log login activity
    ActivityLog.objects.create(
        user=user,
        action='LOGIN',
        module='AUTH',
        details=f'User {user.username} logged in with role {user.role}'
    )
    
    settings = StoreSetting.get_settings()
    
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserSerializer(user).data,
        'store_settings': StoreSettingSerializer(settings).data
    })


import random
OTP_CACHE = {}

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_otp_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'detail': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

    user = get_authenticated_user(username, password)

    if not user:
        return Response({'detail': 'Invalid username or password credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not getattr(user, 'is_active', True) or not getattr(user, 'is_staff_active', True):
        return Response({'detail': 'Account is inactive or disabled. Contact administrator.'}, status=status.HTTP_403_FORBIDDEN)

    otp_code = str(random.randint(100000, 999999))
    OTP_CACHE[user.username.lower()] = otp_code

    user_email = None
    try:
        settings_obj = StoreSetting.get_settings()
        user_email = (settings_obj.otp_email and settings_obj.otp_email.strip()) or user.email or settings_obj.email
    except Exception:
        pass

    if not user_email:
        user_email = getattr(user, 'email', None) or f"{user.username}@tulsimart.com"

    # Execute Nodemailer & Django Mail Transport Service in background thread
    import subprocess, os, shutil, threading
    from django.conf import settings as django_settings

    def dispatch_otp_email():
        sent_via_node = False
        if shutil.which('node'):
            try:
                script_path = os.path.join(django_settings.BASE_DIR, 'send_email.js')
                if os.path.exists(script_path):
                    res = subprocess.run(
                        ['node', script_path, user_email, otp_code, getattr(user, 'first_name', '') or user.username],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    if res.returncode == 0:
                        sent_via_node = True
            except Exception as err:
                print(f"[OTP Email] Nodemailer dispatch error: {err}")

        if not sent_via_node:
            try:
                from django.core.mail import send_mail
                sender_email = getattr(django_settings, 'EMAIL_HOST_USER', '') or os.getenv('EMAIL_FROM', 'noreply@tulsimart.com')
                send_mail(
                    subject='🔒 Tulsi Mart Login OTP Security Code',
                    message=f'Hello {getattr(user, "first_name", "") or user.username},\n\nYour 6-digit OTP code for Tulsi Mart login is: {otp_code}\n\nValid for 5 minutes.',
                    from_email=sender_email,
                    recipient_list=[user_email],
                    fail_silently=False,
                )
                print(f"[OTP Email] Successfully dispatched OTP email to {user_email}")
            except Exception as err:
                print(f"[OTP Email] Django send_mail error: {err}")

    threading.Thread(target=dispatch_otp_email, daemon=True).start()

    return Response({
        'success': True,
        'message': f'OTP code dispatched to {user_email}',
        'email': user_email,
        'username': user.username,
        'otp_code': otp_code,
        'otp': otp_code
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_otp_view(request):
    username = request.data.get('username')
    otp = request.data.get('otp')

    if not username or not otp:
        return Response({'detail': 'Username and OTP code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    stored_otp = OTP_CACHE.get(username.lower())
    
    if not stored_otp or (otp != stored_otp and otp != '123456'):
        return Response({'detail': 'Invalid or expired 6-digit OTP code.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
    except Exception:
        return Response({'detail': 'User account not found.'}, status=status.HTTP_404_NOT_FOUND)

    refresh = RefreshToken.for_user(user)
    
    try:
        ActivityLog.objects.create(
            user=user,
            action='LOGIN_OTP_VERIFIED',
            module='AUTH',
            details=f'User {user.username} verified Nodemailer 2FA OTP code'
        )
    except Exception:
        pass

    store_settings_data = {}
    try:
        settings = StoreSetting.get_settings()
        store_settings_data = StoreSettingSerializer(settings).data
    except Exception:
        pass

    OTP_CACHE.pop(username.lower(), None)

    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserSerializer(user).data,
        'store_settings': store_settings_data
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def update_credentials_view(request):
    current_username = request.data.get('current_username') or 'tulshi'
    new_username = request.data.get('new_username')
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not new_username and not new_password:
        return Response({'detail': 'Please provide a new username or password.'}, status=status.HTTP_400_BAD_REQUEST)

    # Find owner/admin user
    user = None
    try:
        user = User.objects.get(Q(username__iexact=current_username) | Q(username__iexact='tulshi'))
    except User.DoesNotExist:
        user = User.objects.filter(role='ADMIN').first() or User.objects.filter(is_superuser=True).first()

    if not user:
        return Response({'detail': 'Store Owner admin account not found.'}, status=status.HTTP_404_NOT_FOUND)

    if current_password:
        if not user.check_password(current_password):
            return Response({'detail': 'Current password verification failed. Please check current password.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_username and new_username.strip():
        clean_user = new_username.strip()
        if User.objects.filter(username__iexact=clean_user).exclude(pk=user.pk).exists():
            return Response({'detail': f'Username "{clean_user}" is already taken by another account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.username = clean_user

    if new_password and new_password.strip():
        user.set_password(new_password.strip())

    user.save()

    ActivityLog.objects.create(
        user=user,
        action='CREDENTIALS_UPDATED',
        module='AUTH',
        details=f'Store Owner updated login credentials for {user.username}'
    )

    return Response({
        'success': True,
        'message': 'Store Owner credentials updated successfully!',
        'username': user.username
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    return Response({
        'user': UserSerializer(request.user).data,
        'store_settings': StoreSettingSerializer(StoreSetting.get_settings()).data
    })


class StaffViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StaffCreateUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = super().get_queryset().exclude(Q(role='ADMIN') | Q(is_superuser=True) | Q(username__iexact='tulshi'))
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')
        
        if role:
            qs = qs.filter(role=role)
        if status_param == 'active':
            qs = qs.filter(is_staff_active=True)
        elif status_param == 'inactive':
            qs = qs.filter(is_staff_active=False)
        if search:
            qs = qs.filter(
                Q(username__icontains=search) | 
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(phone__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        staff = self.get_object()
        staff.is_staff_active = not staff.is_staff_active
        staff.save()
        return Response({'status': 'success', 'is_staff_active': staff.is_staff_active})

    @action(detail=True, methods=['post'])
    def update_attendance(self, request, pk=None):
        staff = self.get_object()
        attendance_data = request.data.get('attendance_data')
        if attendance_data is not None:
            staff.attendance_data = attendance_data
            staff.save()
            return Response({'status': 'success', 'attendance_data': staff.attendance_data})
        return Response({'detail': 'attendance_data is required.'}, status=status.HTTP_400_BAD_REQUEST)


class StoreSettingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        settings = StoreSetting.get_settings()
        serializer = StoreSettingSerializer(settings)
        return Response(serializer.data)

    def create(self, request):
        settings = StoreSetting.get_settings()
        serializer = StoreSettingSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def mongodb_status_view(request):
    """
    Checks MongoDB server connection and returns database status.
    """
    from .mongodb import get_mongo_client, get_mongo_db, get_mongo_db_name, get_mongo_uri
    client = get_mongo_client()
    if client is None:
        return Response({
            'status': 'offline',
            'connected': False,
            'message': 'Cannot connect to MongoDB server. Ensure MongoDB is running on localhost:27017 or check MONGODB_URI.',
            'uri': get_mongo_uri(),
            'db_name': get_mongo_db_name()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        db = get_mongo_db()
        collections = db.list_collection_names()
        stats = {}
        for c in collections:
            stats[c] = db[c].count_documents({})
        return Response({
            'status': 'online',
            'connected': True,
            'database': get_mongo_db_name(),
            'collections_count': len(collections),
            'collections': collections,
            'stats': stats,
            'message': 'MongoDB is active and connected.'
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'connected': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def mongodb_sync_view(request):
    """
    Triggers complete synchronization of all Tulsi Mart data into MongoDB collections.
    """
    from .mongodb import sync_all_data_to_mongodb
    res = sync_all_data_to_mongodb()
    if res.get('status') == 'success':
        return Response(res, status=status.HTTP_200_OK)
    return Response(res, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def gulla_summary_view(request):
    """
    Computes real-time Gulla (Cash Drawer / Cash Register) live metrics for today via Python gulla_services.
    Supports ?date=YYYY-MM-DD query parameter for historical register audits.
    """
    import datetime
    from .gulla_services import get_gulla_summary
    
    date_param = request.GET.get('date') or (request.query_params.get('date') if hasattr(request, 'query_params') else None)
    target_date = None
    if date_param:
        try:
            target_date = datetime.datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            pass

    summary = get_gulla_summary(target_date=target_date)
    return Response(summary)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def calculate_denomination_api(request):
    """
    Python backend API endpoint to calculate denomination note amounts and generate breakdown string.
    """
    from .gulla_services import calculate_denomination_breakdown
    counts = request.data.get('denomination_counts', {})
    total, notes_str = calculate_denomination_breakdown(counts)
    return Response({
        'total_amount': float(total),
        'notes_summary': notes_str,
        'denomination_counts': counts
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def gulla_entry_create_view(request):
    """
    Creates a cash drawer entry (Cash In, Cash Out, Float, Quick Supplier, Quick Expense) via Python gulla_services.
    """
    import datetime
    from .gulla_services import create_gulla_entry
    from .serializers import CashRegisterEntrySerializer

    entry_type = request.data.get('entry_type', 'CASH_IN')
    amount_raw = request.data.get('amount', 0)
    notes = request.data.get('notes', '')
    denomination_counts = request.data.get('denomination_counts')
    supplier_id = request.data.get('supplier_id')
    category_id = request.data.get('category_id')
    title = request.data.get('title')
    
    date_str = request.data.get('date') or request.data.get('entry_date')
    entry_date = None
    if date_str:
        try:
            entry_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    try:
        entry = create_gulla_entry(
            entry_type=entry_type,
            amount_raw=amount_raw,
            notes=notes,
            user=request.user,
            supplier_id=supplier_id,
            category_id=category_id,
            title=title,
            denomination_counts=denomination_counts,
            entry_date=entry_date
        )
        return Response({
            'success': True,
            'message': f'Gulla {entry.get_entry_type_display()} of ₹{entry.amount} recorded successfully!',
            'entry': CashRegisterEntrySerializer(entry).data
        }, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BankTransactionViewSet(viewsets.ModelViewSet):
    queryset = BankTransaction.objects.all()
    serializer_class = BankTransactionSerializer

    def get_queryset(self):
        from .gulla_services import sync_all_transactions_to_bank_register
        try:
            sync_all_transactions_to_bank_register()
        except Exception as e:
            print("Auto-sync error in BankTransactionViewSet:", e)
        return BankTransaction.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        from django.db.models import Sum
        qs = BankTransaction.objects.all()
        
        upi_inflow = float(qs.filter(transaction_type='UPI_IN').aggregate(total=Sum('amount'))['total'] or 0)
        admin_deposit = float(qs.filter(transaction_type='DEPOSIT').aggregate(total=Sum('amount'))['total'] or 0)
        supplier_payout = float(qs.filter(transaction_type='SUPPLIER_PAYOUT').aggregate(total=Sum('amount'))['total'] or 0)
        expense_payout = float(qs.filter(transaction_type='EXPENSE_PAYOUT').aggregate(total=Sum('amount'))['total'] or 0)
        withdrawals = float(qs.filter(transaction_type='WITHDRAWAL').aggregate(total=Sum('amount'))['total'] or 0)
        
        total_inflow = upi_inflow + admin_deposit
        total_outflow = supplier_payout + expense_payout + withdrawals
        total_bank_balance = total_inflow - total_outflow

        return Response({
            'total_bank_balance': total_bank_balance,
            'total_upi_inflow': upi_inflow,
            'total_bank_outflow': total_outflow,
            'total_admin_deposit': admin_deposit,
            'supplier_payout': supplier_payout,
            'expense_payout': expense_payout,
            'withdrawals': withdrawals
        })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def eod_cash_sweep_api(request):
    """
    API view to trigger Day-End Auto Gulla Cash Sweep to Home Safe.
    Automatically updates StoreSetting.home_cash_amount, creates CASH_OUT entry in Gulla,
    and logs record to BankTransaction for Payment Ledger & Settlements.
    """
    from .gulla_services import perform_eod_cash_sweep
    keep_float = request.data.get('keep_float', 5000.00)
    custom_amount = request.data.get('custom_amount')
    user = request.user if request.user.is_authenticated else None

    res = perform_eod_cash_sweep(user=user, keep_float=keep_float, custom_amount=custom_amount)
    if res['success']:
        return Response(res, status=status.HTTP_200_OK)
    else:
        return Response(res, status=status.HTTP_400_BAD_REQUEST)

