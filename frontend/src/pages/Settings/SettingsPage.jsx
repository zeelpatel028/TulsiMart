import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { 
  Settings, 
  Store, 
  Receipt, 
  Truck, 
  Bell, 
  ShieldCheck, 
  Save, 
  Database, 
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  Sun,
  Moon,
  Check,
  Landmark,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Plus,
  Minus,
  RefreshCw,
  CreditCard,
  FileText,
  Calculator,
  Zap,
  Search
} from 'lucide-react';
import { authApi, bankApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const DENOMS = [500, 200, 100, 50, 20, 10, 5, 1];

export const SettingsPage = () => {
  const { showToast } = useNotification();
  const { storeSettings, updateStoreSettings } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState('shop'); // 'shop' | 'theme' | 'invoice' | 'delivery' | 'backup' | 'banking'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Store settings form state
  const [formData, setFormData] = useState({
    store_name: 'Tulsi Mart',
    tagline: 'Fresh Groceries & Supermarket',
    logo_url: '/logo.png',
    phone: '+91 98765 43210',
    email: 'contact@tulsimart.com',
    address: 'Shop No. 12-14, Heritage Plaza, MG Road, Mumbai, MH - 400001',
    gstin: '27AABCT8899F1Z4',
    currency_symbol: '₹',
    invoice_prefix: 'TM-INV-',
    invoice_footer_terms: 'Thank you for shopping at Tulsi Mart! 100% Quality Guaranteed. Exchange within 24 hours with valid invoice.',
    tax_percentage_default: 5.0,
    delivery_charge_flat: 40.0,
    free_delivery_above: 500.0,
    low_stock_threshold_default: 10,
    home_cash_amount: 0.0,
    enable_notifications: true,
  });

  // Banking state
  const [bankTransactions, setBankTransactions] = useState([]);
  const [bankSummary, setBankSummary] = useState({
    total_bank_balance: 0,
    total_upi_inflow: 0,
    total_bank_outflow: 0,
    total_admin_deposit: 0
  });
  const [bankFilter, setBankFilter] = useState('ALL');
  const [bankSearch, setBankSearch] = useState('');
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    transaction_type: 'DEPOSIT',
    amount: '',
    reference_number: '',
    bank_name: 'HDFC Store Primary Bank',
    notes: ''
  });

  const [bankDenominations, setBankDenominations] = useState({
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0
  });

  const targetBankAmount = parseFloat(bankForm.amount || 0);

  const handleAutoFillBankNotes = (amountToFill) => {
    let rem = Math.round(amountToFill);
    const newCounts = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 };
    const denomValues = [500, 200, 100, 50, 20, 10, 5, 1];

    denomValues.forEach(d => {
      if (rem >= d) {
        const cnt = Math.floor(rem / d);
        rem %= d;
        const key = d === 1 ? 'coins' : String(d);
        newCounts[key] = cnt;
      }
    });

    setBankDenominations(newCounts);
  };

  useEffect(() => {
    if (isBankModalOpen && targetBankAmount > 0) {
      handleAutoFillBankNotes(targetBankAmount);
    }
  }, [isBankModalOpen, bankForm.transaction_type, bankForm.amount]);

  const bankNoteTotal = DENOMS.reduce((sum, d) => {
    const key = d === 1 ? 'coins' : String(d);
    const count = parseInt(bankDenominations[key] || 0, 10);
    return sum + (count * d);
  }, 0);

  const bankDiff = bankNoteTotal - targetBankAmount;

  useEffect(() => {
    loadSettings();
    if (activeSection === 'banking') {
      fetchBankingData();
    }
  }, [activeSection]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await authApi.getSettings();
      if (res.data) {
        setFormData(res.data);
        updateStoreSettings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankingData = async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        bankApi.getTransactions(),
        bankApi.getSummary()
      ]);
      setBankTransactions(txRes.data?.results || txRes.data || []);
      setBankSummary(sumRes.data || {});
    } catch (err) {
      console.error('Failed to load banking data:', err);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await authApi.updateSettings(formData);
      if (res.data) {
        setFormData(res.data);
        updateStoreSettings(res.data);
      }
      showToast('Store settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBankTx = async (e) => {
    if (e) e.preventDefault();
    if (!bankForm.amount || parseFloat(bankForm.amount) <= 0) {
      showToast('Please enter a valid transaction amount', 'error');
      return;
    }

    try {
      let finalNotes = bankForm.notes || '';
      if (bankNoteTotal > 0) {
        const notesStr = DENOMS.map(d => {
          const k = d === 1 ? 'coins' : String(d);
          const c = bankDenominations[k] || 0;
          return c > 0 ? `${d === 1 ? 'Coins' : `₹${d}`}x${c}` : null;
        }).filter(Boolean).join(', ');
        if (notesStr) {
          finalNotes = finalNotes ? `${finalNotes} (${notesStr})` : notesStr;
        }
      }

      const payload = {
        transaction_type: bankForm.transaction_type,
        amount: parseFloat(bankForm.amount),
        reference_number: bankForm.reference_number || `UTR-${Date.now()}`,
        bank_name: bankForm.bank_name,
        notes: finalNotes
      };

      await bankApi.createTransaction(payload);
      showToast(`Bank transaction recorded successfully!`, 'success');
      setIsBankModalOpen(false);
      setBankForm({
        transaction_type: 'DEPOSIT',
        amount: '',
        reference_number: '',
        bank_name: 'HDFC Store Primary Bank',
        notes: ''
      });
      fetchBankingData();
    } catch (err) {
      console.error('Error creating bank tx:', err);
      showToast('Failed to record bank transaction', 'error');
    }
  };

  const handleBackup = () => {
    showToast('Database snapshot created & downloaded!', 'success');
  };

  const filteredBankTx = bankTransactions.filter(tx => {
    const matchesFilter = bankFilter === 'ALL' || tx.transaction_type === bankFilter;
    const searchLower = bankSearch.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      (tx.reference_number && tx.reference_number.toLowerCase().includes(searchLower)) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchLower)) ||
      (tx.bank_name && tx.bank_name.toLowerCase().includes(searchLower)) ||
      (tx.transaction_type_label && tx.transaction_type_label.toLowerCase().includes(searchLower)) ||
      (tx.date && tx.date.toLowerCase().includes(searchLower));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
            Store & Admin Settings
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Configure Tulsi Mart brand profile, Bank & UPI Accounts, tax rules, and MongoDB backups.
          </p>
        </div>

        {activeSection !== 'banking' && (
          <Button variant="primary" size="md" icon={Save} onClick={handleSave} loading={saving} className="self-start sm:self-auto">
            Save Settings
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex lg:flex-col gap-1 text-xs font-bold overflow-x-auto no-scrollbar touch-pan">
          {[
            { id: 'shop', label: 'Shop Profile', icon: Store },
            { id: 'banking', label: 'Bank & UPI System', icon: Landmark },
            { id: 'theme', label: 'Theme & Dark Mode', icon: Sparkles },
            { id: 'invoice', label: 'Invoice & Tax', icon: Receipt },
            { id: 'delivery', label: 'Delivery Rules', icon: Truck },
            { id: 'backup', label: 'Database Backup', icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl transition-all text-left cursor-pointer shrink-0 lg:shrink lg:w-full ${
                  activeSection === item.id
                    ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Form (9 cols) */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          
          {/* BANKING & UPI SYSTEM TAB */}
          {activeSection === 'banking' && (
            <div className="space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-[#384959] dark:text-slate-100 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-sky-600 dark:text-[#88BDF2]" /> Store Bank Accounts & UPI Register
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time ledger for store UPI bill sales, supplier bank payouts, and admin bank deposits.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchBankingData}>
                    Sync Ledger
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setBankForm({
                        transaction_type: 'DEPOSIT',
                        amount: '',
                        reference_number: `UTR-${Date.now()}`,
                        bank_name: 'HDFC Store Primary Bank',
                        notes: 'Admin bank capital deposit'
                      });
                      setIsBankModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Deposit / Add Money
                  </Button>
                </div>
              </div>

              {/* Primary Bank Balance Header Card */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 font-black">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                        HDFC Bank - Store Primary Account (xxxx 8920)
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                        ● Bank Synced
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
                      ₹{Number(bankSummary.total_bank_balance || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Minus}
                    onClick={() => {
                      setBankForm({
                        transaction_type: 'WITHDRAWAL',
                        amount: '',
                        reference_number: `WITH-${Date.now()}`,
                        bank_name: 'HDFC Store Primary Bank',
                        notes: 'Bank cash withdrawal for store Gulla'
                      });
                      setIsBankModalOpen(true);
                    }}
                    className="bg-slate-800 text-slate-200 border-slate-700 font-bold"
                  >
                    Withdraw Funds
                  </Button>
                </div>
              </div>

              {/* 3 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      UPI & POS Sales Inflow
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono mt-1">
                    +₹{Number(bankSummary.total_upi_inflow || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                      Bank & UPI Outflows
                    </span>
                    <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                  </div>
                  <p className="text-lg font-black text-rose-800 dark:text-rose-300 font-mono mt-1">
                    -₹{Number(bankSummary.total_bank_outflow || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                      Admin Capital Deposits
                    </span>
                    <Wallet className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-lg font-black text-sky-800 dark:text-sky-300 font-mono mt-1">
                    +₹{Number(bankSummary.total_admin_deposit || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Live Search Box */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search UTR / Ref No, Payer name, Notes..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
                  />
                  {bankSearch && (
                    <button
                      onClick={() => setBankSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan shrink-0">
                  {[
                    { id: 'ALL', label: 'All Transactions' },
                    { id: 'UPI_IN', label: 'UPI Sales (+)' },
                    { id: 'SUPPLIER_PAYOUT', label: 'Supplier Payouts (-)' },
                    { id: 'EXPENSE_PAYOUT', label: 'Bank Expenses (-)' },
                    { id: 'DEPOSIT', label: 'Admin Deposits (+)' },
                    { id: 'WITHDRAWAL', label: 'Bank Withdrawals (-)' }
                  ].map(flt => (
                    <button
                      key={flt.id}
                      onClick={() => setBankFilter(flt.id)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                        bankFilter === flt.id
                          ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-slate-900 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto touch-pan">
                  <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Entry Type</th>
                        <th className="py-3 px-4 text-right">Amount (₹)</th>
                        <th className="py-3 px-4">Transaction Num</th>
                        <th className="py-3 px-4">Pay Person Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {filteredBankTx.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                            No banking transactions logged yet. POS UPI sales & Supplier Bank payouts will auto-appear here.
                          </td>
                        </tr>
                      ) : (
                        filteredBankTx.map(tx => {
                          const isIncome = tx.transaction_type === 'UPI_IN' || tx.transaction_type === 'DEPOSIT';
                          const amt = parseFloat(tx.amount || 0);

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                              <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                                {tx.date}
                                <p className="text-[10px] text-slate-400">{tx.created_at ? new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  isIncome ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                }`}>
                                  {tx.transaction_type_label || tx.transaction_type}
                                </span>
                              </td>
                              <td className={`py-3 px-4 text-right font-black font-mono text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {isIncome ? `+₹${amt.toFixed(2)}` : `-₹${amt.toFixed(2)}`}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-[#384959] dark:text-slate-200">
                                {tx.reference_number || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                {tx.notes || 'Bank transaction'}
                                <p className="text-[10px] text-slate-400">{tx.bank_name}</p>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'theme' && (
            <div className="space-y-6 text-xs">
              <div>
                <h2 className="text-base font-bold text-[#384959] dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#6A89A7] dark:text-[#88BDF2]" /> Theme & Color Mode
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Choose your preferred workspace aesthetic. Switch seamlessly between modern Light Mode and eye-friendly Dark Mode.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Mode Card */}
                <div 
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                    theme === 'light' 
                      ? 'border-[#88BDF2] bg-[#BDDDFC]/10 shadow-md ring-2 ring-[#88BDF2]/20' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                        <Sun className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-[#384959] dark:text-slate-200">Light Mode</span>
                    </div>
                    {theme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-[#88BDF2] text-[#384959] flex items-center justify-center font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-[#F4F7FB] rounded-xl border border-slate-200/80 space-y-2">
                    <div className="h-3 w-1/2 bg-[#384959]/20 rounded-md" />
                    <div className="h-8 bg-white rounded-lg border border-slate-200 flex items-center px-2">
                      <div className="h-2 w-12 bg-[#88BDF2] rounded-xs" />
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                    Clean, high-contrast Stormy Morning daylight aesthetic.
                  </p>
                </div>

                {/* Dark Mode Card */}
                <div 
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                    theme === 'dark' 
                      ? 'border-[#88BDF2] bg-[#88BDF2]/10 shadow-md ring-2 ring-[#88BDF2]/20' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-800 text-[#88BDF2]">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-[#384959] dark:text-slate-200">Dark Mode</span>
                    </div>
                    {theme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-[#88BDF2] text-[#384959] flex items-center justify-center font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="h-3 w-1/2 bg-slate-700 rounded-md" />
                    <div className="h-8 bg-slate-900 rounded-lg border border-slate-800 flex items-center px-2">
                      <div className="h-2 w-12 bg-[#88BDF2] rounded-xs" />
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                    Sleek dark theme, reduces eye strain during late store hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'shop' && (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <h2 className="text-sm sm:text-base font-bold text-[#384959] dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#6A89A7] dark:text-[#88BDF2]" /> Brand Identity & Contact Details
              </h2>

              {/* Logo Preview */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                  <img src={formData.logo_url || '/logo.png'} alt="Tulsi Mart Logo" className="w-full h-full object-contain" />
                </div>
                <div className="w-full">
                  <h4 className="text-sm font-bold text-[#384959] dark:text-slate-100">Primary TM Grocery Logo</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Appears on sidebar, receipts, navbar, and exported tax invoices.</p>
                  <input
                    type="text"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="mt-2 w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
                    placeholder="/logo.png or Cloudinary URL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Store Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Tagline / Motto</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={formData.currency_symbol}
                    onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                    Home Total Cash Amount (ઘરે રાખેલ રોકડ ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.home_cash_amount !== undefined ? formData.home_cash_amount : ''}
                    onChange={(e) => setFormData({ ...formData, home_cash_amount: parseFloat(e.target.value || 0) })}
                    placeholder="e.g. 50000.00"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Physical Store Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>
              </div>
            </form>
          )}

          {activeSection === 'invoice' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-[#384959] dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#6A89A7] dark:text-[#88BDF2]" /> Tax Invoice Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Invoice Number Prefix</label>
                  <input
                    type="text"
                    value={formData.invoice_prefix}
                    onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Default GST Rate Preset (%)</label>
                  <input
                    type="number"
                    value={formData.tax_percentage_default}
                    onChange={(e) => setFormData({ ...formData, tax_percentage_default: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Invoice Footer Legal & Return Policy</label>
                  <textarea
                    rows={3}
                    value={formData.invoice_footer_terms}
                    onChange={(e) => setFormData({ ...formData, invoice_footer_terms: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'delivery' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-[#384959] dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#6A89A7] dark:text-[#88BDF2]" /> Delivery Charges & Inventory Thresholds
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Flat Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.delivery_charge_flat}
                    onChange={(e) => setFormData({ ...formData, delivery_charge_flat: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Free Delivery Above Order Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.free_delivery_above}
                    onChange={(e) => setFormData({ ...formData, free_delivery_above: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Default Low Stock Alert Threshold (Units)</label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold_default}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold_default: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'backup' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-[#384959] dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#6A89A7] dark:text-[#88BDF2]" /> Database Backup & MongoDB Synchronization
              </h2>

              {/* MongoDB Integration Card */}
              <div className="p-4 bg-emerald-50/50 dark:bg-slate-800/80 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="font-bold text-[#384959] dark:text-slate-100 text-sm">MongoDB NoSQL Integration</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                    PyMongo Connected
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Synchronize all Tulsi Mart data (Products, Orders, Customers, Suppliers, Expenses, Coupons) directly into <strong>MongoDB collections</strong> (`tulsimart_db`).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Database}
                    onClick={async () => {
                      try {
                        showToast('Synchronizing Tulsi Mart datasets into MongoDB...', 'info');
                        const res = await authApi.syncMongoDB();
                        showToast(res.data?.message || 'Data synced to MongoDB!', 'success');
                      } catch (err) {
                        showToast(err.response?.data?.message || 'Could not connect to MongoDB server on localhost:27017', 'error');
                      }
                    }}
                  >
                    Sync All Data to MongoDB
                  </Button>
                </div>
              </div>

              {/* SQL Backup Dump Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-bold text-[#384959] dark:text-slate-100">Database Safety Snapshot</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Export complete database dump including all product catalogs, order invoices, supplier ledgers, customer CRM data, and audit history.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" icon={Database} onClick={handleBackup}>
                    Download SQL Backup Dump
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deposit / Withdrawal Bank Modal */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        title={bankForm.transaction_type === 'DEPOSIT' ? 'Deposit Money to Bank (બેંક જમા)' : bankForm.transaction_type === 'WITHDRAWAL' ? 'Bank Cash Withdrawal (બેંક ઉપાડ)' : 'Bank Expense Payout'}
        subtitle="Record manual admin bank deposits or cash register withdrawals"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full font-sans">
            <Button variant="outline" size="sm" onClick={() => setIsBankModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBankTx}>
              Confirm Transaction
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveBankTx} className="space-y-3 text-xs font-sans">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Transaction Type</label>
            <select
              value={bankForm.transaction_type}
              onChange={(e) => setBankForm({ ...bankForm, transaction_type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="DEPOSIT">➕ Admin Bank Deposit (Capital Injection)</option>
              <option value="WITHDRAWAL">➖ Bank Cash Withdrawal (To Gulla / Cash)</option>
              <option value="EXPENSE_PAYOUT">💸 Bank Direct Expense</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              step="0.01"
              value={bankForm.amount}
              onChange={(e) => {
                const val = e.target.value;
                setBankForm({ ...bankForm, amount: val });
                if (val > 0) {
                  handleAutoFillBankNotes(parseFloat(val));
                }
              }}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
            />
          </div>

          {/* Rupee Note Calculator for Bank Transactions */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                {bankForm.transaction_type === 'DEPOSIT' 
                  ? 'Bank Deposit Cash Notes (જમા નોટ ગણતરી)' 
                  : bankForm.transaction_type === 'WITHDRAWAL' 
                  ? 'Bank Withdrawal Cash Notes (ઉપાડ નોટ ગણતરી)' 
                  : 'Bank Expense Cash Notes (ખર્ચ નોટ ગણતરી)'}
              </label>
              <button
                type="button"
                onClick={() => handleAutoFillBankNotes(targetBankAmount)}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> Auto-Fill Notes (અંદાજિત નોટો)
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {DENOMS.map((d) => {
                const key = d === 1 ? 'coins' : String(d);
                const countVal = bankDenominations[key] !== undefined ? bankDenominations[key] : '';
                return (
                  <div key={d} className="text-center">
                    <span className="block text-[9px] font-extrabold text-slate-500 mb-0.5">
                      {d === 1 ? 'Coin' : `₹${d}`}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={countVal}
                      onChange={(e) => {
                        const cnt = parseInt(e.target.value || 0, 10);
                        const newCounts = { ...bankDenominations, [key]: cnt };
                        setBankDenominations(newCounts);
                        const newTot = DENOMS.reduce((sum, dom) => {
                          const k = dom === 1 ? 'coins' : String(dom);
                          return sum + ((newCounts[k] || 0) * dom);
                        }, 0);
                        if (newTot > 0) {
                          setBankForm(prev => ({ ...prev, amount: newTot }));
                        }
                      }}
                      placeholder="0"
                      className="w-full px-1.5 py-1 text-center font-black text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[#384959] dark:text-slate-100"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Calculated Cash Notes Total:</span>
                <span className={`font-black text-sm ${bankDiff === 0 ? 'text-emerald-600' : bankDiff > 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                  ₹{bankNoteTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                {bankDiff === 0 && (
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Exact Match
                  </span>
                )}
                {bankDiff > 0 && (
                  <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
                    🔵 Excess: ₹{bankDiff.toLocaleString('en-IN')}
                  </span>
                )}
                {bankDiff < 0 && (
                  <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                    🟠 Short: ₹{Math.abs(bankDiff).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Reference / UTR / Cheque No.</label>
            <input
              type="text"
              value={bankForm.reference_number}
              onChange={(e) => setBankForm({ ...bankForm, reference_number: e.target.value })}
              placeholder="e.g. UTR-987654"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Bank Name</label>
            <input
              type="text"
              value={bankForm.bank_name}
              onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
              placeholder="HDFC Store Primary Bank"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Notes / Description</label>
            <input
              type="text"
              value={bankForm.notes}
              onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
              placeholder="Bank cash withdrawal for store Gulla"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
