import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { 
  TrendingUp, 
  IndianRupee, 
  CreditCard, 
  PieChart as PieIcon, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  Download,
  Percent,
  Receipt,
  ArrowLeft,
  LayoutGrid,
  List,
  ShoppingBag,
  BarChart2,
  ShieldCheck,
  CheckCircle2,
  Users,
  UserCheck,
  Printer,
  FileSpreadsheet,
  Building2,
  Wallet,
  Coins,
  ReceiptText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { analyticsApi } from '../../api';
import { useTheme } from '../../context/ThemeContext';

const CATEGORY_ICONS = {
  'Groceries & Staples': '🌾',
  'Grocery': '🌾',
  'Dairy & Bakery': '🥛',
  'Dairy Products': '🥛',
  'Fresh Vegetables & Fruits': '🥦',
  'Vegetables': '🥦',
  'Fruits': '🍎',
  'Snacks & Munchies': '🍿',
  'Snacks': '🍿',
  'Beverages & Drinks': '🥤',
  'Beverages': '🥤',
  'Personal Care & Hygiene': '🧴',
  'Personal Care': '🧴',
  'Household & Cleaning': '🧼',
  'Household': '🧼',
  'Spices & Masalas': '🌶️'
};

const CATEGORY_COLORS = [
  '#00b894', '#0984e3', '#00cec9', '#e17055', '#6c5ce7', '#fd79a8', '#636e72', '#a29bfe'
];

const PAYMENT_COLORS = {
  'UPI': '#00b894',
  'CASH': '#f1c40f',
  'CARD': '#6c5ce7',
  'WALLET': '#e84393',
  'COD': '#e67e22',
  'OTHER': '#00cec9'
};

export const SalesRevenue = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // 'day', 'week', 'month', 'year'
  const [activeTab, setActiveTab] = useState('overview'); // Default to 5-graph dashboard grid overview
  const [matrixView, setMatrixView] = useState('cards'); // 'cards' (row-wise div cards) or 'table'
  const [poView, setPoView] = useState('cards');
  const [customerView, setCustomerView] = useState('cards');
  const [staffView, setStaffView] = useState('cards');
  const [expenseView, setExpenseView] = useState('cards');
  const [customerFilter, setCustomerFilter] = useState('all'); // 'all', 'walkin', 'registered'

  const PALETTE_COLORS = ['#00b894', '#f1c40f', '#6c5ce7', '#e84393', '#e67e22', '#00cec9'];

  const periods = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  useEffect(() => {
    loadTrends();
  }, [timeframe, customerFilter]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const params = { period: timeframe };
      if (customerFilter !== 'all') {
        params.customer_type = customerFilter;
      }
      const res = await analyticsApi.getSalesTrends(params);
      const data = res?.data?.data || res?.data || res;
      setTrendsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const comparisonData = useMemo(() => trendsData?.comparison_data || [], [trendsData]);
  const payment_methods = useMemo(() => trendsData?.payment_methods || [], [trendsData]);
  const category_performance = useMemo(() => trendsData?.category_performance || [], [trendsData]);
  const poSummary = useMemo(() => trendsData?.purchase_orders_summary || { total_pos: 0, total_po_amount: 0, total_paid_amount: 0, list: [] }, [trendsData]);
  const customerSummary = useMemo(() => trendsData?.customer_billing_summary || { total_customer_bills: 0, registered_customers_revenue: 0, walkin_customers_revenue: 0, list: [] }, [trendsData]);
  const staffSummary = useMemo(() => trendsData?.staff_sales_summary || { total_staff: 0, list: [] }, [trendsData]);
  const expenseSummary = useMemo(() => trendsData?.expenses_summary || { total_expenses: 0, cash_expenses: 0, upi_expenses: 0, categories: [], list: [] }, [trendsData]);

  // Aggregated Summary Totals
  const totals = useMemo(() => {
    return comparisonData.reduce(
      (acc, r) => {
        acc.total_bills += r.total_bills || r.orders || 0;
        acc.cash_bills += r.cash_bills || 0;
        acc.upi_bills += r.upi_bills || 0;
        acc.card_bills += r.card_bills || 0;

        acc.cash_non_tax += r.cash_non_tax || 0;
        acc.upi_non_tax += r.upi_non_tax || 0;

        acc.cash_tax += r.cash_tax || 0;
        acc.upi_tax += r.upi_tax || 0;

        acc.total_rev_cash += r.total_rev_cash || 0;
        acc.total_rev_upi += r.total_rev_upi || 0;
        acc.total_rev_combined += r.total_rev_combined || r.revenue || 0;

        acc.profit_cash += r.profit_cash || 0;
        acc.profit_upi += r.profit_upi || 0;
        acc.profit_combined += r.profit_combined || r.profit || 0;

        acc.expenses += r.expenses || 0;
        acc.net_profit += r.net_profit || 0;
        return acc;
      },
      {
        total_bills: 0,
        cash_bills: 0,
        upi_bills: 0,
        card_bills: 0,
        cash_non_tax: 0,
        upi_non_tax: 0,
        cash_tax: 0,
        upi_tax: 0,
        total_rev_cash: 0,
        total_rev_upi: 0,
        total_rev_combined: 0,
        profit_cash: 0,
        profit_upi: 0,
        profit_combined: 0,
        expenses: 0,
        net_profit: 0
      }
    );
  }, [comparisonData]);

  const totalCatRevenue = useMemo(() => category_performance.reduce((sum, c) => sum + (c.revenue || 0), 0), [category_performance]);
  const maxCatRevenue = useMemo(() => Math.max(...category_performance.map(c => c.revenue || 0), 1), [category_performance]);

  const avgOrderValue = totals.total_bills > 0 ? totals.total_rev_combined / totals.total_bills : 0;
  const overallMargin = totals.total_rev_combined > 0 ? ((totals.net_profit / totals.total_rev_combined) * 100).toFixed(1) : '0.0';

  // Export PDF Report Function
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tulsi Mart POS - Sales & Revenue Report (${timeframe.toUpperCase()})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #1e293b; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #00796b; padding-bottom: 12px; margin-bottom: 20px; }
            .brand { font-size: 24px; font-weight: 900; color: #00796b; letter-spacing: -0.5px; }
            .sub { font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 600; }
            .kpis { display: flex; gap: 12px; margin-bottom: 25px; }
            .kpi-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 12px; }
            .kpi-title { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .kpi-val { font-size: 17px; font-weight: 900; color: #00796b; margin-top: 4px; }
            h2 { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 25px; margin-bottom: 10px; border-left: 4px solid #00796b; padding-left: 8px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
            th { background: #00796b; color: white; text-align: left; padding: 7px 8px; font-weight: 800; text-transform: uppercase; font-size: 9px; }
            td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .tfoot td { font-weight: 900; background: #e6f4f1; border-top: 2px solid #00796b; color: #004d40; font-size: 10px; }
            .num { text-align: right; font-family: monospace; font-weight: 600; }
            .footer { margin-top: 35px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">TULSI MART POS</div>
              <div class="sub">Financial Sales, Cash/UPI Breakdown & Operating Margins Report</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 900; font-size: 14px; color: #00796b;">PERIOD: ${timeframe.toUpperCase()}</div>
              <div class="sub">Generated: ${todayStr}</div>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi-card">
              <div class="kpi-title">Gross Revenue</div>
              <div class="kpi-val">₹${totals.total_rev_combined.toLocaleString('en-IN')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Gross Profit (SP - CP)</div>
              <div class="kpi-val">₹${totals.profit_combined.toLocaleString('en-IN')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Operating Expenses</div>
              <div class="kpi-val" style="color: #d97706;">₹${totals.expenses.toLocaleString('en-IN')}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Net Operating Profit</div>
              <div class="kpi-val" style="color: #059669;">₹${totals.net_profit.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <h2>1. Day-Wise Financial Matrix Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bills</th>
                <th>Cash</th>
                <th>UPI</th>
                <th class="num">Non-Tax Cash</th>
                <th class="num">Non-Tax UPI</th>
                <th class="num">Tax Cash</th>
                <th class="num">Tax UPI</th>
                <th class="num">Rev Cash</th>
                <th class="num">Rev UPI</th>
                <th class="num">Total Revenue</th>
                <th class="num">Profit Cash</th>
                <th class="num">Profit UPI</th>
                <th class="num">Combined Profit</th>
              </tr>
            </thead>
            <tbody>
              ${comparisonData.map(r => `
                <tr>
                  <td><b>${r.date || r.label}</b></td>
                  <td>${r.total_bills || r.orders || 0}</td>
                  <td>${r.cash_bills || 0}</td>
                  <td>${r.upi_bills || 0}</td>
                  <td class="num">₹${(r.cash_non_tax || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${(r.upi_non_tax || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${(r.cash_tax || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${(r.upi_tax || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${(r.total_rev_cash || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${(r.total_rev_upi || 0).toLocaleString('en-IN')}</td>
                  <td class="num"><b>₹${(r.total_rev_combined || r.revenue || 0).toLocaleString('en-IN')}</b></td>
                  <td class="num">₹${(r.profit_cash || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${(r.profit_upi || 0).toLocaleString('en-IN')}</td>
                  <td class="num" style="color: #059669;"><b>₹${(r.profit_combined || r.profit || 0).toLocaleString('en-IN')}</b></td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="tfoot">
              <tr>
                <td>TOTALS</td>
                <td>${totals.total_bills}</td>
                <td>${totals.cash_bills}</td>
                <td>${totals.upi_bills}</td>
                <td class="num">₹${totals.cash_non_tax.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.upi_non_tax.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.cash_tax.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.upi_tax.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.total_rev_cash.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.total_rev_upi.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.total_rev_combined.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.profit_cash.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.profit_upi.toLocaleString('en-IN')}</td>
                <td class="num">₹${totals.profit_combined.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <h2>2. Staff Cashier Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Role</th>
                <th>Total Bills</th>
                <th class="num">Cash Collection</th>
                <th class="num">UPI Collection</th>
                <th class="num">Total Collected</th>
              </tr>
            </thead>
            <tbody>
              ${(staffSummary.list || []).map(st => `
                <tr>
                  <td><b>${st.staff_name}</b></td>
                  <td>${st.role}</td>
                  <td>${st.bill_count} Bills</td>
                  <td class="num">₹${Number(st.cash_revenue || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${Number(st.upi_revenue || 0).toLocaleString('en-IN')}</td>
                  <td class="num"><b>₹${Number(st.total_revenue || 0).toLocaleString('en-IN')}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>3. Purchase Orders Paid Summary</h2>
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier Name</th>
                <th>Order Date</th>
                <th class="num">Total Value</th>
                <th class="num">Paid Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(poSummary.list || []).map(po => `
                <tr>
                  <td><b>${po.po_number}</b></td>
                  <td>${po.supplier_name}</td>
                  <td>${po.order_date}</td>
                  <td class="num">₹${Number(po.total_amount || 0).toLocaleString('en-IN')}</td>
                  <td class="num">₹${Number(po.paid_amount || 0).toLocaleString('en-IN')}</td>
                  <td>${po.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Tulsi Mart POS System &bull; Certified Analytics Report &bull; Page 1
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs space-y-1.5 font-sans min-w-[180px]">
          <p className="font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00695C] dark:bg-[#4DB6AC]" />
              Total Revenue:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">₹{Number(data.total_rev_combined || data.revenue || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Net Profit:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{Number(data.net_profit || data.profit || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-slate-500 font-semibold">
            <span>Operating Margin:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${data.margin_pct >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'}`}>
              {data.margin_pct}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading || !trendsData) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00695C]/10 dark:bg-[#4DB6AC]/10 border-2 border-[#009688] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">Loading Sales & Revenue Breakdown...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 📱 Mobile Top App Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] flex items-center -mx-3 -mt-3 mb-3">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-xs cursor-pointer shrink-0 border border-teal-100 dark:border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.6]" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                Sales & <span className="text-[#00695C] dark:text-[#4DB6AC]">Revenue</span>
              </h1>
              <p className="text-[10px] font-semibold text-[#267B70] dark:text-slate-300 truncate">
                Financial Graphs & PDF Report
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-[#00796b] border border-teal-200 flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-teal-100 dark:border-slate-700">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTimeframe(p.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                    timeframe === p.id ? 'bg-[#00796b] text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Desktop Top Header Banner */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-3 flex items-center justify-center shrink-0 shadow-md">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Sales & <span className="text-[#00796b] dark:text-[#80cbc4]">Revenue Analytics</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-[#00695c] dark:bg-teal-950 dark:text-teal-300 border border-teal-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Graphs
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Interactive revenue trend charts, revenue vs profit, category breakdown, payment donut share & matrix ledgers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Segmented Main Tab Navigation Bar (IMAGE 2) */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#00796b] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Revenue & Profit Graphs</span>
          </button>

          <button
            onClick={() => setActiveTab('detailed')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'detailed'
                ? 'bg-[#00796b] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Detailed Breakdown Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('purchase_orders')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'purchase_orders'
                ? 'bg-[#00796b] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Purchase Orders Paid ({poSummary.total_pos})</span>
          </button>

          <button
            onClick={() => setActiveTab('customer_billing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'customer_billing'
                ? 'bg-[#00796b] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Billing ({customerSummary.list.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('staff_sales')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'staff_sales'
                ? 'bg-[#00796b] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Staff Collections ({staffSummary.total_staff})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-[#00796b] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Expenses Paid</span>
          </button>
        </div>
      </div>

      {/* 🌟 ACTION CONTROLS BAR (IMAGE 1 - PLACED DIRECTLY BELOW IMAGE 2 TAB BAR) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-2.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs">
        {/* Download PDF Report Button */}
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] border border-teal-300 dark:border-teal-800 flex items-center gap-2 shadow-2xs hover:bg-teal-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#00796b] dark:text-[#80cbc4]" />
          <span>Download PDF Report</span>
        </button>

        {/* Customer Type Filter Selector Pills (All vs Walk-in (Hoking) Customers) */}
        <div className="flex items-center gap-1 bg-teal-50/70 dark:bg-slate-800/90 p-1 rounded-2xl text-xs font-bold border border-teal-100 dark:border-slate-700/80 shadow-2xs overflow-x-auto">
          <button
            onClick={() => setCustomerFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
              customerFilter === 'all'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700'
            }`}
          >
            All Bills
          </button>
          <button
            onClick={() => setCustomerFilter('walkin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
              customerFilter === 'walkin'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700'
            }`}
          >
            Walk-in (Hoking) Customers Only
          </button>
          <button
            onClick={() => setCustomerFilter('registered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
              customerFilter === 'registered'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700'
            }`}
          >
            Registered Customers
          </button>
        </div>

        {/* Day / Week / Month / Year Timeframe Selector Pills */}
        <div className="flex items-center gap-1 bg-teal-50/70 dark:bg-slate-800/90 p-1 rounded-2xl text-xs font-bold border border-teal-100 dark:border-slate-700/80 shadow-2xs">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setTimeframe(p.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                timeframe === p.id 
                  ? 'bg-[#00796b] text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 TAB 1: 5-GRAPH DASHBOARD GRID (MATCHING USER'S EXACT DESIGN SCREENSHOT) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Row: 2 Cards (Monthly Revenue Trend & Revenue vs Profit) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* GRAPH CARD 1: Monthly Revenue Trend */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 font-heading">
                    Monthly Revenue Trend
                  </h3>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="year">This Year</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                  <option value="day">Today</option>
                </select>
              </div>

              {/* Legend Top Center */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00796b]" />
                <span>Revenue</span>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorMonthlyRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00796b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00796b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis width={55} tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total_rev_combined" 
                      name="Revenue" 
                      stroke="#00796b" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorMonthlyRev)" 
                      dot={{ r: 4, fill: '#00796b', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#00796b', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRAPH CARD 2: Revenue vs Profit */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 font-heading">
                    Revenue vs Profit
                  </h3>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="year">This Year</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                  <option value="day">Today</option>
                </select>
              </div>

              {/* Legend Top Center */}
              <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00796b]" />
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                  <span>Profit</span>
                </div>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis width={55} tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total_rev_combined" name="Revenue" fill="#00796b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="profit_combined" name="Profit" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Row: 3 Cards (Revenue by Category, Payment Method Revenue & Daily Sales Revenue) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* GRAPH CARD 3: Revenue by Category */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 font-heading">
                    Revenue by Category
                  </h3>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="year">This Year</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                  <option value="day">Today</option>
                </select>
              </div>

              {/* Progress Bar List */}
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {category_performance.map((cat, idx) => {
                  const pct = totalCatRevenue > 0 ? ((cat.revenue / totalCatRevenue) * 100).toFixed(0) : 0;
                  const barWidth = `${Math.min(100, Math.max(8, (cat.revenue / maxCatRevenue) * 100))}%`;
                  const icon = CATEGORY_ICONS[cat.category] || '📦';
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-sm">{icon}</span>
                          <span className="truncate max-w-[110px]">{cat.category}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            ₹{Number(cat.revenue || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: barWidth, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRAPH CARD 4: Payment Method Revenue (Donut + Legend) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 font-heading">
                    Payment Method Revenue
                  </h3>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="year">This Year</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                  <option value="day">Today</option>
                </select>
              </div>

              {/* Donut Chart & Legend Grid */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Donut Chart Container */}
                <div className="relative h-56 w-48 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={payment_methods}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {payment_methods.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PAYMENT_COLORS[entry.method?.toUpperCase()] || PALETTE_COLORS[index % PALETTE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Overlay Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <div className="text-xs font-black text-slate-900 dark:text-slate-100 font-heading">
                      ₹{totals.total_rev_combined >= 100000 ? `${(totals.total_rev_combined / 100000).toFixed(2)}L` : totals.total_rev_combined.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Total Revenue
                    </div>
                  </div>
                </div>

                {/* Donut Legend List */}
                <div className="space-y-2.5 flex-1 min-w-0 w-full border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-3">
                  {payment_methods.map((pm, idx) => {
                    const pct = totals.total_rev_combined > 0 ? ((pm.amount / totals.total_rev_combined) * 100).toFixed(0) : 0;
                    const color = PAYMENT_COLORS[pm.method?.toUpperCase()] || PALETTE_COLORS[idx % PALETTE_COLORS.length];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{pm.method}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="font-semibold text-slate-400 text-[11px]">{pct}%</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                            ₹{Number(pm.amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GRAPH CARD 5: Daily Sales Revenue */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 font-heading">
                    Daily Sales Revenue
                  </h3>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="month">Last 30 Days</option>
                  <option value="week">This Week</option>
                  <option value="day">Today</option>
                </select>
              </div>

              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorDailyRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00b894" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00b894" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis width={50} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total_rev_combined" 
                      name="Daily Sales" 
                      stroke="#00b894" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorDailyRev)" 
                      dot={{ r: 3.5, fill: '#00b894', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#00b894', strokeWidth: 2, stroke: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🌟 TAB 2: DETAILED FINANCIAL BREAKDOWN MATRIX */}
      {activeTab === 'detailed' && (
        <div className="space-y-4">
          {/* Header & Matrix View Switcher */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00796b]/10 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center font-bold shrink-0">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide font-heading">
                  {timeframe.toUpperCase()} Financial Breakdown Matrix ({comparisonData.length} Records)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Cash/UPI Split &bull; Non-Tax vs Tax Revenue &bull; Gross Profit (SP - CP) &bull; Operating Expenses
                </p>
              </div>
            </div>

            {/* Customer Filter & View Switcher */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setCustomerFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    customerFilter === 'all'
                      ? 'bg-[#00796b] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All Bills
                </button>
                <button
                  onClick={() => setCustomerFilter('walkin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    customerFilter === 'walkin'
                      ? 'bg-[#00796b] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Walk-in (Hoking) Customers Only
                </button>
                <button
                  onClick={() => setCustomerFilter('registered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    customerFilter === 'registered'
                      ? 'bg-[#00796b] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Registered Members
                </button>
              </div>

              {/* View Switcher: Card View vs Table View */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setMatrixView('cards')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    matrixView === 'cards'
                      ? 'bg-[#00796b] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card View</span>
                </button>
                <button
                  onClick={() => setMatrixView('table')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    matrixView === 'table'
                      ? 'bg-[#00796b] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
              </div>
            </div>
          </div>

          {/* 📦 CARD VIEW (ROW-WISE DIV CARDS) */}
          {matrixView === 'cards' && (
            <div className="space-y-4">
              {comparisonData.map((row, idx) => {
                const totalRev = Number(row.total_rev_combined || row.revenue || 0);
                const cashRev = Number(row.total_rev_cash || 0);
                const upiRev = Number(row.total_rev_upi || 0);
                const grossProfit = Number(row.profit_combined || row.profit || 0);
                const cashProfit = Number(row.profit_cash || 0);
                const upiProfit = Number(row.profit_upi || 0);
                const exp = Number(row.expenses || 0);
                const netProf = Number(row.net_profit || 0);
                const totalNonTax = Number(row.cash_non_tax || 0) + Number(row.upi_non_tax || 0);
                const totalTax = Number(row.cash_tax || 0) + Number(row.upi_tax || 0);

                return (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
                    {/* Card Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200/60 dark:border-teal-800/60 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center font-black shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-base font-black text-slate-900 dark:text-slate-100 font-heading">
                            {row.date || row.label}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-bold flex-wrap">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {row.total_bills || row.orders || 0} Total Bills
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                              {row.cash_bills || 0} Cash
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800">
                              {row.upi_bills || 0} UPI
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Net Operating Margin / Net Profit Header Badge */}
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Net Operating Profit</div>
                        <div className={`px-3 py-1 rounded-xl text-xs font-black inline-block mt-0.5 shadow-2xs ${
                          netProf >= 0 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                          ₹{netProf.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Card Body Grid (4 Column Metrics) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Metric 1: Non-Tax Revenue (replaced Total Revenue name with Non-Tax Price) */}
                      <div className="bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-slate-800/80 dark:to-slate-800/40 p-3.5 rounded-2xl border border-teal-100 dark:border-slate-700/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider">
                          <span>Non-Tax Revenue</span>
                          <Coins className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-heading">
                          ₹{totalNonTax.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1.5 border-t border-teal-100 dark:border-slate-700/60">
                          <span>Cash Non-Tax: <strong className="text-emerald-600 dark:text-emerald-400">₹{Number(row.cash_non_tax || 0).toLocaleString('en-IN')}</strong></span>
                          <span>UPI Non-Tax: <strong className="text-cyan-600 dark:text-cyan-400">₹{Number(row.upi_non_tax || 0).toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>

                      {/* Metric 2: Gross Profit (SP - CP) */}
                      <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/40 dark:to-slate-800/40 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                          <span>Gross Profit (SP - CP)</span>
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-heading">
                          ₹{grossProfit.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700/80 dark:text-emerald-400/80 pt-1.5 border-t border-emerald-100 dark:border-emerald-900/60">
                          <span>Cash: <strong>₹{cashProfit.toLocaleString('en-IN')}</strong></span>
                          <span>UPI: <strong>₹{upiProfit.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>

                      {/* Metric 3: Taxed Sales (GST) */}
                      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/40 dark:to-slate-800/40 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          <span>Taxed Sales (GST)</span>
                          <Percent className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-heading">
                          ₹{totalTax.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80 pt-1.5 border-t border-amber-100 dark:border-amber-900/60">
                          <span>Cash Tax: <strong>₹{Number(row.cash_tax || 0).toLocaleString('en-IN')}</strong></span>
                          <span>UPI Tax: <strong>₹{Number(row.upi_tax || 0).toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>

                      {/* Metric 4: Total Revenue (renamed from Operating Expenses to Total Revenue) */}
                      <div className="bg-gradient-to-br from-[#00796b]/10 to-teal-50/40 dark:from-slate-800/80 dark:to-slate-800/40 p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider">
                          <span>Total Revenue</span>
                          <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-heading">
                          ₹{totalRev.toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 pt-1.5 border-t border-teal-100 dark:border-slate-700/60">
                          <span>Cash: <strong className="text-emerald-600 dark:text-emerald-400">₹{cashRev.toLocaleString('en-IN')}</strong></span>
                          <span>UPI: <strong className="text-cyan-600 dark:text-cyan-400">₹{upiRev.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 📋 TABLE VIEW (FULL LEDGER TABLE) */}
          {matrixView === 'table' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden space-y-0">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider font-heading">
                    Full Ledger Table
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Detailed breakdown table</span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[1100px] border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[10px] whitespace-nowrap">
                    <tr>
                      <th className="px-3.5 py-3">Date</th>
                      <th className="px-3.5 py-3">Bills (Count)</th>
                      <th className="px-3.5 py-3">Cash Bills</th>
                      <th className="px-3.5 py-3">UPI Bills</th>
                      <th className="px-3.5 py-3 text-right">Non-Tax Cash (₹)</th>
                      <th className="px-3.5 py-3 text-right">Non-Tax UPI (₹)</th>
                      <th className="px-3.5 py-3 text-right">Tax Cash (₹)</th>
                      <th className="px-3.5 py-3 text-right">Tax UPI (₹)</th>
                      <th className="px-3.5 py-3 text-right">Rev Cash (₹)</th>
                      <th className="px-3.5 py-3 text-right">Rev UPI (₹)</th>
                      <th className="px-3.5 py-3 text-right">Total Rev (₹)</th>
                      <th className="px-3.5 py-3 text-right">Profit Cash (₹)</th>
                      <th className="px-3.5 py-3 text-right">Profit UPI (₹)</th>
                      <th className="px-3.5 py-3 text-right">Profit Combined (₹)</th>
                      <th className="px-3.5 py-3 text-right">Expenses (₹)</th>
                      <th className="px-3.5 py-3 text-right">Net Profit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                    {comparisonData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {row.date || row.label}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">
                          {row.total_bills || row.orders || 0}
                        </td>
                        <td className="px-3.5 py-3 text-emerald-700 dark:text-emerald-400 font-mono">
                          {row.cash_bills || 0}
                        </td>
                        <td className="px-3.5 py-3 text-cyan-700 dark:text-cyan-400 font-mono">
                          {row.upi_bills || 0}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ₹{Number(row.cash_non_tax || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ₹{Number(row.upi_non_tax || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          ₹{Number(row.cash_tax || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-amber-600 dark:text-amber-400">
                          ₹{Number(row.upi_tax || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{Number(row.total_rev_cash || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-bold text-cyan-700 dark:text-cyan-400">
                          ₹{Number(row.total_rev_upi || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-black text-[#00796b] dark:text-[#80cbc4]">
                          ₹{Number(row.total_rev_combined || row.revenue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ₹{Number(row.profit_cash || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ₹{Number(row.profit_upi || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          ₹{Number(row.profit_combined || row.profit || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">
                          ₹{Number(row.expenses || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3.5 py-3 text-right font-black">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            Number(row.net_profit || 0) >= 0 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            ₹{Number(row.net_profit || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-teal-50/90 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white border-t-2 border-teal-200 dark:border-slate-700 text-xs whitespace-nowrap">
                    <tr>
                      <td className="px-3.5 py-3 uppercase">TOTALS</td>
                      <td className="px-3.5 py-3 font-mono">{totals.total_bills}</td>
                      <td className="px-3.5 py-3 font-mono text-emerald-700 dark:text-emerald-400">{totals.cash_bills}</td>
                      <td className="px-3.5 py-3 font-mono text-cyan-700 dark:text-cyan-400">{totals.upi_bills}</td>
                      <td className="px-3.5 py-3 text-right font-mono">₹{totals.cash_non_tax.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-mono">₹{totals.upi_non_tax.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-mono text-amber-600 dark:text-amber-400">₹{totals.cash_tax.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-mono text-amber-600 dark:text-amber-400">₹{totals.upi_tax.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-black text-emerald-700 dark:text-emerald-400">₹{totals.total_rev_cash.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-black text-cyan-700 dark:text-cyan-400">₹{totals.total_rev_upi.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-black text-[#00796b] dark:text-[#80cbc4]">₹{totals.total_rev_combined.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-mono">₹{totals.profit_cash.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-mono">₹{totals.profit_upi.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">₹{totals.profit_combined.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">₹{totals.expenses.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-3 text-right font-black text-emerald-700 dark:text-emerald-300">₹{totals.net_profit.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🌟 TAB 3: PURCHASE ORDERS PAID */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00796b]/10 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide font-heading">
                  Purchase Orders Paid ({poSummary.total_pos} Orders)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Total Value: ₹{(poSummary.total_po_amount || 0).toLocaleString('en-IN')} &bull; Total Paid: ₹{(poSummary.total_paid_amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPoView('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  poView === 'cards'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card View</span>
              </button>
              <button
                onClick={() => setPoView('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  poView === 'table'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>

          {/* PO Card View */}
          {poView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(poSummary.list || []).map((po, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center font-black shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-black text-slate-900 dark:text-slate-100 font-heading">
                          {po.po_number}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Supplier: <strong className="text-slate-800 dark:text-slate-200">{po.supplier_name}</strong> &bull; Date: {po.order_date}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                      {po.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total PO Amount</div>
                      <div className="text-base font-black text-slate-900 dark:text-slate-100 font-heading">
                        ₹{Number(po.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-0.5">
                      <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Paid Amount</div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-heading">
                        ₹{Number(po.paid_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PO Table View */}
          {poView === 'table' && (
            <Card title="Purchase Orders Paid Summary" subtitle={`Total POs: ${poSummary.total_pos} | Total Value: ₹${(poSummary.total_po_amount || 0).toLocaleString('en-IN')} | Total Paid: ₹${(poSummary.total_paid_amount || 0).toLocaleString('en-IN')}`}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px]">
                    <tr>
                      <th className="px-4 py-3">PO Number</th>
                      <th className="px-4 py-3">Supplier Name</th>
                      <th className="px-4 py-3">Order Date</th>
                      <th className="px-4 py-3 text-right">Total Amount (₹)</th>
                      <th className="px-4 py-3 text-right">Paid Amount (₹)</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                    {(poSummary.list || []).map((po, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{po.po_number}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{po.supplier_name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{po.order_date}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-slate-100">₹{Number(po.total_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">₹{Number(po.paid_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 🌟 TAB 4: CUSTOMER BILLING PAID */}
      {activeTab === 'customer_billing' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00796b]/10 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide font-heading">
                  Customer Billing Breakdown ({customerSummary.list.length} Customers)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Registered Sales: ₹{(customerSummary.registered_customers_revenue || 0).toLocaleString('en-IN')} &bull; Walk-in Sales: ₹{(customerSummary.walkin_customers_revenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCustomerView('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  customerView === 'cards'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card View</span>
              </button>
              <button
                onClick={() => setCustomerView('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  customerView === 'table'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>

          {/* Customer Card View */}
          {customerView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(customerSummary.list || []).map((c, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-black shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-black text-slate-900 dark:text-slate-100 font-heading">
                          {c.customer_name}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 font-mono">
                          Phone: {c.phone} &bull; {c.bill_count} Bills
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-0.5">
                      <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Cash Paid</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-heading">
                        ₹{Number(c.cash_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-cyan-50/50 dark:bg-cyan-950/30 p-2.5 rounded-2xl border border-cyan-100 dark:border-cyan-900/50 space-y-0.5">
                      <div className="text-[9px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">UPI Paid</div>
                      <div className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-heading">
                        ₹{Number(c.upi_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-teal-50/50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-teal-100 dark:border-slate-700/60 space-y-0.5">
                      <div className="text-[9px] font-black text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider">Total Billed</div>
                      <div className="text-xs font-black text-[#00796b] dark:text-[#80cbc4] font-heading">
                        ₹{Number(c.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer Table View */}
          {customerView === 'table' && (
            <Card title="Customer Billing Breakdown" subtitle={`Registered Customer Sales: ₹${(customerSummary.registered_customers_revenue || 0).toLocaleString('en-IN')} | Walk-in Sales: ₹${(customerSummary.walkin_customers_revenue || 0).toLocaleString('en-IN')}`}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Bills Count</th>
                      <th className="px-4 py-3 text-right">Cash Paid (₹)</th>
                      <th className="px-4 py-3 text-right">UPI Paid (₹)</th>
                      <th className="px-4 py-3 text-right">Total Billed (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                    {(customerSummary.list || []).map((c, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{c.customer_name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{c.phone}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 font-mono">{c.bill_count} Bills</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">₹{Number(c.cash_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-mono text-cyan-700 dark:text-cyan-400">₹{Number(c.upi_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-black text-[#00796b] dark:text-[#80cbc4]">₹{Number(c.total_amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 🌟 TAB 5: STAFF SALES / CASHIER COLLECTIONS */}
      {activeTab === 'staff_sales' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00796b]/10 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center font-bold shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide font-heading">
                  Staff Sales & Cashier Collections ({staffSummary.total_staff} Staff Members)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Sales volume & revenue collected by staff members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStaffView('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  staffView === 'cards'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card View</span>
              </button>
              <button
                onClick={() => setStaffView('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  staffView === 'table'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>

          {/* Staff Card View */}
          {staffView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(staffSummary.list || []).map((st, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-black text-slate-900 dark:text-slate-100 font-heading">
                          {st.staff_name}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Role: <strong className="text-slate-700 dark:text-slate-300">{st.role}</strong> &bull; {st.bill_count} Bills
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-0.5">
                      <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Cash Revenue</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-heading">
                        ₹{Number(st.cash_revenue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-cyan-50/50 dark:bg-cyan-950/30 p-2.5 rounded-2xl border border-cyan-100 dark:border-cyan-900/50 space-y-0.5">
                      <div className="text-[9px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">UPI Revenue</div>
                      <div className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-heading">
                        ₹{Number(st.upi_revenue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-teal-50/50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-teal-100 dark:border-slate-700/60 space-y-0.5">
                      <div className="text-[9px] font-black text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider">Total Collected</div>
                      <div className="text-xs font-black text-[#00796b] dark:text-[#80cbc4] font-heading">
                        ₹{Number(st.total_revenue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staff Table View */}
          {staffView === 'table' && (
            <Card title="Staff Sales & Cashier Collections" subtitle="Sales volume & revenue collected by staff members">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Bills Handled</th>
                      <th className="px-4 py-3 text-right">Cash Collection (₹)</th>
                      <th className="px-4 py-3 text-right">UPI Collection (₹)</th>
                      <th className="px-4 py-3 text-right">Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                    {(staffSummary.list || []).map((st, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{st.staff_name}</td>
                        <td className="px-4 py-3 text-slate-500 font-semibold">{st.role}</td>
                        <td className="px-4 py-3 font-mono">{st.bill_count} Bills</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">₹{Number(st.cash_revenue || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-mono text-cyan-700 dark:text-cyan-400">₹{Number(st.upi_revenue || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-black text-[#00796b] dark:text-[#80cbc4]">₹{Number(st.total_revenue || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 🌟 TAB 6: EXPENSES BREAKDOWN */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide font-heading">
                  Operating Expenses Paid Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Total Expenses: ₹{(expenseSummary.total_expenses || 0).toLocaleString('en-IN')} (Cash: ₹{(expenseSummary.cash_expenses || 0).toLocaleString('en-IN')} &bull; UPI: ₹{(expenseSummary.upi_expenses || 0).toLocaleString('en-IN')})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setExpenseView('cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  expenseView === 'cards'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card View</span>
              </button>
              <button
                onClick={() => setExpenseView('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  expenseView === 'table'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>

          {/* Expense Card View */}
          {expenseView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(expenseSummary.list || []).map((e, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-black text-slate-900 dark:text-slate-100 font-heading">
                          {e.title}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          Category: <strong className="text-slate-700 dark:text-slate-300">{e.category}</strong> &bull; Date: {e.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Expense Amount</div>
                      <div className="text-base font-black text-rose-600 dark:text-rose-400 font-heading">
                        ₹{Number(e.amount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1">
                    <span>Payment Method: <strong className="text-slate-800 dark:text-slate-200 font-mono">{e.payment_method}</strong></span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800">
                      PAID EXPENSE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expense Table View */}
          {expenseView === 'table' && (
            <Card title="Operating Expenses Paid Summary" subtitle={`Total Expenses: ₹${(expenseSummary.total_expenses || 0).toLocaleString('en-IN')} (Cash: ₹${(expenseSummary.cash_expenses || 0).toLocaleString('en-IN')} | UPI: ₹${(expenseSummary.upi_expenses || 0).toLocaleString('en-IN')})`}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Expense Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                    {(expenseSummary.list || []).map((e, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{e.title}</td>
                        <td className="px-4 py-3 text-slate-500 font-semibold">{e.category}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{e.date}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{e.payment_method}</td>
                        <td className="px-4 py-3 text-right font-black text-rose-600 dark:text-rose-400">₹{Number(e.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesRevenue;
