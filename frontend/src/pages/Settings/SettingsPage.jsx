import React, { useState, useEffect, useCallback } from 'react';
import { 
  Store, 
  Receipt, 
  Landmark, 
  Palette, 
  Save, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Sun, 
  Moon, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Edit2, 
  Users, 
  Wallet, 
  Clock, 
  Calculator,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, ConfirmDialog, EmptyState } from '../../components/common/UiHelpers';
import { storeSettingsApi } from '../../services/storeSettingsApi';
import { extractList } from '../../utils/apiHelpers';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export const SettingsPage = () => {
  const { storeSettings, setStoreSettings } = useAuth();
  const { showToast } = useNotification();
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme();

  // Active Tab: 'store', 'accounts', 'bank', 'home_cash', 'theme'
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store Settings Form State
  const [formData, setFormData] = useState({
    store_name: '',
    tagline: '',
    store_logo: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    phone: '',
    email: '',
    gstin: '',
    upi_id: '',
    currency_symbol: '₹',
    tax_rate: 0,
    invoice_footer: '',
    auto_1130_sweep_enabled: true,
  });

  // Login Accounts State
  const [loginAccounts, setLoginAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsSearch, setAccountsSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [submittingDeleteAccount, setSubmittingDeleteAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'ADMIN',
    is_active: true,
    require_otp: true,
  });

  // Home Cash Vault State
  const [homeCashData, setHomeCashData] = useState({
    balance: 0,
    transactions: []
  });
  const [loadingHomeCash, setLoadingHomeCash] = useState(false);
  const [isHomeCashModalOpen, setIsHomeCashModalOpen] = useState(false);
  const [homeCashModalType, setHomeCashModalType] = useState('DEPOSIT');
  const [homeCashAmount, setHomeCashAmount] = useState('');
  const [homeNotesReason, setHomeNotesReason] = useState('');
  const [homeNoteCounts, setHomeNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
  const [submittingHomeCash, setSubmittingHomeCash] = useState(false);

  // Bank Transactions State
  const [bankSummary, setBankSummary] = useState({ total_in: 0, total_out: 0, net_balance: 0 });
  const [bankTransactions, setBankTransactions] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);

  // Load Settings Data
  const loadSettingsData = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await storeSettingsApi.getSettings({ signal });
      const data = res.data?.data || res.data || {};
      setFormData({
        store_name: data.store_name || 'Tulsi Mart Supermarket',
        tagline: data.tagline || 'Fresh Grocery & Daily Needs',
        store_logo: data.store_logo || '',
        address: data.address || 'Sector 11, Main Market Road',
        city: data.city || 'Gandhinagar',
        state: data.state || 'Gujarat',
        country: data.country || 'India',
        pincode: data.pincode || '382011',
        phone: data.phone || '+91 98980 11223',
        email: data.email || 'info@tulsimart.com',
        gstin: data.gstin || '24AAACT8890C1Z5',
        upi_id: data.upi_id || 'tulsimart@hdfcbank',
        currency_symbol: data.currency_symbol || '₹',
        tax_rate: data.tax_rate || 5.0,
        invoice_footer: data.invoice_footer || 'Thank you for shopping with Tulsi Mart! Visit Again.',
        auto_1130_sweep_enabled: data.auto_1130_sweep_enabled ?? true,
      });

      if (setStoreSettings) setStoreSettings(data);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      console.error('Error fetching settings:', err);
      showToast('Failed to load store settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [setStoreSettings, showToast]);

  // Load Accounts
  const loadAccounts = useCallback(async (signal) => {
    setLoadingAccounts(true);
    try {
      const res = await storeSettingsApi.getAccounts({}, { signal });
      setLoginAccounts(extractList(res));
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      console.error('Error fetching accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  // Load Home Cash Data
  const loadHomeCash = useCallback(async (signal) => {
    setLoadingHomeCash(true);
    try {
      const res = await storeSettingsApi.getHomeCashData({ signal });
      const data = res.data?.data || res.data || {};
      setHomeCashData({
        balance: Number(data.balance) || 0,
        transactions: data.transactions || []
      });
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      console.error('Error fetching home cash data:', err);
    } finally {
      setLoadingHomeCash(false);
    }
  }, []);

  // Load Bank Transactions
  const loadBankData = useCallback(async (signal) => {
    setLoadingBank(true);
    try {
      const [sumRes, txRes] = await Promise.allSettled([
        storeSettingsApi.getBankSummary({ signal }),
        storeSettingsApi.getBankTransactions({}, { signal })
      ]);
      if (sumRes.status === 'fulfilled') {
        const sumData = sumRes.value.data?.data || sumRes.value.data || {};
        setBankSummary({
          total_in: Number(sumData.total_in) || 0,
          total_out: Number(sumData.total_out) || 0,
          net_balance: Number(sumData.net_balance) || 0
        });
      }
      if (txRes.status === 'fulfilled') {
        setBankTransactions(extractList(txRes.value));
      }
    } catch (err) {
      console.error('Error fetching bank data:', err);
    } finally {
      setLoadingBank(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSettingsData(controller.signal);
    if (activeTab === 'accounts') loadAccounts(controller.signal);
    if (activeTab === 'home_cash') loadHomeCash(controller.signal);
    if (activeTab === 'bank') loadBankData(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadSettingsData, loadAccounts, loadHomeCash, loadBankData]);

  // Save Store Settings
  const handleSaveStoreSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await storeSettingsApi.updateSettings(formData);
      const updated = res.data?.data || res.data || formData;
      setFormData(updated);
      if (setStoreSettings) setStoreSettings(updated);
      showToast('Store settings saved successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update store settings';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Account Handlers
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: 'ADMIN',
      is_active: true,
      require_otp: true,
    });
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccountFormData({
      username: acc.username || '',
      password: '',
      full_name: acc.full_name || '',
      email: acc.email || '',
      role: acc.role || 'ADMIN',
      is_active: acc.is_active ?? true,
      require_otp: acc.require_otp ?? true,
    });
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountFormData.username.trim() || (!editingAccount && !accountFormData.password)) {
      showToast('Username and Password are required', 'error');
      return;
    }

    setSubmittingAccount(true);
    try {
      if (editingAccount) {
        const payload = { ...accountFormData };
        if (!payload.password) delete payload.password;
        await storeSettingsApi.updateAccount(editingAccount.id, payload);
        showToast(`Account "${accountFormData.username}" updated`, 'success');
      } else {
        await storeSettingsApi.createAccount(accountFormData);
        showToast(`Account "${accountFormData.username}" created`, 'success');
      }
      setIsAccountModalOpen(false);
      loadAccounts();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save account';
      showToast(msg, 'error');
    } finally {
      setSubmittingAccount(false);
    }
  };

  const handleToggleAccountStatus = async (acc) => {
    try {
      await storeSettingsApi.toggleAccountStatus(acc.id);
      showToast(`Account "${acc.username}" status updated`, 'success');
      loadAccounts();
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleToggleAccountOtp = async (acc) => {
    try {
      await storeSettingsApi.toggleAccountOtp(acc.id);
      showToast(`Account "${acc.username}" OTP settings updated`, 'success');
      loadAccounts();
    } catch (err) {
      showToast('Failed to toggle OTP', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    setSubmittingDeleteAccount(true);
    try {
      await storeSettingsApi.deleteAccount(deletingAccount.id);
      showToast(`Account "${deletingAccount.username}" deleted`, 'success');
      setDeletingAccount(null);
      loadAccounts();
    } catch (err) {
      showToast('Failed to delete account', 'error');
    } finally {
      setSubmittingDeleteAccount(false);
    }
  };

  // Home Cash Handlers
  const handleOpenHomeCashModal = (type) => {
    setHomeCashModalType(type);
    setHomeCashAmount('');
    setHomeNotesReason('');
    setHomeNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
    setIsHomeCashModalOpen(true);
  };

  const handleHomeNoteChange = (denom, valStr) => {
    const cleanVal = valStr.replace(/[^0-9]/g, '');
    const updatedCounts = { ...homeNoteCounts, [denom]: cleanVal };
    setHomeNoteCounts(updatedCounts);

    const denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1];
    const newTotal = denoms.reduce((acc, d) => acc + (parseInt(updatedCounts[d] || '0', 10) * d), 0);
    if (newTotal > 0) setHomeCashAmount(String(newTotal));
  };

  const handleRecordHomeCash = async (e) => {
    e.preventDefault();
    const amtNum = parseFloat(homeCashAmount);
    if (!amtNum || amtNum <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setSubmittingHomeCash(true);
    try {
      await storeSettingsApi.createHomeCashTransaction({
        entry_type: homeCashModalType,
        amount: amtNum,
        denomination_counts: homeNoteCounts,
        notes: homeNotesReason || `${homeCashModalType} to Home Safe`
      });
      showToast(`Recorded Home Safe ${homeCashModalType.toLowerCase()} of ₹${amtNum.toFixed(2)}`, 'success');
      setIsHomeCashModalOpen(false);
      loadHomeCash();
    } catch (err) {
      showToast('Failed to record home cash transaction', 'error');
    } finally {
      setSubmittingHomeCash(false);
    }
  };

  const formatCurrency = (val) => `₹${(Number(val) || 0).toFixed(2)}`;

  const filteredAccounts = loginAccounts.filter(acc => {
    const matchesSearch = !accountsSearch || 
      acc.username?.toLowerCase().includes(accountsSearch.toLowerCase()) ||
      acc.full_name?.toLowerCase().includes(accountsSearch.toLowerCase()) ||
      acc.email?.toLowerCase().includes(accountsSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || acc.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 🌟 Top Header Banner matching Bill Management Page */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Store className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                  Store Settings & Control
                </h1>
                <Badge variant="teal" size="sm" className="font-extrabold uppercase tracking-wide">
                  Real DB Connected
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium truncate">
                Configure store identity, login accounts, bank accounts, home cash vault & visual themes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={handleSaveStoreSettings}
              disabled={saving}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#00796b] text-white hover:bg-[#004d40] shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 Tab Navigation Bar matching Bill Page */}
      <div className="bg-white dark:bg-slate-900 p-2 border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'store'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-[#00796b]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'accounts'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-[#00796b]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Login Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('home_cash')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'home_cash'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-[#00796b]'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Home Cash Safe</span>
          </button>

          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'bank'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-[#00796b]'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Bank & UPI</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'theme'
                ? 'bg-[#00796b] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-[#00796b]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Appearance</span>
          </button>
        </div>
      </div>

      {/* 🏪 TAB 1: STORE PROFILE & IDENTITY */}
      {activeTab === 'store' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Identity & Branding Card */}
            <Card className="p-4 sm:p-6 border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5 pb-3 border-b border-teal-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] border border-teal-200/60">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white font-heading">
                    Store Identity & Branding
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Main store name, tagline, logo and public contacts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    Store Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    placeholder="Tulsi Mart Supermarket"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 outline-none font-black text-slate-900 dark:text-slate-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Fresh Grocery & Daily Needs"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    Primary Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98980 11223"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-mono font-black text-slate-900 dark:text-slate-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    Support Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@tulsimart.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                  Store Logo URL
                </label>
                <input
                  type="text"
                  value={formData.store_logo}
                  onChange={(e) => setFormData({ ...formData, store_logo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-mono font-bold text-slate-800 dark:text-slate-200 transition-all"
                />
              </div>
            </Card>

            {/* Address Details Card */}
            <Card className="p-4 sm:p-6 border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5 pb-3 border-b border-teal-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] border border-teal-200/60">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white font-heading">
                    Store Location & Address
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Physical address details printed on invoice receipts</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Sector 11, Main Market Road"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-bold text-slate-800 dark:text-slate-200 transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Gandhinagar"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Gujarat"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="382011"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-mono font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Tax & Invoice Config Card */}
            <Card className="p-4 sm:p-6 border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5 pb-3 border-b border-teal-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] border border-teal-200/60">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white font-heading">
                    Tax & Invoice Config
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">GSTIN, default tax rate and invoice footer</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="24AAACT8890C1Z5"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-mono font-black text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.currency_symbol}
                    onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                    placeholder="₹"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-black text-center text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="5.0"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-mono text-center font-black text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider mb-1.5">
                  Invoice Footer Note
                </label>
                <textarea
                  rows={3}
                  value={formData.invoice_footer}
                  onChange={(e) => setFormData({ ...formData, invoice_footer: e.target.value })}
                  placeholder="Thank you for shopping with Tulsi Mart!"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none font-medium text-slate-800 dark:text-slate-200"
                />
              </div>
            </Card>

            <Card className="p-4 sm:p-5 border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3 bg-teal-50/50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00796b]" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Auto Nightly Sweep Rule</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Automatically sweep counter cash drawer entries to the Home Safe Vault at 11:30 PM.
              </p>
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_1130_sweep_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_1130_sweep_enabled: e.target.checked })}
                  className="w-4 h-4 text-[#00796b] rounded focus:ring-[#00796b]"
                />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Enable 11:30 PM Auto Sweep</span>
              </label>
            </Card>
          </div>
        </div>
      )}

      {/* 👥 TAB 2: LOGIN ACCOUNTS MANAGEMENT */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <Card className="p-4 border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <SearchInput
                value={accountsSearch}
                onChange={setAccountsSearch}
                placeholder="Search by username, full name, email..."
                className="flex-1"
              />

              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3.5 py-2 text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STORE_MANAGER">STORE MANAGER</option>
                  <option value="CASHIER">CASHIER</option>
                </select>

                <button
                  onClick={handleOpenAddAccount}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#00796b] text-white hover:bg-[#004d40] shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Account</span>
                </button>
              </div>
            </div>
          </Card>

          {loadingAccounts ? (
            <div className="p-12 text-center text-slate-400">Loading user accounts...</div>
          ) : filteredAccounts.length === 0 ? (
            <Card className="p-8 border border-teal-200/80 rounded-2xl">
              <EmptyState icon={Users} title="No Login Accounts" description="No user accounts match your search filters." />
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-[11px] font-black uppercase text-[#00796b] dark:text-[#80cbc4] border-b border-teal-100 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">User Account</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">OTP Security</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800 font-medium">
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">{acc.full_name || acc.username}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{acc.username} {acc.email ? `• ${acc.email}` : ''}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            acc.role === 'ADMIN'
                              ? 'bg-teal-100 text-[#00695c] border border-teal-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {acc.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleAccountOtp(acc)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer border transition-all ${
                              acc.require_otp
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {acc.require_otp ? 'OTP Required' : 'Direct Login'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleAccountStatus(acc)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer border transition-all ${
                              acc.is_active
                                ? 'bg-teal-50 text-[#00796b] border-teal-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {acc.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditAccount(acc)}
                              className="p-1.5 rounded-xl border border-teal-200/80 text-slate-600 hover:bg-teal-50 cursor-pointer transition-colors"
                              title="Edit Account"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingAccount(acc)}
                              className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 🔐 TAB 3: HOME CASH SAFE VAULT */}
      {activeTab === 'home_cash' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-emerald-50/50 dark:from-slate-900 dark:to-slate-850 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Home Safe Vault Balance</span>
              <div className="text-2xl font-black text-[#00796b] dark:text-[#80cbc4] font-heading mt-1">
                {formatCurrency(homeCashData.balance)}
              </div>
            </Card>

            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button
                onClick={() => handleOpenHomeCashModal('DEPOSIT')}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#00796b] text-white hover:bg-[#004d40] shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>+ Deposit to Home Safe</span>
              </button>

              <button
                onClick={() => handleOpenHomeCashModal('WITHDRAWAL')}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>- Withdraw from Home Safe</span>
              </button>
            </div>
          </div>

          <Card className="p-0 overflow-hidden border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-2xs bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-teal-100 dark:border-slate-800 font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00796b]" />
              <span>Safe Transaction Audit History</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-[11px] font-black uppercase text-[#00796b] border-b border-teal-100">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Balance After</th>
                    <th className="py-3 px-4">Recorded By & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50 dark:divide-slate-800 font-medium">
                  {homeCashData.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={tx.entry_type === 'DEPOSIT' || tx.entry_type === 'SWEEP' ? 'success' : 'danger'} size="xs">
                          {tx.entry_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#00796b]">
                        {formatCurrency(tx.balance_after)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">{tx.notes || '—'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">By: {tx.created_by_name || 'Admin'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 🏦 TAB 4: BANK & UPI ACCOUNTS */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border border-teal-200/80 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total Digital Inflow</span>
              <div className="text-xl font-black text-[#00796b] font-heading mt-1">{formatCurrency(bankSummary.total_in)}</div>
            </Card>

            <Card className="p-4 border border-teal-200/80 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total Digital Outflow</span>
              <div className="text-xl font-black text-rose-600 font-heading mt-1">{formatCurrency(bankSummary.total_out)}</div>
            </Card>

            <Card className="p-4 border border-teal-200/80 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Net Digital Balance</span>
              <div className="text-xl font-black text-slate-900 dark:text-white font-heading mt-1">{formatCurrency(bankSummary.net_balance)}</div>
            </Card>
          </div>

          <Card className="p-5 border border-teal-200/80 rounded-2xl space-y-4 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2 pb-3 border-b border-teal-100">
              <Landmark className="w-5 h-5 text-[#00796b]" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">HDFC Primary Store Bank Account</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-400 block font-bold">Bank Name:</span>
                <span className="text-slate-900 dark:text-white font-black text-sm">HDFC Bank Ltd</span>
              </div>

              <div>
                <span className="text-slate-400 block font-bold">Account Number:</span>
                <span className="text-slate-900 dark:text-white font-mono font-black text-sm">50200088991122</span>
              </div>

              <div>
                <span className="text-slate-400 block font-bold">IFSC Code:</span>
                <span className="text-slate-900 dark:text-white font-mono font-black">HDFC0001234</span>
              </div>

              <div>
                <span className="text-slate-400 block font-bold">Primary UPI VPA:</span>
                <span className="text-[#00796b] font-mono font-black text-sm">{formData.upi_id}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 🎨 TAB 5: APPEARANCE & THEME */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <Card className="p-5 border border-teal-200/80 rounded-2xl space-y-4 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2 pb-3 border-b border-teal-100">
              <Sun className="w-5 h-5 text-[#00796b]" />
              <h3 className="font-black text-base text-slate-900 dark:text-white">Dark / Light Display Mode</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => theme !== 'light' && toggleTheme()}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                  theme === 'light' ? 'border-[#00796b] bg-teal-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <div>
                  <div className="font-black text-slate-900 text-sm">Light Mode</div>
                  <div className="text-xs text-slate-500 font-medium">Clean bright background with teal accents</div>
                </div>
              </div>

              <div
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                  theme === 'dark' ? 'border-[#00796b] bg-slate-800' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Moon className="w-6 h-6 text-indigo-400" />
                <div>
                  <div className="font-black text-slate-900 dark:text-white text-sm">Dark Mode</div>
                  <div className="text-xs text-slate-400 font-medium">Sleek dark theme tailored for night shifts</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 📝 Add / Edit Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={editingAccount ? `Edit Account: @${editingAccount.username}` : 'Create Login Account'}
        size="md"
      >
        <form onSubmit={handleSaveAccount} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-[#00796b] mb-1 uppercase tracking-wider">Username *</label>
              <input
                type="text"
                required
                disabled={Boolean(editingAccount)}
                value={accountFormData.username}
                onChange={(e) => setAccountFormData({ ...accountFormData, username: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 rounded-xl font-mono font-black"
              />
            </div>

            <div>
              <label className="block font-black text-[#00796b] mb-1 uppercase tracking-wider">
                Password {editingAccount ? '(Optional)' : '*'}
              </label>
              <input
                type="password"
                required={!editingAccount}
                value={accountFormData.password}
                onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-[#00796b] mb-1 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={accountFormData.full_name}
                onChange={(e) => setAccountFormData({ ...accountFormData, full_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-black text-[#00796b] mb-1 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={accountFormData.email}
                onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-black text-[#00796b] mb-1 uppercase tracking-wider">User Role</label>
            <select
              value={accountFormData.role}
              onChange={(e) => setAccountFormData({ ...accountFormData, role: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 rounded-xl font-extrabold"
            >
              <option value="ADMIN">ADMIN (Full System Access)</option>
              <option value="STORE_MANAGER">STORE MANAGER (Inventory & Billing)</option>
              <option value="CASHIER">CASHIER (POS Billing Only)</option>
            </select>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-black text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={accountFormData.is_active}
                onChange={(e) => setAccountFormData({ ...accountFormData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#00796b] rounded"
              />
              <span>Active Account</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-black text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={accountFormData.require_otp}
                onChange={(e) => setAccountFormData({ ...accountFormData, require_otp: e.target.checked })}
                className="w-4 h-4 text-[#00796b] rounded"
              />
              <span>Require OTP on Login</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)}>Cancel</Button>
            <button type="submit" disabled={submittingAccount} className="px-4 py-2 rounded-xl font-black bg-[#00796b] text-white hover:bg-[#004d40]">
              {submittingAccount ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 🔐 Home Cash Modal */}
      {isHomeCashModalOpen && (
        <Modal
          isOpen={isHomeCashModalOpen}
          onClose={() => setIsHomeCashModalOpen(false)}
          title={`Home Safe ${homeCashModalType}`}
          size="md"
        >
          <form onSubmit={handleRecordHomeCash} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block font-black text-[#00796b] uppercase tracking-wider mb-1">Total Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={homeCashAmount}
                onChange={(e) => setHomeCashAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 text-sm font-black bg-slate-50 dark:bg-slate-800 border border-teal-200/80 rounded-xl font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-teal-100 space-y-2">
              <span className="font-extrabold text-slate-700 block">Quick Denomination Breakdown:</span>
              <div className="grid grid-cols-3 gap-2">
                {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((denom) => (
                  <div key={denom} className="text-center">
                    <span className="block text-[10px] font-bold">₹{denom}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={homeNoteCounts[denom]}
                      onChange={(e) => handleHomeNoteChange(denom, e.target.value)}
                      placeholder="0"
                      className="w-full text-center py-1 text-xs font-mono border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-black text-[#00796b] uppercase tracking-wider mb-1">Reason / Reference Notes</label>
              <input
                type="text"
                value={homeNotesReason}
                onChange={(e) => setHomeNotesReason(e.target.value)}
                placeholder="Cash deposit or withdrawal notes"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 rounded-xl font-bold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsHomeCashModalOpen(false)}>Cancel</Button>
              <button type="submit" disabled={submittingHomeCash} className="px-4 py-2 rounded-xl font-black bg-[#00796b] text-white hover:bg-[#004d40]">
                {submittingHomeCash ? 'Recording...' : 'Confirm Transaction'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 🗑️ Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDeleteAccount}
        title={`Delete User Account: @${deletingAccount?.username}`}
        message={`Are you sure you want to delete user "@${deletingAccount?.username}" (${deletingAccount?.full_name})? This user will lose system access.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        isDanger={true}
        loading={submittingDeleteAccount}
      />
    </div>
  );
};

export default SettingsPage;
