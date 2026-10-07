import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Banknote,
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
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { gullaApi, suppliersApi, expensesApi, customersApi, ordersApi, authApi, homeCashApi, bankApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
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
  { value: 2, label: '₹2 Note/Coin', color: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200' },
  { value: 1, label: 'Coins (Total ₹)', color: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200', isCoins: true },
];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const GullaManagement = () => {
  const navigate = useNavigate();
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
    2: '',
    1: ''
  });

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('CASH_IN'); // 'OPENING_FLOAT' | 'CASH_IN' | 'CASH_OUT' | 'SUPPLIER_PAYMENT' | 'EXPENSE'
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  
  // EOD Home Cash Sweep Modal & Home Safe Vault State
  const [isEodModalOpen, setIsEodModalOpen] = useState(false);
  const [eodSweeping, setEodSweeping] = useState(false);
  const [eodKeepFloat, setEodKeepFloat] = useState('5000');
  const [eodCustomAmount, setEodCustomAmount] = useState('');
  const [homeCashAmount, setHomeCashAmount] = useState(0);
  const [auto1130SweepEnabled, setAuto1130SweepEnabled] = useState(true);
  const [togglingAutoSweep, setTogglingAutoSweep] = useState(false);
  const [bankBalance, setBankBalance] = useState(0);
  const [homeVaultNotes, setHomeVaultNotes] = useState({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
  const [isHomeVaultModalOpen, setIsHomeVaultModalOpen] = useState(false);
  const [homeVaultHistory, setHomeVaultHistory] = useState([]);
  const [homeVaultLoading, setHomeVaultLoading] = useState(false);

  // Direct Home Vault Transaction Form State
  const [isVaultFormOpen, setIsVaultFormOpen] = useState(false);
  const [vaultFormType, setVaultFormType] = useState('DEPOSIT');
  const [vaultFormAmount, setVaultFormAmount] = useState('');
  const [vaultFormNotes, setVaultFormNotes] = useState('');
  const [vaultFormNoteCounts, setVaultFormNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
  const [vaultSubmitting, setVaultSubmitting] = useState(false);

  const [entryFormData, setEntryFormData] = useState({
    amount: '',
    notes: '',
    supplier_id: '',
    category_id: '',
    title: '',
    cash_source: 'HOME_SAFE'
  });

  // Meta dropdowns
  const [suppliers, setSuppliers] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Selected Date Filter State
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());

  // Transaction Ledger Filter
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState('ALL');

  useEffect(() => {
    fetchGullaData(selectedDate);
    fetchMeta();
  }, [selectedDate]);

  const fetchGullaData = async (dateParam) => {
    const dateToFetch = (typeof dateParam === 'string' && dateParam !== '[object Object]') ? dateParam : (typeof selectedDate === 'string' ? selectedDate : undefined);
    try {
      setRefreshing(true);
      const res = await gullaApi.getGullaSummary(dateToFetch ? { date: dateToFetch } : {});
      const data = res?.data?.data || res?.data || {};
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
        entries: data.entries || data.recent_entries || [],
        cash_tender_logs: data.cash_tender_logs || [],
        notes_and_coins_summary: data.notes_and_coins_summary || {}
      });
      if (data.auto_1130_sweep_enabled !== undefined) {
        setAuto1130SweepEnabled(data.auto_1130_sweep_enabled);
      }
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
      const [suppRes, expCatRes, custRes, ordRes, setRes, bankRes, homeRes] = await Promise.all([
        suppliersApi.getSuppliers(),
        expensesApi.getCategories(),
        customersApi.getCustomers(),
        ordersApi.getOrders(),
        authApi.getSettings(),
        bankApi.getSummary(),
        homeCashApi.getHomeCashData()
      ]);
      setSuppliers(extractList(suppRes));
      setExpenseCategories(extractList(expCatRes));
      setCustomers(extractList(custRes));
      setOrders(extractList(ordRes));
      const setData = setRes?.data?.data || setRes?.data || {};
      const bankData = bankRes?.data?.data || bankRes?.data || {};
      const homeData = homeRes?.data?.data || homeRes?.data || {};
      setHomeCashAmount(parseFloat(setData.home_cash_amount || 0));
      setBankBalance(parseFloat(bankData.total_bank_balance || 0));
      if (homeData.denominations_breakdown) {
        setHomeVaultNotes(homeData.denominations_breakdown);
      }
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
      const resData = res?.data?.data || res?.data || {};
      showToast(resData.message || res?.data?.message || 'Day-End Cash Sweep to Home Safe successful!', 'success');
      setIsEodModalOpen(false);
      if (resData.home_cash_amount !== undefined) {
        setHomeCashAmount(resData.home_cash_amount);
      }
      fetchGullaData(selectedDate);
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
        const resData = res?.data?.data || res?.data || {};
        setTotalPhysicalCash(resData.total_amount || 0);
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
    setCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
  };

  const handleAutoFillLiveCounts = () => {
    const netNotes = summary.notes_and_coins_summary?.net_drawer_notes || {};
    const filled = {};
    [500, 200, 100, 50, 20, 10, 5, 2, 1].forEach(d => {
      const cnt = Math.max(0, parseInt(netNotes[d] || netNotes[String(d)] || 0, 10));
      filled[d] = cnt > 0 ? String(cnt) : '';
    });
    setCounts(filled);
    showToast('Auto-filled note counts from live drawer calculation!', 'info');
  };

  const [modalNoteCounts, setModalNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });

  const handleModalNoteChange = async (denom, valStr) => {
    const cleanVal = valStr.replace(/[^0-9]/g, '');
    const requested = parseInt(cleanVal || 0, 10);

    let availNoteCount = null;
    if (['CASH_IN', 'OPENING_FLOAT'].includes(entryType) && (entryFormData.cash_source || 'HOME_SAFE') === 'HOME_SAFE') {
      availNoteCount = Math.max(0, parseInt(homeVaultNotes[denom] || homeVaultNotes[String(denom)] || 0, 10));
    } else if (['CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE'].includes(entryType)) {
      const netNotesDict = summary.notes_and_coins_summary?.net_drawer_notes || {};
      availNoteCount = Math.max(0, parseInt(netNotesDict[denom] || netNotesDict[String(denom)] || 0, 10));
    }

    if (availNoteCount !== null) {
      if (availNoteCount <= 0 && requested > 0) {
        showToast(`⚠️ Note ₹${denom} is unavailable (0 stock). You cannot add or withdraw this note.`, 'warning');
        return;
      }
      if (requested > availNoteCount) {
        showToast(`⚠️ Insufficient stock for ₹${denom} note! Only ${availNoteCount} available.`, 'warning');
        return;
      }
    }

    const updatedCounts = { ...modalNoteCounts, [denom]: cleanVal };
    setModalNoteCounts(updatedCounts);

    try {
      // Delegate calculation & notes string formatting to Python Backend API
      const res = await gullaApi.calculateNotes({ denomination_counts: updatedCounts });
      const resData = res?.data?.data || res?.data || {};
      const { total_amount, notes_summary } = resData;

      setEntryFormData(prev => ({
        ...prev,
        amount: total_amount > 0 ? String(total_amount) : prev.amount,
        notes: notes_summary || prev.notes
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSelectNote = async (denomToSelect) => {
    const netNotesDict = summary.notes_and_coins_summary?.net_drawer_notes || {};
    let newCounts = { ...modalNoteCounts };

    if (denomToSelect === 'HIGH_NOTES') {
      [500, 200, 100, 50].forEach(d => {
        const avail = Math.max(0, parseInt(netNotesDict[d] || netNotesDict[String(d)] || 0, 10));
        newCounts[d] = avail > 0 ? String(avail) : '';
      });
      [20, 10, 5, 2, 1].forEach(d => { newCounts[d] = ''; });
    } else if (denomToSelect === 'CLEAR') {
      newCounts = { 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' };
    } else if (typeof denomToSelect === 'number' || !isNaN(Number(denomToSelect))) {
      const d = Number(denomToSelect);
      const avail = Math.max(0, parseInt(netNotesDict[d] || netNotesDict[String(d)] || 0, 10));
      if (avail > 0) {
        newCounts[d] = String(avail);
      } else {
        showToast(`⚠️ Note ₹${d} is not available in Gulla drawer`, 'warning');
        return;
      }
    }

    setModalNoteCounts(newCounts);

    try {
      const res = await gullaApi.calculateNotes({ denomination_counts: newCounts });
      const resData = res?.data?.data || res?.data || {};
      const { total_amount, notes_summary } = resData;
      setEntryFormData(prev => ({
        ...prev,
        amount: total_amount > 0 ? String(total_amount) : prev.amount,
        notes: notes_summary || prev.notes
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoSweep1130pm = async () => {
    try {
      setEodSweeping(true);
      const res = await gullaApi.eodSweep({ only_high_notes: true });
      const resData = res?.data?.data || res?.data || {};
      showToast(resData.message || res?.data?.message || '11:30 PM High-Notes Auto Sweep executed successfully!', 'success');
      if (resData.home_cash_amount !== undefined) {
        setHomeCashAmount(resData.home_cash_amount);
      }
      fetchGullaData(selectedDate);
    } catch (err) {
      showToast(err.response?.data?.message || err.response?.data?.error || 'Failed to perform 11:30 PM Auto Sweep', 'error');
    } finally {
      setEodSweeping(false);
    }
  };

  const handleToggleAutoSweep = async (targetState) => {
    const newState = targetState !== undefined ? targetState : !auto1130SweepEnabled;
    try {
      setTogglingAutoSweep(true);
      const res = await gullaApi.toggleAutoSweep({ enabled: newState });
      const resData = res?.data?.data || res?.data || {};
      setAuto1130SweepEnabled(newState);
      showToast(resData.message || res?.data?.message || `11:30 PM Automatic Money Withdraw System is now ${newState ? 'ON (Active)' : 'OFF (Disabled)'}.`, 'success');
      fetchGullaData(selectedDate);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update auto sweep setting', 'error');
    } finally {
      setTogglingAutoSweep(false);
    }
  };

  const fetchHomeVaultHistory = async () => {
    try {
      setHomeVaultLoading(true);
      const res = await homeCashApi.getHomeCashData();
      const resData = res?.data?.data || res?.data || {};
      setHomeVaultHistory(resData.history || extractList(res) || []);
      if (resData.home_cash_amount !== undefined) {
        setHomeCashAmount(resData.home_cash_amount);
      }
      if (resData.auto_1130_sweep_enabled !== undefined) {
        setAuto1130SweepEnabled(resData.auto_1130_sweep_enabled);
      }
      if (resData.denominations_breakdown) {
        setHomeVaultNotes(resData.denominations_breakdown);
      }
      setIsHomeVaultModalOpen(true);
    } catch (err) {
      showToast('Failed to load Home Safe Vault history', 'error');
    } finally {
      setHomeVaultLoading(false);
    }
  };

  const handleVaultNoteChange = async (denom, valStr) => {
    const cleanVal = valStr.replace(/[^0-9]/g, '');
    const updatedCounts = { ...vaultFormNoteCounts, [denom]: cleanVal };
    setVaultFormNoteCounts(updatedCounts);

    try {
      const res = await gullaApi.calculateNotes({ denomination_counts: updatedCounts });
      const resData = res?.data?.data || res?.data || {};
      if (resData.total_amount > 0) {
        setVaultFormAmount(String(resData.total_amount));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVaultFormSubmit = async (e) => {
    if (e) e.preventDefault();
    const amtNum = parseFloat(vaultFormAmount);
    if (!amtNum || amtNum <= 0) {
      showToast('Please enter a valid cash amount', 'error');
      return;
    }
    if (vaultFormType === 'WITHDRAWAL' && amtNum > homeCashAmount) {
      showToast(`⚠️ Insufficient Home Safe Vault balance! Available: ₹${homeCashAmount.toFixed(2)}, Attempted: ₹${amtNum.toFixed(2)}`, 'error');
      return;
    }

    try {
      setVaultSubmitting(true);
      const payload = {
        entry_type: vaultFormType,
        amount: amtNum,
        denomination_counts: vaultFormNoteCounts,
        notes: vaultFormNotes || (vaultFormType === 'DEPOSIT' ? 'Direct Home Safe Vault Deposit' : 'Direct Home Safe Vault Withdrawal')
      };
      await homeCashApi.createHomeCashTransaction(payload);
      showToast(`Home Safe Vault ${vaultFormType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} of ₹${amtNum} recorded successfully!`, 'success');

      setIsVaultFormOpen(false);
      setVaultFormAmount('');
      setVaultFormNotes('');
      setVaultFormNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });

      const res = await homeCashApi.getHomeCashData();
      const resData = res?.data?.data || res?.data || {};
      setHomeVaultHistory(resData.history || extractList(res) || []);
      if (resData.home_cash_amount !== undefined) {
        setHomeCashAmount(resData.home_cash_amount);
      }
      if (resData.denominations_breakdown) {
        setHomeVaultNotes(resData.denominations_breakdown);
      }
      fetchGullaData(selectedDate);
    } catch (err) {
      showToast(err.response?.data?.detail || err.response?.data?.message || 'Failed to record Home Safe Vault transaction', 'error');
    } finally {
      setVaultSubmitting(false);
    }
  };

  const handleOpenEntryModal = (type) => {
    setEntryType(type);
    setModalNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
    setEntryFormData({
      amount: '',
      notes: '',
      supplier_id: suppliers[0]?.id || '',
      category_id: expenseCategories[0]?.id || '',
      customer_id: customers[0]?.id || '',
      title: '',
      cash_source: 'HOME_SAFE'
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

    if (['CASH_IN', 'OPENING_FLOAT'].includes(entryType)) {
      const source = entryFormData.cash_source || 'HOME_SAFE';
      if (source === 'HOME_SAFE') {
        if (amountNum > homeCashAmount) {
          showToast(`⚠️ Insufficient Home Safe Vault Balance! Available: ₹${homeCashAmount.toFixed(2)}, Attempted: ₹${amountNum.toFixed(2)}. Please deposit cash to Home Safe first or select Bank.`, 'error');
          return;
        }

        const hasVaultNotes = Object.values(homeVaultNotes).some(v => v > 0);
        if (hasVaultNotes) {
          for (const [denomStr, countRaw] of Object.entries(modalNoteCounts)) {
            const d = Number(denomStr);
            const requested = parseInt(countRaw || 0, 10);
            if (requested > 0) {
              const avail = Math.max(0, parseInt(homeVaultNotes[d] || homeVaultNotes[String(d)] || 0, 10));
              if (requested > avail) {
                showToast(`⚠️ HOME SAFE ALERT: Insufficient ₹${d} notes in Home Safe Vault! (Available: ${avail} notes, Requested: ${requested} notes).`, 'error');
                return;
              }
            }
          }
        }
      }
      if (source === 'BANK' && amountNum > bankBalance) {
        showToast(`⚠️ Insufficient Bank Account Balance! Available: ₹${bankBalance.toFixed(2)}, Attempted: ₹${amountNum.toFixed(2)}.`, 'error');
        return;
      }
    }

    if (['CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE'].includes(entryType)) {
      const netNotesDict = summary.notes_and_coins_summary?.net_drawer_notes || {};
      for (const [denomStr, countRaw] of Object.entries(modalNoteCounts)) {
        const d = Number(denomStr);
        const requested = parseInt(countRaw || 0, 10);
        if (requested > 0) {
          const avail = Math.max(0, parseInt(netNotesDict[d] || netNotesDict[String(d)] || 0, 10));
          if (requested > avail) {
            showToast(`⚠️ GULLA ALERT: Insufficient ₹${d} notes in Gulla drawer! (Available: ${avail}, Required: ${requested}). Please add notes via Opening Float or Cash In.`, 'error');
            return;
          }
        }
      }
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
          cash_source: ['CASH_IN', 'OPENING_FLOAT'].includes(entryType) ? (entryFormData.cash_source || 'HOME_SAFE') : undefined
        };

        await gullaApi.createGullaEntry(payload);
        showToast('Gulla cash transaction recorded successfully!', 'success');
      }

      setIsEntryModalOpen(false);
      fetchGullaData(selectedDate);
      fetchMeta();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || err.response?.data?.message || 'Failed to record Gulla entry', 'error');
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
    <div className="space-y-6 font-sans overscroll-y-contain overscroll-contain">
      
      {/* 💻 DESKTOP TOP HEADER BANNER (Shown on Desktop lg: screens) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10 max-w-7xl mx-auto">
          {/* Left: Icon & Title with Status Badge */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10 hover:scale-105 transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <Wallet className="w-7 h-7 text-white" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Today's <span className="text-[#00796b] dark:text-[#80cbc4]">Collection</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Register Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Live cash drawer balance, denomination counter & cash float audit
              </p>
            </div>
          </div>

          {/* Right Desktop Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchGullaData(selectedDate)}
              disabled={refreshing}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-teal-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenEntryModal('CASH_IN')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Cash</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenEntryModal('CASH_OUT')}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEodModalOpen(true)}
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white shadow-md shadow-teal-900/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Day-End Sweep</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE / TABLET COMPACT PASTEL MINT HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center">
        {/* SVG Decorative Bottom-Left Wave */}
        <svg
          className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto pointer-events-none text-[#C4EFE9]/70 dark:text-teal-950/40"
          viewBox="0 0 200 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 40C50 60 120 70 200 45V80H0V40Z"
            fill="currentColor"
          />
        </svg>

        {/* SVG Decorative Bottom-Right Mound Curve */}
        <svg
          className="absolute bottom-0 right-0 w-28 sm:w-40 h-auto pointer-events-none text-[#B5ECE5]/80 dark:text-teal-900/40"
          viewBox="0 0 160 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 90C40 40 100 20 160 30V90H20Z"
            fill="currentColor"
          />
        </svg>

        {/* Decorative Floating Mint Dots */}
        <div className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-[#83D9CC] opacity-60 pointer-events-none" />
        <div className="absolute bottom-4 right-20 w-2 h-2 rounded-full bg-[#83D9CC] opacity-50 pointer-events-none" />

        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            
            {/* 1. Pure White Circular Back Button with Dark Teal Arrow */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-md shadow-teal-900/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6]" />
            </button>

            {/* 2. Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Today's <span className="text-[#00695C] dark:text-[#4DB6AC]">Collection</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Live cash drawer balance & float audit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 📄 Main Content Container */}
      <div className="max-w-3xl lg:max-w-7xl mx-auto px-4 lg:px-0 mt-3 lg:mt-0 space-y-6 pb-20 lg:pb-12">

        {/* 📱 Mobile Quick Actions Bar (Mobile & Tablet) */}
        <div className="flex lg:hidden flex-wrap items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => fetchGullaData(selectedDate)}
            disabled={refreshing}
            className="flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border border-teal-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs hover:bg-slate-50 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenEntryModal('CASH_IN')}
            className="flex-1 px-3 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs hover:bg-emerald-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cash</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenEntryModal('CASH_OUT')}
            className="flex-1 px-3 py-2.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800 shadow-2xs hover:bg-rose-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEodModalOpen(true)}
            className="flex-1 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-[#00695C] text-white shadow-md shadow-teal-900/20 hover:bg-[#004D40] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Sweep</span>
          </button>
        </div>

        {/* ================= DATE FILTER CARD ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-teal-100/60 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-[#00695C] dark:text-teal-400 shrink-0" />
            <span>Gulla Register Date:</span>
            <span className="bg-[#00695C] text-white px-3 py-1 rounded-xl text-xs font-bold font-mono shadow-2xs">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedDate(getLocalDateString())}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center cursor-pointer ${
                selectedDate === getLocalDateString()
                  ? 'bg-[#00695C] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDate(getLocalDateString(d));
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center cursor-pointer ${
                selectedDate === (() => { const d = new Date(); d.setDate(d.getDate() - 1); return getLocalDateString(d); })()
                  ? 'bg-[#00695C] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Yesterday
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#00695C] focus:outline-none flex-1 sm:flex-initial"
            />
          </div>
        </div>

      {/* ================= 1. LIVE GULLA CASH CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Expected Net Cash in Gulla */}
        <div className="bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#004D40] text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl space-y-2 relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-10">
            <Wallet className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#E0F2F1]">
              Expected Net Gulla Cash
            </span>
            <span className="w-2 h-2 rounded-full bg-[#4DB6AC] animate-ping shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white truncate">
            ₹{expectedCashInGulla.toFixed(2)}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-slate-200">
            <span className="flex items-center gap-1 font-bold text-[#E0F2F1]/90">
              🏠 Home Safe Total Cash:
            </span>
            <span className="font-extrabold font-mono text-[#FBC02D]">
              ₹{homeCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 2: Today Cash Sales & Bills */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#B2DFDB] dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#607D8B] dark:text-slate-400">
              Today's Cash Bills
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-[#E0F2F1] dark:bg-emerald-950/60 text-[#00695C] shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#00695C] dark:text-[#4DB6AC] truncate">
            +₹{summary.cash_bills.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#607D8B]">
            <span>{summary.cash_bills_count} Cash Bills</span>
            <span className="font-bold text-[#263238] dark:text-slate-300">Khata: ₹{summary.khata_cash.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 3: Today Cash Outflows */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#B2DFDB] dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#607D8B] dark:text-slate-400">
              Total Cash Outflows
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#E53935] dark:text-rose-400 truncate">
            -₹{summary.total_cash_out.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#607D8B]">
            <span>Expense: ₹{summary.expense_cash.toFixed(2)}</span>
            <span className="font-bold text-[#263238] dark:text-slate-300">Supplier: ₹{summary.supplier_cash.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 4: Digital Sales (UPI & Cards) */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#B2DFDB] dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#607D8B] dark:text-slate-400">
              Digital & UPI Sales
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-[#E0F2F1] text-[#00695C] dark:text-[#4DB6AC] shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#00695C] dark:text-[#4DB6AC] truncate">
            ₹{summary.total_digital.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#607D8B]">
            <span>UPI: ₹{summary.upi_bills.toFixed(2)}</span>
            <span className="font-bold text-[#263238] dark:text-slate-300">Card: ₹{summary.card_bills.toFixed(2)}</span>
          </div>
        </div>
      </div>



      {/* ================= 2. DENOMINATION COUNTER & RECONCILIATION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left 7 Cols: Live Gulla Note & Coin Count Summary (Read-Only) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#B2DFDB] dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#E0F2F1] dark:bg-slate-800 text-[#00695C] dark:text-[#4DB6AC] shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#263238] dark:text-slate-100 font-heading">
                  Live Cash Drawer Denomination Breakdown
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
              { denom: 2, label: '₹2 Note', color: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20' },
              { denom: 1, label: 'Coins (₹)', color: 'border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20' }
            ].map(({ denom, label, color }) => {
              const denomsTable = summary.notes_and_coins_summary?.denominations_table || [];
              const found = denomsTable.find((x) => Number(x.denomination) === Number(denom));
              const netNotesDict = summary.notes_and_coins_summary?.net_drawer_notes || {};

              const rawCount = found ? found.net_count : (netNotesDict[denom] || netNotesDict[String(denom)] || 0);
              const countVal = Math.max(0, parseInt(rawCount || 0, 10));
              const subtotalVal = denom === 1 ? countVal : countVal * denom;
              const isOutOfStock = countVal <= 0;

              return (
                <div
                  key={denom}
                  className={`p-3 rounded-2xl border transition-all ${
                    isOutOfStock
                      ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/40 dark:bg-rose-950/20'
                      : color
                  } flex items-center justify-between gap-2 shadow-2xs`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-black block truncate text-[#384959] dark:text-slate-100">
                      {label}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded-md inline-block">
                        ⚠️ Out of Stock (Add Cash)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono font-bold block truncate">
                        {denom === 1 ? 'Coins Value' : `₹${denom} × ${countVal} notes`}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs font-black font-mono ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-[#263238] dark:text-slate-100'}`}>
                      {countVal} {denom === 1 ? '₹' : 'Notes'}
                    </div>
                    <div className={`text-[11px] font-black font-mono ${isOutOfStock ? 'text-rose-500 dark:text-rose-400' : 'text-[#00695C] dark:text-[#4DB6AC]'}`}>
                      ₹{subtotalVal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Summary Banner: Total Physical Notes & Total Expected Cash */}
          <div className="p-3.5 bg-gradient-to-r from-[#E0F2F1] via-[#E0F2F1]/70 to-[#E0F2F1] dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border border-[#B2DFDB] dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-[#00695C] dark:text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[#607D8B] font-medium">Total Cash Notes in Drawer:</span>
              <span className="font-mono text-xs font-black bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-[#B2DFDB] dark:border-slate-700">
                {(summary.notes_and_coins_summary?.denominations_table || [])
                  .filter((x) => x.denomination > 1)
                  .reduce((acc, x) => acc + Math.max(0, x.net_count || 0), 0)}{' '}
                Notes
              </span>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-[#607D8B] font-medium">Net Gulla Cash:</span>
              <span className="font-mono text-base font-black text-[#00695C] dark:text-[#4DB6AC]">
                ₹{expectedCashInGulla.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Reconciliation Audit & Action Box */}
        <div className="lg:col-span-5 space-y-4">
          {/* Audit Comparison & Today Money Counts Card */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#B2DFDB] dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00695C] dark:text-[#4DB6AC] shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#263238] dark:text-slate-100 font-heading">
                  Gulla Audit & Reconciliation
                </h2>
              </div>
              <Badge variant="primary" className="bg-[#00695C] text-white text-[10px] font-mono shrink-0">
                TODAY SUMMARY
              </Badge>
            </div>

            <div className="space-y-2.5">
              {/* 1. Net Gulla Cash (Primary Highlight) */}
              <div className="p-3 bg-gradient-to-r from-[#004D40] via-[#00695C] to-[#004D40] text-white rounded-2xl flex items-center justify-between shadow-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#E0F2F1]">
                    Net Gulla Cash Balance
                  </span>
                  <p className="text-[10px] text-[#E0F2F1]/90">Available drawer cash right now</p>
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
                    Added Cash / Float:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{(summary.opening_float + summary.cash_in_manual).toFixed(2)}
                  </span>
                </div>

                {/* 4. Today POS Cash Sale Bills */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    POS Cash Sales:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +₹{summary.cash_bills.toFixed(2)} ({summary.cash_bills_count} Bills)
                  </span>
                </div>

                {/* 5. Khata Customer Cash */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#009688] shrink-0" />
                    Khata Customer Receipts:
                  </span>
                  <span className="font-mono font-bold text-[#009688] dark:text-[#4DB6AC]">
                    +₹{summary.khata_cash.toFixed(2)}
                  </span>
                </div>

                {/* 6. Cash Withdrawal */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Minus className="w-3.5 h-3.5 text-[#E53935] shrink-0" />
                    Cash Withdrawals:
                  </span>
                  <span className="font-mono font-bold text-[#E53935] dark:text-rose-400">
                    -₹{summary.cash_out_manual.toFixed(2)}
                  </span>
                </div>

                {/* 7. Supplier Cash Payments */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Supplier Payments:
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    -₹{summary.supplier_cash.toFixed(2)}
                  </span>
                </div>

                {/* 8. Store Cash Expenses */}
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Store Expenses:
                  </span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    -₹{summary.expense_cash.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 9. Today Total Inflow & Outflow Totals */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-[#E0F2F1] dark:bg-emerald-950/40 rounded-xl border border-[#B2DFDB] dark:border-emerald-800/60">
                  <span className="text-[10px] font-black text-[#00695C] dark:text-[#4DB6AC] uppercase block">
                    Total Cash Inflow
                  </span>
                  <span className="font-mono font-black text-sm text-[#00695C] dark:text-[#4DB6AC]">
                    +₹{summary.total_cash_in.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200/60 dark:border-rose-800/60">
                  <span className="text-[10px] font-black text-[#E53935] dark:text-rose-300 uppercase block">
                    Total Cash Outflow
                  </span>
                  <span className="font-mono font-black text-sm text-[#E53935] dark:text-rose-400">
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
                  className="w-full text-xs font-bold flex items-center justify-center gap-1 border-[#B2DFDB] dark:border-slate-700"
                >
                  <Truck className="w-3.5 h-3.5 text-[#00695C]" />
                  Supplier Pay
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleOpenEntryModal('EXPENSE')}
                  className="w-full text-xs font-bold flex items-center justify-center gap-1 border-[#B2DFDB] dark:border-slate-700"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#00695C]" />
                  Store Expense
                </Button>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenEntryModal('KHATA_PAYMENT')}
                className="w-full bg-[#00695C] hover:bg-[#004D40] text-white text-xs font-bold flex items-center justify-center gap-2 py-2.5 rounded-xl shadow-sm cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-[#4DB6AC]" />
                Khata Customer Payment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. TRANSACTION LEDGER & AUDIT TRAIL ================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E0F2F1] dark:bg-slate-800 text-[#00695C] dark:text-[#4DB6AC] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#263238] dark:text-slate-100 font-heading">
                Gulla Cash Transaction Ledger
              </h2>
              <p className="text-[10px] text-slate-400">
                Complete real-time record of all drawer cash inflows, payouts, and POS sales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 max-w-full">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[10px] sm:text-[11px] font-bold shrink-0 border border-slate-200/50 dark:border-slate-700/50">
              {['ALL', 'BILL_SALE', 'KHATA_PAYMENT', 'OPENING_FLOAT', 'CASH_IN', 'CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setLedgerFilter(type)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    ledgerFilter === type
                      ? 'bg-[#00695C] text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {type === 'BILL_SALE' ? 'POS Bills' : type === 'KHATA_PAYMENT' ? 'Khata Cash' : type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Entries Responsive Container: Mobile Cards (< md) & Desktop Table (>= md) */}
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No Gulla Entries Found"
            description="Manual cash entries and payouts will appear here in real-time."
          />
        ) : (
          <>
            {/* 1. Mobile View Cards (< md screens) */}
            <div className="block md:hidden space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredEntries.map((e) => {
                const isPositive = ['OPENING_FLOAT', 'CASH_IN', 'BILL_SALE', 'BILL_SALE_DIGITAL', 'KHATA_PAYMENT'].includes(e.entry_type);

                const getBadgeColor = (type) => {
                  switch (type) {
                    case 'BILL_SALE':
                      return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
                    case 'BILL_SALE_DIGITAL':
                      return 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
                    case 'KHATA_PAYMENT':
                      return 'bg-teal-50 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] border-teal-200 dark:border-teal-800/60';
                    case 'SUPPLIER_PAYMENT':
                      return 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
                    case 'EXPENSE':
                      return 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
                    case 'OPENING_FLOAT':
                      return 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
                    case 'CASH_IN':
                      return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
                    case 'CASH_OUT':
                      return 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
                    default:
                      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                  }
                };

                return (
                  <div key={e.id} className="p-3.5 sm:p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-2xs hover:shadow-xs transition-all">
                    {/* Top Row: Type Badge + Amount */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${getBadgeColor(e.entry_type)}`}>
                        {e.entry_type_label || e.entry_type.replace(/_/g, ' ')}
                      </span>
                      <span className={`font-black text-sm sm:text-base tracking-tight ${isPositive ? 'text-[#00796b] dark:text-[#80cbc4]' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isPositive ? `+₹${parseFloat(e.amount).toFixed(2)}` : `-₹${parseFloat(e.amount).toFixed(2)}`}
                      </span>
                    </div>

                    {/* Transaction Notes / Title */}
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {e.notes || 'Routine Gulla cash transaction'}
                    </div>

                    {/* Metadata Row: Date, Clock, Reference ID, User */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/80 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-300">
                          {new Date(e.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{new Date(e.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        {e.reference_id && (
                          <span className="bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border border-slate-200/60 dark:border-slate-600/60">
                            {e.reference_id}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 truncate">• {e.user_name || 'Staff'}</span>
                    </div>

                    {/* Tendered & Change Summary Pill Badges */}
                    {(e.tendered_summary || e.change_summary) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {e.tendered_summary && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-700/60 text-xs font-semibold shadow-2xs">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            {e.tendered_summary}
                          </span>
                        )}
                        {e.change_summary && (
                          <span className="inline-flex items-center gap-1.5 bg-rose-50/90 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-700/60 text-xs font-semibold shadow-2xs">
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                            {e.change_summary}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop & Tablet View Table (>= md screens) */}
            <div className="hidden md:block max-h-[480px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950/60 shadow-xs">
              <table className="w-full text-left text-xs min-w-[750px]">
                <thead className="sticky top-0 z-10 bg-[#E0F2F1] dark:bg-slate-800 text-[#00695C] dark:text-slate-200 uppercase tracking-wider font-extrabold border-b border-[#B2DFDB] dark:border-slate-700 shadow-xs">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">Date & Time</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Entry Type</th>
                    <th className="py-3.5 px-4">Transaction Details & Ref</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Received Notes</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Change Returned</th>
                    <th className="py-3.5 px-6 text-right whitespace-nowrap min-w-[130px]">Cash Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEntries.map((e) => {
                    const isPositive = ['OPENING_FLOAT', 'CASH_IN', 'BILL_SALE', 'BILL_SALE_DIGITAL', 'KHATA_PAYMENT'].includes(e.entry_type);

                    const getBadgeColor = (type) => {
                      switch (type) {
                        case 'BILL_SALE':
                          return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60';
                        case 'BILL_SALE_DIGITAL':
                          return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60';
                        case 'KHATA_PAYMENT':
                          return 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700/60';
                        case 'SUPPLIER_PAYMENT':
                          return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60';
                        case 'EXPENSE':
                          return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/60';
                        case 'OPENING_FLOAT':
                          return 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/60';
                        case 'CASH_IN':
                          return 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/60';
                        case 'CASH_OUT':
                          return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60';
                        default:
                          return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                      }
                    };

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* 1. Date & Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#263238] dark:text-slate-200">
                              {new Date(e.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* 2. Entry Type Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${getBadgeColor(e.entry_type)}`}>
                            {e.entry_type_label || e.entry_type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* 3. Transaction Details / Notes */}
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <div className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                            {e.notes || 'Routine Gulla cash transaction'}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 flex-wrap">
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300 whitespace-nowrap inline-block border border-slate-200/50 dark:border-slate-700/50">
                              {e.reference_id || e.id}
                            </span>
                            <span className="whitespace-nowrap">• {e.user_name || 'Staff'}</span>
                          </div>
                        </td>

                        {/* 4. Received Notes Count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {e.tendered_summary ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700/60 font-mono text-[11px] font-bold">
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              {e.tendered_summary}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs font-mono">-</span>
                          )}
                        </td>

                        {/* 5. Change / Outflow Notes Count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {e.change_summary ? (
                            <span className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-700/60 font-mono text-[11px] font-bold">
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                              {e.change_summary}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs font-mono">-</span>
                          )}
                        </td>

                        {/* 6. Cash Amount */}
                        <td className={`py-3.5 px-6 text-right font-mono font-black text-sm whitespace-nowrap ${
                          isPositive ? 'text-[#00695C] dark:text-[#4DB6AC]' : 'text-[#E53935] dark:text-rose-400'
                        }`}>
                          {isPositive ? `+₹${parseFloat(e.amount).toFixed(2)}` : `-₹${parseFloat(e.amount).toFixed(2)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      </div>

      {/* ================= MODAL 1: ADD CASH / WITHDRAWAL / PAYOUT ================= */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title={entryType === 'CASH_IN' ? 'Add Cash to Gulla' : entryType === 'CASH_OUT' ? 'Cash Withdrawal' : entryType === 'KHATA_PAYMENT' ? 'Khata Customer Cash Payment' : entryType === 'OPENING_FLOAT' ? 'Add Opening Cash / Float' : `Record ${entryType.replace('_', ' ')}`}
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
              className="bg-[#00695C] hover:bg-[#004D40] text-white font-bold"
            >
              Submit Entry
            </Button>
          </div>
        }
      >
        <form onSubmit={handleEntrySubmit} className="space-y-4 text-xs">
          {/* Cash Source Selector when Adding Cash */}
          {['CASH_IN', 'OPENING_FLOAT'].includes(entryType) && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Select Source of Money to Add Cash *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryFormData({ ...entryFormData, cash_source: 'HOME_SAFE' })}
                  className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    (entryFormData.cash_source || 'HOME_SAFE') === 'HOME_SAFE'
                      ? 'bg-[#00695C] text-white border-[#004D40] shadow-sm font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-bold">Home Safe Vault</span>
                  </div>
                  <span className={`text-[10px] font-mono mt-1 ${
                    (entryFormData.cash_source || 'HOME_SAFE') === 'HOME_SAFE' ? 'text-emerald-200' : 'text-slate-400'
                  }`}>
                    Avail: ₹{homeCashAmount.toFixed(2)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryFormData({ ...entryFormData, cash_source: 'BANK' })}
                  className={`p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    entryFormData.cash_source === 'BANK'
                      ? 'bg-[#00695C] text-white border-[#004D40] shadow-sm font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-bold">Bank Account</span>
                  </div>
                  <span className={`text-[10px] font-mono mt-1 ${
                    entryFormData.cash_source === 'BANK' ? 'text-emerald-200' : 'text-slate-400'
                  }`}>
                    Avail: ₹{bankBalance.toFixed(2)}
                  </span>
                </button>
              </div>

              {/* Live balance warning message */}
              {(() => {
                const amt = parseFloat(entryFormData.amount || 0);
                const src = entryFormData.cash_source || 'HOME_SAFE';
                if (amt > 0) {
                  if (src === 'HOME_SAFE' && amt > homeCashAmount) {
                    return (
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/80 rounded-xl border border-rose-200 dark:border-rose-800 text-[10px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>⚠️ Insufficient Home Safe Vault Balance! (Available: ₹{homeCashAmount.toFixed(2)}, Short by ₹{(amt - homeCashAmount).toFixed(2)})</span>
                      </div>
                    );
                  }
                  if (src === 'BANK' && amt > bankBalance) {
                    return (
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/80 rounded-xl border border-rose-200 dark:border-rose-800 text-[10px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>⚠️ Insufficient Bank Account Balance! (Available: ₹{bankBalance.toFixed(2)}, Short by ₹{(amt - bankBalance).toFixed(2)})</span>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
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
                className="w-full pl-8 pr-3 py-2 text-base font-black font-mono bg-[#F0FAF9] dark:bg-slate-800 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688]"
              />
            </div>
          </div>

          {/* Interactive Note Denomination Counter */}
          <div className="p-3 bg-[#F0FAF9] dark:bg-slate-800/70 rounded-2xl border border-[#B2DFDB] dark:border-slate-700 space-y-2">
            {['CASH_IN', 'OPENING_FLOAT'].includes(entryType) && (entryFormData.cash_source || 'HOME_SAFE') === 'HOME_SAFE' && (
              <div className="p-2 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
                    ⚡ Fill Available Home Safe Vault Notes:
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      const filled = {};
                      [500, 200, 100, 50, 20, 10, 5, 2, 1].forEach(d => {
                        const cnt = Math.max(0, parseInt(homeVaultNotes[d] || homeVaultNotes[String(d)] || 0, 10));
                        filled[d] = cnt > 0 ? String(cnt) : '';
                      });
                      setModalNoteCounts(filled);
                      try {
                        const res = await gullaApi.calculateNotes({ denomination_counts: filled });
                        setEntryFormData(prev => ({
                          ...prev,
                          amount: res.data?.total_amount > 0 ? String(res.data.total_amount) : prev.amount,
                          notes: res.data?.notes_summary || prev.notes
                        }));
                      } catch (err) {
                        console.error('Failed to calculate notes', err);
                      }
                      showToast('Auto-filled available note counts from Home Safe Vault!', 'info');
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-[10px] font-black border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                  >
                    ✨ Fill All Available Vault Notes
                  </button>
                </div>
              </div>
            )}

            {entryType === 'CASH_OUT' && (
              <div className="p-2.5 bg-[#E0F2F1] dark:bg-slate-800/90 rounded-xl border border-[#B2DFDB] dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-[#00695C] dark:text-[#4DB6AC] font-black text-xs">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>How many notes do you want to withdraw to Home Safe Vault?</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-snug">
                  Enter count of notes (500, 200, 100, 50, 20, 10, 5, 2, 1) to transfer from Gulla drawer to Home Safe:
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectNote('HIGH_NOTES')}
                    className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-black border border-amber-300 dark:border-amber-800 cursor-pointer"
                  >
                    ✨ 11:30 PM Rule (500, 200, 100, 50)
                  </button>
                  {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleQuickSelectNote(d)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      All {d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickSelectNote('CLEAR')}
                    className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-800 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#00695C] dark:text-[#4DB6AC] flex items-center gap-1.5 font-heading">
                <Calculator className="w-3.5 h-3.5 text-[#009688]" />
                Note Counter System
              </span>
              <button
                type="button"
                onClick={() => setModalNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' })}
                className="text-[10px] font-bold text-[#607D8B] hover:text-[#00695C] underline cursor-pointer"
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
                { denom: 2, label: '₹2 Note' },
                { denom: 1, label: 'Coins (₹)' }
              ].map(({ denom, label }) => {
                const cnt = modalNoteCounts[denom] || '';
                const sub = (denom === 1 ? parseFloat(cnt) || 0 : (parseInt(cnt, 10) || 0) * denom);

                let availNoteCount = null;
                if (['CASH_IN', 'OPENING_FLOAT'].includes(entryType) && (entryFormData.cash_source || 'HOME_SAFE') === 'HOME_SAFE') {
                  availNoteCount = Math.max(0, parseInt(homeVaultNotes[denom] || homeVaultNotes[String(denom)] || 0, 10));
                } else if (['CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE'].includes(entryType)) {
                  const netNotesDict = summary.notes_and_coins_summary?.net_drawer_notes || {};
                  availNoteCount = Math.max(0, parseInt(netNotesDict[denom] || netNotesDict[String(denom)] || 0, 10));
                }

                const isUnavailable = availNoteCount !== null && availNoteCount <= 0;

                return (
                  <div key={denom} className={`flex items-center justify-between gap-1 p-1.5 rounded-xl border text-[11px] transition-all ${
                    isUnavailable ? 'bg-slate-100/90 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700/80 opacity-75' : 'bg-white dark:bg-slate-900 border-[#B2DFDB] dark:border-slate-800'
                  }`}>
                    <div className="space-y-0.5 min-w-0">
                      <span className={`font-bold font-mono block truncate ${isUnavailable ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>{label}:</span>
                      {availNoteCount !== null ? (
                        <span className={`text-[9px] block truncate font-mono ${isUnavailable ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-bold'}`}>
                          {isUnavailable ? '⚠️ 0 in stock (Disabled)' : `Avail: ${availNoteCount} ${denom === 1 ? '₹' : 'notes'}`}
                        </span>
                      ) : (
                        <span className="text-[9px] block truncate font-mono text-slate-400">
                          Count (500,200...)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        disabled={isUnavailable}
                        value={isUnavailable ? '' : cnt}
                        onChange={(e) => handleModalNoteChange(denom, e.target.value)}
                        title={isUnavailable ? `₹${denom} note is unavailable (0 stock)` : `Enter count for ₹${denom}`}
                        className={`w-12 px-1 py-0.5 text-center font-black font-mono border rounded-lg text-xs transition-all ${
                          isUnavailable
                            ? 'bg-slate-200/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                            : 'bg-[#F0FAF9] dark:bg-slate-800 border-[#B2DFDB] dark:border-slate-700 text-slate-800 dark:text-slate-100'
                        }`}
                      />
                      <span className="w-10 text-right font-mono font-bold text-[10px] text-[#00695C] dark:text-[#4DB6AC]">
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
              <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
                Select Khata Customer
              </label>
              <select
                value={entryFormData.customer_id || ''}
                onChange={(e) => setEntryFormData({ ...entryFormData, customer_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688]"
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
              <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={entryFormData.supplier_id}
                onChange={(e) => setEntryFormData({ ...entryFormData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688]"
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
                <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={entryFormData.title}
                  onChange={(e) => setEntryFormData({ ...entryFormData, title: e.target.value })}
                  placeholder="e.g. Tea & Snacks / Delivery Charges / Freight"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Expense Category
                </label>
                <select
                  value={entryFormData.category_id}
                  onChange={(e) => setEntryFormData({ ...entryFormData, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688]"
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
                  <div className="p-2.5 bg-[#E0F2F1]/80 dark:bg-slate-800/80 rounded-xl border border-[#B2DFDB] dark:border-slate-700 space-y-2 text-xs">
                    <span className="font-extrabold text-[#00695C] dark:text-[#4DB6AC] flex items-center gap-1.5 text-[11px] font-heading">
                      <Truck className="w-3.5 h-3.5 text-[#009688]" />
                      Link Delivery & Transport to Order / PO
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#607D8B] dark:text-slate-400 mb-0.5">Link Customer Order</label>
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
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-lg text-[11px]"
                        >
                          <option value="">-- Choose Order --</option>
                          {orders.map(o => (
                            <option key={o.id} value={o.id}>#{o.order_number} - {o.customer_name || 'Walk-in'} (₹{parseFloat(o.total_amount).toFixed(2)})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#607D8B] dark:text-slate-400 mb-0.5">Link Supplier Vendor</label>
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
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-lg text-[11px]"
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
            <label className="block font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={entryFormData.notes}
              onChange={(e) => setEntryFormData({ ...entryFormData, notes: e.target.value })}
              placeholder="e.g. Shift start float / Owner withdrawal"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688]"
            />
          </div>
        </form>
      </Modal>

      {/* ================= MODAL 2: DAY-END HOME CASH SWEEP MODAL (EMBEDS HOME SAFE VAULT & 11:30 PM AUTO-WITHDRAW) ================= */}
      <Modal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
        title="Day-End Cash Sweep & Home Safe Vault"
        subtitle={`Current Home Vault Balance: ₹${homeCashAmount.toFixed(2)} • 11:30 PM Auto-Withdraw Rule`}
        maxWidth="max-w-2xl w-full"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setIsEodModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          {/* 1. Home Safe Cash Vault Quick Summary Card (Billing Page Style) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 p-2 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-[#384959] dark:text-slate-100">
                      Home Safe Cash Vault
                    </h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${auto1130SweepEnabled ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'}`}>
                      <Clock className={`w-2.5 h-2.5 ${auto1130SweepEnabled ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
                      {auto1130SweepEnabled ? '11:30 PM Auto-Withdraw ON' : '11:30 PM Auto-Withdraw OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Daily automatic & manual cash vault transfer system
                  </p>
                </div>
              </div>

              {/* Current Vault Balance & History */}
              <div className="flex items-center justify-between sm:justify-end gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shrink-0 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Vault Balance
                  </span>
                  <span className="text-base sm:text-lg font-black font-heading text-emerald-600 dark:text-emerald-400">
                    ₹{homeCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEodModalOpen(false);
                    fetchHomeVaultHistory();
                  }}
                  loading={homeVaultLoading}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#384959] dark:text-slate-200 border-slate-300 dark:border-slate-600 text-xs font-bold px-2.5 py-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>History</span>
                </Button>
              </div>
            </div>

            {/* 11:30 PM Auto-Withdraw Rule Feature Banner */}
            <div className="p-3.5 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl shrink-0 ${auto1130SweepEnabled ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#384959] dark:text-[#88BDF2] text-xs sm:text-sm tracking-tight block">
                        ⏰ 11:30 PM Automatic Money Withdraw System:
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase border ${auto1130SweepEnabled ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
                        {auto1130SweepEnabled ? '🟢 ON (ACTIVE)' : '🔴 OFF (PAUSED)'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
                      If Admin does not manually withdraw all money from today's collection by <strong>11:30 PM</strong>, 
                      the system automatically sweeps remaining cash in notes of <strong>₹500, ₹200, ₹100, and ₹50</strong> into Home Safe Vault. 
                      Coins & small change stay in register float.
                    </p>
                  </div>
                </div>

                {/* Interactive Auto Toggle Switch (ON / OFF) */}
                <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 justify-between sm:justify-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Auto Withdraw:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleAutoSweep()}
                    disabled={togglingAutoSweep}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${auto1130SweepEnabled ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                    title={auto1130SweepEnabled ? 'Click to TURN OFF 11:30 PM Auto-Withdraw' : 'Click to TURN ON 11:30 PM Auto-Withdraw'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${auto1130SweepEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                  <span className={`text-xs font-black min-w-[28px] ${auto1130SweepEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {auto1130SweepEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL 3: HOME SAFE CASH VAULT AUDIT TRAIL MODAL (READ-ONLY LOGS) ================= */}
      <Modal
        isOpen={isHomeVaultModalOpen}
        onClose={() => setIsHomeVaultModalOpen(false)}
        title="Home Safe Cash Vault Audit Trail"
        subtitle={`Total Home Vault Balance: ₹${homeCashAmount.toFixed(2)}`}
        maxWidth="max-w-2xl w-full"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setIsHomeVaultModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Top Balance Summary Strip (Billing Page Style) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Home Vault Balance
                </span>
                <span className="text-base sm:text-lg font-black font-heading text-emerald-600 dark:text-emerald-400">
                  ₹{homeCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700">
              Vault Audit Active
            </span>
          </div>

          {/* Live Physical Notes Breakdown Grid (Billing Page Style) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#384959] dark:text-[#88BDF2] flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Live Physical Notes Breakdown in Home Safe:
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Real-Time Vault Inventory
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 pt-0.5">
              {[500, 200, 100, 50, 20, 10, 5, 2, 1].map(d => {
                const cnt = homeVaultNotes[d] || homeVaultNotes[String(d)] || 0;
                const hasNotes = cnt > 0;
                return (
                  <div key={d} className={`p-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${hasNotes ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'}`}>
                    <span className="text-[10px] font-bold block leading-none">₹{d}</span>
                    <span className="text-xs font-mono font-extrabold mt-1">{cnt}</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-0.5">₹{(cnt * d).toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit History List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block pt-1">
              📜 Vault Transaction History & Logs ({homeVaultHistory.length} Entries):
            </span>

            {homeVaultHistory.length === 0 ? (
              <EmptyState
                icon={Lock}
                title="No Vault Transactions Found"
                description="Home Safe cash deposits, withdrawals, and 11:30 PM auto-sweeps will appear here."
              />
            ) : (
              homeVaultHistory.map((tx) => {
                const isDeposit = tx.entry_type === 'DEPOSIT' || tx.entry_type === 'SWEEP';
                return (
                  <div
                    key={tx.id}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                          tx.entry_type === 'SWEEP' 
                            ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                            : isDeposit
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                        }`}>
                          {tx.entry_type_display || tx.entry_type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          {tx.created_at}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {tx.notes || 'Home Safe Vault Transaction'}
                      </p>
                      {tx.notes_summary && tx.notes_summary !== '-' && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          Denominations: {tx.notes_summary}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        • Performed by {tx.created_by_name || 'Admin'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-sm sm:text-base font-black font-mono ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isDeposit ? `+₹${parseFloat(tx.amount).toFixed(2)}` : `-₹${parseFloat(tx.amount).toFixed(2)}`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-bold">
                        Balance After: ₹{parseFloat(tx.balance_after).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default GullaManagement;
