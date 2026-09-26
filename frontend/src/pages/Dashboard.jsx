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
  Store,
  Search,
  Zap,
  Tag,
  ShieldCheck,
  ChevronRight,
  Flame,
  Percent
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
import { ProductCard } from '../components/common/ProductCard';
import { ProductDetailModal } from '../components/common/ProductDetailModal';
import { analyticsApi, inventoryApi } from '../api';
import { getCachedData, setCachedData } from '../utils/metaCache';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import InvoiceModal from '../components/invoices/InvoiceModal';
import CartLoader from '../components/common/CartLoader';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { openQuickOrder } = useOutletContext() || {};
  const { user, storeSettings } = useAuth();
  const { showToast } = useNotification();

  const [dashboardData, setDashboardData] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  // Cart quantities state for quick adding straight from Home Screen
  const [cartQuantities, setCartQuantities] = useState({});

  // Active Promo Banner Carousel
  const [activeBanner, setActiveBanner] = useState(0);

  const banners = [
    {
      id: 1,
      title: 'Fresh Organic Vegetables & Fruits',
      subtitle: 'Handpicked daily from farms near you',
      tag: 'UP TO 30% OFF',
      code: 'FRESH30',
      gradient: 'from-[#00695C] to-[#009688]',
      buttonText: 'Shop Fresh Now'
    },
    {
      id: 2,
      title: 'Daily Essentials & Atta Instant Delivery',
      subtitle: 'Chakki Atta, Pure Ghee & Dairy in 10 minutes',
      tag: 'SUPER SAVINGS',
      code: 'DAILY10',
      gradient: 'from-emerald-800 to-teal-600',
      buttonText: 'Order Essentials'
    },
    {
      id: 3,
      title: 'Tulsi Festival Grocery Dhamaka',
      subtitle: 'Extra ₹100 Cashback on Orders over ₹499',
      tag: 'FESTIVAL SPECIAL',
      code: 'TULSI100',
      gradient: 'from-[#004D40] to-[#00695C]',
      buttonText: 'Claim Coupon'
    }
  ];

  // Auto carousel rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardAndCatalog();
  }, []);

  const fetchDashboardAndCatalog = async () => {
    const cachedDash = getCachedData('dashboard_summary');
    if (cachedDash) {
      setDashboardData(cachedDash.dashboardData);
      setPopularProducts(cachedDash.popularProducts);
      setCategoriesList(cachedDash.categoriesList);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [dashRes, prodRes, catRes] = await Promise.all([
        analyticsApi.getDashboardSummary(),
        inventoryApi.getProducts({ page: 1 }),
        inventoryApi.getCategories()
      ]);

      const dashData = dashRes.data;
      const prods = prodRes.data?.results || prodRes.data || [];
      const popular = Array.isArray(prods) ? prods.slice(0, 8) : [];
      const cats = catRes.data?.results || catRes.data || [];
      const catList = Array.isArray(cats) ? cats : [];

      setDashboardData(dashData);
      setPopularProducts(popular);
      setCategoriesList(catList);

      setCachedData('dashboard_summary', {
        dashboardData: dashData,
        popularProducts: popular,
        categoriesList: catList
      }, 2 * 60 * 1000);
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    setCartQuantities(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1
    }));
    showToast(`Added '${product.name}' to cart!`, 'success');
  };

  const handleUpdateQuantity = (product, newQty) => {
    if (newQty <= 0) {
      setCartQuantities(prev => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      showToast(`Removed '${product.name}' from cart`, 'info');
    } else {
      setCartQuantities(prev => ({
        ...prev,
        [product.id]: newQty
      }));
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CartLoader text="Loading Tulsi Mart Home Screen..." size="lg" />
      </div>
    );
  }

  const { kpis, daily_trends, category_breakdown, top_products, low_stock_items, recent_orders } = dashboardData;

  const PALETTE_COLORS = ['#00695C', '#009688', '#4DB6AC', '#80CBC4', '#E0F2F1', '#263238'];

  const defaultCategoryIcons = [
    { name: 'Atta & Flour', icon: '🌾', color: 'bg-amber-100 text-amber-800' },
    { name: 'Dairy & Milk', icon: '🥛', color: 'bg-blue-100 text-blue-800' },
    { name: 'Fresh Vegetables', icon: '🥦', color: 'bg-emerald-100 text-emerald-800' },
    { name: 'Fruits', icon: '🍎', color: 'bg-rose-100 text-rose-800' },
    { name: 'Pulses & Rice', icon: '🫘', color: 'bg-[#E0F2F1] text-[#00695C]' },
    { name: 'Oil & Ghee', icon: '🛢️', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Snacks & Munchies', icon: '🍿', color: 'bg-orange-100 text-orange-800' },
    { name: 'Cold Drinks & Juice', icon: '🥤', color: 'bg-purple-100 text-purple-800' },
    { name: 'Spices & Masala', icon: '🌶️', color: 'bg-red-100 text-red-800' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. APP TOP BAR & POS HEADER BANNER */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border-b border-teal-100/80 dark:border-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <Zap className="w-6 h-6 text-teal-200 fill-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Tulsi Mart Store Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
                  ⚡ 10 Min Delivery
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time counter sales, popular grocery items, inventory alerts, and recent store bills.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <Button
              variant="primary"
              size="md"
              icon={Store}
              onClick={() => navigate('/billing')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-md shadow-teal-600/20"
            >
              Start Billing (POS)
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={ShoppingBag}
              onClick={() => navigate('/products')}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold"
            >
              All Products
            </Button>
          </div>
        </div>
      </div>

      {/* 2. PROMOTIONAL HERO BANNER CAROUSEL */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#B2DFDB]/60 dark:border-slate-800">
        <div className={`p-6 sm:p-8 bg-gradient-to-r ${banners[activeBanner].gradient} text-white transition-all duration-500`}>
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                {banners[activeBanner].tag}
              </span>
              <span className="text-xs font-bold text-[#E0F2F1] flex items-center gap-1 font-mono">
                <Tag className="w-3.5 h-3.5" /> CODE: {banners[activeBanner].code}
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black font-heading leading-tight tracking-tight">
              {banners[activeBanner].title}
            </h2>

            <p className="text-xs sm:text-sm text-[#E0F2F1] font-medium">
              {banners[activeBanner].subtitle}
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigate('/products')}
                className="px-5 py-2.5 bg-white text-[#00695C] hover:bg-[#E0F2F1] font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>{banners[activeBanner].buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Slide Dots */}
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveBanner(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeBanner === idx ? 'w-6 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>



      {/* 4. POPULAR & TRENDING PRODUCTS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-black text-[#263238] dark:text-slate-100 font-heading">
              Popular Grocery Items
            </h2>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="text-xs font-bold text-[#00695C] dark:text-[#4DB6AC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Full Catalogue <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {popularProducts.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No Featured Products"
            description="Add products to your catalogue to display them on the app home screen."
            actionLabel="Add Product"
            onAction={() => navigate('/products')}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
            {popularProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cartQuantity={cartQuantities[p.id] || 0}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onOpenDetails={(prod) => setSelectedProductForModal(prod)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. STORE MANAGEMENT KPIS & DASHBOARD SUMMARY */}
      <div className="pt-4 border-t border-[#B2DFDB]/60 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-[#263238] dark:text-slate-100 font-heading flex items-center gap-2">
            <Store className="w-4.5 h-4.5 text-[#00695C] dark:text-[#4DB6AC]" />
            <span>Store Operations & Metrics</span>
          </h2>
          <span className="text-xs text-[#607D8B] font-semibold">{user?.first_name || 'Admin'} View</span>
        </div>

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
      </div>

      {/* 6. WEEKLY REVENUE TREND & RESTOCK WATCHLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
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
                      <stop offset="5%" stopColor="#009688" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#009688" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#B2DFDB" className="dark:opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#607D8B' }} axisLine={false} tickLine={false} />
                  <YAxis
                    width={50}
                    tick={{ fontSize: 11, fill: '#607D8B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Daily Sales']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #B2DFDB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                  <Area type="monotone" dataKey="sales" stroke="#00695C" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

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
            <div className="divide-y divide-[#E0F2F1] dark:divide-slate-800">
              {low_stock_items.length > 0 ? (
                low_stock_items.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#263238] dark:text-slate-100 truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#607D8B]">
                        <span className="font-mono">{item.sku}</span>
                        {item.category_name && <span>• {item.category_name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-extrabold ${item.stock_quantity <= 0 ? 'text-[#E53935]' : 'text-[#FBC02D]'}`}>
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

      {/* 7. RECENT STORE BILLS */}
      <Card
        title="Recent Store Bills & Invoices"
        subtitle="Latest customer transactions created via POS billing counter"
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
            View All Bills ({kpis.total_orders}) →
          </Button>
        }
      >
        <div className="overflow-x-auto touch-pan">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px] tracking-wider whitespace-nowrap bg-slate-50/70 dark:bg-slate-800/60">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Invoice</th>
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
                  <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{o.order_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{o.customer_name}</td>
                    <td className="py-3 px-4 font-extrabold text-teal-700 dark:text-teal-400">₹{Number(o.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                        {o.payment_method}
                        <span className={`w-1.5 h-1.5 rounded-full ${o.payment_status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default" size="xs">{o.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrderForInvoice(o)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 dark:hover:text-white hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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

      {/* Product Detail Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          isOpen={!!selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
          cartQuantity={cartQuantities[selectedProductForModal.id] || 0}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onBuyNow={() => navigate('/billing')}
        />
      )}

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
