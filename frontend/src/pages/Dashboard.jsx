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
    try {
      setLoading(true);
      const [dashRes, prodRes, catRes] = await Promise.all([
        analyticsApi.getDashboardSummary(),
        inventoryApi.getProducts({ page: 1 }),
        inventoryApi.getCategories()
      ]);

      setDashboardData(dashRes.data);
      
      const prods = prodRes.data?.results || prodRes.data || [];
      setPopularProducts(Array.isArray(prods) ? prods.slice(0, 8) : []);

      const cats = catRes.data?.results || catRes.data || [];
      setCategoriesList(Array.isArray(cats) ? cats : []);
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
      {/* 1. APP TOP BAR & DELIVERY LOCATION BADGE */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-[#B2DFDB] dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#00695C] text-white p-1.5 rounded-xl">
              <Zap className="w-4 h-4 text-[#4DB6AC] fill-[#4DB6AC]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#00695C] dark:text-[#4DB6AC] tracking-wider">
                  ⚡ 10 MINUTES DELIVERY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#009688] animate-pulse" />
              </div>
              <h1 className="text-base sm:text-lg font-black text-[#263238] dark:text-slate-100 font-heading">
                Tulsi Mart Outlet • Main Sector Store
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            icon={Store}
            onClick={() => navigate('/billing')}
            className="flex-1 sm:flex-initial font-bold shadow-sm bg-[#00695C] hover:bg-[#004D40]"
          >
            ⚡ Start Billing (POS)
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={ShoppingBag}
            onClick={() => navigate('/products')}
            className="flex-1 sm:flex-initial"
          >
            All Products
          </Button>
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

      {/* 3. CIRCULAR GROCERY CATEGORIES GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#263238] dark:text-slate-100 font-heading flex items-center gap-2">
            <span>Explore Grocery Categories</span>
            <span className="text-xs font-normal text-[#607D8B]">({categoriesList.length || 9} Categories)</span>
          </h2>
          <button
            onClick={() => navigate('/products')}
            className="text-xs font-bold text-[#00695C] dark:text-[#4DB6AC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            See All Categories <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5 sm:gap-3">
          {(categoriesList.length > 0 ? categoriesList : defaultCategoryIcons).map((cat, idx) => {
            const iconObj = defaultCategoryIcons[idx % defaultCategoryIcons.length];
            const name = cat.name || cat;
            return (
              <div
                key={idx}
                onClick={() => navigate('/products')}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-[#B2DFDB]/60 dark:border-slate-800 p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#009688] hover:shadow-md transition-all touch-active group"
              >
                <div className={`w-12 h-12 rounded-full ${iconObj.color} flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform mb-2`}>
                  {iconObj.icon}
                </div>
                <span className="text-[11px] font-bold text-[#263238] dark:text-slate-200 line-clamp-1 leading-tight font-heading">
                  {name}
                </span>
              </div>
            );
          })}
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
          <table className="w-full min-w-[620px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#B2DFDB] dark:border-slate-800 text-[#607D8B] uppercase font-bold text-[10px] tracking-wider">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2F1] dark:divide-slate-800 font-medium">
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
                  <tr key={o.id} className="hover:bg-[#F0FAF9] dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-[#263238] dark:text-slate-100">{o.order_number}</td>
                    <td className="py-3 font-semibold text-[#263238] dark:text-slate-300">{o.customer_name}</td>
                    <td className="py-3 font-extrabold text-[#00695C] dark:text-[#4DB6AC]">₹{Number(o.total_amount).toFixed(2)}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[#263238] dark:text-slate-300">
                        {o.payment_method}
                        <span className={`w-1.5 h-1.5 rounded-full ${o.payment_status === 'PAID' ? 'bg-[#009688]' : 'bg-[#FBC02D]'}`} />
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant="default" size="xs">{o.status}</Badge>
                    </td>
                    <td className="py-3 text-[#607D8B] dark:text-slate-500">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedOrderForInvoice(o)}
                        className="p-1.5 text-[#607D8B] hover:text-[#00695C] dark:hover:text-white hover:bg-[#E0F2F1] dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
