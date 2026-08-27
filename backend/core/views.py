import os
from decimal import Decimal
from django.db import models
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Q

from .models import ActivityLog, BankTransaction, Staff, StoreSetting, LoginAccount
from .serializers import (
    StaffSerializer,
    ActivityLogSerializer,
    BankTransactionSerializer,
    StoreSettingSerializer,
    LoginAccountSerializer
)


class LoginAccountViewSet(viewsets.ModelViewSet):
    queryset = LoginAccount.objects.all().order_by('-created_at')
    serializer_class = LoginAccountSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        if not LoginAccount.objects.exists():
            LoginAccount.objects.create(
                username='admin',
                password='password123',
                full_name='Store Administrator',
                email='admin@tulsimart.com',
                role='ADMIN',
                is_active=True,
                require_otp=False
            )
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(full_name__icontains=search) |
                Q(email__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        acc = self.get_object()
        acc.is_active = not acc.is_active
        acc.save()
        return Response({'status': 'success', 'is_active': acc.is_active})

    @action(detail=True, methods=['post'])
    def toggle_otp(self, request, pk=None):
        acc = self.get_object()
        acc.require_otp = not acc.require_otp
        acc.save()
        return Response({'status': 'success', 'require_otp': acc.require_otp})



class StoreSettingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .mongodb import get_mongo_store_settings
        mongo_doc = get_mongo_store_settings()
        if mongo_doc:
            return Response(mongo_doc, status=status.HTTP_200_OK)

        settings_obj = StoreSetting.get_settings()
        serializer = StoreSettingSerializer(settings_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        from .mongodb import save_mongo_store_settings
        settings_obj = StoreSetting.get_settings()
        serializer = StoreSettingSerializer(settings_obj, data=request.data, partial=False)
        if serializer.is_valid():
            saved_instance = serializer.save()
            save_mongo_store_settings(serializer.data)
            user_name = request.user.username if request.user and request.user.is_authenticated else 'Admin'
            ActivityLog.objects.create(
                user_name=user_name,
                action='UPDATE_SETTINGS',
                module='Settings',
                details='Updated store settings in MongoDB and main database'
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        from .mongodb import save_mongo_store_settings
        settings_obj = StoreSetting.get_settings()
        serializer = StoreSettingSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            saved_instance = serializer.save()
            full_data = StoreSettingSerializer(saved_instance).data
            save_mongo_store_settings(full_data)
            user_name = request.user.username if request.user and request.user.is_authenticated else 'Admin'
            ActivityLog.objects.create(
                user_name=user_name,
                action='PATCH_SETTINGS',
                module='Settings',
                details='Partially updated store settings in MongoDB and main database'
            )
            return Response(full_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().order_by('-created_at')
    serializer_class = StaffSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')
        
        if role:
            qs = qs.filter(role=role)
        if status_param == 'active':
            qs = qs.filter(is_active=True)
        elif status_param == 'inactive':
            qs = qs.filter(is_active=False)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | 
                Q(email__icontains=search) | 
                Q(phone__icontains=search) |
                Q(role__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        staff = self.get_object()
        staff.is_active = not staff.is_active
        staff.save()
        return Response({'status': 'success', 'is_active': staff.is_active})

    @action(detail=True, methods=['post'])
    def update_attendance(self, request, pk=None):
        staff = self.get_object()
        attendance_data = request.data.get('attendance_data')
        if attendance_data is not None:
            staff.attendance_data = attendance_data
            staff.save()
            return Response({'status': 'success', 'attendance_data': staff.attendance_data})
        return Response({'detail': 'attendance_data is required.'}, status=status.HTTP_400_BAD_REQUEST)


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


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def home_cash_vault_api(request):
    """
    API view to manage Home Safe Cash Vault:
    GET: Returns Home Safe Cash Balance, Totals, Denominations Breakdown, and Audit History.
    POST: Records Manual Home Cash Deposit or Withdrawal, updates StoreSetting.home_cash_amount,
          and saves transaction history with denomination note breakdown.
    """
    from .models import StoreSetting, HomeCashTransaction
    setting = StoreSetting.get_settings()

    if request.method == 'POST':
        entry_type = request.data.get('entry_type', 'DEPOSIT') # DEPOSIT or WITHDRAWAL
        amount_raw = request.data.get('amount', 0)
        denom_counts = request.data.get('denomination_counts', {})
        notes = request.data.get('notes', '')
        user = request.user if request.user.is_authenticated else None
        created_by_str = request.data.get('created_by_name') or (user.get_full_name() if (user and hasattr(user, 'get_full_name') and user.get_full_name()) else (user.username if (user and hasattr(user, 'username')) else 'Store Owner'))

        try:
            amt = Decimal(str(amount_raw))
        except (ValueError, TypeError):
            return Response({'detail': 'માપદંડ પ્રમાણે માન્ય રકમ દાખલ કરો.'}, status=status.HTTP_400_BAD_REQUEST)

        if amt <= 0:
            return Response({'detail': 'રકમ ₹0 કરતાં વધારે હોવી જોઈએ.'}, status=status.HTTP_400_BAD_REQUEST)

        current_balance = Decimal(str(setting.home_cash_amount or 0))

        if entry_type == 'WITHDRAWAL':
            if amt > current_balance:
                return Response({
                    'detail': f"⚠️ Home Safe Warning: ઘરે રાખેલ તિજોરીમાં માત્ર ₹{current_balance:.2f} જ કેશ ઉપલબ્ધ છે! (તમે ₹{amt:.2f} વિથડ્રો કરવાનો પ્રયાસ કર્યો)."
                }, status=status.HTTP_400_BAD_REQUEST)
            new_balance = current_balance - amt
        else:
            entry_type = 'DEPOSIT'
            new_balance = current_balance + amt

        setting.home_cash_amount = new_balance
        setting.save()

        tx = HomeCashTransaction.objects.create(
            entry_type=entry_type,
            amount=amt,
            denomination_counts=denom_counts if isinstance(denom_counts, dict) else {},
            notes=notes,
            created_by_name=created_by_str,
            balance_after=new_balance
        )

    # Calculate Summaries & Denominations Breakdown
    current_home_balance = Decimal(str(setting.home_cash_amount or 0))
    tx_qs = HomeCashTransaction.objects.all()

    total_deposits = tx_qs.filter(entry_type__in=['DEPOSIT', 'SWEEP']).aggregate(s=models.Sum('amount'))['s'] or Decimal('0.00')
    total_withdrawals = tx_qs.filter(entry_type='WITHDRAWAL').aggregate(s=models.Sum('amount'))['s'] or Decimal('0.00')

    # Calculate net physical note counts for Home Safe
    denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1]
    denom_totals = {str(d): 0 for d in denoms}

    for tx in tx_qs:
        counts = tx.denomination_counts or {}
        is_add = tx.entry_type in ['DEPOSIT', 'SWEEP']
        if isinstance(counts, dict):
            for d_str, count_val in counts.items():
                try:
                    cnt = int(count_val or 0)
                    d_key = str(d_str)
                    if d_key in denom_totals:
                        if is_add:
                            denom_totals[d_key] += cnt
                        else:
                            denom_totals[d_key] = max(0, denom_totals[d_key] - cnt)
                except (ValueError, TypeError):
                    pass

    history_data = []
    for tx in tx_qs[:100]:
        counts = tx.denomination_counts or {}
        breakdown_parts = []
        if isinstance(counts, dict):
            for d in denoms:
                c = int(counts.get(str(d)) or counts.get(d) or 0)
                if c > 0:
                    breakdown_parts.append(f"{c}×₹{d}")
        breakdown_str = " + ".join(breakdown_parts) if breakdown_parts else "-"

        history_data.append({
            'id': tx.id,
            'entry_type': tx.entry_type,
            'entry_type_display': tx.get_entry_type_display(),
            'amount': float(tx.amount),
            'denomination_counts': tx.denomination_counts,
            'notes_summary': breakdown_str,
            'notes': tx.notes or '',
            'created_by_name': tx.created_by_name,
            'balance_after': float(tx.balance_after),
            'created_at': tx.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })

    return Response({
        'home_cash_amount': float(current_home_balance),
        'total_deposits': float(total_deposits),
        'total_withdrawals': float(total_withdrawals),
        'total_transactions': tx_qs.count(),
        'denominations_breakdown': denom_totals,
        'history': history_data
    }, status=status.HTTP_200_OK)


import random
from datetime import datetime, timedelta
from django.core.mail import send_mail

OTP_STORAGE = {}
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

def get_tokens_for_account(acc):
    user_obj, _ = User.objects.get_or_create(username=acc.username, defaults={
        'email': acc.email,
        'first_name': acc.full_name,
        'is_staff': True,
        'is_superuser': (acc.role == 'ADMIN')
    })
    refresh = RefreshToken.for_user(user_obj)
    return str(refresh.access_token), str(refresh)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_auth_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Ensure default admin account exists if no accounts are present
    if not LoginAccount.objects.exists():
        LoginAccount.objects.create(
            username='admin',
            password='password123',
            full_name='Store Administrator',
            email='admin@tulsimart.com',
            role='ADMIN',
            is_active=True,
            require_otp=False
        )

    try:
        acc = LoginAccount.objects.get(username__iexact=username)
    except LoginAccount.DoesNotExist:
        return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not acc.is_active:
        return Response({'detail': 'This account has been disabled by store admin.'}, status=status.HTTP_403_FORBIDDEN)

    if acc.password != password:
        return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check if 2FA OTP is required based on LoginAccount settings in DB
    store_settings = StoreSetting.get_settings()
    otp_required = acc.require_otp

    if otp_required:
        otp_code = str(random.randint(100000, 999999))
        OTP_STORAGE[acc.username] = {
            'otp': otp_code,
            'expires_at': datetime.now() + timedelta(minutes=10)
        }

        # Single Email Dispatcher (Primary: Django SMTP | Fallback: Nodemailer Node Script)
        import subprocess
        import base64
        from django.conf import settings as django_settings
        from django.core.mail import EmailMultiAlternatives
        from email.mime.image import MIMEImage

        logo_paths = [
            os.path.join(django_settings.BASE_DIR, '../frontend/public/logo-transparent.png'),
            os.path.join(django_settings.BASE_DIR, '../frontend/public/logo.png'),
            os.path.join(django_settings.BASE_DIR, '../logo.png'),
            os.path.join(django_settings.BASE_DIR, 'logo.png')
        ]

        actual_logo_path = None
        for lp in logo_paths:
            if os.path.exists(lp):
                actual_logo_path = lp
                break

        logo_base64 = ""
        logo_bytes = None
        if actual_logo_path:
            try:
                with open(actual_logo_path, 'rb') as f:
                    logo_bytes = f.read()
                    logo_base64 = "data:image/png;base64," + base64.b64encode(logo_bytes).decode('utf-8')
            except Exception:
                pass

        logo_html = f'<img src="cid:logo_img" alt="{store_settings.store_name} Logo" style="height: 52px; width: auto; max-width: 170px; display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));" />' if actual_logo_path else (
            f'<img src="{logo_base64}" alt="{store_settings.store_name} Logo" style="height: 52px; width: auto; max-width: 170px; display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));" />' if logo_base64 else '<div style="font-size: 32px; margin-bottom: 8px;">🛒</div>'
        )

        otp_digits_list = [d for d in str(otp_code).zfill(6)]
        otp_digits_tds = "".join([
            f'<td align="center" valign="middle" style="padding: 0 3px; width: 36px; white-space: nowrap;">'
            f'<table border="0" cellpadding="0" cellspacing="0" style="width: 36px; height: 48px; background-color: #1e293b; border: 2px solid #88BDF2; border-radius: 10px; border-collapse: separate; box-shadow: 0 4px 12px rgba(136, 189, 242, 0.25);">'
            f'<tr><td align="center" valign="middle" style="font-family: \'JetBrains Mono\', \'Courier New\', monospace; font-size: 24px; font-weight: 900; color: #88BDF2; text-align: center; line-height: 48px;">{d}</td></tr>'
            f'</table></td>'
            for d in otp_digits_list
        ])

        subject = f"🛒 {store_settings.store_name} Security OTP Code: {otp_code}"
        message_text = f"Hello {acc.full_name},\n\nYour 2-Factor Authentication OTP code for {store_settings.store_name} login is: {otp_code}\n\nThis code is valid for 10 minutes."
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: 'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 25px 10px; -webkit-font-smoothing: antialiased; }}
            .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.4); border: 1px solid #1e293b; }}
            .header {{ background: linear-gradient(135deg, #1e293b 0%, #384959 50%, #273440 100%); padding: 32px 24px; text-align: center; color: #ffffff; border-bottom: 3px solid #88BDF2; }}
            .brand-badge {{ display: inline-block; background: rgba(136, 189, 242, 0.15); border: 1px solid rgba(136, 189, 242, 0.4); color: #88BDF2; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 4px 14px; border-radius: 50px; margin-bottom: 12px; }}
            .title {{ font-size: 24px; font-weight: 900; margin: 0; color: #ffffff; letter-spacing: -0.5px; }}
            .subtitle {{ font-size: 12px; color: #BDDDFC; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-top: 6px; }}
            .body {{ padding: 30px 24px; color: #334155; }}
            .greeting {{ font-size: 17px; font-weight: 800; color: #384959; margin-bottom: 8px; }}
            .intro {{ font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 22px; }}
            .otp-container {{ background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); border-radius: 20px; padding: 24px 12px; text-align: center; margin: 24px 0; border: 1px solid #334155; box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 25px rgba(15,23,42,0.25); border-top: 3px solid #88BDF2; }}
            .otp-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: #94a3b8; margin-bottom: 16px; }}
            .badge {{ display: inline-block; margin-top: 18px; font-size: 12px; color: #88BDF2; background: rgba(136, 189, 242, 0.12); border: 1px solid rgba(136, 189, 242, 0.3); padding: 5px 16px; border-radius: 30px; font-weight: 700; }}
            .notice {{ background: #f0f7ff; border-left: 4px solid #384959; padding: 14px 16px; border-radius: 12px; font-size: 12px; color: #384959; margin-top: 24px; line-height: 1.5; }}
            .footer {{ background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              {logo_html}
              <div class="brand-badge">🔒 2FA Verification</div>
              <div class="title">{store_settings.store_name}</div>
              <div class="subtitle">Supermarket & Grocery Management</div>
            </div>
            <div class="body">
              <div class="greeting">Hello {acc.full_name},</div>
              <div class="intro">A login verification request was received for your <strong>{store_settings.store_name}</strong> account. Use the 6-digit security code below to complete your sign-in:</div>
              
              <div class="otp-container">
                <div class="otp-label">Security Verification Code</div>
                
                <!-- Single Non-Wrapping Row 6-Digit PIN Table -->
                <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto; width: auto; border-collapse: separate; table-layout: fixed; white-space: nowrap;">
                  <tr style="white-space: nowrap;">
                    {otp_digits_tds}
                  </tr>
                </table>

                <div class="badge">⏱️ Valid for 10 minutes</div>
              </div>

              <div class="notice">
                🛡️ <strong>Security Tip:</strong> Never share this OTP code with anyone. Tulsi Mart personnel will never ask for your 2FA verification code via phone or email.
              </div>
            </div>
            <div class="footer">
              &copy; 2026 {store_settings.store_name} Supermarket Software • Automated Security Notification
            </div>
          </div>
        </body>
        </html>
        """

        email_sent = False

        # Attempt 1: Native Django SMTP (Strictly Primary)
        sender_email = getattr(django_settings, 'EMAIL_HOST_USER', '') or getattr(django_settings, 'DEFAULT_FROM_EMAIL', '') or 'noreply@tulsimart.com'
        if sender_email:
            try:
                msg = EmailMultiAlternatives(subject, message_text, sender_email, [acc.email])
                msg.attach_alternative(html_message, "text/html")
                if logo_bytes:
                    try:
                        logo_mime = MIMEImage(logo_bytes)
                        logo_mime.add_header('Content-ID', '<logo_img>')
                        logo_mime.add_header('Content-Disposition', 'inline', filename='logo.png')
                        msg.attach(logo_mime)
                    except Exception as le:
                        print(f"[Django Logo Attach Warning]: {le}")
                msg.send(fail_silently=False)
                email_sent = True
                print(f"[Django SMTP Single Dispatch Success] OTP {otp_code} delivered to {acc.email}")
            except Exception as e:
                print(f"[Django SMTP Dispatch Exception]: {e} | Falling back to Nodemailer script...")

        # Attempt 2: Nodemailer Script (ONLY executed if Django SMTP failed or is unconfigured)
        if not email_sent:
            script_path = os.path.join(django_settings.BASE_DIR, 'send_email.js')
            if os.path.exists(script_path):
                try:
                    res_proc = subprocess.run(
                        ['node', script_path, acc.email, otp_code, acc.full_name],
                        capture_output=True,
                        text=True,
                        timeout=15
                    )
                    if res_proc.returncode == 0:
                        email_sent = True
                        print(f"[Nodemailer Single Dispatch Success] Delivered single OTP email to {acc.email}")
                    else:
                        print(f"[Nodemailer Dispatch Failed]: {res_proc.stderr.strip() or res_proc.stdout.strip()}")
                except Exception as e:
                    print(f"[Nodemailer Execution Error]: {e}")

        email_parts = acc.email.split('@') if acc.email and '@' in acc.email else ['', '']
        masked_email = (email_parts[0][:2] + '***@' + email_parts[1]) if email_parts[0] else acc.email

        return Response({
            'otp_required': True,
            'username': acc.username,
            'email': acc.email,
            'masked_email': masked_email,
            'dev_otp': otp_code,
            'message': f"OTP sent to email {masked_email}"
        }, status=status.HTTP_200_OK)

    # Direct login without OTP
    access_token, refresh_token = get_tokens_for_account(acc)
    token_payload = {
        'id': acc.id,
        'username': acc.username,
        'name': acc.full_name,
        'email': acc.email,
        'role': acc.role
    }

    return Response({
        'otp_required': False,
        'access': access_token,
        'refresh': refresh_token,
        'user': token_payload,
        'store_settings': StoreSettingSerializer(store_settings).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_otp_auth_view(request):
    username = request.data.get('username', '').strip()
    otp = request.data.get('otp', '').strip()

    if not username or not otp:
        return Response({'detail': 'Username and OTP code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        acc = LoginAccount.objects.get(username__iexact=username)
    except LoginAccount.DoesNotExist:
        return Response({'detail': 'User account not found.'}, status=status.HTTP_404_NOT_FOUND)

    record = OTP_STORAGE.get(acc.username)
    if not record:
        return Response({'detail': 'No active OTP found. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    if datetime.now() > record['expires_at']:
        del OTP_STORAGE[acc.username]
        return Response({'detail': 'OTP has expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    if record['otp'] != otp:
        return Response({'detail': 'Invalid OTP code. Please check your email and try again.'}, status=status.HTTP_400_BAD_REQUEST)

    # Clear used OTP
    del OTP_STORAGE[acc.username]

    store_settings = StoreSetting.get_settings()
    access_token, refresh_token = get_tokens_for_account(acc)
    token_payload = {
        'id': acc.id,
        'username': acc.username,
        'name': acc.full_name,
        'email': acc.email,
        'role': acc.role
    }

    return Response({
        'access': access_token,
        'refresh': refresh_token,
        'user': token_payload,
        'store_settings': StoreSettingSerializer(store_settings).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_me_auth_view(request):
    acc = None
    if request.user and request.user.is_authenticated:
        acc = LoginAccount.objects.filter(username__iexact=request.user.username).first()

    if not acc:
        acc = LoginAccount.objects.first()

    if not acc:
        return Response({'detail': 'User account not found.'}, status=status.HTTP_404_NOT_FOUND)

    store_settings = StoreSetting.get_settings()
    return Response({
        'user': {
            'id': acc.id,
            'username': acc.username,
            'name': acc.full_name,
            'email': acc.email,
            'role': acc.role
        },
        'store_settings': StoreSettingSerializer(store_settings).data
    }, status=status.HTTP_200_OK)


