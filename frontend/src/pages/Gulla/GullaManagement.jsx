import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/UiHelpers';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Receipt,
  Truck,
  Lock,
  FileText,
  Coins,
  Calculator,
  Printer,
  Download,
  Info,
  ShieldCheck,
  Store,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import { gullaApi, suppliersApi, expensesApi, customersApi, ordersApi, authApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DENOMINATIONS = [
  { value: 500, label: '₹500 Note', color: 'bg-stone-100 dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200' },
  { value: 200, label: '₹200 Note', color: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200' },
  { value: 100, label: '₹100 Note', color: 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200' },
  { value: 50, label: '₹50 Note', color: 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200' },
  { value: 20, label: '₹20 Note', color: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200' },
  { value: 10, label: '₹10 Note', color: 'bg-amber-100/70 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300' },
  { value: 5, label: '₹5 Note/Coin', color: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200' },
  { value: 1, label: 'Coins (Total ₹)', color: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200', isCoins: true },
];

export const GullaManagement = () => {
  const { showToast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Summary State
  const [summary, setSummary] = useState({
    opening_float: 0,
    cash_in_manual: 0,
    cash_out_manual: 0,
    cash_bills: 0,
    cash_bills_count: 0,
    upi_bills: 0,
    card_bills: 0,
    khata_cash: 0,
    supplier_cash: 0,
    expense_cash: 0,
    total_cash_in: 0,
    total_cash_out: 0,
    net_cash_in_gulla: 0,
    total_digital: 0,
    entries: [],
    cash_tender_logs: [],
    notes_and_coins_summary: {}
  });

  // Note Denominations Counter State
  const [counts, setCounts] = useState({
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    5: '',
    1: ''
  });

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('CASH_IN'); // 'OPENING_FLOAT' | 'CASH_IN' | 'CASH_OUT' | 'SUPPLIER_PAYMENT' | 'EXPENSE'
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  
  // EOD Home Cash Sweep Modal State
  const [isEodModalOpen, setIsEodModalOpen] = useState(false);
  const [eodSweeping, setEodSweeping] = useState(false);
  const [eodKeepFloat, setEodKeepFloat] = useState('5000');
  const [eodCustomAmount, setEodCustomAmount] = useState('');
  const [homeCashAmount, setHomeCashAmount] = useState(0);

  const [entryFormData, setEntryFormData] = useState({
    amount: '',
    notes: '',
    supplier_id: '',
    category_id: '',
    title: ''
  });

  // Meta dropdowns
  const [suppliers, setSuppliers] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [customers, setCustomers] = useState([]);



  // Selected Date Filter State
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Transaction Ledger Filter
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState('ALL');

  useEffect(() => {
    fetchGullaData(selectedDate);
    fetchMeta();
  }, [selectedDate]);

  const fetchGullaData = async (dateToFetch = selectedDate) => {
    try {
      setRefreshing(true);
      const res = await gullaApi.getGullaSummary({ date: dateToFetch });
      const data = res.data || {};
      setSummary({
        opening_float: parseFloat(data.opening_float) || 0,
        cash_in_manual: parseFloat(data.manual_cash_in) || 0,
        cash_out_manual: parseFloat(data.manual_cash_out) || 0,
        cash_bills: parseFloat(data.pos_cash_sales) || 0,
        cash_bills_count: data.cash_bills_count || (data.cash_tender_logs ? data.cash_tender_logs.length : 0),
        upi_bills: parseFloat(data.digital_sales?.upi) || 0,
        card_bills: parseFloat(data.digital_sales?.card) || 0,
        khata_cash: parseFloat(data.khata_cash_receipts) || 0,
        supplier_cash: parseFloat(data.supplier_cash_payouts) || 0,
        expense_cash: parseFloat(data.expense_cash_payouts) || 0,
        total_cash_in: parseFloat(data.total_cash_inflow) || 0,
        total_cash_out: parseFloat(data.total_cash_outflow) || 0,
        net_cash_in_gulla: parseFloat(data.net_cash_in_gulla) || 0,
        total_digital: parseFloat(data.digital_sales?.total_digital) || 0,
        entries: data.recent_entries || data.entries || [],
        cash_tender_logs: data.cash_tender_logs || [],
        notes_and_coins_summary: data.notes_and_coins_summary || {}
      });
    } catch (err) {
      console.error('Failed to load Gulla summary', err);
      showToast('Could not fetch Gulla summary data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [orders, setOrders] = useState([]);

  const fetchMeta = async () => {
    try {
      const [suppRes, expCatRes, custRes, ordRes, setRes] = await Promise.all([
        suppliersApi.getSuppliers(),
        expensesApi.getCategories(),
        customersApi.getCustomers(),
        ordersApi.getOrders(),
        authApi.getSettings()
      ]);
      setSuppliers(suppRes.data?.results || suppRes.data || []);
      setExpenseCategories(expCatRes.data?.results || expCatRes.data || []);
      setCustomers(custRes.data?.results || custRes.data || []);
      setOrders(ordRes.data?.results || ordRes.data || []);
      setHomeCashAmount(parseFloat(setRes.data?.home_cash_amount || 0));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEodSweepSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setEodSweeping(true);
      const payload = {
        keep_float: parseFloat(eodKeepFloat || 5000),
        custom_amount: eodCustomAmount ? parseFloat(eodCustomAmount) : undefined
      };
      const res = await gullaApi.eodSweep(payload);
      showToast(res.data?.message || 'Day-End Cash Sweep to Home Safe successful!', 'success');
      setIsEodModalOpen(false);
      if (res.data?.home_cash_amount !== undefined) {
        setHomeCashAmount(res.data.home_cash_amount);
      }
      fetchGullaData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to perform EOD Cash Sweep', 'error');
    } finally {
      setEodSweeping(false);
    }
  };

  // Physical Cash Denomination Calculations via Python Backend
  const [totalPhysicalCash, setTotalPhysicalCash] = useState(0);

  useEffect(() => {
    const calcPhysicalFromPython = async () => {
      try {
        const res = await gullaApi.calculateNotes({ denomination_counts: counts });
        setTotalPhysicalCash(res.data?.total_amount || 0);
      } catch (err) {
        console.error(err);
      }
    };
    calcPhysicalFromPython();
  }, [counts]);

  const expectedCashInGulla = summary.net_cash_in_gulla;
  const cashVariance = totalPhysicalCash - expectedCashInGulla;

  const handleCountChange = (valueKey, inputStr) => {
    const val = inputStr.replace(/[^0-9.]/g, '');
    setCounts(prev => ({ ...prev, [valueKey]: val }));
  };

  const handleResetCounts = () => {
    setCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
  };

  const handleAutoFillLiveCounts = () => {
    const netNotes = summary.notes_and_coins_summary?.net_drawer_notes || {};
    const filled = {};
    [500, 200, 100, 50, 20, 10, 5, 1].forEach(d => {
      const cnt = Math.max(0, parseInt(netNotes[d] || netNotes[String(d)] || 0, 10));
      filled[d] = cnt > 0 ? String(cnt) : '';
    });
    setCounts(filled);
    showToast('Auto-filled note counts from live drawer calculation!', 'info');
  };

  const [modalNoteCounts, setModalNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });

  const handleModalNoteChange = async (denom, valStr) => {
    const cleanVal = valStr.replace(/[^0-9]/g, '');
    const updatedCounts = { ...modalNoteCounts, [denom]: cleanVal };
    setModalNoteCounts(updatedCounts);

    try {
      // Delegate calculation & notes string formatting to Python Backend API
      const res = await gullaApi.calculateNotes({ denomination_counts: updatedCounts });
      const { total_amount, notes_summary } = res.data;

      setEntryFormData(prev => ({
        ...prev,
        amount: total_amount > 0 ? String(total_amount) : prev.amount,
        notes: notes_summary || prev.notes
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEntryModal = (type) => {
    setEntryType(type);
    setModalNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
    setEntryFormData({
      amount: '',
      notes: '',
      supplier_id: suppliers[0]?.id || '',
      category_id: expenseCategories[0]?.id || '',
      customer_id: customers[0]?.id || '',
      title: ''
    });
    setIsEntryModalOpen(true);
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(entryFormData.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid cash amount', 'error');
      return;
    }

    try {
      setEntrySubmitting(true);

      if (entryType === 'KHATA_PAYMENT' && entryFormData.customer_id) {
        await customersApi.recordKhataPayment(entryFormData.customer_id, {
          amount: amountNum,
          notes: entryFormData.notes || 'Khata Customer Cash Receipt from Gulla',
          denomination_counts: modalNoteCounts,
          payment_method: 'CASH'
        });
        showToast('Khata customer cash payment recorded successfully!', 'success');
      } else {
        const payload = {
          entry_type: entryType,
          amount: amountNum,
          notes: entryFormData.notes,
          denomination_counts: modalNoteCounts,
          supplier_id: entryType === 'SUPPLIER_PAYMENT' ? entryFormData.supplier_id : undefined,
          category_id: entryType === 'EXPENSE' ? entryFormData.category_id : undefined,
          title: entryType === 'EXPENSE' ? entryFormData.title : undefined,
          date: selectedDate,
        };

        await gullaApi.createGullaEntry(payload);
        showToast('Gulla cash transaction recorded successfully!', 'success');
      }

      setIsEntryModalOpen(false);
      fetchGullaData(selectedDate);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to record Gulla entry', 'error');
    } finally {
      setEntrySubmitting(false);
    }
  };



  // Filtered Ledger Entries
  const filteredEntries = (summary.entries || []).filter(e => {
    const searchLower = ledgerSearch.toLowerCase();
    const matchesSearch = !ledgerSearch || 
      (e.notes && e.notes.toLowerCase().includes(searchLower)) ||
      (e.entry_type && e.entry_type.toLowerCase().includes(searchLower)) ||
      (e.reference_id && e.reference_id.toLowerCase().includes(searchLower)) ||
      String(e.amount).includes(ledgerSearch);

    if (!matchesSearch) return false;
    if (ledgerFilter === 'ALL') return true;
    if (ledgerFilter === 'BILL_SALE') return e.entry_type === 'BILL_SALE' || e.entry_type === 'BILL_SALE_DIGITAL';
    return e.entry_type === ledgerFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-100 font-sans pb-12">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#384959] text-white flex items-center justify-center shadow-md shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#88BDF2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight">
                Gulla Management (ગલ્લા મેનેજમેન્ટ)
              </h1>
              <Badge variant="primary" className="bg-[#384959] text-white text-[10px] font-mono shrink-0">
                POS CASH REGISTER
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live cash drawer balance, denomination counter, cash float & register closing audit
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:flex sm:flex-row items-center gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGullaData}
            loading={refreshing}
            className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs border-slate-300 dark:border-slate-700 w-full sm:w-auto px-2 sm:px-3 py-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEntryModal('CASH_IN')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] sm:text-xs flex items-center justify-center gap-1 w-full sm:w-auto px-2 sm:px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>+ Add Cash</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEntryModal('CASH_OUT')}
            className="bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 text-[11px] sm:text-xs flex items-center justify-center gap-1 w-full sm:w-auto px-2 sm:px-3 py-1.5"
          >
            <Minus className="w-3.5 h-3.5 shrink-0" />
            <span>- Withdraw</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEodModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 w-full sm:w-auto px-2.5 sm:px-3.5 py-1.5 shadow-xs cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span>🏠 Day-End Home Sweep</span>
          </Button>
        </div>
      </div>

      {/* ================= DATE FILTER BAR ================= */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
          <Calendar className="w-4 h-4 text-[#384959] dark:text-[#88BDF2] shrink-0" />
          <span>Gulla Register Date:</span>
          <span className="bg-[#384959] text-white px-2.5 py-1 rounded-lg text-xs font-mono">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-1 sm:flex-initial text-center cursor-pointer ${
              selectedDate === new Date().toISOString().split('T')[0]
                ? 'bg-[#384959] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-1 sm:flex-initial text-center cursor-pointer ${
              selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                ? 'bg-[#384959] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Yesterday
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#384959] outline-none flex-1 sm:flex-initial"
          />
        </div>
      </div>

      {/* ================= 1. LIVE GULLA CASH CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Expected Net Cash in Gulla */}
        <div className="bg-gradient-to-br from-[#384959] to-[#2B3844] text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <Wallet className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#BDDDFC]">
              Expected Net Gulla Cash (કુલ ગલ્લું)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white truncate">
            ₹{expectedCashInGulla.toFixed(2)}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-slate-200">
            <span className="flex items-center gap-1 font-bold">
              🏠 Home Safe Total Cash:
            </span>
            <span className="font-extrabold font-mono text-amber-300">
              ₹{homeCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Today Cash Sales & Bills */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today Cash Bills (રોકડ વેચાણ)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
            +₹{summary.cash_bills.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{summary.cash_bills_count} Cash Bills</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Khata: ₹{summary.khata_cash.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 3: Today Cash Outflows */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cash Outflows (રોકડ ચુકવણું)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 truncate">
            -₹{summary.total_cash_out.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Expense: ₹{summary.expense_cash.toFixed(2)}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Supplier: ₹{summary.supplier_cash.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 4: Digital Sales (UPI & Cards) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Digital / UPI Sales (ડિજિટલ)
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-[#BDDDFC]/40 text-[#384959] dark:text-[#88BDF2] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#384959] dark:text-[#88BDF2] truncate">
            ₹{summary.total_digital.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>UPI: ₹{summary.upi_bills.toFixed(2)}</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">Card: ₹{summary.card_bills.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ================= 2. DENOMINATION COUNTER & RECONCILIATION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left 7 Cols: Live Gulla Note & Coin Count Summary (Read-Only) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#384959]/10 dark:bg-[#88BDF2]/10 text-[#384959] dark:text-[#88BDF2] shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#384959] dark:text-slate-100">
                  Live Drawer Note Breakdown (ગલ્લામાં ચલણી નોટ વિગત)
                </h2>
                <p className="text-[10px] text-slate-400">
                  Auto-calculated count of physical notes & coins currently inside Gulla cash drawer.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
              <button
                onClick={handleAutoFillLiveCounts}
                className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                title="Click to copy live auto-calculated drawer note count into audit counter"
              >
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Live Auto-Count
              </button>
            </div>
          </div>

          {/* All Note Denominations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {[
              { denom: 500, label: '₹500 Note', color: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20' },
              { denom: 200, label: '₹200 Note', color: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20' },
              { denom: 100, label: '₹100 Note', color: 'border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20' },
              { denom: 50, label: '₹50 Note', color: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20' },
              { denom: 20, label: '₹20 Note', color: 'border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20' },
              { denom: 10, label: '₹10 Note', color: 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40' },
              { denom: 5, label: '₹5 Note', color: 'border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20' },
              { denom: 1, label: 'Coins (₹)', color: 'border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20' }
            ].map(({ denom, label, color }) => {
              const denomsTable = summary.notes_and_coins_summary?.denominations_table || [];
              const found = denomsTable.find((x) => Number(x.denomination) === Number(denom));
              const netNotesDict = summary.notes_and_coins_summary?.net_drawer_notes || {};

              const rawCount = found ? found.net_count : (netNotesDict[denom] || netNotesDict[String(denom)] || 0);
              const countVal = Math.max(0, parseInt(rawCount || 0, 10));
              const subtotalVal = denom === 1 ? countVal : countVal * denom;

              return (
                <div
                  key={denom}
                  className={`p-3 rounded-2xl border ${color} flex items-center justify-between gap-2 shadow-2xs`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-black block truncate text-[#384959] dark:text-slate-100">
                      {label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold block truncate">
                      {denom === 1 ? 'Coins Value' : `₹${denom} × ${countVal} notes`}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black font-mono text-[#384959] dark:text-slate-100">
                      {countVal} {denom === 1 ? '₹' : 'Notes'}
                    </div>
                    <div className="text-[11px] font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{subtotalVal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Summary Banner: Total Physical Notes & Total Expected Cash */}
          <div className="p-3.5 bg-gradient-to-r from-[#384959]/5 via-[#384959]/10 to-[#88BDF2]/10 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-[#384959]/10 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-[#384959] dark:text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Total Cash Notes in Drawer:</span>
              <span className="font-mono text-xs font-black bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {(summary.notes_and_coins_summary?.denominations_table || [])
                  .filter((x) => x.denomination > 1)
                  .reduce((acc, x) => acc + Math.max(0, x.net_count || 0), 0)}{' '}
                Notes
              </span>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-slate-500 font-medium">Net Gulla Cash:</span>
              <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                ₹{expectedCashInGulla.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Reconciliation Audit & Action Box */}
        <div className="lg:col-span-5 space-y-4">
          {/* Audit Comparison & Today Money Counts Card */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#384959] dark:text-[#88BDF2] shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#384959] dark:text-slate-100">
                  Gulla Audit & Reconciliation
                </h2>
              </div>
              <Badge variant="primary" className="bg-[#384959] text-white text-[10px] font-mono shrink-0">
                TODAY SUMMARY
              </Badge>
            </div>

            <div className="space-y-2.5">
              {/* 1. Net Gulla Cash (Primary Highlight) */}
              <div className="p-3 bg-gradient-to-r from-[#384959] to-[#2B3844] text-white rounded-2xl flex items-center justify-between shadow-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#BDDDFC]">
                    Net Gulla Cash (ગલ્લામાં કુલ રોકડ)
                  </span>
                  <p className="text-[10px] text-slate-300">Available drawer cash right now</p>
                </div>
                <div className="text-right font-mono font-black text-lg sm:text-xl text-white">
                  ₹{expectedCashInGulla.toFixed(2)}
                </div>
              </div>



              {/* Today Money Breakdown List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1 pt-1">
                
                {/* 3. Add Cash / Opening Float */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Added Cash / Float (ઉમેરેલ રોકડ):
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{(summary.opening_float + summary.cash_in_manual).toFixed(2)}
                  </span>
                </div>

                {/* 4. Today POS Cash Sale Bills */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    POS Cash Bills (રોકડ વેચાણ બિલ):
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{summary.cash_bills.toFixed(2)} ({summary.cash_bills_count} Bills)
                  </span>
                </div>

                {/* 5. Khata Customer Cash */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    Khata Customer Cash (ખાતા કેશ આવક):
                  </span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                    +₹{summary.khata_cash.toFixed(2)}
                  </span>
                </div>

                {/* 6. Cash Withdrawal */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Minus className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Cash Withdrawals (ઉપાડ રોકડ):
                  </span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    -₹{summary.cash_out_manual.toFixed(2)}
                  </span>
                </div>

                {/* 7. Supplier Cash Payments */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    Supplier Payments (સપ્લાયર ચુકવણી):
                  </span>
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    -₹{summary.supplier_cash.toFixed(2)}
                  </span>
                </div>

                {/* 8. Store Cash Expenses */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Store Expenses (સ્ટોર ખર્ચ):
                  </span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    -₹{summary.expense_cash.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 9. Today Total Inflow & Outflow Totals */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                    Total Cash Inflow (કુલ રોકડ આવક)
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    +₹{summary.total_cash_in.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200/60 dark:border-rose-800/60">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase block">
                    Total Cash Outflow (કુલ રોકડ જાવક)
                  </span>
                  <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                    -₹{summary.total_cash_out.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleOpenEntryModal('SUPPLIER_PAYMENT')}
                  className="w-full text-xs font-bold flex items-center justify-center gap-1 border-slate-300 dark:border-slate-700"
                >
                  <Truck className="w-3.5 h-3.5 text-[#384959]" />
                  Supplier Pay
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleOpenEntryModal('EXPENSE')}
                  className="w-full text-xs font-bold flex items-center justify-center gap-1 border-slate-300 dark:border-slate-700"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#384959]" />
                  Store Expense
                </Button>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenEntryModal('KHATA_PAYMENT')}
                className="w-full bg-[#384959] hover:bg-[#2B3844] text-white text-xs font-bold flex items-center justify-center gap-2 py-2.5 rounded-xl shadow-sm cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-[#88BDF2]" />
                Khata Customer Pay (ખાતા ગ્રાહક ચુકવણી)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. TRANSACTION LEDGER & AUDIT TRAIL ================= */}
      <Card className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#384959] dark:text-[#88BDF2] shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-[#384959] dark:text-slate-100">
              Today's Gulla Transaction Ledger (ગલ્લાની વ્યવહાર યાદી)
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 max-w-full">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] sm:text-[11px] font-bold shrink-0">
              {['ALL', 'BILL_SALE', 'KHATA_PAYMENT', 'OPENING_FLOAT', 'CASH_IN', 'CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setLedgerFilter(type)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    ledgerFilter === type
                      ? 'bg-white dark:bg-slate-900 text-[#384959] dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {type === 'BILL_SALE' ? 'POS Bills' : type === 'KHATA_PAYMENT' ? 'Khata Cash' : type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Entries Table */}
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No Gulla Entries Found"
            description="Manual cash entries and payouts will appear here in real-time."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[#384959] dark:text-slate-300 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Entry Type</th>
                  <th className="py-3 px-4">Transaction Details & Ref</th>
                  <th className="py-3 px-4">Received Notes (આવેલ નોટ)</th>
                  <th className="py-3 px-4">Change Notes (આપેલ/જાવક)</th>
                  <th className="py-3 px-4 text-right">Cash Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEntries.map((e) => {
                  const isPositive = ['OPENING_FLOAT', 'CASH_IN', 'BILL_SALE', 'BILL_SALE_DIGITAL', 'KHATA_PAYMENT'].includes(e.entry_type);

                  const getBadgeColor = (type) => {
                    switch (type) {
                      case 'BILL_SALE':
                        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300';
                      case 'BILL_SALE_DIGITAL':
                        return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300';
                      case 'KHATA_PAYMENT':
                        return 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300';
                      case 'SUPPLIER_PAYMENT':
                        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300';
                      case 'EXPENSE':
                        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300';
                      case 'OPENING_FLOAT':
                        return 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300';
                      case 'CASH_IN':
                        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200';
                      case 'CASH_OUT':
                        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300';
                      default:
                        return 'bg-slate-100 text-slate-700';
                    }
                  };

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* 1. Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#384959] dark:text-slate-200">
                            {new Date(e.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* 2. Entry Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${getBadgeColor(e.entry_type)}`}>
                          {e.entry_type_label || e.entry_type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* 3. Transaction Details / Notes */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                          {e.notes || 'Routine Gulla cash transaction'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            {e.reference_id || e.id}
                          </span>
                          <span>• {e.user_name || 'Staff'}</span>
                        </div>
                      </td>

                      {/* 4. Received Notes Count */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {e.tendered_summary ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-mono text-[11px] font-bold">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {e.tendered_summary}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* 5. Change / Outflow Notes Count */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {e.change_summary ? (
                          <span className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 font-mono text-[11px] font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            {e.change_summary}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* 6. Cash Amount */}
                      <td className={`py-3 px-4 text-right font-mono font-black text-sm whitespace-nowrap ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isPositive ? `+₹${parseFloat(e.amount).toFixed(2)}` : `-₹${parseFloat(e.amount).toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ================= MODAL 1: ADD CASH / WITHDRAWAL / PAYOUT ================= */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title={entryType === 'CASH_IN' ? 'Add Cash to Gulla (ગલ્લામાં રોકડ ઉમેરો)' : entryType === 'CASH_OUT' ? 'Cash Withdrawal (ગલ્લામાંથી ઉપાડ)' : entryType === 'KHATA_PAYMENT' ? 'Khata Customer Cash Pay (ખાતા ગ્રાહક ચુકવણી)' : entryType === 'OPENING_FLOAT' ? 'Add Opening Cash / Float' : `Record ${entryType.replace('_', ' ')}`}
        subtitle="Manage Gulla cash drawer inflows and outflows"
        maxWidth="max-w-lg w-full"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEntrySubmit}
              loading={entrySubmitting}
              className="bg-[#384959] hover:bg-[#2B3844] text-white"
            >
              Submit Entry
            </Button>
          </div>
        }
      >
        <form onSubmit={handleEntrySubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Amount */}
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Cash Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-base font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                autoFocus
                value={entryFormData.amount}
                onChange={(e) => setEntryFormData({ ...entryFormData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-base font-black font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
              />
            </div>
          </div>

          {/* Interactive Note Denomination Counter (ચલણી નોટ ગણતરી) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#384959] dark:text-[#88BDF2] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#88BDF2]" />
                Note Counter System (ચલણી નોટ ગણતરી)
              </span>
              <button
                type="button"
                onClick={() => setModalNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' })}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
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
                const cnt = modalNoteCounts[denom] || '';
                const sub = (denom === 1 ? parseFloat(cnt) || 0 : (parseInt(cnt, 10) || 0) * denom);
                return (
                  <div key={denom} className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <span className="font-bold font-mono text-slate-600 dark:text-slate-300 truncate">{label}:</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={cnt}
                        onChange={(e) => handleModalNoteChange(denom, e.target.value)}
                        className="w-12 px-1 py-0.5 text-center font-black font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                      <span className="w-10 text-right font-mono font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                        ₹{sub}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Dropdown if KHATA_PAYMENT */}
          {entryType === 'KHATA_PAYMENT' && (
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                Select Khata Customer (ગ્રાહક પસંદ કરો)
              </label>
              <select
                value={entryFormData.customer_id || ''}
                onChange={(e) => setEntryFormData({ ...entryFormData, customer_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
              >
                <option value="">-- General Walk-in Khata Cash --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.full_name} ({c.phone}) - Khata Due: ₹{parseFloat(c.khata_balance || c.balance || 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Supplier Dropdown if SUPPLIER_PAYMENT */}
          {entryType === 'SUPPLIER_PAYMENT' && (
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={entryFormData.supplier_id}
                onChange={(e) => setEntryFormData({ ...entryFormData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.company_name || s.phone})</option>
                ))}
              </select>
            </div>
          )}

          {/* Expense Category Dropdown if EXPENSE */}
          {entryType === 'EXPENSE' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={entryFormData.title}
                  onChange={(e) => setEntryFormData({ ...entryFormData, title: e.target.value })}
                  placeholder="e.g. Tea & Snacks / Delivery Charges / Freight"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Expense Category
                </label>
                <select
                  value={entryFormData.category_id}
                  onChange={(e) => setEntryFormData({ ...entryFormData, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Delivery & Transport Order / PO Linker */}
              {(() => {
                const selectedExpCat = expenseCategories.find(c => String(c.id) === String(entryFormData.category_id));
                const isDelCat = selectedExpCat && (
                  selectedExpCat.name.toLowerCase().includes('delivery') ||
                  selectedExpCat.name.toLowerCase().includes('transport') ||
                  selectedExpCat.name.toLowerCase().includes('freight') ||
                  selectedExpCat.name.toLowerCase().includes('logistics')
                );
                if (!isDelCat) return null;
                return (
                  <div className="p-2.5 bg-sky-50/80 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 space-y-2 text-xs">
                    <span className="font-extrabold text-[#384959] dark:text-[#88BDF2] flex items-center gap-1.5 text-[11px]">
                      <Truck className="w-3.5 h-3.5 text-[#88BDF2]" />
                      Link Delivery & Transport to Order / PO (ઓર્ડર/પો લિંક કરો)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Link Customer Order</label>
                        <select
                          onChange={(e) => {
                            const ord = orders.find(o => String(o.id) === String(e.target.value));
                            if (ord) {
                              setEntryFormData(prev => ({
                                ...prev,
                                title: prev.title || `Delivery Charge for Order #${ord.order_number}`,
                                notes: `Linked Ref: Customer Order #${ord.order_number} (${ord.customer_name || 'Walk-in'})${prev.notes ? ' | ' + prev.notes : ''}`
                              }));
                            }
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px]"
                        >
                          <option value="">-- Choose Order --</option>
                          {orders.map(o => (
                            <option key={o.id} value={o.id}>#{o.order_number} - {o.customer_name || 'Walk-in'} (₹{parseFloat(o.total_amount).toFixed(2)})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Link Supplier Vendor</label>
                        <select
                          onChange={(e) => {
                            const supp = suppliers.find(s => String(s.id) === String(e.target.value));
                            if (supp) {
                              setEntryFormData(prev => ({
                                ...prev,
                                title: prev.title || `Freight Transport for Supplier ${supp.name}`,
                                notes: `Linked Ref: Supplier Vendor ${supp.name}${prev.notes ? ' | ' + prev.notes : ''}`
                              }));
                            }
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px]"
                        >
                          <option value="">-- Choose Supplier --</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.company_name || s.phone})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Remarks / Notes */}
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={entryFormData.notes}
              onChange={(e) => setEntryFormData({ ...entryFormData, notes: e.target.value })}
              placeholder="e.g. Shift start float / Owner withdrawal"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
            />
          </div>
        </form>
      </Modal>

      {/* ================= MODAL 2: DAY-END HOME CASH SWEEP MODAL ================= */}
      <Modal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
        title="Day-End Auto Cash Sweep to Home Safe (દિવસના અંતે ઘરે રોકડ ટ્રાન્સફર)"
        subtitle="Automatically withdraw cash drawer balance and transfer to Home Safe"
        maxWidth="max-w-md w-full"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsEodModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleEodSweepSubmit}
              loading={eodSweeping}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Confirm Home Cash Sweep
            </Button>
          </div>
        }
      >
        <form onSubmit={handleEodSweepSubmit} className="space-y-4 text-xs font-sans">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="flex items-center justify-between text-[#384959] dark:text-slate-200 font-bold">
              <span>Expected Gulla Cash Drawer:</span>
              <span className="font-mono text-sm font-black">₹{expectedCashInGulla.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Current Home Total Cash:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{homeCashAmount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Keep Float for Tomorrow (કાલે સવારે ગલ્લામાં રાખવાની રોકડ ₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={eodKeepFloat}
              onChange={(e) => setEodKeepFloat(e.target.value)}
              placeholder="5000.00"
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
            />
            <p className="text-[10px] text-slate-400 mt-1">Default: ₹5,000 float stays in register for morning change; rest transfers to Home Safe.</p>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Or Custom Sweep Amount (₹) (અથવા મનપસંદ રકમ ઘરે મોકલો)
            </label>
            <input
              type="number"
              step="0.01"
              value={eodCustomAmount}
              onChange={(e) => setEodCustomAmount(e.target.value)}
              placeholder="Leave blank to auto-sweep excess"
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2]"
            />
          </div>

          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-bold text-[#384959] dark:text-[#88BDF2]">ℹ️ System Action Summary:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[10px]">
              <li>Creates CASH_OUT entry in Gulla Cash Register</li>
              <li>Adds swept cash directly to <strong>Brand Identity Home Total Cash Amount</strong></li>
              <li>Logs record to <strong>Payment Ledger & Settlements</strong></li>
            </ul>
          </div>
        </form>
      </Modal>


    </div>
  );
};

export default GullaManagement;
