import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Receipt, 
  Landmark, 
  Palette, 
  ShieldAlert, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Sparkles,
  Database,
  RefreshCw,
  QrCode,
  CreditCard,
  Building,
  FileText,
  Percent,
  MapPin,
  Phone,
  Mail,
  HelpCircle,
  Lock,
  Sun,
  Moon,
  Globe,
  UserCheck,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Check,
  X,
  Users,
  Wallet,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Search,
  Clock
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CartLoader } from '../../components/common/CartLoader';
import { settingsApi, authApi, loginAccountsApi, homeCashApi, bankApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export const SettingsPage = () => {
  const { storeSettings, updateStoreSettings, user, isRole } = useAuth();
  const { showToast } = useNotification();
  const { theme, toggleTheme, colorTheme, setColorTheme, colorPresets } = useTheme();

  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Login Accounts Management State
  const [loginAccounts, setLoginAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  const [accountFormData, setAccountFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'ADMIN',
    is_active: true,
    require_otp: true,
  });

  // Home Safe Cash Vault State
  const [homeCashData, setHomeCashData] = useState({
    home_cash_amount: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    total_transactions: 0,
    denominations_breakdown: {},
    history: []
  });
  const [loadingHomeCash, setLoadingHomeCash] = useState(false);
  const [isHomeCashModalOpen, setIsHomeCashModalOpen] = useState(false);
  const [homeCashModalType, setHomeCashModalType] = useState('DEPOSIT'); // DEPOSIT or WITHDRAWAL
  const [homeNoteCounts, setHomeNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
  const [homeNotesReason, setHomeNotesReason] = useState('');
  const [submittingHomeCash, setSubmittingHomeCash] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('ALL'); // ALL, SWEEP, DEPOSIT, WITHDRAWAL
  const [historySearch, setHistorySearch] = useState('');
  const [loginsFilter, setLoginsFilter] = useState('ALL'); // ALL, ADMIN, STORE_MANAGER, CASHIER
  const [loginsSearch, setLoginsSearch] = useState('');
  const [bankTransactions, setBankTransactions] = useState([]);
  const [loadingBankTx, setLoadingBankTx] = useState(false);
  const [bankFilter, setBankFilter] = useState('ALL');
  const [bankSearch, setBankSearch] = useState('');

  // Form State initialized with defaults
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
    gst_number: '',
    pan_number: '',
    invoice_prefix: '',
    invoice_terms: '',
    show_logo_on_invoice: true,
    auto_print_invoice: false,
    tax_enabled: true,
    default_gst_rate: 18.0,
    prices_include_tax: false,
    currency_symbol: '₹',
    currency_code: 'INR',
    payment_cash_enabled: true,
    payment_upi_enabled: true,
    payment_card_enabled: true,
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    theme_mode: 'light',
    primary_color: '#00695C',
    security_require_otp: false,
    security_session_timeout: 30,
  });

  // Database settings fetch
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getSettings();
      if (res.data) {
        setFormData(res.data);
        updateStoreSettings(res.data);
      }
    } catch (err) {
      console.warn('Settings API request offline or fallback mode:', err);
      if (storeSettings) {
        setFormData((prev) => ({ ...prev, ...storeSettings }));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await loginAccountsApi.getAccounts();
      setLoginAccounts(extractList(res));
    } catch (err) {
      console.error('Failed to load login accounts:', err);
      showToast('Could not load login accounts from database.', 'error');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLoginAccounts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsApi.updateSettings(formData);
      if (res.data) {
        setFormData(res.data);
        updateStoreSettings(res.data);
        showToast('Store settings permanently updated in database!', 'success');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save settings to database.';
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };


  // Login Account Actions
  const handleOpenCreateAccountModal = () => {
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

  const handleOpenEditAccountModal = (acc) => {
    setEditingAccount(acc);
    setAccountFormData({
      username: acc.username || '',
      password: acc.password || '',
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
    setSubmittingAccount(true);
    try {
      if (editingAccount) {
        await loginAccountsApi.updateAccount(editingAccount.id, accountFormData);
        showToast(`Login account '${accountFormData.username}' updated!`, 'success');
      } else {
        await loginAccountsApi.createAccount(accountFormData);
        showToast(`New login account '${accountFormData.username}' created!`, 'success');
      }
      setIsAccountModalOpen(false);
      fetchLoginAccounts();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save login account.';
      showToast(msg, 'error');
    } finally {
      setSubmittingAccount(false);
    }
  };

  const handleToggleAccountStatus = async (id) => {
    try {
      await loginAccountsApi.toggleAccountStatus(id);
      showToast('User login status updated!', 'success');
      fetchLoginAccounts();
    } catch {
      showToast('Failed to toggle user login status.', 'error');
    }
  };

  const handleToggleAccountOtp = async (id, username) => {
    try {
      const res = await loginAccountsApi.toggleAccountOtp(id);
      const isOtp = res.data?.require_otp;
      showToast(`OTP Verification for '${username}' ${isOtp ? 'ENABLED' : 'DISABLED'}.`, 'success');
      fetchLoginAccounts();
    } catch {
      showToast('Failed to toggle OTP verification setting.', 'error');
    }
  };

  const handleDeleteAccount = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete login account '${username}' from database?`)) return;
    try {
      await loginAccountsApi.deleteAccount(id);
      showToast(`Login account '${username}' deleted successfully.`, 'success');
      fetchLoginAccounts();
    } catch {
      showToast('Failed to delete login account.', 'error');
    }
  };

  const fetchHomeCashData = async () => {
    setLoadingHomeCash(true);
    try {
      const res = await homeCashApi.getHomeCashData();
      const payload = res.data?.data || res.data || {};
      setHomeCashData({
        home_cash_amount: parseFloat(payload.home_cash_amount || 0),
        total_deposits: parseFloat(payload.total_deposits || 0),
        total_withdrawals: parseFloat(payload.total_withdrawals || 0),
        total_transactions: parseInt(payload.total_transactions || 0, 10),
        denominations_breakdown: payload.denominations_breakdown || {},
        history: Array.isArray(payload.history) ? payload.history : (Array.isArray(payload) ? payload : [])
      });
    } catch (err) {
      console.error('Failed to fetch home cash data:', err);
    } finally {
      setLoadingHomeCash(false);
    }
  };

  const fetchBankTransactions = async () => {
    setLoadingBankTx(true);
    try {
      const res = await bankApi.getTransactions();
      setBankTransactions(extractList(res));
    } catch (err) {
      console.error('Failed to fetch bank transactions:', err);
    } finally {
      setLoadingBankTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'home_cash') {
      fetchHomeCashData();
    } else if (activeTab === 'banking') {
      fetchBankTransactions();
    }
  }, [activeTab]);

  const calculateHomeNoteTotal = (counts) => {
    return Object.entries(counts).reduce((sum, [denom, count]) => sum + (Number(denom) * (Number(count) || 0)), 0);
  };

  const handleOpenHomeCashModal = (type) => {
    setHomeCashModalType(type);
    setHomeNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 2: '', 1: '' });
    setHomeNotesReason('');
    setIsHomeCashModalOpen(true);
  };

  const handleHomeNoteCountChange = (denom, valStr) => {
    const cleanVal = valStr.replace(/[^0-9]/g, '');
    setHomeNoteCounts(prev => ({ ...prev, [denom]: cleanVal }));
  };

  const handleSubmitHomeCashTransaction = async (e) => {
    e?.preventDefault();
    const totalAmt = calculateHomeNoteTotal(homeNoteCounts);
    if (totalAmt <= 0) {
      showToast('⚠️ Please enter note quantities to calculate amount.', 'error');
      return;
    }

    if (homeCashModalType === 'WITHDRAWAL' && totalAmt > homeCashData.home_cash_amount) {
      showToast(`⚠️ Home Safe Warning: Only ₹${homeCashData.home_cash_amount.toFixed(2)} available in Home Safe!`, 'error');
      return;
    }

    setSubmittingHomeCash(true);
    try {
      await homeCashApi.createHomeCashTransaction({
        entry_type: homeCashModalType,
        amount: totalAmt,
        denomination_counts: homeNoteCounts,
        notes: homeNotesReason || (homeCashModalType === 'DEPOSIT' ? 'Manual Home Safe Cash Deposit' : 'Manual Home Safe Cash Withdrawal'),
        created_by_name: user?.full_name || user?.username || 'Store Admin'
      });

      showToast(`Successfully recorded Home Safe Cash ${homeCashModalType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} of ₹${totalAmt.toFixed(2)}!`, 'success');
      setIsHomeCashModalOpen(false);
      fetchHomeCashData();
      fetchSettings();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit home cash transaction.';
      showToast(msg, 'error');
    } finally {
      setSubmittingHomeCash(false);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <CartLoader text="Fetching Database Store Settings..." size="md" />
      </div>
    );
  }

  const tabs = [
    { id: 'store', label: 'Store Profile', icon: Store, desc: 'Name, address, contact & branding' },
    { id: 'home_cash', label: 'Home Safe Cash Vault', icon: Wallet, desc: 'Total home cash balance, deposits, withdrawals & note history' },
    { id: 'logins', label: 'Login Accounts', icon: ShieldCheck, desc: 'Passwords, usernames & OTP emails' },
    { id: 'tax', label: 'Tax & Invoicing', icon: Receipt, desc: 'GSTIN, invoice prefixes & tax rates' },
    { id: 'banking', label: 'Banking & Payments', icon: Landmark, desc: 'Bank accounts, UPI & payout rules' },
    { id: 'theme', label: 'Theme & Regional', icon: Palette, desc: 'Colors, currency & display mode' },
    { id: 'security', label: 'Security & System', icon: ShieldAlert, desc: 'Auth policy, session & database sync' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Store & Profile Hero Header */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border-b border-teal-100/80 dark:border-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-teal-600/20 shrink-0">
              {user?.first_name ? user.first_name[0] : (user?.username?.[0] || 'A')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Admin')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
                  {user?.role?.replace('_', ' ') || 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure store identity, user credentials, OTP delivery emails, GST structures, and security settings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={fetchSettings}
              disabled={saving}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Save}
              onClick={handleSubmit}
              loading={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-md shadow-teal-600/20"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto no-scrollbar touch-pan mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all shrink-0 font-bold text-xs cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 6: LOGIN ACCOUNTS & CREDENTIALS */}
      {activeTab === 'logins' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-6 space-y-4">
            {/* Header + Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#384959] dark:text-slate-100 font-heading">
                  User Login Credentials Directory
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-bold border border-slate-200/60 dark:border-slate-700/60">
                  {['ALL', 'ADMIN', 'STORE_MANAGER', 'CASHIER'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setLoginsFilter(role)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        loginsFilter === role
                          ? 'bg-teal-600 text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {role === 'ALL' ? 'All' : role === 'ADMIN' ? 'Admins' : role === 'STORE_MANAGER' ? 'Managers' : 'Cashiers'}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={loginsSearch}
                    onChange={(e) => setLoginsSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-500 outline-none w-36 sm:w-44 font-medium dark:text-slate-200"
                  />
                </div>

                {/* Add New Login Account Button */}
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserPlus}
                  onClick={handleOpenCreateAccountModal}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-xs"
                >
                  Add Account
                </Button>
              </div>
            </div>

            {loadingAccounts ? (
              <div className="py-12 flex justify-center">
                <CartLoader text="Loading Login Accounts..." size="sm" />
              </div>
            ) : (() => {
              const filteredAccounts = (loginAccounts || []).filter((acc) => {
                if (loginsFilter !== 'ALL' && acc.role !== loginsFilter) return false;
                if (loginsSearch.trim()) {
                  const q = loginsSearch.toLowerCase();
                  const matchName = (acc.full_name || '').toLowerCase().includes(q);
                  const matchUser = (acc.username || '').toLowerCase().includes(q);
                  const matchEmail = (acc.email || '').toLowerCase().includes(q);
                  const matchRole = (acc.role || '').toLowerCase().includes(q);
                  return matchName || matchUser || matchEmail || matchRole;
                }
                return true;
              });

              if (filteredAccounts.length === 0) {
                return (
                  <div className="py-12 text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No Login Accounts Found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search filter or click "Add Account" to create a new login credential.</p>
                  </div>
                );
              }

              return (
                <>
                  {/* 1. Mobile Cards View (< md screens) */}
                  <div className="block md:hidden space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredAccounts.map((acc) => {
                      const isShowPass = !!showPasswordMap[acc.id];
                      return (
                        <div
                          key={acc.id}
                          className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-2xs hover:shadow-xs transition-all"
                        >
                          {/* Top Row: Name + Actions */}
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{acc.full_name}</p>
                              <span className="text-[10px] text-slate-400 font-mono">ID: #{acc.id}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditAccountModal(acc)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Edit Credentials"
                              >
                                <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(acc.id, acc.username)}
                                className="p-1.5 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                              </button>
                            </div>
                          </div>

                          {/* Username & Role Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-mono font-bold text-xs border border-teal-200 dark:border-teal-800">
                              @{acc.username}
                            </span>
                            <Badge variant={acc.role === 'ADMIN' ? 'primary' : 'secondary'} size="sm">
                              {acc.role_label || acc.role}
                            </Badge>
                          </div>

                          {/* Email & Password */}
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{acc.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 font-mono text-xs pt-1 border-t border-slate-200/50 dark:border-slate-800">
                              <span className="text-slate-500">Password:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{isShowPass ? acc.password : '••••••••'}</span>
                                <button
                                  onClick={() => togglePasswordVisibility(acc.id)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  {isShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Toggles Row */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/80">
                            <span
                              onClick={() => handleToggleAccountOtp(acc.id, acc.username)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                                acc.require_otp
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {acc.require_otp ? '🔒 OTP Required' : '🔑 Password Only'}
                            </span>

                            <span
                              onClick={() => handleToggleAccountStatus(acc.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                                acc.is_active
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              }`}
                            >
                              ● {acc.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. Desktop & Tablet View Table (>= md screens) */}
                  <div className="hidden md:block max-h-[480px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950/60 shadow-xs custom-scrollbar">
                    <table className="w-full text-left text-xs min-w-[800px]">
                      <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-700 shadow-xs">
                        <tr>
                          <th className="py-3.5 px-4 whitespace-nowrap">User / Full Name</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Username</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">OTP Delivery Email</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Password</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Role</th>
                          <th className="py-3.5 px-4 text-center whitespace-nowrap">OTP Verification</th>
                          <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                          <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredAccounts.map((acc) => {
                          const isShowPass = !!showPasswordMap[acc.id];
                          return (
                            <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors whitespace-nowrap">
                              <td className="py-3.5 px-4">
                                <p className="font-extrabold text-slate-900 dark:text-slate-100">{acc.full_name}</p>
                                <span className="text-[10px] text-slate-400 font-mono">ID: #{acc.id}</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                                @{acc.username}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{acc.email || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono">
                                <div className="flex items-center gap-2">
                                  <span>{isShowPass ? acc.password : '••••••••'}</span>
                                  <button
                                    onClick={() => togglePasswordVisibility(acc.id)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    title={isShowPass ? "Hide password" : "Show password"}
                                  >
                                    {isShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge variant={acc.role === 'ADMIN' ? 'primary' : 'secondary'} size="sm">
                                  {acc.role_label || acc.role}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  onClick={() => handleToggleAccountOtp(acc.id, acc.username)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                                    acc.require_otp
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  }`}
                                  title="Click to toggle OTP requirement for this account"
                                >
                                  {acc.require_otp ? '🔒 OTP Required' : '🔑 Password Only'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span
                                  onClick={() => handleToggleAccountStatus(acc.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                                    acc.is_active
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                  }`}
                                >
                                  ● {acc.is_active ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditAccountModal(acc)}
                                    className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Edit Credentials"
                                  >
                                    <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAccount(acc.id, acc.username)}
                                    className="p-1.5 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </Card>
        </div>
      )}

      {/* Main Settings Form */}
      {activeTab !== 'logins' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAB 1: STORE PROFILE */}
          {activeTab === 'store' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-[#384959] dark:text-[#88BDF2] rounded-xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Store Identity</h3>
                    <p className="text-xs text-slate-500">General store information used across receipts & invoices</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      name="store_name"
                      value={formData.store_name}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                      placeholder="e.g. Tulsi Mart Supermarket"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Store Tagline
                    </label>
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                      placeholder="e.g. Fresh Groceries & Daily Needs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Store Logo URL
                    </label>
                    <input
                      type="text"
                      name="store_logo"
                      value={formData.store_logo}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100 font-mono text-xs"
                      placeholder="/logo.png or https://..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Store Street Address *
                    </label>
                    <textarea
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                      placeholder="Complete store location details..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </Card>

              {/* Side Contact Box */}
              <Card className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Contact Channels</h3>
                      <p className="text-xs text-slate-500">Customer care & store helpline</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Store Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Store Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Branding Preview */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Header Live Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                      <img src={formData.store_logo || '/logo.png'} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.src = '/logo.png'; }} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{formData.store_name || 'Tulsi Mart'}</h4>
                      <p className="text-[11px] text-slate-500">{formData.tagline}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: TAX & INVOICING */}
          {activeTab === 'tax' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Tax Configuration</h3>
                    <p className="text-xs text-slate-500">GSTIN, PAN & tax calculation rules</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      name="gst_number"
                      value={formData.gst_number}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono uppercase dark:text-slate-100"
                      placeholder="27AABCT8899F1Z4"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono uppercase dark:text-slate-100"
                      placeholder="AABCT8899F"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Default GST Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        name="default_gst_rate"
                        value={formData.default_gst_rate}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono dark:text-slate-100"
                      />
                      <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3 sm:col-span-2 pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="tax_enabled"
                        checked={formData.tax_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Enable GST Billing</span>
                        <p className="text-[11px] text-slate-500">Calculate GST on all counter & online orders</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="prices_include_tax"
                        checked={formData.prices_include_tax}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Item Prices Include GST</span>
                        <p className="text-[11px] text-slate-500">Listed product prices are tax-inclusive by default</p>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>

              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Invoice Customization</h3>
                    <p className="text-xs text-slate-500">Prefixes, terms & print behavior</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Invoice Serial Prefix
                    </label>
                    <input
                      type="text"
                      name="invoice_prefix"
                      value={formData.invoice_prefix}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono uppercase dark:text-slate-100"
                      placeholder="TM-INV-"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Example: {formData.invoice_prefix}10024</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Invoice Terms & Footer Note
                    </label>
                    <textarea
                      name="invoice_terms"
                      rows={3}
                      value={formData.invoice_terms}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="show_logo_on_invoice"
                        checked={formData.show_logo_on_invoice}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Logo on Tax Invoices</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="auto_print_invoice"
                        checked={formData.auto_print_invoice}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Auto-Print Thermal Receipt after Checkout</span>
                    </label>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: BANKING & PAYMENTS */}
          {activeTab === 'banking' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Primary Bank Account</h3>
                    <p className="text-xs text-slate-500">Official bank record for payouts & settlements</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all dark:text-slate-100"
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Account Number</label>
                    <input
                      type="text"
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono dark:text-slate-100"
                      placeholder="e.g. 50200012345678"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono uppercase dark:text-slate-100"
                      placeholder="e.g. HDFC0001234"
                    />
                  </div>
                </div>
              </Card>

              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">UPI & Checkout Methods</h3>
                    <p className="text-xs text-slate-500">Store VPA & enabled counter payment options</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Store UPI VPA ID</label>
                    <input
                      type="text"
                      name="upi_id"
                      value={formData.upi_id}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono text-xs dark:text-slate-100"
                      placeholder="tulsimart@hdfcbank"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="payment_cash_enabled"
                        checked={formData.payment_cash_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Accept Cash Counter Payments</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="payment_upi_enabled"
                        checked={formData.payment_upi_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Accept QR Code / UPI Payments</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="payment_card_enabled"
                        checked={formData.payment_card_enabled}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Accept Debit / Credit Card Terminal</span>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Bank & Digital Payment Transaction Audit History Table */}
              <Card className="lg:col-span-2 p-4 sm:p-6 space-y-4">
                <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  {/* Top Row: Title & Refresh Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 shrink-0">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-black text-[#384959] dark:text-slate-100 font-heading">
                        Bank & Digital Payment Transaction Audit History
                      </h3>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchBankTransactions}
                      className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingBankTx ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                  </div>

                  {/* Bottom Row: Filter Tabs & Search Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-bold border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto custom-scrollbar max-w-full">
                      {['ALL', 'UPI_IN', 'CARD_IN', 'SUPPLIER_PAYOUT', 'EXPENSE_PAYOUT', 'DEPOSIT', 'WITHDRAWAL'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBankFilter(type)}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                            bankFilter === type
                              ? 'bg-teal-600 text-white shadow-xs font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {type === 'ALL'
                            ? 'All'
                            : type === 'UPI_IN'
                            ? 'UPI Sales'
                            : type === 'CARD_IN'
                            ? 'Card Sales'
                            : type === 'SUPPLIER_PAYOUT'
                            ? 'Supplier Payouts'
                            : type === 'EXPENSE_PAYOUT'
                            ? 'Expenses'
                            : type === 'DEPOSIT'
                            ? 'Bank Deposits'
                            : 'Withdrawals'}
                        </button>
                      ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full lg:w-56 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search bank logs..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-500 outline-none w-full font-medium dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {loadingBankTx ? (
                  <div className="py-12 flex justify-center">
                    <CartLoader text="Loading Bank & Digital Logs..." size="sm" />
                  </div>
                ) : (() => {
                  const filteredBankLogs = (bankTransactions || []).filter((tx) => {
                    if (bankFilter !== 'ALL' && tx.transaction_type !== bankFilter) return false;
                    if (bankSearch.trim()) {
                      const q = bankSearch.toLowerCase();
                      const matchType = (tx.transaction_type_display || tx.transaction_type || '').toLowerCase().includes(q);
                      const matchRef = (tx.reference_number || '').toLowerCase().includes(q);
                      const matchBank = (tx.bank_name || '').toLowerCase().includes(q);
                      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
                      const matchUser = (tx.created_by_name || '').toLowerCase().includes(q);
                      const matchAmt = String(tx.amount || '').includes(q);
                      return matchType || matchRef || matchBank || matchNotes || matchUser || matchAmt;
                    }
                    return true;
                  });

                  if (filteredBankLogs.length === 0) {
                    return (
                      <div className="py-12 text-center space-y-2">
                        <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No Bank or Digital Transactions Logged</p>
                        <p className="text-xs text-slate-400">All UPI sales, card receipts, supplier bank payouts & deposits will automatically appear here in real-time.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* 1. Mobile Cards View (< md screens) */}
                      <div className="block md:hidden space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {filteredBankLogs.map((tx) => {
                          const isPositive = ['UPI_IN', 'CARD_IN', 'DEPOSIT'].includes(tx.transaction_type);
                          const isUpi = tx.transaction_type === 'UPI_IN';
                          const isCard = tx.transaction_type === 'CARD_IN';
                          const isDeposit = tx.transaction_type === 'DEPOSIT';

                          return (
                            <div
                              key={tx.id}
                              className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-2xs hover:shadow-xs transition-all"
                            >
                              {/* Top Row: Type Badge + Amount */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                                    isUpi
                                      ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
                                      : isCard
                                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                                      : isDeposit
                                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                                  }`}
                                >
                                  {isUpi && <QrCode className="w-3 h-3 text-sky-500" />}
                                  {isCard && <CreditCard className="w-3 h-3 text-indigo-500" />}
                                  {isDeposit && <ArrowDownLeft className="w-3 h-3 text-emerald-500" />}
                                  {!isPositive && <ArrowUpRight className="w-3 h-3 text-rose-500" />}
                                  {tx.transaction_type_display || tx.transaction_type?.replace('_', ' ')}
                                </span>

                                <span
                                  className={`font-black text-sm sm:text-base font-mono tracking-tight ${
                                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {isPositive ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              {/* Notes / Purpose */}
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                                {tx.notes || 'Store Digital / Banking Settlement'}
                              </div>

                              {/* Reference Number Pill */}
                              {tx.reference_number && (
                                <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference No</span>
                                  <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 truncate">
                                    {tx.reference_number}
                                  </span>
                                </div>
                              )}

                              {/* Footer Info */}
                              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/80 flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (tx.date || '-')}</span>
                                </div>

                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                  • {tx.bank_name || 'HDFC Bank'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 2. Desktop & Tablet View Table (>= md screens) */}
                      <div className="hidden md:block max-h-[480px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950/60 shadow-xs custom-scrollbar">
                        <table className="w-full text-left text-xs min-w-[850px]">
                          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-700 shadow-xs">
                            <tr>
                              <th className="py-3.5 px-4 whitespace-nowrap">Date & Time</th>
                              <th className="py-3.5 px-4 whitespace-nowrap">Transaction Type</th>
                              <th className="py-3.5 px-4 whitespace-nowrap">Reference No</th>
                              <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">Amount</th>
                              <th className="py-3.5 px-4 whitespace-nowrap">Bank / Channel</th>
                              <th className="py-3.5 px-4">Notes & Settlement Details</th>
                              <th className="py-3.5 px-4 whitespace-nowrap">Action By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {filteredBankLogs.map((tx) => {
                              const isPositive = ['UPI_IN', 'CARD_IN', 'DEPOSIT'].includes(tx.transaction_type);
                              const isUpi = tx.transaction_type === 'UPI_IN';
                              const isCard = tx.transaction_type === 'CARD_IN';
                              const isDeposit = tx.transaction_type === 'DEPOSIT';

                              return (
                                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                  {/* Date & Time */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold">
                                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (tx.date || '-')}
                                    </div>
                                  </td>

                                  {/* Transaction Type Badge */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                                        isUpi
                                          ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800/60'
                                          : isCard
                                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800/60'
                                          : isDeposit
                                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60'
                                      }`}
                                    >
                                      {isUpi && <QrCode className="w-3 h-3 text-sky-600 dark:text-sky-400" />}
                                      {isCard && <CreditCard className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                                      {isDeposit && <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                                      {!isPositive && <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                                      {tx.transaction_type_display || tx.transaction_type?.replace('_', ' ')}
                                    </span>
                                  </td>

                                  {/* Reference No */}
                                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-teal-700 dark:text-teal-400">
                                    {tx.reference_number || 'N/A'}
                                  </td>

                                  {/* Amount */}
                                  <td className={`py-3.5 px-4 text-right font-black font-mono text-sm tracking-tight whitespace-nowrap ${
                                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {isPositive ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>

                                  {/* Bank / Channel */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-mono text-xs font-bold border border-slate-200/80 dark:border-slate-700/80">
                                      {tx.bank_name || 'HDFC Bank'}
                                    </span>
                                  </td>

                                  {/* Notes / Details */}
                                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                    {tx.notes || 'N/A'}
                                  </td>

                                  {/* Performed By */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                                      <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                      <span>{tx.created_by_name || 'System Auto'}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </Card>
            </div>
          )}

          {/* TAB 4: THEME & REGIONAL */}
          {activeTab === 'theme' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Currency & Regional</h3>
                    <p className="text-xs text-slate-500">Currency symbol and monetary display formats</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Currency Symbol</label>
                    <input
                      type="text"
                      name="currency_symbol"
                      value={formData.currency_symbol}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono dark:text-slate-100"
                      placeholder="₹"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Currency Code</label>
                    <input
                      type="text"
                      name="currency_code"
                      value={formData.currency_code}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono uppercase dark:text-slate-100"
                      placeholder="INR"
                    />
                  </div>
                </div>
              </Card>

              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Appearance & Color Theme</h3>
                    <p className="text-xs text-slate-500">Select store management color scheme & display mode</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Light / Dark Mode Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Display Mode: <span className="capitalize">{theme}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">Toggle dark / light mode interface</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={toggleTheme}>
                      Toggle Mode
                    </Button>
                  </div>


                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: SECURITY & SYSTEM */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Security Policy & Role Authorization</h3>
                    <p className="text-xs text-slate-500">Session, OTP login enforcement & privileges</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Active User Role:</span>
                      <Badge variant="primary" size="sm">{user?.role || 'ADMIN'}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Database level role authorization is active. Only authenticated Admin / Store Owner users can modify store configuration.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Session Timeout (Minutes)
                    </label>
                    <input
                      type="number"
                      name="security_session_timeout"
                      value={formData.security_session_timeout}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none transition-all font-mono dark:text-slate-100"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="security_require_otp"
                      checked={formData.security_require_otp}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Enforce OTP Verification on Admin Login</span>
                      <p className="text-[11px] text-slate-500">Send 2FA code to email on sign in</p>
                    </div>
                  </label>
                </div>
              </Card>

            </div>
          )}

        </form>
      )}



      {/* Modal for Creating / Editing Login Account Credentials */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={editingAccount ? `Edit Login Account - @${editingAccount.username}` : 'Add New Login Account'}
        subtitle="Configure username, password, role & OTP email in `login` table"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={accountFormData.full_name}
              onChange={(e) => setAccountFormData({ ...accountFormData, full_name: e.target.value })}
              required
              placeholder="e.g. Zeel Patel"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none font-medium dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Username *</label>
            <input
              type="text"
              value={accountFormData.username}
              onChange={(e) => setAccountFormData({ ...accountFormData, username: e.target.value })}
              required
              placeholder="e.g. admin or cashier1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none font-mono font-bold dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
            <input
              type="text"
              value={accountFormData.password}
              onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
              required
              placeholder="Enter secure password"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none font-mono dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">OTP Delivery Email *</label>
            <input
              type="email"
              value={accountFormData.email}
              onChange={(e) => setAccountFormData({ ...accountFormData, email: e.target.value })}
              required
              placeholder="user@tulsimart.com"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-400 mt-1">OTP verification codes for this account will be sent to this email address.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">System Role *</label>
            <select
              value={accountFormData.role}
              onChange={(e) => setAccountFormData({ ...accountFormData, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00695C] outline-none font-medium dark:text-slate-100"
            >
              <option value="ADMIN">Admin / Store Owner</option>
              <option value="STORE_MANAGER">Store Manager</option>
              <option value="CASHIER">Cashier / Billing Staff</option>
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={accountFormData.is_active}
                onChange={(e) => setAccountFormData({ ...accountFormData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200">Account Active & Enabled</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={accountFormData.require_otp}
                onChange={(e) => setAccountFormData({ ...accountFormData, require_otp: e.target.checked })}
                className="w-4 h-4 text-[#384959] rounded-md focus:ring-0"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200">Require OTP Email Verification on Login</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submittingAccount} className="bg-[#00695C] hover:bg-[#004D40] text-white font-bold">
              {editingAccount ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* TAB: HOME SAFE CASH VAULT */}
      {activeTab === 'home_cash' && (
        <div className="space-y-6">
          {/* Top Banner Card with Balance */}
          <Card className="p-6 bg-gradient-to-r from-[#004D40] via-[#00695C] to-[#004D40] text-white rounded-3xl shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                  <Landmark className="w-3.5 h-3.5 text-emerald-400" /> Home Cash Vault
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-heading">
                  ₹{(parseFloat(homeCashData?.home_cash_amount || 0)).toFixed(2)}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm max-w-lg">
                  Total safe cash stored at home from Day-End Gulla Sweeps and manual deposits.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenHomeCashModal('DEPOSIT')}
                  className="bg-[#00695C] hover:bg-[#004D40] text-white font-extrabold shadow-lg border border-[#00695C] cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Deposit Cash to Home
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleOpenHomeCashModal('WITHDRAWAL')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-lg border border-amber-500 cursor-pointer"
                >
                  <ArrowDownRight className="w-4 h-4" /> Withdraw Cash from Home
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHomeCashData}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHomeCash ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
            </div>
          </Card>

          {/* Metric Cards Grid (Billing Page Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Home Cash Balance */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Home Cash Balance
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#384959] dark:text-emerald-400 font-heading tracking-tight block mt-0.5">
                  ₹{(parseFloat(homeCashData?.home_cash_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Card 2: Total Deposits & Sweeps */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0 shadow-2xs">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Total Deposits & Sweeps
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#384959] dark:text-sky-400 font-heading tracking-tight block mt-0.5">
                  ₹{(parseFloat(homeCashData?.total_deposits || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Card 3: Total Home Withdrawals */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-2xs">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Total Home Withdrawals
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#384959] dark:text-rose-400 font-heading tracking-tight block mt-0.5">
                  ₹{(parseFloat(homeCashData?.total_withdrawals || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Card 4: Total Audit Entries */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Total Audit Entries
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#384959] dark:text-amber-400 font-heading tracking-tight block mt-0.5">
                  {homeCashData?.total_transactions || 0} Entries
                </span>
              </div>
            </div>
          </div>

          {/* Physical Notes Breakdown Cards */}
          <Card className="p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-[#384959] dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                Live Physical Notes Breakdown
              </h3>
              <Badge variant="info" className="text-[10px]">Real-Time Note Audit</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
              {[
                { denom: 500, label: '₹500 Note', color: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30' },
                { denom: 200, label: '₹200 Note', color: 'border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30' },
                { denom: 100, label: '₹100 Note', color: 'border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/30' },
                { denom: 50, label: '₹50 Note', color: 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30' },
                { denom: 20, label: '₹20 Note', color: 'border-orange-200 dark:border-orange-900 bg-orange-50/60 dark:bg-orange-950/30' },
                { denom: 10, label: '₹10 Note', color: 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40' },
                { denom: 5, label: '₹5 Note', color: 'border-teal-200 dark:border-teal-900 bg-teal-50/60 dark:bg-teal-950/30' },
                { denom: 2, label: '₹2 Note', color: 'border-violet-200 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/30' },
                { denom: 1, label: 'Coins (₹)', color: 'border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30' }
              ].map(({ denom, label, color }) => {
                const count = homeCashData.denominations_breakdown[String(denom)] || 0;
                const totalVal = denom * count;
                const hasNotes = count > 0;
                return (
                  <div
                    key={denom}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all shadow-2xs hover:shadow-xs ${
                      hasNotes
                        ? `${color} text-slate-800 dark:text-slate-100`
                        : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-700/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 font-heading ${
                        hasNotes
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        ₹{denom}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-[#384959] dark:text-slate-200 truncate">
                            {label}
                          </span>
                          {hasNotes && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 block truncate">
                          {count} {denom === 1 ? 'coins' : 'pcs'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-sm sm:text-base font-black font-mono block ${
                        hasNotes ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        ₹{totalVal.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Subtotal
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Home Safe Audit History Ledger Table (Billing Page / Gulla Management Style) */}
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#384959] dark:text-slate-100 font-heading">
                  Home Safe Transaction Audit History
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-bold border border-slate-200/60 dark:border-slate-700/60">
                  {['ALL', 'SWEEP', 'DEPOSIT', 'WITHDRAWAL'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHistoryFilter(type)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                        historyFilter === type
                          ? 'bg-teal-600 text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {type === 'ALL' ? 'All' : type === 'SWEEP' ? 'Gulla Sweeps' : type === 'DEPOSIT' ? 'Deposits' : 'Withdrawals'}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search history..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-500 outline-none w-36 sm:w-44 font-medium dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {(() => {
              const filteredHistory = (homeCashData.history || []).filter(tx => {
                if (historyFilter !== 'ALL' && tx.entry_type !== historyFilter) return false;
                if (historySearch.trim()) {
                  const q = historySearch.toLowerCase();
                  const matchType = (tx.entry_type_display || '').toLowerCase().includes(q);
                  const matchNotes = (tx.notes || '').toLowerCase().includes(q);
                  const matchUser = (tx.created_by_name || '').toLowerCase().includes(q);
                  const matchDate = (tx.created_at || '').toLowerCase().includes(q);
                  const matchAmt = String(tx.amount || '').includes(q);
                  const matchBreakdown = (tx.notes_summary || '').toLowerCase().includes(q);
                  return matchType || matchNotes || matchUser || matchDate || matchAmt || matchBreakdown;
                }
                return true;
              });

              if (filteredHistory.length === 0) {
                return (
                  <div className="py-12 text-center space-y-2">
                    <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No Safe Transactions Found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search filter or add a deposit/withdrawal above.</p>
                  </div>
                );
              }

              return (
                <>
                  {/* 1. Mobile Cards View (< md screens) */}
                  <div className="block md:hidden space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredHistory.map((tx) => {
                      const isSweep = tx.entry_type === 'SWEEP';
                      const isDeposit = tx.entry_type === 'DEPOSIT';
                      const isPositive = isSweep || isDeposit;

                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-2xs hover:shadow-xs transition-all"
                        >
                          {/* Top Row: Type Badge + Amount */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                                isSweep
                                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
                                  : isDeposit
                                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                  : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                              }`}
                            >
                              {isSweep && <Sparkles className="w-3 h-3 text-sky-500" />}
                              {isDeposit && <ArrowDownLeft className="w-3 h-3 text-emerald-500" />}
                              {!isPositive && <ArrowUpRight className="w-3 h-3 text-rose-500" />}
                              {tx.entry_type_display || tx.entry_type}
                            </span>

                            <span
                              className={`font-black text-sm sm:text-base font-mono tracking-tight ${
                                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isPositive ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Transaction Notes / Purpose */}
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                            {tx.notes || (isSweep ? 'End of Day Gulla Safe Cash Sweep' : 'Manual Home Safe Transaction')}
                          </div>

                          {/* Note Breakdown Summary Pills */}
                          {tx.notes_summary && tx.notes_summary !== 'N/A' && (
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Notes Breakdown
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 truncate">
                                {tx.notes_summary}
                              </span>
                            </div>
                          )}

                          {/* Metadata Footer: Date, Clock, Performed By, Balance After */}
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/80 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{tx.created_at}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                Vault: ₹{Number(tx.balance_after || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                • {tx.created_by_name || 'Admin'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. Desktop & Tablet View Table (>= md screens) */}
                  <div className="hidden md:block max-h-[480px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-950/60 shadow-xs custom-scrollbar">
                    <table className="w-full text-left text-xs min-w-[850px]">
                      <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-700 shadow-xs">
                        <tr>
                          <th className="py-3.5 px-4 whitespace-nowrap">Date & Time</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Entry Type</th>
                          <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">Cash Amount</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Note Breakdown</th>
                          <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[130px]">Safe Balance After</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">Action By</th>
                          <th className="py-3.5 px-4">Notes / Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredHistory.map((tx) => {
                          const isSweep = tx.entry_type === 'SWEEP';
                          const isDeposit = tx.entry_type === 'DEPOSIT';
                          const isPositive = isSweep || isDeposit;

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              {/* Date & Time */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {tx.created_at}
                                </div>
                              </td>

                              {/* Entry Type Badge */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                                    isSweep
                                      ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800/60'
                                      : isDeposit
                                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                                      : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60'
                                  }`}
                                >
                                  {isSweep && <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />}
                                  {isDeposit && <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                                  {!isPositive && <ArrowUpRight className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                                  {tx.entry_type_display || tx.entry_type}
                                </span>
                              </td>

                              {/* Cash Amount */}
                              <td className={`py-3.5 px-4 text-right font-black font-mono text-sm tracking-tight whitespace-nowrap ${
                                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isPositive ? '+' : '-'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Note Breakdown */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-mono text-xs font-bold border border-slate-200/80 dark:border-slate-700/80">
                                  {tx.notes_summary || 'N/A'}
                                </span>
                              </td>

                              {/* Safe Balance After */}
                              <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-slate-800 dark:text-slate-100 whitespace-nowrap">
                                ₹{Number(tx.balance_after || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Performed By */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                                  <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                  <span>{tx.created_by_name || 'Admin'}</span>
                                </div>
                              </td>

                              {/* Notes / Purpose */}
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                {tx.notes || 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </Card>
        </div>
      )}

      {/* 💰 Home Cash Deposit / Withdrawal Modal */}
      <Modal
        isOpen={isHomeCashModalOpen}
        onClose={() => setIsHomeCashModalOpen(false)}
        title={homeCashModalType === 'DEPOSIT' ? 'Deposit Cash to Home Safe' : 'Withdraw Cash from Home Safe'}
        subtitle={homeCashModalType === 'DEPOSIT' ? 'Record physical currency notes added to home safe' : `Record cash withdrawn from home safe (Current balance: ₹${(parseFloat(homeCashData?.home_cash_amount || 0)).toFixed(2)})`}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setIsHomeCashModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmitHomeCashTransaction}
              loading={submittingHomeCash}
              className={homeCashModalType === 'DEPOSIT' ? 'bg-[#00695C] hover:bg-[#004D40] text-white font-extrabold cursor-pointer' : 'bg-amber-600 hover:bg-amber-700 text-white font-extrabold cursor-pointer'}
            >
              Confirm {homeCashModalType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} (₹{calculateHomeNoteTotal(homeNoteCounts).toFixed(2)})
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitHomeCashTransaction} className="space-y-4 font-sans">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Total Calculated Cash Amount:
            </span>
            <span className={`text-2xl font-black font-heading ${
              calculateHomeNoteTotal(homeNoteCounts) > 0
                ? homeCashModalType === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                : 'text-slate-400'
            }`}>
              ₹{calculateHomeNoteTotal(homeNoteCounts).toFixed(2)}
            </span>
          </div>

          {/* Notes Denominations Inputs */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            <label className="text-xs font-bold text-[#384959] dark:text-slate-200 block">
              Enter Physical Note Counts:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((amt) => {
                const count = homeNoteCounts[amt] || '';
                const lineTotal = amt * (parseInt(count) || 0);
                return (
                  <div key={amt} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                    <span className="px-2 py-1 rounded-lg text-xs font-black font-heading bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                      ₹{amt}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={count}
                      onChange={(e) => handleHomeNoteCountChange(amt, e.target.value)}
                      placeholder="0 pcs"
                      className="w-20 text-center py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-[#384959] dark:text-slate-100"
                    />
                    <span className="w-16 text-right font-bold text-slate-500 font-mono text-[11px]">
                      = ₹{lineTotal}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#384959] dark:text-slate-200 block mb-1">
              Transaction Reason / Reference Note:
            </label>
            <input
              type="text"
              value={homeNotesReason}
              onChange={(e) => setHomeNotesReason(e.target.value)}
              placeholder={homeCashModalType === 'DEPOSIT' ? 'e.g. Personal Cash added to safe, EOD float' : 'e.g. Vendor payout from home safe, Owner draw'}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-[#384959] dark:text-slate-100 font-medium"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
