import React, { useState, useEffect } from 'react';
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
  Receipt
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
  const { isDark } = useTheme();
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // 'day', 'week', 'month', 'year'

  const PALETTE_COLORS = ['#384959', '#6A89A7', '#88BDF2', '#BDDDFC', '#2E3D4B', '#53708C'];

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

  if (loading || !trendsData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#384959]/10 dark:bg-[#88BDF2]/10 border-2 border-[#88BDF2] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#384959] dark:text-slate-200">Loading Sales & Revenue Analytics...</p>
        </div>
      </div>
    );
  }

  const comparisonData = trendsData?.comparison_data || trendsData?.monthly_comparison || [];
  const payment_methods = trendsData?.payment_methods || [];
  const category_performance = trendsData?.category_performance || [];

  const totalRevenue = comparisonData.reduce((sum, m) => sum + (parseFloat(m?.revenue) || 0), 0);
  const totalExpenses = comparisonData.reduce((sum, m) => sum + (parseFloat(m?.expenses) || 0), 0);
  const totalProfit = comparisonData.reduce((sum, m) => sum + (parseFloat(m?.profit) || 0), 0);
  const totalOrders = comparisonData.reduce((sum, m) => sum + (parseInt(m?.orders) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Custom Tooltip for Revenue & Net Operating Margin
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs space-y-1.5 font-sans min-w-[170px]">
          <p className="font-bold text-[#384959] dark:text-slate-100 border-b border-slate-100 dark:border-slate-700/60 pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#384959] dark:bg-[#88BDF2]" />
              Total Revenue:
            </span>
            <span className="font-bold text-[#384959] dark:text-slate-100">₹{Number(data.revenue || 0).toLocaleString('en-IN')}</span>
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
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-slate-500 font-semibold">
            <span>Operating Margin:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${data.margin_pct >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'}`}>
              {data.margin_pct}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
            Sales & Revenue Analytics
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze revenue performance, net operating profit margins, and sales growth across daily, weekly, monthly, and yearly timeframes.
          </p>
        </div>

        {/* Period Selector (Day, Week, Month, Year) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto overflow-x-auto no-scrollbar touch-pan border border-slate-200/60 dark:border-slate-700/50">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setTimeframe(p.id)}
              className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                timeframe === p.id 
                  ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#384959] dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Gross Revenue"
          value={totalRevenue}
          prefix="₹"
          change={14.6}
          isPositive={true}
          icon={IndianRupee}
          color="navy"
        />
        <StatCard
          title="Net Operating Margin"
          value={`${overallMargin}%`}
          trendLabel={`₹${totalProfit.toLocaleString('en-IN')} net profit`}
          icon={Percent}
          color="sky"
        />
        <StatCard
          title="Operating Expenses"
          value={totalExpenses}
          prefix="₹"
          trendLabel="total operational cost"
          icon={Receipt}
          color="slate"
        />
        <StatCard
          title="Average Order (AOV)"
          value={avgOrderValue.toFixed(2)}
          prefix="₹"
          change={5.2}
          isPositive={true}
          icon={TrendingUp}
          color="light"
        />
      </div>

      {/* Main Bar Chart: Total Revenue & Net Operating Margin (Profit) */}
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
                fill={isDark ? '#88BDF2' : '#384959'} 
                radius={[6, 6, 0, 0]} 
                maxBarSize={40}
              />
              <Bar 
                dataKey="profit" 
                name="Net Profit (₹)" 
                fill="#10B981" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid: Payment Method Breakdown & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Methods Breakdown (5 Cols) */}
        <div className="lg:col-span-5">
          <Card title="Payment Method Share" subtitle="Transactions by payment gateway & mode">
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payment_methods}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
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

            <div className="mt-2 space-y-2">
              {payment_methods.map((pm, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PALETTE_COLORS[i % PALETTE_COLORS.length] }}
                    />
                    <span className="font-bold text-[#384959] dark:text-slate-200">{pm.method}</span>
                    <span className="text-[10px] text-slate-400">({pm.count} txns)</span>
                  </div>
                  <span className="font-extrabold text-[#384959] dark:text-[#88BDF2]">₹{Number(pm.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Category Revenue Leaderboard (7 Cols) */}
        <div className="lg:col-span-7">
          <Card title="Category Revenue Performance" subtitle="Top generating grocery departments">
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={category_performance} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
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
                    width={50}
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
                  <Bar dataKey="revenue" name="Revenue (₹)" fill={isDark ? '#88BDF2' : '#384959'} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesRevenue;
