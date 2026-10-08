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
  CheckCircle2
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

export const SalesRevenue = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // 'day', 'week', 'month', 'year'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payments' | 'categories'

  const PALETTE_COLORS = ['#00796b', '#004d40', '#4db6ac', '#80cbc4', '#00695c', '#26a69a'];

  const periods = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  useEffect(() => {
    loadTrends();
  }, [timeframe]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getSalesTrends({ period: timeframe });
      setTrendsData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const comparisonData = useMemo(() => trendsData?.comparison_data || trendsData?.monthly_comparison || [], [trendsData]);
  const payment_methods = useMemo(() => trendsData?.payment_methods || [], [trendsData]);
  const category_performance = useMemo(() => trendsData?.category_performance || [], [trendsData]);

  const totalRevenue = useMemo(() => comparisonData.reduce((sum, m) => sum + (parseFloat(m?.revenue) || 0), 0), [comparisonData]);
  const totalExpenses = useMemo(() => comparisonData.reduce((sum, m) => sum + (parseFloat(m?.expenses) || 0), 0), [comparisonData]);
  const totalProfit = useMemo(() => comparisonData.reduce((sum, m) => sum + (parseFloat(m?.profit) || 0), 0), [comparisonData]);
  const totalOrders = useMemo(() => comparisonData.reduce((sum, m) => sum + (parseInt(m?.orders) || 0), 0), [comparisonData]);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Custom Tooltip for Revenue & Net Operating Margin
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs space-y-1.5 font-sans min-w-[170px]">
          <p className="font-extrabold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00695C] dark:bg-[#4DB6AC]" />
              Total Revenue:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">₹{Number(data.revenue || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Net Profit:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{Number(data.profit || 0).toLocaleString('en-IN')}</span>
          </div>
          {data.expenses > 0 && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Expenses:</span>
              <span>₹{Number(data.expenses).toLocaleString('en-IN')}</span>
            </div>
          )}
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
          <p className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200">Loading Sales & Revenue Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 📱 Mobile & Tablet Top App Header - Pastel Mint Theme */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
        {/* SVG Decorative Waves */}
        <svg className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto pointer-events-none text-[#C4EFE9]/70 dark:text-teal-950/40" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40C50 60 120 70 200 45V80H0V40Z" fill="currentColor" />
        </svg>

        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-md shadow-teal-900/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6]" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Sales & <span className="text-[#00695C] dark:text-[#4DB6AC]">Revenue</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Analyze revenue performance & margins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl shrink-0 border border-teal-100 dark:border-slate-700">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setTimeframe(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  timeframe === p.id
                    ? 'bg-[#00796b] text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart POS Top Header Banner (Desktop Only) - Matching Supplier Header */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left: TrendingUp Icon & Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Sales & <span className="text-[#00796b] dark:text-[#80cbc4]">Revenue</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Analytics Live
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Analyze revenue performance, net operating profit margins & sales growth trends
              </p>
            </div>
          </div>

          {/* Right: Quick Stat Badges & Period Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                    GROSS REVENUE
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-heading leading-none block">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                    NET MARGIN
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#00796b] dark:text-[#80cbc4] leading-none block">
                    {overallMargin}%
                  </span>
                </div>
              </div>
            </div>

            {/* Timeframe Segmented Control */}
            <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-2xl text-xs font-bold border border-teal-100 dark:border-slate-700/80 shadow-2xs">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTimeframe(p.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    timeframe === p.id 
                      ? 'bg-[#00796b] text-white shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Segmented Main Tab Navigation Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Revenue Trends & Margin</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Methods ({payment_methods.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Category Performance ({category_performance.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Gross Revenue"
          value={totalRevenue}
          prefix="₹"
          change={14.6}
          isPositive={true}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Net Operating Margin"
          value={`${overallMargin}%`}
          trendLabel={`₹${totalProfit.toLocaleString('en-IN')} net profit`}
          icon={Percent}
          color="teal"
        />
        <StatCard
          title="Operating Expenses"
          value={totalExpenses}
          prefix="₹"
          trendLabel="total operational cost"
          icon={Receipt}
          color="amber"
        />
        <StatCard
          title="Average Order (AOV)"
          value={avgOrderValue.toFixed(2)}
          prefix="₹"
          change={5.2}
          isPositive={true}
          icon={TrendingUp}
          color="teal"
        />
      </div>

      {/* 🌟 TAB 1: REVENUE OVERVIEW & TRENDS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Bar Chart: Total Revenue & Net Operating Margin */}
          <Card
            title="Revenue & Net Operating Margin"
            subtitle={`Total Revenue vs Net Profit comparison aggregated by ${timeframe}`}
          >
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis
                    width={55}
                    tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar 
                    dataKey="revenue" 
                    name="Total Revenue (₹)" 
                    fill={isDark ? '#4DB6AC' : '#00695C'} 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={40}
                  />
                  <Bar 
                    dataKey="profit" 
                    name="Net Profit (₹)" 
                    fill="#009688" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue & Profit Breakdown Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-black text-[#263238] dark:text-slate-100 uppercase tracking-wider">
                  Period Financial Summary ({comparisonData.length} Intervals)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Aggregated by POS Analytics API</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px] whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Period Label</th>
                    <th className="px-4 py-3 whitespace-nowrap">Total Orders</th>
                    <th className="px-4 py-3 whitespace-nowrap">Gross Revenue (₹)</th>
                    <th className="px-4 py-3 whitespace-nowrap">Expenses (₹)</th>
                    <th className="px-4 py-3 whitespace-nowrap">Net Profit (₹)</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                  {comparisonData.map((m, idx) => (
                    <tr key={idx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {m.label}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                        {m.orders || 0} Orders
                      </td>
                      <td className="px-4 py-3.5 font-black text-[#00796b] dark:text-[#80cbc4] whitespace-nowrap">
                        ₹{Number(m.revenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap">
                        ₹{Number(m.expenses || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        ₹{Number(m.profit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                          Number(m.margin_pct || 0) >= 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {m.margin_pct || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 TAB 2: PAYMENT METHODS */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <Card title="Payment Method Share" subtitle="Transactions by payment gateway & mode">
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payment_methods}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="amount"
                    >
                      {payment_methods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Amount']}
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                        borderRadius: '12px', 
                        border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                        color: isDark ? '#f8fafc' : '#1e293b'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <Card title="Payment Gateway Breakdown" subtitle="Detailed volume by payment mode">
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {payment_methods.map((pm, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: PALETTE_COLORS[i % PALETTE_COLORS.length] }}
                      />
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">{pm.method}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Count: {pm.count} Transactions</span>
                      </div>
                    </div>

                    <span className="font-black text-[#00796b] dark:text-[#80cbc4] text-sm font-heading">
                      ₹{Number(pm.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 🌟 TAB 3: CATEGORY PERFORMANCE */}
      {activeTab === 'categories' && (
        <Card title="Category Revenue Leaderboard" subtitle="Top revenue generating grocery departments">
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category_performance} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} 
                  axisLine={false} 
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  width={55}
                  tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                    borderRadius: '12px', 
                    border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                    color: isDark ? '#f8fafc' : '#1e293b'
                  }}
                />
                <Bar dataKey="revenue" name="Revenue (₹)" fill={isDark ? '#4DB6AC' : '#00695C'} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SalesRevenue;
