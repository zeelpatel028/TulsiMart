import datetime
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q, F
from orders.models import Order, PaymentTransaction
from suppliers.models import Supplier, SupplierPayment
from expenses.models import Expense, ExpenseCategory
from .models import CashRegisterEntry
from .serializers import CashRegisterEntrySerializer

DENOM_LIST = [500, 200, 100, 50, 20, 10, 5, 1]


def calculate_denomination_breakdown(denomination_counts):
    """
    Python backend helper to calculate total amount & note breakdown string from note counts dictionary.
    """
    total = Decimal('0.00')
    parts = []
    
    if not isinstance(denomination_counts, dict):
        return total, ""
        
    for d in DENOM_LIST:
        cnt_val = denomination_counts.get(str(d)) or denomination_counts.get(d) or 0
        try:
            cnt = int(cnt_val)
        except (ValueError, TypeError):
            cnt = 0
            
        if cnt > 0:
            if d == 1:
                total += Decimal(str(cnt))
                parts.append(f"Coins: ₹{cnt}")
            else:
                total += Decimal(str(d * cnt))
                parts.append(f"₹{d}×{cnt}")
                
    breakdown_str = f"Notes: {', '.join(parts)}" if parts else ""
    return total, breakdown_str


def reconcile_gulla_cash(total_physical_cash, expected_cash):
    """
    Python backend function to audit cash variance between physical note tally and expected register balance.
    """
    try:
        physical = Decimal(str(total_physical_cash or 0))
        expected = Decimal(str(expected_cash or 0))
    except (ValueError, TypeError):
        physical = Decimal('0.00')
        expected = Decimal('0.00')

    variance = physical - expected

    if variance == Decimal('0.00'):
        audit_status = 'EXACT_MATCH'
        status_label = 'Perfect Cash Match'
    elif variance > Decimal('0.00'):
        audit_status = 'SURPLUS'
        status_label = f'Surplus Cash (+₹{variance})'
    else:
        audit_status = 'SHORTAGE'
        status_label = f'Shortage Cash (-₹{abs(variance)})'

    return {
        'physical_cash': float(physical),
        'expected_cash': float(expected),
        'variance': float(variance),
        'status': audit_status,
        'status_label': status_label
    }


def get_gulla_summary(target_date=None):
    """
    Comprehensive Python backend service to calculate Gulla cash drawer metrics for a given date.
    Calculates Opening Float, POS Cash Sales, Customer Khata Receipts, Manual Cash In/Out,
    Supplier Payouts, Expense Outflows, Net Expected Gulla Cash, and Digital Sales.
    """
    today = target_date or timezone.localtime(timezone.now()).date()

    # 1. Manual Register Entries for today
    entries_qs = CashRegisterEntry.objects.filter(created_at__date=today)

    def sum_entry_type(etype):
        return entries_qs.filter(entry_type=etype).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

    opening_float = sum_entry_type('OPENING_FLOAT')
    manual_cash_in = sum_entry_type('CASH_IN')
    manual_cash_out = sum_entry_type('CASH_OUT')
    manual_supplier_pay = sum_entry_type('SUPPLIER_PAYMENT')
    manual_expense_out = sum_entry_type('EXPENSE')

    # 2. Automated POS Cash Transactions today
    pos_cash_txns = PaymentTransaction.objects.filter(
        created_at__date=today,
        payment_method='CASH',
        status='PAID'
    )
    
    # Direct POS Cash Sales (excluding Khata settlement transactions)
    pos_cash_sales = pos_cash_txns.exclude(
        notes__icontains='Khata'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

    # Khata Customer Cash Receipts
    khata_cash_receipts = pos_cash_txns.filter(
        notes__icontains='Khata'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

    # 3. Direct Supplier & Expense Cash Payouts for today
    supplier_cash_payouts = SupplierPayment.objects.filter(
        payment_date=today,
        payment_method='CASH'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

    expense_cash_payouts = Expense.objects.filter(
        date=today,
        payment_method='CASH'
    ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

    # 4. Total Cash Inflows & Outflows
    total_cash_inflow = opening_float + pos_cash_sales + khata_cash_receipts + manual_cash_in
    total_cash_outflow = manual_cash_out + supplier_cash_payouts + expense_cash_payouts

    # 5. Net Cash in Gulla Register
    net_cash_in_gulla = total_cash_inflow - total_cash_outflow

    # 6. Non-Cash Sales (UPI / Card / Bank Transfer for shift reconciliation)
    digital_txns = PaymentTransaction.objects.filter(
        created_at__date=today,
        status='PAID'
    ).exclude(payment_method='CASH')

    upi_sales = digital_txns.filter(payment_method='UPI').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
    card_sales = digital_txns.filter(payment_method='CARD').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
    bank_sales = digital_txns.filter(payment_method='NET_BANKING').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
    total_digital_sales = upi_sales + card_sales + bank_sales

    # 7. Denomination note breakdown aggregation from POS Cash Orders & Manual Register Entries
    cash_orders = Order.objects.filter(created_at__date=today, payment_method='CASH').select_related('created_by')
    tendered_notes_agg = {str(d): 0 for d in DENOM_LIST}
    change_notes_agg = {str(d): 0 for d in DENOM_LIST}

    def calc_greedy_notes(amount):
        try:
            amt = int(round(float(amount or 0)))
            res = {str(d): 0 for d in DENOM_LIST}
            for d in DENOM_LIST:
                if amt >= d:
                    res[str(d)] = amt // d
                    amt = amt % d
            return res
        except Exception:
            return {str(d): 0 for d in DENOM_LIST}

    def parse_notes_from_text(notes_str):
        counts = {str(d): 0 for d in DENOM_LIST}
        if not notes_str or not isinstance(notes_str, str):
            return counts
        import re
        matches = re.findall(r'₹?(\d+)[×x](\d+)', notes_str)
        for denom, cnt in matches:
            if denom in counts:
                try:
                    counts[denom] += int(cnt)
                except ValueError:
                    pass
        coin_match = re.search(r'Coins: ₹?(\d+)', notes_str)
        if coin_match:
            try:
                counts['1'] += int(coin_match.group(1))
            except ValueError:
                pass
        return counts

    # Parse manual register entries for note counts
    for entry in entries_qs:
        parsed_counts = entry.denomination_counts if (isinstance(entry.denomination_counts, dict) and any(int(v or 0) > 0 for v in entry.denomination_counts.values())) else parse_notes_from_text(entry.notes)
        has_notes = any(int(c or 0) > 0 for c in parsed_counts.values())
        if not has_notes and entry.amount > 0:
            parsed_counts = calc_greedy_notes(entry.amount)

        for d_str, count in parsed_counts.items():
            try:
                cnt_num = int(count or 0)
                if cnt_num > 0 and d_str in tendered_notes_agg:
                    if entry.entry_type in ['OPENING_FLOAT', 'CASH_IN']:
                        tendered_notes_agg[d_str] += cnt_num
                    elif entry.entry_type in ['CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE']:
                        change_notes_agg[d_str] += cnt_num
            except (ValueError, TypeError):
                pass

    cash_tender_logs_list = []
    for o in cash_orders:
        t_has_notes = isinstance(o.tendered_notes, dict) and any(int(v or 0) > 0 for v in o.tendered_notes.values())
        c_has_notes = isinstance(o.change_notes, dict) and any(int(v or 0) > 0 for v in o.change_notes.values())

        t_counts = o.tendered_notes if t_has_notes else calc_greedy_notes(o.cash_tendered or o.total_amount)
        c_counts = o.change_notes if c_has_notes else (calc_greedy_notes(o.change_returned) if (o.change_returned and float(o.change_returned) > 0) else {})

        for d_str, count in t_counts.items():
            if d_str in tendered_notes_agg:
                try:
                    tendered_notes_agg[d_str] += int(count or 0)
                except (ValueError, TypeError):
                    pass

        for d_str, count in c_counts.items():
            if d_str in change_notes_agg:
                try:
                    change_notes_agg[d_str] += int(count or 0)
                except (ValueError, TypeError):
                    pass

        cash_tender_logs_list.append({
            'id': o.id,
            'order_number': o.order_number,
            'customer_name': o.customer_name or 'Walk-in',
            'bill_amount': float(o.total_amount),
            'cash_tendered': float(o.cash_tendered or o.total_amount),
            'change_returned': float(o.change_returned or 0),
            'tendered_notes': t_counts,
            'change_notes': c_counts,
            'time': o.created_at.strftime('%I:%M %p')
        })

    denominations_table = []
    for d in DENOM_LIST:
        d_str = str(d)
        t_cnt = tendered_notes_agg[d_str]
        c_cnt = change_notes_agg[d_str]
        net_cnt = t_cnt - c_cnt
        val = d * net_cnt
        denominations_table.append({
            'denomination': d,
            'label': 'Coins (₹)' if d == 1 else f'₹{d} Note',
            'tendered_count': t_cnt,
            'change_count': c_cnt,
            'net_count': net_cnt,
            'total_value': val
        })

    # Aggregate Unified Cash Transaction Ledger for today
    unified_entries = []

    # 1. Manual Cash Register Entries for today
    for e in entries_qs.order_by('-created_at'):
        parsed = e.denomination_counts if (isinstance(e.denomination_counts, dict) and any(int(v or 0) > 0 for v in e.denomination_counts.values())) else parse_notes_from_text(e.notes)
        if not any(int(v or 0) > 0 for v in parsed.values()) and e.amount > 0:
            parsed = calc_greedy_notes(e.amount)

        is_inflow = e.entry_type in ['OPENING_FLOAT', 'CASH_IN', 'KHATA_PAYMENT']
        t_counts = parsed if is_inflow else {}
        c_counts = parsed if not is_inflow else {}

        _, t_str = calculate_denomination_breakdown(t_counts)
        _, c_str = calculate_denomination_breakdown(c_counts)

        unified_entries.append({
            'id': f'reg-{e.id}',
            'entry_type': e.entry_type,
            'entry_type_label': e.get_entry_type_display(),
            'amount': float(e.amount),
            'notes': e.notes or e.get_entry_type_display(),
            'reference_id': e.reference_id or f'REG-{e.id}',
            'created_at': e.created_at.isoformat(),
            'user_name': e.created_by_name or 'Store Admin',
            'tendered_notes': t_counts,
            'change_notes': c_counts,
            'tendered_summary': t_str.replace('Notes: ', '') if t_str else '',
            'change_summary': c_str.replace('Notes: ', '') if c_str else ''
        })

    # 2. POS Order Bills for today (Both Cash & Digital Payments)
    all_orders = Order.objects.filter(created_at__date=today).select_related('created_by')
    for o in all_orders:
        c_name = o.customer_name or 'Walk-in Customer'
        is_cash = (o.payment_method == 'CASH')
        
        t_has_notes = isinstance(o.tendered_notes, dict) and any(int(v or 0) > 0 for v in o.tendered_notes.values())
        c_has_notes = isinstance(o.change_notes, dict) and any(int(v or 0) > 0 for v in o.change_notes.values())

        if is_cash:
            t_counts = o.tendered_notes if t_has_notes else calc_greedy_notes(o.cash_tendered or o.total_amount)
            c_counts = o.change_notes if c_has_notes else (calc_greedy_notes(o.change_returned) if (o.change_returned and float(o.change_returned) > 0) else {})
            _, t_str = calculate_denomination_breakdown(t_counts)
            _, c_str = calculate_denomination_breakdown(c_counts)
            e_label = 'POS Cash Bill'
            e_type = 'BILL_SALE'
        else:
            t_counts = {}
            c_counts = {}
            t_str = f"Digital ({o.payment_method})"
            c_str = ""
            e_label = f"POS {o.payment_method} Bill"
            e_type = 'BILL_SALE_DIGITAL'

        unified_entries.append({
            'id': f'ord-{o.id}',
            'entry_type': e_type,
            'entry_type_label': e_label,
            'amount': float(o.total_amount),
            'notes': f'POS {o.payment_method} Bill #{o.order_number} ({c_name})',
            'reference_id': o.order_number,
            'created_at': o.created_at.isoformat(),
            'user_name': o.created_by.get_full_name() if (o.created_by and hasattr(o.created_by, 'get_full_name') and o.created_by.get_full_name()) else (o.created_by.username if o.created_by else 'Cashier'),
            'tendered_notes': t_counts,
            'change_notes': c_counts,
            'cash_tendered': float(o.cash_tendered or o.total_amount) if is_cash else 0.0,
            'change_returned': float(o.change_returned or 0) if is_cash else 0.0,
            'tendered_summary': t_str.replace('Notes: ', '') if t_str else '',
            'change_summary': c_str.replace('Notes: ', '') if c_str else ''
        })

    # 3. Khata Customer Cash Payments for today
    khata_txns = pos_cash_txns.filter(notes__icontains='Khata')
    for pt in khata_txns:
        d_counts = calc_greedy_notes(pt.amount)
        _, t_str = calculate_denomination_breakdown(d_counts)
        unified_entries.append({
            'id': f'khata-{pt.id}',
            'entry_type': 'KHATA_PAYMENT',
            'entry_type_label': 'Khata Customer Cash',
            'amount': float(pt.amount),
            'notes': pt.notes or f'Khata Cash Receipt #{pt.transaction_id}',
            'reference_id': pt.transaction_id,
            'created_at': pt.created_at.isoformat(),
            'user_name': 'Cashier',
            'tendered_notes': d_counts,
            'change_notes': {},
            'tendered_summary': t_str.replace('Notes: ', '') if t_str else '',
            'change_summary': ''
        })

    # 4. Direct Supplier Cash Payments for today (not created via Gulla entry)
    direct_supp_pays = SupplierPayment.objects.filter(payment_date=today, payment_method='CASH').select_related('supplier')
    for sp in direct_supp_pays:
        if not sp.notes or 'Paid from Gulla' not in sp.notes:
            s_name = sp.supplier.name if sp.supplier else 'Supplier'
            dt = timezone.datetime.combine(sp.payment_date, timezone.now().time()).isoformat()
            d_counts = calc_greedy_notes(sp.amount)
            _, c_str = calculate_denomination_breakdown(d_counts)
            unified_entries.append({
                'id': f'supp-{sp.id}',
                'entry_type': 'SUPPLIER_PAYMENT',
                'entry_type_label': 'Supplier Cash Payment',
                'amount': float(sp.amount),
                'notes': f'Supplier Cash Pay: {s_name} ({sp.notes or ""})'.strip(),
                'reference_id': f'SUPP-{sp.id}',
                'created_at': dt,
                'user_name': 'Store Admin',
                'tendered_notes': {},
                'change_notes': d_counts,
                'tendered_summary': '',
                'change_summary': c_str.replace('Notes: ', '') if c_str else ''
            })

    # 5. Direct Store Cash Expenses for today (not created via Gulla entry)
    direct_expenses = Expense.objects.filter(date=today, payment_method='CASH').select_related('category')
    for ex in direct_expenses:
        if not ex.notes or 'Paid from Gulla' not in ex.notes:
            c_name = ex.category.name if ex.category else 'Operations'
            dt = timezone.datetime.combine(ex.date, timezone.now().time()).isoformat()
            d_counts = calc_greedy_notes(ex.amount)
            _, c_str = calculate_denomination_breakdown(d_counts)
            unified_entries.append({
                'id': f'exp-{ex.id}',
                'entry_type': 'EXPENSE',
                'entry_type_label': 'Store Cash Expense',
                'amount': float(ex.amount),
                'notes': f'Store Expense [{c_name}]: {ex.title} ({ex.notes or ""})'.strip(),
                'reference_id': f'EXP-{ex.id}',
                'created_at': dt,
                'user_name': 'Store Admin',
                'tendered_notes': {},
                'change_notes': d_counts,
                'tendered_summary': '',
                'change_summary': c_str.replace('Notes: ', '') if c_str else ''
            })

    # Sort all entries by timestamp descending
    unified_entries.sort(key=lambda x: x['created_at'], reverse=True)

    return {
        'date': str(today),
        'cash_in_hand': float(net_cash_in_gulla),
        'total_cash': float(net_cash_in_gulla),
        'net_cash_in_gulla': float(net_cash_in_gulla),
        'opening_float': float(opening_float),
        'pos_cash_sales': float(pos_cash_sales),
        'khata_cash_receipts': float(khata_cash_receipts),
        'manual_cash_in': float(manual_cash_in),
        'manual_cash_out': float(manual_cash_out),
        'supplier_cash_payouts': float(supplier_cash_payouts),
        'expense_cash_payouts': float(expense_cash_payouts),
        'total_cash_inflow': float(total_cash_inflow),
        'total_cash_outflow': float(total_cash_outflow),
        'net_cash_in_gulla': float(net_cash_in_gulla),
        'digital_sales': {
            'upi': float(upi_sales),
            'card': float(card_sales),
            'bank': float(bank_sales),
            'total_digital': float(total_digital_sales)
        },
        'total_combined_revenue': float(pos_cash_sales + khata_cash_receipts + total_digital_sales),
        'notes_and_coins_summary': {
            'tendered_notes': tendered_notes_agg,
            'change_notes': change_notes_agg,
            'net_drawer_notes': {d: tendered_notes_agg[d] - change_notes_agg[d] for d in [str(x) for x in DENOM_LIST]},
            'total_tendered_notes_count': sum(tendered_notes_agg.values()),
            'total_change_notes_count': sum(change_notes_agg.values()),
            'denominations_table': denominations_table
        },
        'cash_tender_logs': cash_tender_logs_list,
        'recent_entries': unified_entries,
        'entries': unified_entries
    }


@transaction.atomic
def create_gulla_entry(entry_type, amount_raw, notes='', user=None, supplier_id=None, category_id=None, title=None, denomination_counts=None, entry_date=None):
    """
    Python backend service to create Gulla cash register entries (Float, Cash In, Cash Out, Supplier Pay, Expense).
    Handles denomination note calculation and sub-ledger creation atomically.
    """
    today = entry_date or timezone.localtime(timezone.now()).date()

    if denomination_counts:
        calc_total, calc_notes_str = calculate_denomination_breakdown(denomination_counts)
        if calc_total > 0:
            amount_raw = calc_total
        if calc_notes_str and calc_notes_str not in notes:
            notes = f"{notes} ({calc_notes_str})" if notes else calc_notes_str

    try:
        amount = Decimal(str(amount_raw))
    except (ValueError, TypeError):
        raise ValueError('Invalid amount provided')

    if amount <= 0:
        raise ValueError('Amount must be greater than 0')

    # Validate Gulla Drawer Note Availability for Cash Outflow Entries
    if entry_type in ['CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE']:
        summary = get_gulla_summary(today)
        net_notes = summary.get('notes_and_coins_summary', {}).get('net_drawer_notes', {})
        if denomination_counts and isinstance(denomination_counts, dict):
            for denom_str, count_val in denomination_counts.items():
                try:
                    requested_cnt = int(count_val or 0)
                    if requested_cnt > 0:
                        avail_cnt = max(0, int(net_notes.get(str(denom_str)) or net_notes.get(int(denom_str) if str(denom_str).isdigit() else denom_str) or 0))
                        if requested_cnt > avail_cnt:
                            raise ValueError(f"⚠️ Gulla Alert: ગુલ્લામાં ₹{denom_str} ની નોટ ઉપલબ્ધ નથી! (પ્રાપ્ય: {avail_cnt}, જરૂરિયાત: {requested_cnt}). કૃપા કરીને Opening Float અથવા Cash In વડે નોટો ઉમેરો.")
                except ValueError as ve:
                    if "Gulla Alert" in str(ve):
                        raise ve

    # 1. Handle Supplier Payout entry
    if entry_type == 'SUPPLIER_PAYMENT' and supplier_id:
        try:
            supp = Supplier.objects.get(id=supplier_id)
            sp = SupplierPayment.objects.create(
                supplier=supp,
                amount=amount,
                payment_method='CASH',
                payment_date=today,
                notes=f"Paid from Gulla: {notes}" if notes else "Paid from Gulla Cash Drawer"
            )
        except Supplier.DoesNotExist:
            pass

    # 2. Handle Store Expense entry
    if entry_type == 'EXPENSE':
        cat = None
        if category_id:
            try:
                cat = ExpenseCategory.objects.get(id=category_id)
            except ExpenseCategory.DoesNotExist:
                pass
        if not cat:
            cat, _ = ExpenseCategory.objects.get_or_create(name='Daily Operations', defaults={'icon': 'Receipt', 'color': '#384959'})
        
        ex = Expense.objects.create(
            title=title or notes or 'Store Cash Expense',
            category=cat,
            amount=amount,
            date=today,
            payment_method='CASH',
            notes=f"Paid from Gulla: {notes}" if notes else "Cash Register Outflow"
        )

    # 3. Create Cash Register Entry with denomination counts
    created_by_str = user.get_full_name() if (user and hasattr(user, 'get_full_name') and user.get_full_name()) else (user.username if (user and hasattr(user, 'username')) else 'Store Admin')
    entry = CashRegisterEntry.objects.create(
        entry_type=entry_type,
        amount=amount,
        notes=notes,
        denomination_counts=denomination_counts or {},
        created_by_name=created_by_str
    )

    return entry


def sync_all_transactions_to_bank_register():
    """
    Master synchronization service to ensure ALL store transactions across all modules:
    1. POS Order Bills (All paid customer bills)
    2. Supplier Payouts (All vendor payments)
    3. Khata Customer Settlements (All khata payments)
    4. Store Expenses (All operational expenses)
    5. Admin Capital Deposits & Withdrawals
    are comprehensively present in the Bank & UPI Register (BankTransaction model).
    """
    from core.models import BankTransaction
    from orders.models import Order, PaymentTransaction
    from suppliers.models import SupplierPayment
    from expenses.models import Expense

    count = 0

    # 1. Sync All Paid POS Orders & Bills
    paid_orders = Order.objects.filter(payment_status='PAID').select_related('customer', 'created_by')
    for ord_obj in paid_orders:
        ref_no = ord_obj.invoice_number or ord_obj.order_number
        if not BankTransaction.objects.filter(reference_number=ref_no).exists():
            is_upi_card = ord_obj.payment_method in ['UPI', 'CARD', 'BANK', 'ONLINE']
            ttype = 'UPI_IN' if is_upi_card else 'UPI_IN'
            label_pm = f"[{ord_obj.payment_method}]" if ord_obj.payment_method else "[CASH/UPI]"
            cust_str = ord_obj.customer_name or (ord_obj.customer.name if ord_obj.customer else 'Walk-in Customer')
            
            bt = BankTransaction.objects.create(
                transaction_type=ttype,
                amount=ord_obj.total_amount,
                reference_number=ref_no,
                bank_name='HDFC Store Primary Bank',
                notes=f"POS Bill #{ord_obj.order_number} ({cust_str}) {label_pm}",
                created_by=ord_obj.created_by
            )
            bt_dt = ord_obj.created_at or timezone.now()
            BankTransaction.objects.filter(id=bt.id).update(date=bt_dt.date(), created_at=bt_dt)
            count += 1

    # 2. Sync All Supplier Payments
    supp_payments = SupplierPayment.objects.all().select_related('supplier')
    for sp in supp_payments:
        ref_no = sp.reference_number or f"PAY-SUPP-{sp.id}"
        if not BankTransaction.objects.filter(reference_number=ref_no).exists():
            supp_name = sp.supplier.company_name or sp.supplier.name if sp.supplier else 'Supplier'
            bt = BankTransaction.objects.create(
                transaction_type='SUPPLIER_PAYOUT',
                amount=sp.amount,
                reference_number=ref_no,
                bank_name='HDFC Store Primary Bank',
                notes=f"Supplier Payout to {supp_name} ({sp.payment_method})",
            )
            sp_date = sp.payment_date or timezone.now().date()
            sp_dt = timezone.datetime.combine(sp_date, timezone.now().time())
            BankTransaction.objects.filter(id=bt.id).update(date=sp_date, created_at=sp_dt)
            count += 1

    # 3. Sync All Khata Customer Settlements
    khata_txns = PaymentTransaction.objects.filter(notes__icontains='Khata').select_related('order__customer')
    for kt in khata_txns:
        ref_no = kt.transaction_id or f"KHATA-TXN-{kt.id}"
        if not BankTransaction.objects.filter(reference_number=ref_no).exists():
            c_name = kt.order.customer_name if (kt.order and kt.order.customer_name) else 'Khata Customer'
            bt = BankTransaction.objects.create(
                transaction_type='UPI_IN',
                amount=kt.amount,
                reference_number=ref_no,
                bank_name='HDFC Store Primary Bank',
                notes=f"Khata Customer Settlement: {c_name} ({kt.payment_method})",
            )
            kt_dt = kt.created_at or timezone.now()
            BankTransaction.objects.filter(id=bt.id).update(date=kt_dt.date(), created_at=kt_dt)
            count += 1

    # 4. Sync All Store Expenses
    expenses_qs = Expense.objects.all().select_related('category', 'created_by')
    for ex in expenses_qs:
        ref_no = f"EXP-{ex.id}"
        if not BankTransaction.objects.filter(reference_number=ref_no).exists():
            cat_name = ex.category.name if ex.category else 'Store Expense'
            bt = BankTransaction.objects.create(
                transaction_type='EXPENSE_PAYOUT',
                amount=ex.amount,
                reference_number=ref_no,
                bank_name='HDFC Store Primary Bank',
                notes=f"Store Expense: {ex.title} ({cat_name}) [{ex.payment_method}]",
                created_by=ex.created_by
            )
            ex_date = ex.date or timezone.now().date()
            ex_dt = timezone.datetime.combine(ex_date, timezone.now().time())
            BankTransaction.objects.filter(id=ex_date, created_at=ex_dt) if False else BankTransaction.objects.filter(id=bt.id).update(date=ex_date, created_at=ex_dt)
            count += 1

    return count


def perform_eod_cash_sweep(user=None, keep_float=Decimal('5000.00'), custom_amount=None):
    """
    Automatic Day-End Gulla Sweep to Home Safe.
    Calculates expected net cash in Gulla, subtracts the desired float to keep for tomorrow,
    creates a CASH_OUT entry in CashRegisterEntry, adds the swept cash to StoreSetting.home_cash_amount,
    and logs a BankTransaction / PaymentTransaction so it appears in Payment Ledger & Settlements.
    """
    from core.models import CashRegisterEntry, BankTransaction

    today = timezone.localtime(timezone.now()).date()
    summary = get_gulla_summary(today)
    net_cash_gulla = Decimal(str(summary.get('net_cash_in_gulla', 0)))

    if custom_amount is not None:
        sweep_amount = Decimal(str(custom_amount))
    else:
        keep_float_dec = Decimal(str(keep_float or 5000.00))
        sweep_amount = max(Decimal('0.00'), net_cash_gulla - keep_float_dec)
        if sweep_amount <= Decimal('0.00') and net_cash_gulla > Decimal('0.00'):
            sweep_amount = net_cash_gulla

    if sweep_amount <= Decimal('0.00'):
        return {
            'success': False,
            'message': 'No positive net cash in Gulla available for Day-End sweep.',
            'swept_amount': 0.0,
            'net_cash_gulla': float(net_cash_gulla)
        }

    ts_str = timezone.now().strftime('%Y%m%d%H%M%S')

    # 1. Create CASH_OUT entry in CashRegisterEntry
    created_by_str = user.get_full_name() if (user and hasattr(user, 'get_full_name') and user.get_full_name()) else (user.username if (user and hasattr(user, 'username')) else 'Store Admin')
    entry = CashRegisterEntry.objects.create(
        entry_type='CASH_OUT',
        amount=sweep_amount,
        notes=f"Auto EOD Cash Sweep to Home Safe (ઘરે રોકડ મોકલી) [Ref: EOD-{ts_str}]",
        created_by_name=created_by_str
    )

    # 2. Log to BankTransaction for Payment Ledger & Settlements
    ref_no = f"EOD-HOME-{ts_str}"
    BankTransaction.objects.create(
        transaction_type='WITHDRAWAL',
        amount=sweep_amount,
        reference_number=ref_no,
        bank_name='Gulla Cash Drawer to Home Safe',
        notes=f"Day-End Auto Cash Withdrawal to Home Safe",
        created_by=user if user and user.is_authenticated else None
    )

    # 3. Update StoreSetting home_cash_amount & Log HomeCashTransaction
    try:
        from core.models import StoreSetting, HomeCashTransaction
        setting = StoreSetting.get_settings()
        setting.home_cash_amount = Decimal(str(setting.home_cash_amount or 0)) + sweep_amount
        setting.save()

        HomeCashTransaction.objects.create(
            entry_type='SWEEP',
            amount=sweep_amount,
            notes=f"Auto EOD Cash Sweep from Gulla Cash Drawer [Ref: EOD-{ts_str}]",
            created_by_name=created_by_str,
            balance_after=setting.home_cash_amount
        )
    except Exception as ex:
        print("Home cash transaction sweep warning:", ex)

    return {
        'success': True,
        'message': f'Successfully swept ₹{sweep_amount:.2f} from Gulla to Home Safe!',
        'swept_amount': float(sweep_amount),
        'net_cash_remaining_in_gulla': float(net_cash_gulla - sweep_amount)
    }
