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
  ArrowLeft
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

  const totalKhataDue = customers.reduce((acc, c) => acc + (Number(c.outstanding_balance || c.pending_payments) || 0), 0);

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
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
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
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

      {/* 🌟 Top Header Banner (Desktop Only) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                  Customer Directory
                </h1>
                <Badge variant="teal" size="sm" className="font-extrabold uppercase tracking-wide">
                  Real DB Connected
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 font-medium truncate">
                Manage grocery customer profiles, khata balance statements & purchase histories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-teal-200/60 dark:border-slate-700 shadow-2xs text-xs font-bold">
              <UserCheck className="w-4 h-4 text-[#00796b] dark:text-[#80cbc4]" />
              <span className="text-slate-600 dark:text-slate-400">Total Records:</span>
              <span className="text-slate-900 dark:text-white font-extrabold">{totalItems}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-teal-200/60 dark:border-slate-700 shadow-2xs text-xs font-bold">
              <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-slate-600 dark:text-slate-400">Total Khata Due:</span>
              <span className="text-amber-700 dark:text-amber-400 font-extrabold">{formatCurrency(totalKhataDue)}</span>
            </div>

            <Button
              variant="teal"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer bg-[#00796b] hover:bg-[#004d40] text-white"
            >
              <Plus className="w-4 h-4" />
              <span>New Customer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 🔍 Controls & Search Bar Container matching OrderList */}
      <Card variant="default" className="p-4 sm:p-5 border-teal-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Search Input */}
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search Customer Name, Phone Number, Email, City..."
              className="w-full"
            />
          </div>

          {/* Status Tabs & Controls matching Bill Page */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
            
            {/* Status Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-teal-200/60 dark:border-slate-700">
              <button
                onClick={() => handleStatusFilterChange('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All Customers
              </button>
              <button
                onClick={() => handleStatusFilterChange('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleStatusFilterChange('BLOCKED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'BLOCKED'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Blocked
              </button>
            </div>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-teal-200/60 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View (Image matching Bill Page)"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => loadCustomers()}
              title="Refresh Customer Data"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700 hover:text-[#00796b] dark:hover:text-[#80cbc4] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00796b]' : ''}`} />
            </button>
          </div>

        </div>
      </Card>

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
      ) : customers.length === 0 ? (
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
        /* 🌟 Card Grid View - Exact match to Bill Management UI & User Screenshot */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {customers.map((c) => {
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

                {/* Bottom Footer: Action Buttons (Exact Match to Screenshot & OrderList) */}
                <div className="flex items-center justify-between pt-1 text-xs gap-2">
                  {/* History / Details Button */}
                  <button
                    onClick={() => handleOpenProfile(c)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-teal-50 text-[#00796b] dark:bg-slate-800 dark:text-[#80cbc4] border border-teal-200/70 dark:border-slate-700 hover:bg-teal-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>History</span>
                  </button>

                  {/* Pay / Khata Button */}
                  <button
                    onClick={() => handleOpenKhata(c)}
                    className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#00796b] text-white hover:bg-[#004d40] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5 flex-1 justify-center"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Pay</span>
                  </button>

                  {/* Edit Icon Button */}
                  <button
                    onClick={() => handleOpenEditModal(c)}
                    title="Edit Customer"
                    className="p-1.5 rounded-xl border border-teal-200/80 dark:border-slate-700 text-slate-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
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
                {customers.map((c) => {
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

      {/* 💰 Khata Payment Modal */}
      {isKhataOpen && khataCustomer && (
        <Modal
          isOpen={isKhataOpen}
          onClose={() => setIsKhataOpen(false)}
          title={`Record Khata Payment: ${khataCustomer.name}`}
          size="md"
        >
          <form onSubmit={handleRecordKhata} className="space-y-4 font-sans text-slate-800 dark:text-slate-100">
            <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold block">Current Pending Khata Balance:</span>
                <span className="text-xs text-slate-500">Customer ID: #{khataCustomer.id}</span>
              </div>
              <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                {formatCurrency(khataCustomer.outstanding_balance || khataCustomer.pending_payments || 0)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={khataForm.amount}
                  onChange={(e) => setKhataForm({ ...khataForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={khataForm.payment_method}
                  onChange={(e) => setKhataForm({ ...khataForm, payment_method: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden font-bold"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            {/* Quick Currency Denomination Counter */}
            {khataForm.payment_method === 'CASH' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#00796b]" />
                    Quick Cash Denomination Counter
                  </span>
                  {khataForm.cash_tendered && (
                    <span className="text-[#00796b] dark:text-[#80cbc4] font-mono">Tendered: ₹{khataForm.cash_tendered}</span>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[500, 200, 100, 50, 20, 10, 5, 1].map((denom) => (
                    <div key={denom} className="text-center">
                      <span className="block text-[10px] font-bold text-slate-500">₹{denom}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={khataNoteCounts[denom]}
                        onChange={(e) => handleKhataNoteChange(denom, e.target.value)}
                        placeholder="0"
                        className="w-full text-center px-1 py-1 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-[#00796b]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Note / Reference
              </label>
              <input
                type="text"
                value={khataForm.notes}
                onChange={(e) => setKhataForm({ ...khataForm, notes: e.target.value })}
                placeholder="Transaction reference or receipt note"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsKhataOpen(false)} disabled={submittingKhata}>
                Cancel
              </Button>
              <Button type="submit" variant="warning" disabled={submittingKhata} className="min-w-[120px] font-bold">
                {submittingKhata ? 'Recording...' : 'Confirm Payment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 👁️ View Customer Profile & Purchase History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Profile & History: ${selectedCustomer.name}`}
          size="lg"
        >
          <div className="space-y-5 font-sans text-slate-800 dark:text-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-teal-50 dark:bg-slate-800/80 rounded-2xl border border-teal-200/70 dark:border-slate-700">
                <span className="text-[11px] font-bold text-[#00796b] dark:text-[#80cbc4] uppercase block">Total Spent</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(selectedCustomer.total_spent)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase block">Total Orders</span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {selectedCustomer.total_orders || historyData.total_orders || 0}
                </span>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-slate-800/80 rounded-2xl border border-amber-200/70 dark:border-slate-700">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase block">Pending Khata</span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                  {formatCurrency(selectedCustomer.outstanding_balance || selectedCustomer.pending_payments || 0)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold">Phone: <span className="font-mono">{selectedCustomer.phone}</span></span>
                {selectedCustomer.email && <span>Email: {selectedCustomer.email}</span>}
                <span>Status: <Badge variant={selectedCustomer.status === 'BLOCKED' ? 'danger' : 'success'} size="xs">{selectedCustomer.status}</Badge></span>
              </div>
              {selectedCustomer.address && (
                <div className="text-slate-500">Address: {selectedCustomer.address}, {selectedCustomer.city || 'Mumbai'} {selectedCustomer.pincode}</div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#00796b]" />
                Recent Purchase Orders & Bills
              </h4>

              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading order history...</div>
              ) : historyData.orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200">
                  No previous orders found for this customer.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {historyData.orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-2.5 px-3 font-bold text-[#00796b] dark:text-[#80cbc4] font-mono">#{o.order_number || o.id}</td>
                          <td className="py-2.5 px-3 text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—'}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{formatCurrency(o.total_amount)}</td>
                          <td className="py-2.5 px-3 text-slate-600">{o.payment_method || 'CASH'}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant={o.payment_status === 'PAID' ? 'success' : 'warning'} size="xs">
                              {o.payment_status || 'PENDING'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                Close Profile
              </Button>
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
