import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  IndianRupee, 
  ShoppingCart, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  Layers, 
  Truck, 
  FileText, 
  Receipt, 
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Store
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
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/UiHelpers';
import { analyticsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from '../components/invoices/InvoiceModal';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { openQuickOrder } = useOutletContext() || {};
  const { user, storeSettings } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getDashboardSummary();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#384959]/10 border-2 border-[#88BDF2] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#384959]">Loading Tulsi Mart Dashboard...</p>
        </div>
      </div>
    );
  }

  const { kpis, daily_trends, category_breakdown, top_products, low_stock_items, recent_orders, notifications } = dashboardData;

  // Stormy Morning Colors for Category Donut Chart
  const PALETTE_COLORS = ['#384959', '#6A89A7', '#88BDF2', '#BDDDFC', '#2E3D4B', '#53708C'];

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-5 sm:space-y-6 font-sans">
      {/* Peaceful Welcome Banner & Quick Action Buttons */}

      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
              {getGreeting()}, {user?.first_name || user?.username || 'Admin'} 🌿
            </h1>
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Counter Open
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {todayFormatted} • Ready for fast grocery counter billing and daily inventory.
          </p>
        </div>

        {/* 4 Essential Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            variant="accent"
            size="md"
            icon={Store}
            onClick={() => navigate('/billing')}
            className="flex-1 sm:flex-initial font-bold shadow-sm"
          >
            ⚡ Start Billing (POS)
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={Plus}
            onClick={() => navigate('/products')}
            className="flex-1 sm:flex-initial"
          >
            Add Product
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={Receipt}
            onClick={() => navigate('/expenses')}
            className="flex-1 sm:flex-initial"
          >
            Record Expense
          </Button>
          <Button
            variant="ghost"
            size="md"
            icon={Users}
            onClick={() => navigate('/customers')}
            className="flex-1 sm:flex-initial"
          >
            Customers
          </Button>
        </div>
      </div>

      {/* 4 Essential Daily Metrics (Streamlined for zero cognitive overload) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Today's Counter Revenue"
          value={kpis.today_sales}
          prefix="₹"
          trendLabel="today so far"
          icon={TrendingUp}
          color="navy"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Today's Bills & Orders"
          value={kpis.today_orders ?? kpis.total_orders}
          suffix=" checkouts"
          icon={ShoppingCart}
          color="sky"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Urgent Low Stock Alert"
          value={kpis.low_stock_products + kpis.out_of_stock_products}
          suffix=" items to reorder"
          icon={AlertTriangle}
          color="slate"
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          title="Active Grocery Items"
          value={kpis.total_products}
          suffix=" items live"
          icon={ShoppingBag}
          color="light"
          onClick={() => navigate('/products')}
        />
      </div>

      {/* Clean 2-Column Section: 7-Day Activity Trend + Urgent Restock List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* 7-Day Sales Trend (7 Cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Weekly Sales Trend"
            subtitle="Daily revenue collection over past 7 days"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/sales-revenue')}>
                Full Revenue View →
              </Button>
            }
          >
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily_trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#88BDF2" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#88BDF2" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis
                    width={50}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Daily Sales']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#384959" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Low Stock Watchlist (5 Cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Urgent Restock Watchlist"
            subtitle="Products that need immediate supplier reorder"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
                Inventory →
              </Button>
            }
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {low_stock_items.length > 0 ? (
                low_stock_items.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#384959] dark:text-slate-100 truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono">{item.sku}</span>
                        {item.category_name && <span>• {item.category_name}</span>}
                      </div>
                    </div>


                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-extrabold ${item.stock_quantity <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {item.stock_quantity <= 0 ? 'Out of stock' : `${item.stock_quantity} left`}
                        </span>
                      </div>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => navigate('/suppliers')}
                      >
                        Reorder
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  variant="compact"
                  icon={CheckCircle2}
                  title="Inventory Healthy"
                  description="All stock items are currently above minimum levels."
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Store Bills Table */}
      <Card
        title="Recent Store Bills"
        subtitle="Latest customer transactions and counter invoices"
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
            Bill Management ({kpis.total_orders}) →
          </Button>
        }
      >

        <div className="overflow-x-auto touch-pan">
          <table className="w-full min-w-[620px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {recent_orders.length === 0 ? (
                <EmptyState
                  variant="table"
                  colSpan={7}
                  icon={ShoppingCart}
                  title="No Recent Orders"
                  description="New orders created via POS checkout or billing counter will be displayed here."
                />
              ) : (
                recent_orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#384959] dark:text-slate-100">{o.order_number}</td>
                    <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{o.customer_name}</td>
                    <td className="py-3 font-extrabold text-[#384959] dark:text-[#88BDF2]">₹{Number(o.total_amount).toFixed(2)}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        {o.payment_method}
                        <span className={`w-1.5 h-1.5 rounded-full ${o.payment_status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant="default" size="xs">{o.status}</Badge>
                    </td>
                    <td className="py-3 text-slate-400 dark:text-slate-500">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedOrderForInvoice(o)}
                        className="p-1.5 text-slate-400 hover:text-[#384959] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="View Tax Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </Card>

      {/* Invoice Viewer Modal */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          isOpen={!!selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
          order={selectedOrderForInvoice}
          store={storeSettings}
        />
      )}
    </div>
  );
};

export default Dashboard;
