import datetime
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, F, Q, Avg
from django.db.models.functions import TruncDate, TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from orders.models import Order, OrderItem, PaymentTransaction
from inventory.models import Product, Category, StockMovement
from customers.models import Customer
from expenses.models import Expense
from suppliers.models import PurchaseOrder, Supplier
from core.models import StoreSetting

class DashboardSummaryView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)
        seven_days_ago = today - datetime.timedelta(days=6)

        # Sales & Orders KPIs
        all_orders = Order.objects.all()
        paid_orders = all_orders.filter(payment_status='PAID')
        
        total_sales = paid_orders.aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')
        today_sales = paid_orders.filter(created_at__date=today).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')
        month_sales = paid_orders.filter(created_at__date__gte=first_day_of_month).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')

        total_orders_count = all_orders.count()
        pending_orders_count = all_orders.filter(status__in=['NEW', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY']).count()
        completed_orders_count = all_orders.filter(status='DELIVERED').count()
        cancelled_orders_count = all_orders.filter(status='CANCELLED').count()

        # Customers & Products KPIs
        total_customers = Customer.objects.count()
        all_products = Product.objects.all()
        total_products = all_products.count()
        out_of_stock_count = all_products.filter(stock_quantity__lte=0).count()
        low_stock_count = all_products.filter(stock_quantity__gt=0, stock_quantity__lte=F('min_stock_alert')).count()

        # Expenses & Profit KPIs
        today_expenses = Expense.objects.filter(date=today).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        month_expenses = Expense.objects.filter(date__gte=first_day_of_month).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        total_expenses = Expense.objects.aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

        # Estimated Profit (Revenue - Cost of Goods - Expenses)
        # Calculate cost of sold items in delivered/paid orders
        total_cogs = OrderItem.objects.filter(order__payment_status='PAID').aggregate(
            cogs=Sum(F('quantity') * F('product__cost_price'))
        )['cogs'] or Decimal('0.00')
        
        gross_profit = total_sales - total_cogs
        net_profit = gross_profit - total_expenses

        # Dynamic Sales Growth %
        thirty_days_ago = today - datetime.timedelta(days=30)
        sixty_days_ago = today - datetime.timedelta(days=60)
        curr_30_sales = paid_orders.filter(created_at__date__gte=thirty_days_ago).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')
        prev_30_sales = paid_orders.filter(created_at__date__gte=sixty_days_ago, created_at__date__lt=thirty_days_ago).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')
        if prev_30_sales > 0:
            sales_growth_percent = round(float((curr_30_sales - prev_30_sales) / prev_30_sales * 100), 1)
        else:
            sales_growth_percent = 100.0 if curr_30_sales > 0 else 0.0

        # 7-Day Sales Trend
        daily_trends = []
        for i in range(7):
            d = seven_days_ago + datetime.timedelta(days=i)
            day_orders = paid_orders.filter(created_at__date=d)
            sales_sum = day_orders.aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')
            order_cnt = day_orders.count()
            day_exp = Expense.objects.filter(date=d).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
            daily_trends.append({
                'date': d.strftime('%d %b'),
                'raw_date': str(d),
                'sales': float(sales_sum),
                'orders': order_cnt,
                'expenses': float(day_exp),
                'profit': float(sales_sum - day_exp)
            })

        # Category Breakdown
        categories_data = (
            OrderItem.objects.filter(order__payment_status='PAID', product__category__isnull=False)
            .values(cat_name=F('product__category__name'))
            .annotate(revenue=Sum('subtotal'), items_sold=Sum('quantity'))
            .order_by('-revenue')[:6]
        )

        # Top 5 Selling Products
        top_products = (
            OrderItem.objects.filter(order__payment_status='PAID')
            .values('product__id', 'product__name', 'product__image', 'product__selling_price', 'product__stock_quantity')
            .annotate(total_sold=Sum('quantity'), total_revenue=Sum('subtotal'))
            .order_by('-total_sold')[:5]
        )

        # Low Stock Alert list
        low_stock_items = (
            Product.objects.filter(stock_quantity__lte=F('min_stock_alert'))
            .values('id', 'name', 'sku', 'stock_quantity', 'min_stock_alert', 'image', 'mrp', 'selling_price')[:6]
        )

        # Recent Orders
        recent_orders = (
            Order.objects.all().order_by('-created_at')[:6]
            .values('id', 'order_number', 'customer_name', 'total_amount', 'status', 'payment_status', 'payment_method', 'created_at')
        )

        return Response({
            'kpis': {
                'total_sales': float(total_sales),
                'today_sales': float(today_sales),
                'month_sales': float(month_sales),
                'total_orders': total_orders_count,
                'pending_orders': pending_orders_count,
                'completed_orders': completed_orders_count,
                'cancelled_orders': cancelled_orders_count,
                'total_customers': total_customers,
                'total_products': total_products,
                'low_stock_products': low_stock_count,
                'out_of_stock_products': out_of_stock_count,
                'today_expenses': float(today_expenses),
                'month_expenses': float(month_expenses),
                'total_expenses': float(total_expenses),
                'gross_profit': float(gross_profit),
                'net_profit': float(net_profit),
                'sales_growth_percent': sales_growth_percent,
            },
            'daily_trends': daily_trends,
            'category_breakdown': [
                {'name': c['cat_name'], 'value': float(c['revenue'] or 0), 'items_sold': c['items_sold']} 
                for c in categories_data
            ],
            'top_products': [
                {
                    'id': p['product__id'],
                    'name': p['product__name'],
                    'image': p['product__image'],
                    'price': float(p['product__selling_price'] or 0),
                    'stock': p['product__stock_quantity'],
                    'sold': p['total_sold'],
                    'revenue': float(p['total_revenue'] or 0)
                } for p in top_products
            ],
            'low_stock_items': list(low_stock_items),
            'recent_orders': list(recent_orders),
            'notifications': []
        })


class AnalyticsTrendsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        period = request.query_params.get('period', 'month').lower().strip() # 'day', 'week', 'month', 'year'
        today = timezone.now().date()

        trends_data = []

        if period in ['day', 'daily']:
            # Last 14 days
            for i in range(13, -1, -1):
                d_date = today - datetime.timedelta(days=i)
                next_d = d_date + datetime.timedelta(days=1)

                sales = Order.objects.filter(
                    payment_status='PAID',
                    created_at__date=d_date
                ).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')

                orders_count = Order.objects.filter(
                    created_at__date=d_date
                ).count()

                exp = Expense.objects.filter(
                    date=d_date
                ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

                cogs = OrderItem.objects.filter(
                    order__payment_status='PAID',
                    order__created_at__date=d_date
                ).aggregate(c=Sum(F('quantity') * F('product__cost_price')))['c'] or Decimal('0.00')

                profit = sales - cogs - exp
                margin_pct = round((profit / sales * 100), 1) if sales > 0 else Decimal('0.0')

                label = d_date.strftime('%d %b')
                trends_data.append({
                    'label': label,
                    'month': label,
                    'revenue': float(sales),
                    'cogs': float(cogs),
                    'expenses': float(exp),
                    'profit': float(profit),
                    'margin_pct': float(margin_pct),
                    'orders': orders_count
                })

        elif period in ['week', 'weekly']:
            # Last 8 weeks
            start_of_current_week = today - datetime.timedelta(days=today.weekday())
            for i in range(7, -1, -1):
                w_start = start_of_current_week - datetime.timedelta(weeks=i)
                w_end = w_start + datetime.timedelta(days=7)

                sales = Order.objects.filter(
                    payment_status='PAID',
                    created_at__date__gte=w_start,
                    created_at__date__lt=w_end
                ).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')

                orders_count = Order.objects.filter(
                    created_at__date__gte=w_start,
                    created_at__date__lt=w_end
                ).count()

                exp = Expense.objects.filter(
                    date__gte=w_start,
                    date__lt=w_end
                ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

                cogs = OrderItem.objects.filter(
                    order__payment_status='PAID',
                    order__created_at__date__gte=w_start,
                    order__created_at__date__lt=w_end
                ).aggregate(c=Sum(F('quantity') * F('product__cost_price')))['c'] or Decimal('0.00')

                profit = sales - cogs - exp
                margin_pct = round((profit / sales * 100), 1) if sales > 0 else Decimal('0.0')

                label = f"W{w_start.strftime('%U')} ({w_start.strftime('%d %b')})"
                trends_data.append({
                    'label': label,
                    'month': label,
                    'revenue': float(sales),
                    'cogs': float(cogs),
                    'expenses': float(exp),
                    'profit': float(profit),
                    'margin_pct': float(margin_pct),
                    'orders': orders_count
                })

        elif period in ['year', 'yearly']:
            # Last 5 years
            current_year = today.year
            for i in range(4, -1, -1):
                yr = current_year - i
                yr_start = datetime.date(yr, 1, 1)
                yr_end = datetime.date(yr + 1, 1, 1)

                sales = Order.objects.filter(
                    payment_status='PAID',
                    created_at__date__gte=yr_start,
                    created_at__date__lt=yr_end
                ).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')

                orders_count = Order.objects.filter(
                    created_at__date__gte=yr_start,
                    created_at__date__lt=yr_end
                ).count()

                exp = Expense.objects.filter(
                    date__gte=yr_start,
                    date__lt=yr_end
                ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

                cogs = OrderItem.objects.filter(
                    order__payment_status='PAID',
                    order__created_at__date__gte=yr_start,
                    order__created_at__date__lt=yr_end
                ).aggregate(c=Sum(F('quantity') * F('product__cost_price')))['c'] or Decimal('0.00')

                profit = sales - cogs - exp
                margin_pct = round((profit / sales * 100), 1) if sales > 0 else Decimal('0.0')

                label = str(yr)
                trends_data.append({
                    'label': label,
                    'month': label,
                    'revenue': float(sales),
                    'cogs': float(cogs),
                    'expenses': float(exp),
                    'profit': float(profit),
                    'margin_pct': float(margin_pct),
                    'orders': orders_count
                })

        else:
            # Default: Monthly (Last 12 Months)
            for i in range(11, -1, -1):
                m_date = (today.replace(day=1) - datetime.timedelta(days=i*30)).replace(day=1)
                if m_date.month == 12:
                    next_m = m_date.replace(year=m_date.year + 1, month=1)
                else:
                    next_m = m_date.replace(month=m_date.month + 1)

                sales = Order.objects.filter(
                    payment_status='PAID',
                    created_at__date__gte=m_date,
                    created_at__date__lt=next_m
                ).aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')

                orders_count = Order.objects.filter(
                    created_at__date__gte=m_date,
                    created_at__date__lt=next_m
                ).count()

                exp = Expense.objects.filter(
                    date__gte=m_date,
                    date__lt=next_m
                ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

                cogs = OrderItem.objects.filter(
                    order__payment_status='PAID',
                    order__created_at__date__gte=m_date,
                    order__created_at__date__lt=next_m
                ).aggregate(c=Sum(F('quantity') * F('product__cost_price')))['c'] or Decimal('0.00')

                profit = sales - cogs - exp
                margin_pct = round((profit / sales * 100), 1) if sales > 0 else Decimal('0.0')

                label = m_date.strftime('%b %Y')
                trends_data.append({
                    'label': label,
                    'month': label,
                    'revenue': float(sales),
                    'cogs': float(cogs),
                    'expenses': float(exp),
                    'profit': float(profit),
                    'margin_pct': float(margin_pct),
                    'orders': orders_count
                })

        # Payment Methods Distribution
        payment_methods = (
            Order.objects.filter(payment_status='PAID')
            .values('payment_method')
            .annotate(total_amount=Sum('total_amount'), count=Count('id'))
            .order_by('-total_amount')
        )

        # Category Performance
        categories = (
            OrderItem.objects.filter(order__payment_status='PAID', product__category__isnull=False)
            .values(category_name=F('product__category__name'))
            .annotate(
                revenue=Sum('subtotal'),
                items_sold=Sum('quantity'),
                orders_count=Count('order', distinct=True)
            )
            .order_by('-revenue')
        )

        # Customer Growth by Month
        customer_growth = []
        for i in range(5, -1, -1):
            m_date = (today.replace(day=1) - datetime.timedelta(days=i*30)).replace(day=1)
            if m_date.month == 12:
                next_m = m_date.replace(year=m_date.year + 1, month=1)
            else:
                next_m = m_date.replace(month=m_date.month + 1)
            
            cnt = Customer.objects.filter(created_at__date__gte=m_date, created_at__date__lt=next_m).count()
            customer_growth.append({
                'month': m_date.strftime('%b %Y'),
                'new_customers': cnt
            })

        return Response({
            'comparison_data': trends_data,
            'monthly_comparison': trends_data,
            'payment_methods': [
                {'method': pm['payment_method'], 'amount': float(pm['total_amount'] or 0), 'count': pm['count']}
                for pm in payment_methods
            ],
            'category_performance': [
                {
                    'category': c['category_name'], 
                    'revenue': float(c['revenue'] or 0), 
                    'items_sold': c['items_sold'],
                    'orders_count': c['orders_count']
                } for c in categories
            ],
            'customer_growth': customer_growth
        })


class ReportsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        report_type = request.query_params.get('type', 'sales') # sales, purchase, inventory, profit, expense, customer, gst, product, order
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        category_id = request.query_params.get('category')
        search = request.query_params.get('search')

        data = []
        summary = {}

        if report_type == 'sales':
            qs = Order.objects.filter(payment_status='PAID')
            if date_from:
                qs = qs.filter(created_at__date__gte=date_from)
            if date_to:
                qs = qs.filter(created_at__date__lte=date_to)
            if search:
                qs = qs.filter(Q(order_number__icontains=search) | Q(customer_name__icontains=search))
            
            for o in qs.order_by('-created_at')[:100]:
                data.append({
                    'Order ID': o.order_number,
                    'Invoice No': o.invoice_number or '-',
                    'Customer': o.customer_name,
                    'Date': o.created_at.strftime('%Y-%m-%d %H:%M'),
                    'Payment Method': o.payment_method,
                    'Subtotal (₹)': float(o.subtotal),
                    'Tax (₹)': float(o.tax_amount),
                    'Discount (₹)': float(o.discount_amount),
                    'Total Amount (₹)': float(o.total_amount),
                    'Status': o.status
                })
            
            tot = qs.aggregate(s=Sum('total_amount'), t=Sum('tax_amount'), d=Sum('discount_amount'))
            summary = {
                'Total Revenue': f"₹{float(tot['s'] or 0):,.2f}",
                'Total Orders': qs.count(),
                'Total GST Collected': f"₹{float(tot['t'] or 0):,.2f}",
                'Total Discounts Given': f"₹{float(tot['d'] or 0):,.2f}"
            }

        elif report_type == 'inventory':
            qs = Product.objects.all().select_related('category', 'brand', 'unit')
            if category_id:
                qs = qs.filter(category_id=category_id)
            if search:
                qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))

            total_val = 0
            for p in qs:
                stock_val = float(p.selling_price) * p.stock_quantity
                cost_val = float(p.cost_price) * p.stock_quantity
                total_val += stock_val
                data.append({
                    'SKU': p.sku,
                    'Product Name': p.name,
                    'Category': p.category.name if p.category else '-',
                    'Stock Qty': f"{p.stock_quantity} {p.unit.short_name if p.unit else ''}",
                    'Min Alert': p.min_stock_alert,
                    'Stock Status': p.stock_status.replace('_', ' '),
                    'Selling Price (₹)': float(p.selling_price),
                    'Cost Price (₹)': float(p.cost_price),
                    'Stock Valuation (₹)': round(stock_val, 2),
                    'Expiry Date': str(p.expiry_date) if p.expiry_date else 'N/A'
                })

            summary = {
                'Total Products': qs.count(),
                'Total Inventory Valuation': f"₹{total_val:,.2f}",
                'Low Stock Items': qs.filter(stock_quantity__lte=F('min_stock_alert'), stock_quantity__gt=0).count(),
                'Out of Stock Items': qs.filter(stock_quantity__lte=0).count()
            }

        elif report_type == 'gst':
            qs = Order.objects.filter(payment_status='PAID')
            if date_from:
                qs = qs.filter(created_at__date__gte=date_from)
            if date_to:
                qs = qs.filter(created_at__date__lte=date_to)

            for o in qs.order_by('-created_at')[:100]:
                cgst = float(o.tax_amount) / 2
                sgst = float(o.tax_amount) / 2
                data.append({
                    'Invoice No': o.invoice_number or o.order_number,
                    'Date': o.created_at.strftime('%Y-%m-%d'),
                    'Customer': o.customer_name,
                    'Taxable Value (₹)': float(o.subtotal - o.discount_amount),
                    'CGST (₹)': round(cgst, 2),
                    'SGST (₹)': round(sgst, 2),
                    'Total GST (₹)': float(o.tax_amount),
                    'Invoice Total (₹)': float(o.total_amount)
                })

            tot_tax = qs.aggregate(t=Sum('tax_amount'), sub=Sum('subtotal'))
            summary = {
                'Total Invoices': qs.count(),
                'Total Taxable Turnover': f"₹{float(tot_tax['sub'] or 0):,.2f}",
                'CGST Total': f"₹{float(tot_tax['t'] or 0)/2:,.2f}",
                'SGST Total': f"₹{float(tot_tax['t'] or 0)/2:,.2f}",
                'Total GST Liability': f"₹{float(tot_tax['t'] or 0):,.2f}"
            }

        elif report_type == 'expense':
            qs = Expense.objects.all().select_related('category')
            if date_from:
                qs = qs.filter(date__gte=date_from)
            if date_to:
                qs = qs.filter(date__lte=date_to)

            for e in qs.order_by('-date')[:100]:
                data.append({
                    'Date': str(e.date),
                    'Title': e.title,
                    'Category': e.category.name,
                    'Amount (₹)': float(e.amount),
                    'Payment Method': e.payment_method,
                    'Paid To': e.paid_to or '-',
                    'Notes': e.notes or '-'
                })

            tot_exp = qs.aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
            summary = {
                'Total Expenses': f"₹{float(tot_exp):,.2f}",
                'Total Records': qs.count()
            }

        elif report_type == 'customer':
            qs = Customer.objects.all()
            for c in qs.order_by('-created_at')[:100]:
                total_spent = float(c.orders.filter(payment_status='PAID').aggregate(t=Sum('total_amount'))['t'] or 0)
                orders_cnt = c.orders.count()
                data.append({
                    'Customer Name': c.name,
                    'Phone': c.phone,
                    'Email': c.email or '-',
                    'City': c.city,
                    'Total Orders': orders_cnt,
                    'Total Spent (₹)': total_spent,
                    'Status': c.status,
                    'Joined Date': c.created_at.strftime('%Y-%m-%d')
                })

            summary = {
                'Total Customers': qs.count(),
                'Active Customers': qs.filter(status='ACTIVE').count(),
                'Blocked Customers': qs.filter(status='BLOCKED').count()
            }

        elif report_type == 'purchase':
            qs = PurchaseOrder.objects.all().select_related('supplier')
            for po in qs.order_by('-created_at')[:100]:
                data.append({
                    'PO Number': po.po_number,
                    'Supplier': po.supplier.name,
                    'Company': po.supplier.company_name or '-',
                    'Order Date': str(po.order_date),
                    'Status': po.status,
                    'Total Amount (₹)': float(po.total_amount),
                    'Paid Amount (₹)': float(po.paid_amount),
                    'Due Amount (₹)': float(po.due_amount)
                })

            tot_po = qs.aggregate(t=Sum('total_amount'), p=Sum('paid_amount'))
            summary = {
                'Total POs': qs.count(),
                'Total Purchase Value': f"₹{float(tot_po['t'] or 0):,.2f}",
                'Total Paid': f"₹{float(tot_po['p'] or 0):,.2f}",
                'Total Balance Due': f"₹{float((tot_po['t'] or 0) - (tot_po['p'] or 0)):,.2f}"
            }

        elif report_type == 'profit':
            # Monthly profit breakdown
            today = timezone.now().date()
            for i in range(6):
                m_date = (today.replace(day=1) - datetime.timedelta(days=i*30)).replace(day=1)
                if m_date.month == 12:
                    next_m = m_date.replace(year=m_date.year + 1, month=1)
                else:
                    next_m = m_date.replace(month=m_date.month + 1)

                sales = float(Order.objects.filter(payment_status='PAID', created_at__date__gte=m_date, created_at__date__lt=next_m).aggregate(t=Sum('total_amount'))['t'] or 0)
                exp = float(Expense.objects.filter(date__gte=m_date, date__lt=next_m).aggregate(t=Sum('amount'))['t'] or 0)
                cogs = float(OrderItem.objects.filter(order__payment_status='PAID', order__created_at__date__gte=m_date, order__created_at__date__lt=next_m).aggregate(t=Sum(F('quantity') * F('product__cost_price')))['t'] or 0)
                gross = sales - cogs
                net = gross - exp
                margin = round((net / sales * 100) if sales > 0 else 0, 1)

                data.append({
                    'Month': m_date.strftime('%B %Y'),
                    'Gross Sales (₹)': round(sales, 2),
                    'Cost of Goods (₹)': round(cogs, 2),
                    'Gross Profit (₹)': round(gross, 2),
                    'Operating Expenses (₹)': round(exp, 2),
                    'Net Profit / Loss (₹)': round(net, 2),
                    'Net Margin (%)': f"{margin}%"
                })

            summary = {
                'Report Range': 'Last 6 Months',
                'Status': 'Profitable'
            }

        return Response({
            'report_type': report_type,
            'summary': summary,
            'data': data
        })
