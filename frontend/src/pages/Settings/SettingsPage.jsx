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
  History
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CartLoader } from '../../components/common/CartLoader';
import { settingsApi, authApi, loginAccountsApi, homeCashApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export const SettingsPage = () => {
  const { storeSettings, updateStoreSettings, user, isRole } = useAuth();
  const { showToast } = useNotification();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingMongo, setSyncingMongo] = useState(false);
  const [mongoStatus, setMongoStatus] = useState(null);

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
    primary_color: '#384959',
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

  const fetchMongoStatus = async () => {
    try {
      const res = await authApi.getMongoStatus();
      setMongoStatus(res.data);
    } catch {
      setMongoStatus({ status: 'offline', message: 'MongoDB not reachable' });
    }
  };

  const fetchLoginAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await loginAccountsApi.getAccounts();
      setLoginAccounts(res.data?.results || res.data || []);
    } catch (err) {
      console.error('Failed to load login accounts:', err);
      showToast('Could not load login accounts from database.', 'error');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMongoStatus();
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

  const handleMongoSync = async () => {
    setSyncingMongo(true);
    try {
      const res = await authApi.syncMongoDB();
      showToast(res.data.message || 'MongoDB synchronized successfully!', 'success');
      fetchMongoStatus();
    } catch (err) {
      showToast('MongoDB sync failed. Check database logs.', 'error');
    } finally {
      setSyncingMongo(false);
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
      setHomeCashData(res.data);
    } catch (err) {
      console.error('Failed to fetch home cash data:', err);
    } finally {
      setLoadingHomeCash(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'home_cash') {
      fetchHomeCashData();
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
      showToast('⚠️ કૃપા કરીને રકમ ગણવા માટે નોટો ની સંખ્યા એન્ટર કરો.', 'error');
      return;
    }

    if (homeCashModalType === 'WITHDRAWAL' && totalAmt > homeCashData.home_cash_amount) {
      showToast(`⚠️ Home Safe Warning: ઘરે રાખેલ તિજોરીમાં માત્ર ₹${homeCashData.home_cash_amount.toFixed(2)} જ કેશ ઉપલબ્ધ છે!`, 'error');
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#384959] via-[#4A5D6E] to-[#2B3A48] dark:from-slate-900 dark:to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#88BDF2] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Database className="w-3.5 h-3.5" /> 100% Database Driven Module
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Admin & Store Settings
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Configure store identity, user login credentials, OTP delivery emails, GST structures, and security settings stored in database.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={fetchSettings}
              disabled={saving}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Save}
              onClick={handleSubmit}
              loading={saving}
              className="bg-[#88BDF2] text-[#384959] hover:bg-sky-300 font-extrabold shadow-lg"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto touch-pan pb-2 gap-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all shrink-0 font-medium text-xs sm:text-sm ${
                isActive
                  ? 'bg-[#384959] text-white dark:bg-[#88BDF2] dark:text-[#384959] font-bold shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-[#384959]' : 'text-slate-400'}`} />
              <div className="text-left">
                <div>{t.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 6: LOGIN ACCOUNTS & CREDENTIALS */}
      {activeTab === 'logins' && (
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-[#384959] dark:text-[#88BDF2] rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">User Login Credentials Directory</h3>
                  <p className="text-xs text-slate-500">Manage user accounts, usernames, passwords & OTP delivery emails stored in database `login` table</p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={handleOpenCreateAccountModal}
                className="bg-[#384959] text-white hover:bg-slate-700 font-bold self-start sm:self-auto"
              >
                Add New Login Account
              </Button>
            </div>

            {loadingAccounts ? (
              <div className="py-8 flex justify-center">
                <CartLoader text="Loading Login Accounts..." size="sm" />
              </div>
            ) : loginAccounts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No custom login accounts found in `login` table. Click "Add New Login Account" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto touch-pan">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b-2 border-[#384959] text-[#384959] dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">User / Full Name</th>
                      <th className="py-3 px-3">Username</th>
                      <th className="py-3 px-3">OTP Delivery Email</th>
                      <th className="py-3 px-3">Password</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3 text-center">OTP Verification</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loginAccounts.map((acc) => {
                      const isShowPass = !!showPasswordMap[acc.id];
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{acc.full_name}</p>
                            <span className="text-[10px] text-slate-400">ID: #{acc.id}</span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-[#384959] dark:text-[#88BDF2]">
                            {acc.username}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{acc.email || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono">
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
                          <td className="py-3.5 px-3">
                            <Badge variant={acc.role === 'ADMIN' ? 'primary' : 'secondary'} size="sm">
                              {acc.role_label || acc.role}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-3 text-center">
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
                          <td className="py-3.5 px-3 text-center">
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
                          <td className="py-3.5 px-3 text-right">
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
            )}
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100 font-mono text-xs"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100 font-mono"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100 font-mono"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Branding Preview */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Header Live Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 p-1.5 border border-slate-200 flex items-center justify-center shrink-0">
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono uppercase dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono uppercase dark:text-slate-100"
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
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono uppercase dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono uppercase dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono text-xs dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono dark:text-slate-100"
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono uppercase dark:text-slate-100"
                      placeholder="INR"
                    />
                  </div>
                </div>
              </Card>

              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-[#384959]/10 text-[#384959] dark:text-[#88BDF2] rounded-xl">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Appearance & Theme Mode</h3>
                    <p className="text-xs text-slate-500">Store management system theme preference</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Current Mode: <span className="capitalize">{theme}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">Toggle dark / light mode interface</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={toggleTheme}>
                      Toggle Theme
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none transition-all font-mono dark:text-slate-100"
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

              <Card className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Database Sync & Status</h3>
                    <p className="text-xs text-slate-500">MongoDB analytics replication status</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">MongoDB Status</span>
                      <Badge variant={mongoStatus?.connected ? 'success' : 'warning'} size="sm">
                        {mongoStatus?.connected ? 'Online' : 'Offline / Standby'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{mongoStatus?.message || 'Checking status...'}</p>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={RefreshCw}
                      onClick={handleMongoSync}
                      loading={syncingMongo}
                      className="w-full justify-center mt-2"
                    >
                      Sync All Collections to MongoDB
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Bottom Floating Actions */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md">
            <span className="text-xs text-slate-500">
              Last Updated: {formData.updated_at ? new Date(formData.updated_at).toLocaleString('en-IN') : 'Just now'}
            </span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={fetchSettings}
                disabled={saving}
              >
                Cancel / Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Save}
                loading={saving}
                className="bg-[#384959] text-white hover:bg-slate-700 font-bold"
              >
                Save Settings to Database
              </Button>
            </div>
          </div>
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none font-medium dark:text-slate-100"
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none font-mono font-bold dark:text-slate-100"
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none font-mono dark:text-slate-100"
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
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-400 mt-1">OTP verification codes for this account will be sent to this email address.</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">System Role *</label>
            <select
              value={accountFormData.role}
              onChange={(e) => setAccountFormData({ ...accountFormData, role: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-none font-medium dark:text-slate-100"
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
            <Button variant="primary" size="sm" type="submit" loading={submittingAccount} className="bg-[#384959] text-white font-bold">
              {editingAccount ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* TAB: HOME SAFE CASH VAULT */}
      {activeTab === 'home_cash' && (
        <div className="space-y-6">
          {/* Top Banner Card with Balance */}
          <Card className="p-6 bg-gradient-to-r from-slate-900 via-[#384959] to-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                  <Landmark className="w-3.5 h-3.5 text-emerald-400" /> Home Cash Vault (ઘરે રાખેલ તિજોરી કેશ)
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-heading">
                  ₹{homeCashData.home_cash_amount.toFixed(2)}
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg border border-emerald-500 cursor-pointer"
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

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">Home Cash Balance</span>
                <span className="text-xl font-black text-[#384959] dark:text-emerald-400 font-heading">₹{homeCashData.home_cash_amount.toFixed(2)}</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="p-3 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">Total Deposits & Sweeps</span>
                <span className="text-xl font-black text-[#384959] dark:text-sky-400 font-heading">₹{homeCashData.total_deposits.toFixed(2)}</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">Total Home Withdrawals</span>
                <span className="text-xl font-black text-[#384959] dark:text-rose-400 font-heading">₹{homeCashData.total_withdrawals.toFixed(2)}</span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">Total Audit Entries</span>
                <span className="text-xl font-black text-[#384959] dark:text-amber-400 font-heading">{homeCashData.total_transactions} Entries</span>
              </div>
            </Card>
          </div>

          {/* Physical Notes Breakdown Cards */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-[#384959] dark:text-slate-100 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#88BDF2]" />
                Live Physical Notes Breakdown (ઘરે રાખેલ નોટો નો હિસાબ)
              </h3>
              <Badge variant="info">Automated Net Note Audit</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((denom) => {
                const count = homeCashData.denominations_breakdown[String(denom)] || 0;
                const totalVal = denom * count;
                return (
                  <div key={denom} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-center space-y-1">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 inline-block font-heading">
                      ₹{denom}
                    </span>
                    <span className="text-lg font-black text-[#384959] dark:text-slate-100 block font-mono">
                      {count} <span className="text-[10px] font-normal text-slate-400">pcs</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block font-mono">
                      = ₹{totalVal}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Home Safe Audit History Ledger Table */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-[#384959] dark:text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#88BDF2]" />
                  Home Safe Transaction Audit History (ઘરે તિજોરી નો સંપૂર્ણ હિસાબ)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete history of Day-End Gulla Sweeps, manual home deposits & withdrawals with note breakdown.
                </p>
              </div>
            </div>

            <div className="table-scroll-container border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-96 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Entry Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Note Breakdown</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4">Action By</th>
                    <th className="py-3 px-4">Notes / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {homeCashData.history.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                        No Home Safe cash transactions logged yet.
                      </td>
                    </tr>
                  ) : (
                    homeCashData.history.map((tx) => {
                      const isSweep = tx.entry_type === 'SWEEP';
                      const isDeposit = tx.entry_type === 'DEPOSIT';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {tx.created_at}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              isSweep
                                ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                : isDeposit
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}>
                              {tx.entry_type_display}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-black font-mono text-sm ${
                            isSweep || isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {isSweep || isDeposit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                            {tx.notes_summary}
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-mono text-slate-800 dark:text-slate-100">
                            ₹{tx.balance_after.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            {tx.created_by_name}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {tx.notes}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 💰 Home Cash Deposit / Withdrawal Modal */}
      <Modal
        isOpen={isHomeCashModalOpen}
        onClose={() => setIsHomeCashModalOpen(false)}
        title={homeCashModalType === 'DEPOSIT' ? 'Deposit Cash to Home Safe (ઘરે રોકડ ઉમેરો/જમા કરો)' : 'Withdraw Cash from Home Safe (ઘરેથી રોકડ ઉપાડ)'}
        subtitle={homeCashModalType === 'DEPOSIT' ? 'Record physical currency notes added to home safe' : `Record cash withdrawn from home safe (Current balance: ₹${homeCashData.home_cash_amount.toFixed(2)})`}
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
              className={homeCashModalType === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer' : 'bg-amber-600 hover:bg-amber-700 text-white font-extrabold cursor-pointer'}
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
              Enter Physical Note Counts (નોટોની સંખ્યા એન્ટર કરો):
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
              Transaction Reason / Reference Note (કારણ / વિગત):
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
