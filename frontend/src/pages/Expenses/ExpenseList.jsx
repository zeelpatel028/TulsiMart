import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { SearchInput, EmptyState } from '../../components/common/UiHelpers';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  IndianRupee, 
  Calendar, 
  Zap, 
  Home, 
  Users, 
  Truck, 
  Package, 
  Wrench, 
  Megaphone,
  CreditCard,
  PieChart as PieIcon,
  ShoppingBag,
  Calculator,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { expensesApi, gullaApi, ordersApi, suppliersApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export const ExpenseList = () => {
  const { showToast } = useNotification();
  const { isDark } = useTheme();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Orders & PO meta for Delivery & Transport linking
  const [orders, setOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  // Note Denominations Counter State for Cash Payment
  const [noteCounts, setNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });

  // Link Order / PO State for Delivery & Transport
  const [linkType, setLinkType] = useState('NONE'); // 'NONE' | 'ORDER' | 'PO'
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedPO, setSelectedPO] = useState('');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI',
    paid_to: '',
    notes: '',
  });

  const PALETTE_COLORS = ['#00796b', '#004d40', '#4db6ac', '#80cbc4', '#00695c', '#26a69a'];

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes, sumRes, ordRes, poRes] = await Promise.all([
        expensesApi.getExpenses({ search, category: selectedCategory || undefined }),
        expensesApi.getCategories(),
        expensesApi.getExpenseSummary(),
        ordersApi.getOrders(),
        suppliersApi.getPurchaseOrders()
      ]);
      setExpenses(expRes.data?.results || expRes.data || []);
      setCategories(catRes.data?.results || catRes.data || []);
      setSummary(sumRes.data);
      setOrders(ordRes.data?.results || ordRes.data || []);
      setPurchaseOrders(poRes.data?.results || poRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteCountChange = async (denom, valStr) => {
    const cleanVal = valStr.replace(/[^0-9]/g, '');
    const updatedCounts = { ...noteCounts, [denom]: cleanVal };
    setNoteCounts(updatedCounts);

    try {
      const res = await gullaApi.calculateNotes({ denomination_counts: updatedCounts });
      const { total_amount, notes_summary } = res.data;

      setFormData(prev => ({
        ...prev,
        amount: total_amount > 0 ? String(total_amount) : prev.amount,
        notes: notes_summary ? `${notes_summary}${prev.notes ? ' | ' + prev.notes.replace(/^Notes:\s*[^\s|]+(?:\s*\|\s*)?/, '') : ''}` : prev.notes
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const selectedCategoryObj = categories.find(c => String(c.id) === String(formData.category));
  const isDeliveryCategory = selectedCategoryObj && (
    selectedCategoryObj.name.toLowerCase().includes('delivery') || 
    selectedCategoryObj.name.toLowerCase().includes('transport') ||
    selectedCategoryObj.name.toLowerCase().includes('freight') ||
    selectedCategoryObj.name.toLowerCase().includes('logistics')
  );

  const resetModalState = () => {
    setFormData({
      title: '',
      category: categories[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'UPI',
      paid_to: '',
      notes: '',
    });
    setNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
    setLinkType('NONE');
    setSelectedOrder('');
    setSelectedPO('');
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await expensesApi.createExpense({
        ...formData,
        amount: parseFloat(formData.amount || 0)
      });
      showToast('Expense recorded successfully!', 'success');
      setIsModalOpen(false);
      resetModalState();
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.response?.data?.detail || 'Failed to record expense. Check Gulla note availability.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await expensesApi.deleteExpense(id);
      showToast('Expense record deleted', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete expense', 'error');
    }
  };

  const chartData = (summary?.category_breakdown || [])
    .filter(c => parseFloat(c.total || 0) > 0)
    .map(c => ({
      name: c.category__name || 'General Overheads',
      value: parseFloat(c.total || 0)
    }));

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 🌟 Tulsi Mart POS Top Header Banner - Full Width Edge-to-Edge Background like Bill Page */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Banner Grid Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left: Receipt Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Store <span className="text-[#00796b] dark:text-[#80cbc4]">Expenses</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Overheads Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Track operational store overheads, rent, utilities, employee payroll & vendor payouts
              </p>
            </div>
          </div>

          {/* Right: Quick Stat Cards & Record Expense Button */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2.5 flex-1 sm:flex-initial">
              {/* Stat Card 1: Today's Outflow */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl p-2 sm:px-3 sm:py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1 whitespace-nowrap">
                    TODAY'S OUTFLOW
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-heading leading-none block whitespace-nowrap">
                    ₹{Number(summary?.today_expenses || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Stat Card 2: This Month's Expenses */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl p-2 sm:px-3 sm:py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1 whitespace-nowrap">
                    THIS MONTH
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#00796b] dark:text-[#80cbc4] leading-none block whitespace-nowrap">
                    ₹{Number(summary?.monthly_expenses || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Record Expense Action Button */}
            <button
              onClick={() => {
                setFormData({ ...formData, category: categories[0]?.id || '' });
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#00796b] hover:bg-[#004d40] text-white font-bold rounded-2xl shadow-md border border-[#004d40]/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Today's Operational Outflow"
          value={summary?.today_expenses || 0}
          prefix="₹"
          icon={Receipt}
          color="emerald"
        />
        <StatCard
          title="This Month's Total Expenses"
          value={summary?.monthly_expenses || 0}
          prefix="₹"
          icon={Receipt}
          color="teal"
        />
        <StatCard
          title="All-Time Recorded Expenses"
          value={summary?.total_expenses || 0}
          prefix="₹"
          icon={Receipt}
          color="amber"
        />
      </div>

      {/* Grid: Expense Breakdown Donut & Expenses Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Category Breakdown Donut (4 cols) */}
        <div className="lg:col-span-4">
          <Card title="Monthly Expense Categories" subtitle="Cost allocation across operations">
            {chartData.length === 0 ? (
              <div className="h-56 w-full flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500">
                <PieIcon className="w-10 h-10 mb-2 opacity-40 text-[#88BDF2]" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No monthly expenses recorded</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Click "Record New Expense" to log overheads</p>
              </div>
            ) : (
              <>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Total']}
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

                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1 touch-pan">
                  {chartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PALETTE_COLORS[i % PALETTE_COLORS.length] }}
                        />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <span className="font-extrabold text-[#384959] dark:text-[#88BDF2] shrink-0">₹{item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Expenses List Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Responsive View: Mobile Cards (block md:hidden) & Desktop Table (hidden md:block) */}
          <div className="md:hidden space-y-3">
            {/* Category Pipeline Tabs for Mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === ''
                    ? 'bg-[#00796b] text-white shadow-xs font-extrabold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                All ({expenses.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(String(c.id))}
                  className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                    String(selectedCategory) === String(c.id)
                      ? 'bg-[#00796b] text-white shadow-xs font-extrabold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No Expense Records"
                description="No expenses match your search or category filter."
              />
            ) : (
              expenses.map((e) => (
                <div
                  key={e.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 p-3.5 space-y-2.5 shadow-xs"
                >
                  {/* Top Row: Title & Amount */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug">
                      {e.title}
                    </span>
                    <span className="text-sm font-black text-[#00695C] dark:text-[#4DB6AC] font-heading shrink-0">
                      ₹{Number(e.amount).toFixed(2)}
                    </span>
                  </div>

                  {/* Middle Row: Category Pill & Payment Method + Date */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E0F2F1] dark:border-slate-800 gap-2">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2F1] text-[#00695C] dark:bg-teal-950/80 dark:text-teal-300 border border-[#B2DFDB] dark:border-teal-800/60 whitespace-nowrap">
                        {e.category_name || 'General'}
                      </span>
                      {e.paid_to && e.paid_to !== '-' && (
                        <p className="text-[10px] text-slate-500 font-medium">Paid to: {e.paid_to}</p>
                      )}
                    </div>

                    <div className="text-right space-y-0.5 shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#E0F2F1] text-[#00695C] dark:bg-teal-950/80 dark:text-teal-300 border border-[#B2DFDB] uppercase">
                        {e.payment_method}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-mono">{e.date}</span>
                    </div>
                  </div>

                  {/* Bottom Row: Record ID & Action Button */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E0F2F1] dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">ID #{e.id}</span>
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (hidden md:block) */}
          <Card className="p-0 overflow-hidden hidden md:block">
            {/* Filter & Category Pipeline Bar */}
            <div className="p-3.5 sm:p-4 border-b border-[#B2DFDB]/60 dark:border-slate-800 bg-[#F0FAF9]/80 dark:bg-slate-900 space-y-3">
              {/* Category Pipeline Tabs like Bill Management */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                    selectedCategory === ''
                      ? 'bg-[#00796b] text-white shadow-xs font-extrabold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#B2DFDB] dark:border-slate-700'
                  }`}
                >
                  All Categories ({expenses.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(String(c.id))}
                    className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                      String(selectedCategory) === String(c.id)
                        ? 'bg-[#00796b] text-white shadow-xs font-extrabold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#B2DFDB] dark:border-slate-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="pt-2 border-t border-[#B2DFDB]/50 dark:border-slate-800 flex items-center gap-3">
                <div className="flex-1">
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search expenses by description, payee or notes..."
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
              <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-[#F0FAF9] dark:bg-slate-800 shadow-xs">
                  <tr className="bg-[#F0FAF9] dark:bg-slate-800 border-b border-[#B2DFDB] dark:border-slate-800 text-[#607D8B] dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Expense Title & Method</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Paid To</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {expenses.length === 0 ? (
                    <EmptyState
                      variant="table"
                      colSpan={6}
                      icon={Receipt}
                      title="No Expense Records"
                      description={
                        search || selectedCategory
                          ? 'No overhead expenses match your search or category filter.'
                          : 'No expenses have been recorded yet for the store.'
                      }
                      actionLabel="Record Expense"
                      onAction={() => setIsModalOpen(true)}
                      actionIcon={Plus}
                      secondaryActionLabel={search || selectedCategory ? 'Reset Filters' : undefined}
                      onSecondaryAction={() => {
                        setSearch('');
                        setSelectedCategory('');
                      }}
                    />
                  ) : (
                    expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-[#E0F2F1]/50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{e.title}</p>
                          <p className="text-[10px] text-[#00695C] dark:text-[#4DB6AC] font-mono font-semibold">
                            Paid via {e.payment_method}
                          </p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E0F2F1] text-[#00695C] dark:bg-teal-950/80 dark:text-teal-300 border border-[#B2DFDB] dark:border-teal-800/60 whitespace-nowrap">
                            {e.category_name || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{e.paid_to || '-'}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">{e.date}</td>
                        <td className="py-3 px-4 text-right font-black text-[#00695C] dark:text-[#4DB6AC] text-sm font-heading">
                          ₹{Number(e.amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operating Expense"
        subtitle="Log store expenses and recurring bills for net profit calculation"
        maxWidth="max-w-lg w-full"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateExpense}
              disabled={submitting}
              className="px-5 py-2.5 bg-[#00796b] hover:bg-[#004d40] text-white font-bold rounded-xl shadow-xs border border-[#004d40]/20 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Expense Title / Description *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Electric AC Bill / Packaging Bags"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="2500.00"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[#384959] dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              >
                <option value="UPI">UPI Payment</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          {/* 1. Cash Payment Rupee Note Denomination Calculator */}
          {formData.payment_method === 'CASH' && (
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  Rupee Note Denomination Calculator
                </span>
                <button
                  type="button"
                  onClick={() => setNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' })}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 underline cursor-pointer"
                >
                  Clear Notes
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { denom: 500, label: '₹500 Note' },
                  { denom: 200, label: '₹200 Note' },
                  { denom: 100, label: '₹100 Note' },
                  { denom: 50, label: '₹50 Note' },
                  { denom: 20, label: '₹20 Note' },
                  { denom: 10, label: '₹10 Note' },
                  { denom: 5, label: '₹5 Note' },
                  { denom: 1, label: 'Coins (₹)' }
                ].map(({ denom, label }) => {
                  const cnt = noteCounts[denom] || '';
                  const sub = (denom === 1 ? parseFloat(cnt) || 0 : (parseInt(cnt, 10) || 0) * denom);
                  return (
                    <div key={denom} className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="font-extrabold text-slate-700 dark:text-slate-200 w-16">{label}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={cnt}
                        onChange={(e) => handleNoteCountChange(denom, e.target.value)}
                        className="w-12 px-1.5 py-0.5 text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden focus:border-emerald-500 text-[#384959] dark:text-slate-100"
                      />
                      <span className="w-14 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        = ₹{sub}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Delivery & Transport Order/PO Linker */}
          {isDeliveryCategory && (
            <div className="p-3 bg-sky-50/80 dark:bg-sky-950/40 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#384959] dark:text-[#88BDF2] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#88BDF2]" />
                  Link Delivery & Transport to Order / PO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setLinkType('ORDER'); setSelectedPO(''); }}
                  className={`py-1.5 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    linkType === 'ORDER'
                      ? 'bg-[#384959] text-white border-[#384959]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  📦 Customer Order
                </button>

                <button
                  type="button"
                  onClick={() => { setLinkType('PO'); setSelectedOrder(''); }}
                  className={`py-1.5 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    linkType === 'PO'
                      ? 'bg-[#384959] text-white border-[#384959]'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  🚚 Supplier PO
                </button>
              </div>

              {linkType === 'ORDER' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Customer Order *</label>
                  <select
                    value={selectedOrder}
                    onChange={(e) => {
                      const ordId = e.target.value;
                      setSelectedOrder(ordId);
                      const ord = orders.find(o => String(o.id) === String(ordId));
                      if (ord) {
                        const refStr = `Customer Order #${ord.order_number} (${ord.customer_name || 'Walk-in'})`;
                        setFormData(prev => ({
                          ...prev,
                          paid_to: prev.paid_to || `Delivery Partner (${ord.customer_name || 'Customer'})`,
                          notes: prev.notes ? `${prev.notes} | Linked Ref: ${refStr}` : `Linked Ref: ${refStr}`
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">-- Choose Customer Order --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.order_number} - {o.customer_name || 'Walk-in'} (₹{parseFloat(o.total_amount).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'PO' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Supplier Purchase Order (PO) *</label>
                  <select
                    value={selectedPO}
                    onChange={(e) => {
                      const poId = e.target.value;
                      setSelectedPO(poId);
                      const po = purchaseOrders.find(p => String(p.id) === String(poId));
                      if (po) {
                        const refStr = `Supplier PO #${po.po_number} (${po.supplier_name || 'Supplier'})`;
                        setFormData(prev => ({
                          ...prev,
                          paid_to: prev.paid_to || `Transport Vendor (${po.supplier_name || 'Supplier'})`,
                          notes: prev.notes ? `${prev.notes} | Linked Ref: ${refStr}` : `Linked Ref: ${refStr}`
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="">-- Choose Supplier PO --</option>
                    {purchaseOrders.map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.po_number} - {p.supplier_name || 'Supplier'} (₹{parseFloat(p.total_amount).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Paid To / Recipient Firm</label>
            <input
              type="text"
              value={formData.paid_to}
              onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
              placeholder="e.g. Adani Electricity Mumbai Ltd / Porter Logistics"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Remarks / Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional remarks or linked reference details"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpenseList;
