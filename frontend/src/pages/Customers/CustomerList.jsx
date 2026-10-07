import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, Pagination, ConfirmDialog, EmptyState } from '../../components/common/UiHelpers';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  Eye, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  Wallet, 
  Receipt, 
  Calculator, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Calendar,
  Banknote,
  Smartphone,
  Building2,
  Minus,
  CheckCircle2,
  IndianRupee
} from 'lucide-react';
import { customerApi } from '../../services/customerApi';
import { extractList } from '../../utils/apiHelpers';
import { useNotification } from '../../context/NotificationContext';
import useDebounce from '../../hooks/useDebounce';

export const CustomerList = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Primary Data State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, BLOCKED
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Image matching Bill Page style) or 'table'
  const debouncedSearch = useDebounce(search, 350);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyData, setHistoryData] = useState({ orders: [], stats: null, total_orders: 0 });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Add / Edit Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    pincode: '',
    notes: '',
  });

  // Khata Payment Modal
  const [isKhataOpen, setIsKhataOpen] = useState(false);
  const [khataCustomer, setKhataCustomer] = useState(null);
  const [khataForm, setKhataForm] = useState({
    amount: '',
    cash_tendered: '',
    payment_method: 'CASH',
    notes: 'Khata Payment',
    order_id: null,
  });
  const [submittingKhata, setSubmittingKhata] = useState(false);
  const [khataNoteCounts, setKhataNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });

  // Delete Dialog State
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Load Customers from Backend API
  const loadCustomers = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: 20,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };
      const res = await customerApi.getCustomers(params, { signal });
      const list = extractList(res);
      setCustomers(list);

      const pagMeta = res.data?.pagination || res.pagination;
      const total = pagMeta?.total || pagMeta?.total_items || list.length;
      const totalP = pagMeta?.total_pages || Math.ceil(total / 20) || 1;

      setTotalItems(total);
      setTotalPages(totalP);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Error fetching customers:', err);
      setError('Failed to load customer records from database.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    loadCustomers(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadCustomers]);

  // Handlers for search & filters
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: 'Mumbai',
      pincode: '',
      notes: '',
    });
    setEditingCustomer(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      city: cust.city || 'Mumbai',
      pincode: cust.pincode || '',
      notes: cust.notes || '',
    });
    setIsFormOpen(true);
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Name and Phone number are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, formData);
        showToast(`Customer "${formData.name}" updated successfully`, 'success');
      } else {
        await customerApi.createCustomer(formData);
        showToast(`Customer "${formData.name}" created successfully`, 'success');
      }
      setIsFormOpen(false);
      resetForm();
      loadCustomers();
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save customer record';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Block Status
  const handleToggleBlock = async (cust) => {
    try {
      await customerApi.toggleCustomerBlock(cust.id);
      const action = cust.status === 'BLOCKED' ? 'unblocked' : 'blocked';
      showToast(`Customer "${cust.name}" ${action} successfully`, 'success');
      loadCustomers();
    } catch (err) {
      showToast('Failed to change customer status', 'error');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setSubmittingDelete(true);
    try {
      await customerApi.deleteCustomer(deletingCustomer.id);
      showToast(`Customer "${deletingCustomer.name}" deleted successfully`, 'success');
      setDeletingCustomer(null);
      loadCustomers();
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.message || 'Failed to delete customer';
      showToast(errMsg, 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  // View Customer Profile & Purchase History
  const handleOpenProfile = async (cust) => {
    setSelectedCustomer(cust);
    setLoadingHistory(true);
    setHistoryData({ orders: [], stats: null, total_orders: 0 });
    try {
      const res = await customerApi.getCustomerHistory(cust.id, { page: 1, limit: 10 });
      const data = res.data?.data || res.data || {};
      setHistoryData({
        orders: data.orders || [],
        stats: data.stats || null,
        total_orders: data.total_orders || 0
      });
    } catch (err) {
      console.error('Error fetching purchase history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Khata Payment Modal Handlers
  const handleOpenKhata = (cust) => {
    setKhataCustomer(cust);
    const dueAmount = cust.outstanding_balance || cust.pending_payments || 0;
    setKhataForm({
      amount: dueAmount > 0 ? String(dueAmount) : '',
      cash_tendered: '',
      payment_method: 'CASH',
      notes: 'Khata Payment',
      order_id: null,
    });
    setKhataNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
    setIsKhataOpen(true);
  };

  const getDenomBreakdownText = (counts) => {
    const denoms = [500, 200, 100, 50, 20, 10, 5, 1];
    const parts = denoms
      .filter(d => parseInt(counts[d] || '0', 10) > 0)
      .map(d => d === 1 ? `Coins: ₹${counts[d]}` : `₹${d}×${counts[d]}`);
    return parts.join(' + ') || '';
  };

  const handleKhataNoteChange = (denom, valStr) => {
    const cleanVal = valStr.replace(/[^0-9]/g, '');
    const updatedCounts = { ...khataNoteCounts, [denom]: cleanVal };
    setKhataNoteCounts(updatedCounts);

    const denoms = [500, 200, 100, 50, 20, 10, 5, 1];
    const newTotal = denoms.reduce((acc, d) => {
      const cnt = parseInt(updatedCounts[d] || '0', 10);
      return acc + (d === 1 ? cnt : cnt * d);
    }, 0);

    const noteText = getDenomBreakdownText(updatedCounts);

    setKhataForm(prev => ({
      ...prev,
      cash_tendered: newTotal > 0 ? String(newTotal) : prev.cash_tendered,
      amount: prev.amount || (newTotal > 0 ? String(newTotal) : prev.amount),
      notes: noteText ? `Khata Payment (Notes: ${noteText})` : prev.notes
    }));
  };

  const handleRecordKhata = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(khataForm.amount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setSubmittingKhata(true);
    try {
      const res = await customerApi.recordKhataPayment(khataCustomer.id, {
        amount: amountNum,
        payment_method: khataForm.payment_method,
        notes: khataForm.notes,
        order_id: khataForm.order_id || null
      });
      showToast(res.data?.message || `Recorded payment of ₹${amountNum.toFixed(2)} for ${khataCustomer.name}`, 'success');
      setIsKhataOpen(false);
      setKhataCustomer(null);
      loadCustomers();
    } catch (err) {
      showToast('Failed to record Khata payment', 'error');
    } finally {
      setSubmittingKhata(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `₹${num.toFixed(2)}`;
  };

  const activeCount = customers.filter(c => c.status !== 'BLOCKED').length;
  const blockedCount = customers.filter(c => c.status === 'BLOCKED').length;
  const khataDueCount = customers.filter(c => (Number(c.outstanding_balance || c.pending_payments) || 0) > 0).length;
  const totalKhataDue = customers.reduce((acc, c) => acc + (Number(c.outstanding_balance || c.pending_payments) || 0), 0);

  const displayedCustomers = customers.filter(c => {
    if (statusFilter === 'ACTIVE') return c.status !== 'BLOCKED';
    if (statusFilter === 'BLOCKED') return c.status === 'BLOCKED';
    if (statusFilter === 'KHATA_DUE') return (Number(c.outstanding_balance || c.pending_payments) || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40] pb-10">
      {/* 📱 MOBILE / TABLET COMPACT PASTEL MINT HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
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
            {/* 1. Pure White Circular Back Button */}
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
                Customer <span className="text-[#00695C] dark:text-[#4DB6AC]">Directory</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Manage customer profiles, khata balance & purchase histories
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart Edge-to-Edge Desktop Header Banner */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                  Customer <span className="text-[#00796b] dark:text-[#80cbc4]">Directory</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Directory
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Manage grocery customer profiles, khata balance statements & purchase histories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-teal-200/60 dark:border-slate-700 shadow-2xs text-xs font-bold">
              <UserCheck className="w-4 h-4 text-[#00796b] dark:text-[#80cbc4]" />
              <span className="text-slate-600 dark:text-slate-400">Total:</span>
              <span className="text-slate-900 dark:text-white font-extrabold">{totalItems}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-teal-200/60 dark:border-slate-700 shadow-2xs text-xs font-bold">
              <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-slate-600 dark:text-slate-400">Khata Due:</span>
              <span className="text-amber-700 dark:text-amber-400 font-extrabold">{formatCurrency(totalKhataDue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Redesigned Unified Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Controls: Search Input + New Customer Button + View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search customer name, phone, email, city..."
            />
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* New Customer Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#00796b] to-[#004d40] text-white hover:from-[#00695c] hover:to-[#00382e] shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Customer</span>
            </button>

            {/* View Switcher (Grid vs Table) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View (Card layout)"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View (List layout)"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>

              <button
                onClick={() => loadCustomers()}
                title="Refresh Data"
                className="p-1.5 rounded-lg text-xs text-slate-500 hover:text-teal-700 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00796b]' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ⚠️ API Error Alert */}
      {error && (
        <Card variant="danger" className="p-4 border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{error}</span>
          </div>
          <Button variant="danger" size="xs" onClick={() => loadCustomers()}>
            Retry
          </Button>
        </Card>
      )}

      {/* 📊 Customer List Section */}
      {loading && customers.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-[#00796b] border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading Customer Records...</p>
        </div>
      ) : displayedCustomers.length === 0 ? (
        <Card variant="default" className="p-8 border-teal-200/80 dark:border-slate-800">
          <EmptyState
            icon={Users}
            title={search ? 'No matching customers' : 'No customers registered'}
            description={search ? `No customer records match "${search}".` : 'Start adding customers to manage their profiles, order histories, and Khata statements.'}
            actionLabel={search ? 'Clear Search' : 'Add First Customer'}
            onAction={search ? () => setSearch('') : handleOpenAddModal}
            actionIcon={search ? RefreshCw : Plus}
          />
        </Card>
      ) : viewMode === 'grid' ? (
        /* 🌟 Card Grid View - Exact match to Inventory Page UI */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {displayedCustomers.map((c) => {
            const pendingBal = Number(c.outstanding_balance || c.pending_payments) || 0;
            const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU';
            const isBlocked = c.status === 'BLOCKED';

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-[#00796b] dark:hover:border-[#80cbc4] transition-all flex flex-col justify-between"
              >
                {/* Top Header: Customer Avatar, Name, ID & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border shadow-2xs ${
                      isBlocked
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                        : 'bg-teal-100/90 text-[#00796b] dark:bg-teal-950/90 dark:text-[#80cbc4] border-teal-200/80'
                    }`}>
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                        {c.name}
                      </h3>
                      <p className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        ID: <span className="font-semibold">#{c.id}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs border ${
                    isBlocked
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200'
                      : 'bg-teal-50 text-[#00796b] dark:bg-teal-950/80 dark:text-teal-300 border-teal-200/80'
                  }`}>
                    {c.status || 'ACTIVE'}
                  </span>
                </div>

                {/* Middle Body: Contact Details Container */}
                <div className="bg-slate-50/80 dark:bg-slate-850 p-3 rounded-xl border border-teal-100/60 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <Phone className="w-3.5 h-3.5 text-[#00796b] dark:text-[#80cbc4] shrink-0" />
                    <span className="font-mono">{c.phone}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}, {c.city || 'Mumbai'}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Row: Total Spent & Khata Due (Matching Bill Page Typography) */}
                <div className="flex items-center justify-between text-xs py-2 border-t border-b border-teal-100/60 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      TOTAL SPENT
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-slate-100 font-heading block">
                      {formatCurrency(c.total_spent)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      KHATA DUE
                    </span>
                    <span className={`text-base font-black font-heading block ${
                      pendingBal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[#00796b] dark:text-[#80cbc4]'
                    }`}>
                      {formatCurrency(pendingBal)}
                    </span>
                  </div>
                </div>

                {/* Bottom Footer: Action Buttons (Inventory Style) */}
                <div className="flex items-center justify-between pt-1 text-xs gap-2 flex-wrap">
                  {/* Update Customer Pill Button */}
                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="px-3 py-1.5 rounded-xl bg-[#E0F2F1] text-[#00695C] dark:bg-teal-950 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 hover:bg-[#B2DFDB] transition-all font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update Customer</span>
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto">
                    {/* Pay / Khata Button */}
                    <button
                      onClick={() => handleOpenKhata(c)}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#00796b] to-[#004d40] text-white hover:from-[#00695c] hover:to-[#00382e] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Pay</span>
                    </button>

                    {/* History Icon Button */}
                    <button
                      onClick={() => handleOpenProfile(c)}
                      title="View History"
                      className="p-1.5 rounded-xl border border-teal-200/80 dark:border-slate-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete Icon Button */}
                    <button
                      onClick={() => setDeletingCustomer(c)}
                      title="Delete Customer"
                      className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="p-0 overflow-hidden border border-teal-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
          <div className="overflow-x-auto touch-pan">
            <table className="w-full min-w-[840px] text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs shadow-2xs">
                <tr className="border-b border-teal-100 dark:border-slate-700/80 text-[#00796b] dark:text-[#80cbc4] font-black uppercase tracking-wider text-[11px] whitespace-nowrap">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Orders & Spent</th>
                  <th className="py-3.5 px-4">Khata Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                {displayedCustomers.map((c) => {
                  const pendingBal = Number(c.outstanding_balance || c.pending_payments) || 0;
                  const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU';
                  const isBlocked = c.status === 'BLOCKED';

                  return (
                    <tr key={c.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs border ${
                            isBlocked
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                              : 'bg-teal-100/90 text-[#00796b] dark:bg-teal-950/90 dark:text-[#80cbc4] border-teal-200/80'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{c.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID: #{c.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Phone className="w-3.5 h-3.5 text-[#00796b] shrink-0" />
                            <span className="font-mono">{c.phone}</span>
                          </div>
                          {c.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate max-w-[160px]">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{c.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                          {c.address || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {c.city || 'Mumbai'} {c.pincode ? `- ${c.pincode}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-black text-slate-900 dark:text-white">
                            {formatCurrency(c.total_spent)}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3 text-slate-400" />
                            <span>{c.total_orders || 0} Orders</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {pendingBal > 0 ? (
                          <div className="inline-flex flex-col">
                            <Badge variant="warning" size="xs" className="font-bold">
                              Due: {formatCurrency(pendingBal)}
                            </Badge>
                            <button
                              onClick={() => handleOpenKhata(c)}
                              className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-bold mt-1 text-left cursor-pointer"
                            >
                              Clear Balance
                            </button>
                          </div>
                        ) : (
                          <Badge variant="success" size="xs" className="font-semibold">
                            Clear (₹0.00)
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                            : 'bg-teal-100 text-[#00695c] dark:bg-teal-950 dark:text-teal-300 border border-teal-200'
                        }`}>
                          {c.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenProfile(c)}
                            title="View Purchase History"
                            className="p-1.5 rounded-lg bg-teal-50 dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenKhata(c)}
                            title="Record Khata Payment"
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Wallet className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(c)}
                            title="Edit Customer"
                            className="p-1.5 rounded-lg border border-teal-200/80 dark:border-slate-700 text-slate-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleBlock(c)}
                            title={isBlocked ? 'Unblock Customer' : 'Block Customer'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingCustomer(c)}
                            title="Delete Customer"
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 📄 Pagination Controls matching OrderList */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={20}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}

      {/* 📝 Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Create New Customer'}
        size="md"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer full name"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Street Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Flat/House No, Building, Street"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="400001"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes / Preferences
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Special instructions or credit limit notes"
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              disabled={submitting}
              className="min-w-[100px] bg-[#00796b] text-white hover:bg-[#004d40]"
            >
              {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 💰 Record Khata Payment Modal */}
      {isKhataOpen && khataCustomer && (() => {
        const dueAmount = khataCustomer.outstanding_balance || khataCustomer.pending_payments || 0;
        const amountNum = parseFloat(khataForm.amount) || 0;
        const isOverpaying = amountNum > dueAmount && dueAmount > 0;
        const isInvalidAmount = !amountNum || amountNum <= 0 || isOverpaying;
        const remainingBalance = Math.max(0, dueAmount - amountNum);
        
        const cashCountTotal = [500, 200, 100, 50, 20, 10, 5, 1].reduce((acc, d) => {
          const cnt = parseInt(khataNoteCounts[d] || '0', 10);
          return acc + (d === 1 ? cnt : cnt * d);
        }, 0);

        const updateDenomCount = (denom, delta) => {
          const currentCnt = parseInt(khataNoteCounts[denom] || '0', 10);
          const newCnt = Math.max(0, currentCnt + delta);
          handleKhataNoteChange(denom, newCnt === 0 ? '' : newCnt.toString());
        };

        return (
          <Modal
            isOpen={isKhataOpen}
            onClose={() => setIsKhataOpen(false)}
            maxWidth="max-w-xl"
            title={
              <span className="flex items-center gap-3 text-left">
                <span className="w-10 h-10 rounded-2xl bg-[#00796b] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#00796b]/20 shrink-0">
                  <IndianRupee className="w-5 h-5" />
                </span>
                <span className="block min-w-0">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight block">
                    Record Khata Payment
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                    Customer: <strong className="text-slate-800 dark:text-slate-100">{khataCustomer.name}</strong>
                  </span>
                </span>
              </span>
            }
            footer={
              <div className="w-full flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsKhataOpen(false)} 
                  disabled={submittingKhata}
                  className="px-5 py-2.5 rounded-xl font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={handleRecordKhata}
                  disabled={submittingKhata || isInvalidAmount}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    isInvalidAmount
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-[#00796b] hover:bg-[#004d40] text-white shadow-teal-600/20 active:scale-95 cursor-pointer'
                  }`}
                >
                  {submittingKhata ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Payment</span>
                    </>
                  )}
                </Button>
              </div>
            }
          >
            <form onSubmit={handleRecordKhata} className="space-y-5 font-sans text-slate-800 dark:text-slate-100 pb-1">
              
              {/* 1. Pending Khata Balance Card */}
              <div className={`p-4 rounded-2xl border shadow-2xs flex items-center justify-between transition-all ${
                dueAmount > 0 
                  ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/40 dark:from-slate-800/90 dark:to-amber-950/30 border-amber-200/80 dark:border-amber-800/50' 
                  : 'bg-gradient-to-br from-emerald-50/90 to-teal-50/40 dark:from-slate-800/90 dark:to-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/50'
              }`}>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Wallet className="w-3.5 h-3.5 text-[#00796b] dark:text-teal-400" />
                    <span>Current Pending Khata Balance</span>
                  </div>
                  <div className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                    Customer ID: <span className="font-semibold text-slate-600 dark:text-slate-300">#ID-{khataCustomer.id}</span>
                  </div>
                </div>
                <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight shrink-0 ${
                  dueAmount > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {formatCurrency(dueAmount)}
                </div>
              </div>

              {/* 2. Payment Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Payment Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  {dueAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setKhataForm({ ...khataForm, amount: String(dueAmount) })}
                      className="text-[11px] font-semibold text-[#00796b] hover:text-[#004d40] dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Pay Full Amount ({formatCurrency(dueAmount)})
                    </button>
                  )}
                </div>

                <div className="relative rounded-2xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-lg font-mono">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={khataForm.amount}
                    onChange={(e) => setKhataForm({ ...khataForm, amount: e.target.value })}
                    placeholder="0.00"
                    className={`w-full pl-9 pr-4 py-3 text-lg font-black bg-white dark:bg-slate-800 border rounded-2xl outline-hidden font-mono transition-all ${
                      isOverpaying 
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 text-rose-700 dark:text-rose-300' 
                        : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#00796b] text-slate-900 dark:text-white'
                    }`}
                  />
                </div>

                {/* Validation Feedback */}
                {isOverpaying ? (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Payment amount cannot be greater than pending Khata balance ({formatCurrency(dueAmount)}).
                  </p>
                ) : !khataForm.amount || amountNum <= 0 ? (
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Enter the exact amount collected from the customer.
                  </p>
                ) : null}
              </div>

              {/* 3. Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'CASH', label: 'CASH', icon: Banknote },
                    { id: 'UPI', label: 'UPI / GPay', icon: Smartphone },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                    { id: 'NET_BANKING', label: 'Net Bank', icon: Building2 },
                  ].map((method) => {
                    const MethodIcon = method.icon;
                    const isSelected = khataForm.payment_method === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setKhataForm({ ...khataForm, payment_method: method.id })}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-[#00796b] text-[#00796b] dark:text-teal-300 shadow-2xs ring-1 ring-[#00796b]' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <MethodIcon className={`w-4 h-4 ${isSelected ? 'text-[#00796b] dark:text-teal-300' : 'text-slate-400'}`} />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Quick Cash Denomination Counter */}
              {khataForm.payment_method === 'CASH' && (
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-[#00796b] dark:text-teal-400" />
                      Quick Cash Counter
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Cash Total:</span>
                      <span className="text-xs font-bold text-[#00796b] dark:text-teal-300 font-mono">
                        {formatCurrency(cashCountTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[500, 200, 100, 50, 20, 10, 5, 1].map((denom) => {
                      const count = khataNoteCounts[denom] || '';
                      return (
                        <div key={denom} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono w-10 shrink-0">
                            ₹{denom}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateDenomCount(denom, -1)}
                              className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                              title="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={count}
                              onChange={(e) => handleKhataNoteChange(denom, e.target.value)}
                              placeholder="0"
                              className="w-8 text-center py-0.5 text-xs font-mono font-bold bg-transparent outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => updateDenomCount(denom, 1)}
                              className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                              title="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Payment Note / Reference */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Payment Note / Reference
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Optional</span>
                </div>
                <input
                  type="text"
                  value={khataForm.notes}
                  onChange={(e) => setKhataForm({ ...khataForm, notes: e.target.value })}
                  placeholder="e.g., Transaction reference, receipt note, or notes breakdown"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden transition-all text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* 6. Live Payment Summary */}
              <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Payment Summary
                </span>
                <div className="space-y-1.5 font-medium pt-0.5">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Pending Khata Balance</span>
                    <span className="font-mono font-bold">{formatCurrency(dueAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold">
                    <span>Payment Amount</span>
                    <span className="font-mono text-[#00796b] dark:text-teal-400">{formatCurrency(amountNum)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
                    <span>Remaining Khata Balance</span>
                    <span className={`font-mono text-sm ${remainingBalance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>

            </form>
          </Modal>
        );
      })()}

      {/* 👁️ View Customer Profile & Purchase History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          maxWidth="max-w-3xl"
          title={
            <span className="flex items-center gap-3 text-left">
              <span className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-teal-600/20 shrink-0 tracking-wider">
                {(() => {
                  const parts = (selectedCustomer.name || '').trim().split(/\s+/);
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  }
                  return (selectedCustomer.name || 'CU').slice(0, 2).toUpperCase();
                })()}
              </span>
              <span className="block min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                    {selectedCustomer.name}
                  </span>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    #ID-{selectedCustomer.id}
                  </span>
                </span>
                <span className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    selectedCustomer.status === 'BLOCKED' 
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60' 
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCustomer.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                    {selectedCustomer.status === 'BLOCKED' ? 'Blocked Customer' : 'Active Customer'}
                  </span>
                </span>
              </span>
            </span>
          }
          footer={
            <div className="w-full flex items-center justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCustomer(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer text-sm shadow-xs"
              >
                Close Profile
              </Button>
            </div>
          }
        >
          <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 pb-2">
            
            {/* 1. Summary Cards (3-Card Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Total Spent Card */}
              <div className="p-4 bg-gradient-to-br from-teal-50/80 to-emerald-50/40 dark:from-slate-800/90 dark:to-teal-950/30 rounded-2xl border border-teal-200/80 dark:border-teal-800/50 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                    Total Spent
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(selectedCustomer.total_spent)}
                </div>
                <p className="text-[11px] font-medium text-teal-700/80 dark:text-teal-400 mt-1">
                  Lifetime spending
                </p>
              </div>

              {/* Total Orders Card */}
              <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-slate-800/90 dark:to-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                    Total Orders
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {selectedCustomer.total_orders || historyData.total_orders || 0}
                </div>
                <p className="text-[11px] font-medium text-blue-700/80 dark:text-blue-400 mt-1">
                  Orders placed
                </p>
              </div>

              {/* Pending Khata Card */}
              <div className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-slate-800/90 dark:to-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Pending Khata
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-300 tracking-tight">
                  {formatCurrency(selectedCustomer.outstanding_balance || selectedCustomer.pending_payments || 0)}
                </div>
                <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400 mt-1">
                  Outstanding amount
                </p>
              </div>
            </div>

            {/* 2. Customer Information Section */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Customer Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Phone */}
                <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Phone Number</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                      {selectedCustomer.phone || '-'}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Email Address</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate block">
                      {selectedCustomer.email || 'Not available'}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Account Status</span>
                    <div className="mt-0.5">
                      <Badge variant={selectedCustomer.status === 'BLOCKED' ? 'danger' : 'success'} size="xs">
                        {selectedCustomer.status || 'ACTIVE'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Delivery Address</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug block">
                      {[selectedCustomer.address, selectedCustomer.city, selectedCustomer.pincode].filter(Boolean).join(', ') || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Recent Orders & Bills Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Recent Orders & Bills
                </h4>
                {historyData.orders && historyData.orders.length > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    Showing {historyData.orders.length} {historyData.orders.length === 1 ? 'order' : 'orders'}
                  </span>
                )}
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                    Loading order history...
                  </div>
                </div>
              ) : !historyData.orders || historyData.orders.length === 0 ? (
                /* Empty State */
                <div className="py-10 px-4 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 shadow-xs">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    No orders yet
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    This customer hasn't placed any orders yet. Orders will appear here after the customer completes a purchase.
                  </p>
                </div>
              ) : (
                /* Orders List */
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {historyData.orders.map((o) => (
                    <div 
                      key={o.id}
                      className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-700/70 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/50">
                            #ORD-{o.order_number || o.id}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-3 pt-0.5">
                          <span>{o.items_count ? `${o.items_count} Items` : 'Order Summary'}</span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-slate-500 dark:text-slate-400">Payment: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{o.payment_method || 'Cash on Delivery'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(o.total_amount)}
                          </div>
                          <div className="mt-0.5">
                            <Badge 
                              variant={
                                o.payment_status === 'PAID' || o.payment_status === 'COMPLETED' ? 'success' : 
                                o.payment_status === 'CANCELLED' ? 'danger' : 'warning'
                              } 
                              size="xs"
                            >
                              {o.payment_status || 'COMPLETED'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </Modal>
      )}

      {/* 🗑️ Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDeleteCustomer}
        title={`Delete Customer: ${deletingCustomer?.name}`}
        message={`Are you sure you want to delete "${deletingCustomer?.name}" (${deletingCustomer?.phone})? This record will be permanently removed.`}
        confirmText="Delete Customer"
        cancelText="Cancel"
        isDanger={true}
        loading={submittingDelete}
      />
    </div>
  );
};

export default CustomerList;
