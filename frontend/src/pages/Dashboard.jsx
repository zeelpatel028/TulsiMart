import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Layers,
  AlertTriangle,
  Users,
  Clock,
  IndianRupee,
  Plus,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
  ChevronDown,
  Package,
  Truck,
  FileText,
  Boxes,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
  ArrowUpRight
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/UiHelpers';
import { analyticsApi } from '../api';
import { getCachedData, setCachedData } from '../utils/metaCache';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import CartLoader from '../components/common/CartLoader';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSuperAdminDashboard();
  }, []);

  const fetchSuperAdminDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      const cached = getCachedData('super_admin_dashboard');
      if (cached) {
        setDashData(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    try {
      const res = await analyticsApi.getAdminDashboard();
      const data = res?.data?.data || res?.data || res;
      if (data) {
        setDashData(data);
        setCachedData('super_admin_dashboard', data, 60 * 1000); // 1 min cache
        if (isManualRefresh) {
          showToast('Dashboard data updated live', 'success');
        }
      }
    } catch (err) {
      console.error('Failed to fetch Super Admin Dashboard', err);
      if (isManualRefresh) {
        showToast('Failed to refresh dashboard', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'recently';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (loading && !dashData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CartLoader text="Loading Super Admin Dashboard..." size="lg" />
      </div>
    );
  }

  // Extract real backend metrics safely with fallbacks
  const productsCount = dashData?.products_count || 0;
  const categoriesCount = dashData?.categories_count || 0;
  const lowStockCount = dashData?.low_stock_count || 0;
  const outOfStockCount = dashData?.out_of_stock_count || 0;
  const expiringSoonCount = dashData?.expiring_soon_count || 0;
  const totalSuppliers = dashData?.total_suppliers || 0;
  const activeSuppliers = dashData?.active_suppliers || 0;
  const pendingSuppliers = dashData?.pending_suppliers || 0;

  const totalPosCount = dashData?.total_pos_count || 0;
  const pendingPosCount = dashData?.pending_pos_count || 0;
  const processingPosCount = dashData?.processing_pos_count || 0;
  const deliveredPosCount = dashData?.delivered_pos_count || 0;

  const inventoryValue = dashData?.inventory_value || 0;

  const lowStockProducts = Array.isArray(dashData?.low_stock_products) ? dashData.low_stock_products : [];
  const latestPurchaseOrders = Array.isArray(dashData?.latest_purchase_orders) ? dashData.latest_purchase_orders : [];
  const suppliersSummary = Array.isArray(dashData?.suppliers_summary) ? dashData.suppliers_summary : [];
  const categoriesSummary = Array.isArray(dashData?.categories_summary) ? dashData.categories_summary : [];
  const topProducts = Array.isArray(dashData?.top_products) ? dashData.top_products : [];
  const recentActivity = Array.isArray(dashData?.recent_admin_activity) ? dashData.recent_admin_activity : [];

  const stockOverview = dashData?.stock_overview || {
    in_stock: Math.max(0, productsCount - lowStockCount - outOfStockCount),
    low_stock: lowStockCount,
    out_of_stock: outOfStockCount
  };

  const pieChartData = [
    { name: 'In Stock', value: stockOverview.in_stock, color: '#009688' },
    { name: 'Low Stock', value: stockOverview.low_stock, color: '#FBC02D' },
    { name: 'Out of Stock', value: stockOverview.out_of_stock, color: '#E53935' }
  ].filter(item => item.value > 0);

  const adminName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin';

  const defaultCategoryIcons = {
    'Dairy & Bakery': '🥛',
    'Fresh Vegetables & Fruits': '🥦',
    'Groceries & Staples': '🌾',
    'Beverages & Drinks': '🥤',
    'Snacks & Munchies': '🍿',
    'Personal Care': '🧼',
    'Household Essentials': '🧹'
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      
      {/* 1. HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-[#B2DFDB]/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Shield Icon + Title + Subtitle */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#00695C] to-[#004D40] text-white flex items-center justify-center shadow-md shadow-[#00695C]/25 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#4DB6AC]" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm sm:text-xl font-black text-[#263238] dark:text-white tracking-tight font-heading whitespace-nowrap">
                {getGreeting()}, {user?.first_name || 'Admin'}
              </h1>
              <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E0F2F1] dark:bg-[#00695C]/40 text-[#00695C] dark:text-[#4DB6AC] border border-[#4DB6AC]/40 uppercase tracking-wider">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#607D8B] dark:text-slate-400 mt-0.5 font-medium truncate">
              Here's what's happening with your store today.
            </p>
          </div>
        </div>

        {/* Right Side: Refresh Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchSuperAdminDashboard(true)}
            disabled={refreshing}
            className="p-2 sm:p-2.5 rounded-xl border border-[#B2DFDB] dark:border-slate-800 bg-[#F0FAF9] dark:bg-slate-800 text-[#00695C] dark:text-[#4DB6AC] hover:bg-[#E0F2F1] transition-all cursor-pointer shadow-2xs"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00695C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. TOP STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="TOTAL PRODUCTS"
          value={productsCount}
          icon={ShoppingBag}
          color="navy"
          onClick={() => navigate('/products')}
        />
        <StatCard
          title="LOW STOCK"
          value={lowStockCount}
          icon={AlertTriangle}
          color="slate"
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          title="TOTAL SUPPLIERS"
          value={totalSuppliers}
          icon={Users}
          color="light"
          onClick={() => navigate('/suppliers')}
        />
        <StatCard
          title="PENDING POs"
          value={pendingPosCount}
          icon={Clock}
          color="sky"
          onClick={() => navigate('/suppliers')}
        />
      </div>

      {/* 3. INVENTORY OVERVIEW & INVENTORY STOCK CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left: Inventory Overview */}
        <div className="lg:col-span-7">
          <Card
            title="Inventory Overview"
            subtitle="Current stock levels and urgent reorder alerts"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/inventory')}
                className="text-xs text-[#00695C] dark:text-[#4DB6AC] font-bold"
              >
                View Inventory →
              </Button>
            }
          >
            {/* 3 Status Summary Bar */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-5">
              <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 text-center">
                <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                  LOW STOCK
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300 font-heading mt-0.5 block">
                  {lowStockCount} Products
                </span>
              </div>

              <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-3.5 text-center">
                <span className="text-[11px] font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">
                  OUT OF STOCK
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-300 font-heading mt-0.5 block">
                  {outOfStockCount} Products
                </span>
              </div>

              <div className="bg-orange-50/80 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-3.5 text-center">
                <span className="text-[11px] font-extrabold text-orange-800 dark:text-orange-400 uppercase tracking-wider block">
                  EXPIRING SOON
                </span>
                <span className="text-xl sm:text-2xl font-black text-orange-900 dark:text-orange-300 font-heading mt-0.5 block">
                  {expiringSoonCount} Products
                </span>
              </div>
            </div>

            {/* Low Stock Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#607D8B] dark:text-slate-400 mb-3">
                Low Stock Products
              </h4>

              {lowStockProducts.length === 0 ? (
                <EmptyState
                  variant="compact"
                  icon={CheckCircle2}
                  title="Stock Levels Healthy"
                  description="All products are currently above minimum threshold levels."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[11px]">
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-center">Stock</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {lowStockProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-[#263238] dark:text-slate-100">{p.name}</p>
                            <p className="text-[10px] text-[#607D8B] font-mono">{p.sku} • {p.category_name}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            {p.stock_quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.stock_quantity <= 0 
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300' 
                                : p.stock_quantity <= 3 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Stock Chart */}
        <div className="lg:col-span-5">
          <Card
            title="Inventory Stock Overview"
            subtitle="Overall stock distribution ratio"
          >
            <div className="h-56 w-full flex items-center justify-center">
              {productsCount === 0 ? (
                <EmptyState
                  variant="compact"
                  icon={Boxes}
                  title="No Inventory Data"
                  description="Add products to visualize stock health."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} Products`, name]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #B2DFDB' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Legend */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#607D8B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#009688]" />
                  <span>In Stock</span>
                </div>
                <p className="text-base font-bold text-[#263238] dark:text-slate-100 mt-1 font-mono">
                  {stockOverview.in_stock}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#607D8B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FBC02D]" />
                  <span>Low Stock</span>
                </div>
                <p className="text-base font-bold text-[#263238] dark:text-slate-100 mt-1 font-mono">
                  {stockOverview.low_stock}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#607D8B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                  <span>Out of Stock</span>
                </div>
                <p className="text-base font-bold text-[#263238] dark:text-slate-100 mt-1 font-mono">
                  {stockOverview.out_of_stock}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. PURCHASE ORDERS & SUPPLIER OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Purchase Orders */}
        <div className="lg:col-span-6">
          <Card
            title="Purchase Orders"
            subtitle="Supplier PO pipeline and status metrics"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/suppliers')}
                className="text-xs text-[#00695C] dark:text-[#4DB6AC] font-bold"
              >
                View All Purchase Orders →
              </Button>
            }
          >
            {/* Counter Summary Pills */}
            <div className="grid grid-cols-4 gap-2 mb-4 bg-[#F0FAF9] dark:bg-slate-800/60 p-3 rounded-2xl border border-[#B2DFDB]/60 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-[#607D8B] font-extrabold uppercase">Total PO</span>
                <p className="text-base font-black text-[#263238] dark:text-slate-100 font-mono">{totalPosCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-amber-700 font-extrabold uppercase">Pending</span>
                <p className="text-base font-black text-amber-800 dark:text-amber-400 font-mono">{pendingPosCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-blue-700 font-extrabold uppercase">Processing</span>
                <p className="text-base font-black text-blue-800 dark:text-blue-400 font-mono">{processingPosCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase">Delivered</span>
                <p className="text-base font-black text-emerald-800 dark:text-emerald-400 font-mono">{deliveredPosCount}</p>
              </div>
            </div>

            {/* Purchase Orders Table */}
            {latestPurchaseOrders.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={FileText}
                title="No Purchase Orders Yet"
                description="Create your first purchase order to see it here."
                actionLabel="+ Create Purchase Order"
                onAction={() => navigate('/suppliers')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[11px]">
                      <th className="py-2.5 px-3">PO Number</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {latestPurchaseOrders.slice(0, 5).map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#00695C] dark:text-[#4DB6AC]">
                          {po.po_number}
                        </td>
                        <td className="py-2.5 px-3 text-[#263238] dark:text-slate-200 font-semibold">
                          {po.supplier_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          ₹{Number(po.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.status === 'RECEIVED' || po.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : po.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Suppliers Overview */}
        <div className="lg:col-span-6">
          <Card
            title="Supplier Overview"
            subtitle="Registered suppliers & vendor partnerships"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/suppliers')}
                className="text-xs text-[#00695C] dark:text-[#4DB6AC] font-bold"
              >
                Manage Suppliers →
              </Button>
            }
          >
            {/* Supplier Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 bg-[#F0FAF9] dark:bg-slate-800/60 p-3 rounded-2xl border border-[#B2DFDB]/60 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-[#607D8B] font-extrabold uppercase">Total</span>
                <p className="text-base font-black text-[#263238] dark:text-slate-100 font-mono">{totalSuppliers}</p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase">Active</span>
                <p className="text-base font-black text-emerald-800 dark:text-emerald-400 font-mono">{activeSuppliers}</p>
              </div>
              <div>
                <span className="text-[10px] text-amber-700 font-extrabold uppercase">Pending</span>
                <p className="text-base font-black text-amber-800 dark:text-amber-400 font-mono">{pendingSuppliers}</p>
              </div>
            </div>

            {/* Supplier Table */}
            {suppliersSummary.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={Users}
                title="No Suppliers Registered"
                description="Add suppliers to create purchase orders and manage stock."
                actionLabel="+ Add Supplier"
                onAction={() => navigate('/suppliers')}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[11px]">
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3 text-center">Products</th>
                      <th className="py-2.5 px-3 text-center">Purchase Orders</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {suppliersSummary.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-[#263238] dark:text-slate-100">{s.name}</p>
                          <p className="text-[10px] text-[#607D8B]">{s.company_name}</p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{s.products_count}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{s.po_count}</td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant={s.status === 'Active' ? 'success' : 'warning'} size="xs">
                            {s.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 5. QUICK ACTIONS */}
      <Card
        title="Quick Actions"
        subtitle="Super Admin operational shortcuts"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-3.5 rounded-2xl bg-[#00695C] text-white hover:bg-[#004D40] font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => navigate('/products')}
            className="p-3.5 rounded-2xl bg-[#009688] text-white hover:bg-[#00796B] font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>

          <button
            onClick={() => navigate('/suppliers')}
            className="p-3.5 rounded-2xl bg-[#4DB6AC] text-[#263238] hover:bg-[#26A69A] hover:text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>

          <button
            onClick={() => navigate('/suppliers')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 text-[#00695C] dark:text-[#4DB6AC] border border-[#00695C]/40 dark:border-slate-700 hover:bg-[#E0F2F1] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create PO</span>
          </button>

          <button
            onClick={() => navigate('/inventory')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 text-[#263238] dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Boxes className="w-4 h-4 text-[#00695C]" />
            <span>View Inventory</span>
          </button>

          <button
            onClick={() => navigate('/suppliers')}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 text-[#263238] dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <FileText className="w-4 h-4 text-[#009688]" />
            <span>View POs</span>
          </button>
        </div>
      </Card>

      {/* 8. RECENT ADMIN ACTIVITY */}
      <Card
        title="Recent Admin Activity"
        subtitle="System audit log of Super Admin operational actions"
      >
        {recentActivity.length === 0 ? (
          <EmptyState
            variant="compact"
            icon={Activity}
            title="No Recent Admin Activity"
            description="Operational actions performed by super admin will be logged here."
          />
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#B2DFDB] dark:before:bg-slate-800">
            {recentActivity.map((act) => (
              <div key={act.id} className="relative flex items-start justify-between gap-4">
                {/* Dot */}
                <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-[#00695C] ring-4 ring-white dark:ring-slate-900" />
                
                <div>
                  <p className="text-xs font-bold text-[#263238] dark:text-slate-100">
                    {act.title}
                  </p>
                  <span className="text-[10px] font-semibold text-[#009688] dark:text-[#4DB6AC]">
                    {act.type}
                  </span>
                </div>

                <span className="text-[11px] font-medium text-[#607D8B] dark:text-slate-400 shrink-0 font-mono">
                  {formatTimeAgo(act.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};

export default Dashboard;
