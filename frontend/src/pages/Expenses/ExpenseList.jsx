import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  ArrowLeft,
  LayoutGrid,
  List,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { expensesApi, gullaApi, ordersApi, suppliersApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export const ExpenseList = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { isDark } = useTheme();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters & Layout Controls State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'analytics' | 'logistics'

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
      setExpenses(extractList(expRes));
      setCategories(extractList(catRes));
      setSummary(sumRes.data);
      setOrders(extractList(ordRes));
      setPurchaseOrders(extractList(poRes));
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
    if (e) e.preventDefault();
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

  const chartData = useMemo(() => {
    return (summary?.category_breakdown || [])
      .filter(c => parseFloat(c.total || c.amount || 0) > 0)
      .map(c => ({
        name: c.category || c.category_name || c.category__name || 'General Overheads',
        value: parseFloat(c.total || c.amount || 0)
      }));
  }, [summary]);

  // Filtered Expenses List
  const filteredExpenses = useMemo(() => {
    let list = Array.isArray(expenses) ? expenses : [];
    if (selectedCategory) {
      list = list.filter(e => String(e.category?.id || e.category) === String(selectedCategory));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.paid_to && e.paid_to.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.payment_method && e.payment_method.toLowerCase().includes(q))
      );
    }
    return list;
  }, [expenses, selectedCategory, search]);

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
                Store <span className="text-[#00695C] dark:text-[#4DB6AC]">Expenses</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Track operational store overheads
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormData({ ...formData, category: categories[0]?.id || '' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* 🌟 Tulsi Mart POS Top Header Banner (Desktop Only) - Matching Supplier Header */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left: Receipt Icon & Title */}
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

          {/* Right: Quick Stat Badges & Record Button */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                    TODAY'S OUTFLOW
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-heading leading-none block">
                    ₹{Number(summary?.today_expenses || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                    THIS MONTH
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#00796b] dark:text-[#80cbc4] leading-none block">
                    ₹{Number(summary?.monthly_expenses || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setFormData({ ...formData, category: categories[0]?.id || '' });
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white font-extrabold rounded-2xl shadow-sm shadow-teal-900/20 border border-[#004d40]/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 STORE OVERHEADS CONTENT */}
      <div className="space-y-4">
          {/* Filter, Search & Layout Controls Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="w-full md:w-72 lg:w-80 shrink-0">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                placeholder="Search expenses by payee, title or notes..."
              />
            </div>

            {/* Right Controls: Category Filter Tabs + Layout Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto">
              {/* Category Filter Pills */}
              <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === ''
                      ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({expenses.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(String(c.id))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      String(selectedCategory) === String(c.id)
                        ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle: Table vs Cards */}
              <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-[#00695C] dark:text-[#4DB6AC] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-[#00695C] dark:text-[#4DB6AC] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* List Display: Empty State vs Cards vs Table */}
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Expense Records Found"
              description="There are currently no store operational expenses matching your search or category filter."
              variant="card"
              actionLabel="Record Expense"
              onAction={() => setIsModalOpen(true)}
              actionIcon={Plus}
            />
          ) : viewMode === 'table' ? (
            /* RICH EXPENSES DATA TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-sm font-black text-[#263238] dark:text-slate-100 uppercase tracking-wider">
                    Store Expenses Table ({filteredExpenses.length} Records)
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Managed in `core_expense` database table</span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[760px] border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Title & Method</th>
                      <th className="px-4 py-3 whitespace-nowrap">Category</th>
                      <th className="px-4 py-3 whitespace-nowrap">Paid To / Payee</th>
                      <th className="px-4 py-3 whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Amount (₹)</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                    {filteredExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{e.title}</p>
                          <span className="text-[10px] text-[#00695C] dark:text-[#4DB6AC] font-mono font-bold uppercase">
                            Paid via {e.payment_method}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-[#00695C] dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            {e.category?.name || e.category_name || 'General'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                          {e.paid_to || '-'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {e.date}
                        </td>

                        <td className="px-4 py-3.5 text-right font-black text-[#00695C] dark:text-[#4DB6AC] text-sm font-heading whitespace-nowrap">
                          ₹{Number(e.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Delete Expense Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* RICH EXPENSES CARDS VIEW - MATCHING SUPPLIER CARD UI */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredExpenses.map((e) => (
                <div
                  key={e.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-teal-400/50 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top Accent Gradient Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00695C] via-[#009688] to-[#4DB6AC] rounded-t-3xl" />

                  <div>
                    {/* Header Row: Category Badge + Amount */}
                    <div className="flex items-start justify-between gap-3 mt-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00695C] to-[#009688] text-white flex items-center justify-center shrink-0 shadow-md border border-white/20 group-hover:scale-105 transition-transform">
                          <Receipt className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-[#00695c] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                            {e.category?.name || e.category_name || 'General'}
                          </span>
                        </div>
                      </div>

                      <span className="text-base sm:text-lg font-black text-[#00695C] dark:text-[#4DB6AC] font-heading shrink-0">
                        ₹{Number(e.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Expense Title */}
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-3.5 leading-snug">
                      {e.title}
                    </h3>

                    {/* Payee Info & Method Pill */}
                    <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Paid To:</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate ml-2">
                          {e.paid_to || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Method:</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[10px] uppercase">
                          {e.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-bold text-slate-400">
                      📅 {e.date}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Delete Expense Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* 🌟 RECORD OPERATING EXPENSE MODAL */}
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
        <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1 font-sans">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Expense Title / Description *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Electric AC Bill / Packaging Bags"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:border-[#00796b] outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="2500.00"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100 focus:border-[#00796b] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:border-[#00796b] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:border-[#00796b] outline-none"
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
                        className="w-12 px-1.5 py-0.5 text-center font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-100"
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
                <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  Link Delivery & Transport to Order / PO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setLinkType('ORDER'); setSelectedPO(''); }}
                  className={`py-1.5 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    linkType === 'ORDER'
                      ? 'bg-[#00796b] text-white border-[#00796b]'
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
                      ? 'bg-[#00796b] text-white border-[#00796b]'
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
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Paid To / Recipient Firm</label>
            <input
              type="text"
              value={formData.paid_to}
              onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
              placeholder="e.g. Adani Electricity Mumbai Ltd / Porter Logistics"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#00796b] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Remarks / Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional remarks or linked reference details"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#00796b] outline-none resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpenseList;
