import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, Pagination, ConfirmDialog, EmptyState } from '../../components/common/UiHelpers';
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  IndianRupee, 
  Ban, 
  CheckCircle, 
  Star, 
  Clock, 
  Eye, 
  Sparkles,
  MessageSquareQuote,
  Wallet,
  CreditCard,
  Receipt,
  CheckCheck,
  Calculator
} from 'lucide-react';
import { customersApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const CustomerList = () => {
  const { showToast } = useNotification();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);

  // Khata Payment Modal State
  const [isKhataModalOpen, setIsKhataModalOpen] = useState(false);
  const [khataCustomer, setKhataCustomer] = useState(null);
  const [khataForm, setKhataForm] = useState({
    amount: '',
    cash_tendered: '',
    payment_method: 'CASH',
    notes: 'Khata Balance Cleared',
    order_id: null,
  });
  const [submittingKhata, setSubmittingKhata] = useState(false);

  // Note Denomination Counter for Khata Customer Payment
  const [khataNoteCounts, setKhataNoteCounts] = useState({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });

  const autoCalculateDenominations = (amount) => {
    let remaining = Math.max(0, Math.round(Number(amount) || 0));
    const denoms = [500, 200, 100, 50, 20, 10, 5, 1];
    const breakdown = {};
    for (const d of denoms) {
      if (remaining >= d) {
        const count = Math.floor(remaining / d);
        breakdown[d] = count;
        remaining = remaining % d;
      }
    }
    return breakdown;
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
      notes: noteText ? `Khata Payment (Notes: ${noteText})` : prev.notes
    }));
  };

  // Add customer state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.getCustomers({
        search,
        status: statusFilter || undefined
      });
      setCustomers(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = async (c) => {
    setSelectedCustomer(c);
    try {
      setLoadingHistory(true);
      const res = await customersApi.getCustomerHistory(c.id);
      setCustomerOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenKhataModal = (customer, order = null) => {
    const initialAmt = order ? order.total_amount : (customer.pending_payments || 0);
    const amtStr = initialAmt ? String(initialAmt) : '';
    setKhataCustomer(customer);
    setKhataForm({
      amount: amtStr,
      cash_tendered: amtStr,
      payment_method: 'CASH',
      notes: order ? `Payment for Bill #${order.order_number}` : 'Khata Balance Payment',
      order_id: order ? order.id : null,
    });
    setKhataNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
    setIsKhataModalOpen(true);
  };

  const handleRecordKhataPayment = async (e) => {
    if (e) e.preventDefault();
    const amtVal = parseFloat(khataForm.amount);
    if (!khataForm.amount || isNaN(amtVal) || amtVal <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    const tenderedVal = khataForm.payment_method === 'CASH'
      ? (parseFloat(khataForm.cash_tendered) || amtVal)
      : amtVal;

    if (khataForm.payment_method === 'CASH' && tenderedVal < amtVal) {
      showToast(`Tendered cash (₹${tenderedVal}) is less than payment amount (₹${amtVal})`, 'warning');
      return;
    }

    const changeVal = khataForm.payment_method === 'CASH' ? Math.max(0, tenderedVal - amtVal) : 0;
    const changeNotesObj = changeVal > 0 ? autoCalculateDenominations(changeVal) : null;

    try {
      setSubmittingKhata(true);
      const res = await customersApi.recordKhataPayment(khataCustomer.id, {
        amount: amtVal,
        cash_tendered: khataForm.payment_method === 'CASH' ? tenderedVal : null,
        change_returned: changeVal,
        payment_method: khataForm.payment_method,
        notes: khataForm.notes,
        denomination_counts: khataForm.payment_method === 'CASH' ? khataNoteCounts : undefined,
        change_notes: changeNotesObj,
        order_id: khataForm.order_id || undefined,
      });

      showToast(res.data?.message || 'Khata payment recorded successfully!', 'success');
      setIsKhataModalOpen(false);
      loadCustomers();

      // If customer profile is currently open, refresh their ledger
      if (selectedCustomer && selectedCustomer.id === khataCustomer.id) {
        const historyRes = await customersApi.getCustomerHistory(khataCustomer.id);
        setCustomerOrders(historyRes.data || []);
        setSelectedCustomer({
          ...selectedCustomer,
          pending_payments: res.data?.new_pending_payments ?? 0
        });
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to record khata payment', 'error');
    } finally {
      setSubmittingKhata(false);
    }
  };

  const handleToggleBillStatus = async (customer, order, targetStatus) => {
    try {
      const res = await customersApi.toggleBillPaymentStatus(customer.id, {
        order_id: order.id,
        target_status: targetStatus
      });
      showToast(res.data?.message || `Bill status updated to ${targetStatus}!`, 'success');
      
      // Refresh customer history and main customer list
      const historyRes = await customersApi.getCustomerHistory(customer.id);
      setCustomerOrders(historyRes.data || []);
      
      if (selectedCustomer && selectedCustomer.id === customer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          pending_payments: res.data?.new_pending_payments ?? selectedCustomer.pending_payments
        });
      }
      loadCustomers();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to change bill payment status', 'error');
    }
  };

  const handleToggleBlock = async (c) => {
    try {
      await customersApi.toggleCustomerBlock(c.id);
      showToast(`Customer status updated to ${c.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'}`, 'info');
      loadCustomers();
      if (selectedCustomer && selectedCustomer.id === c.id) {
        setSelectedCustomer({ ...selectedCustomer, status: c.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE' });
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmittingForm(true);
      await customersApi.createCustomer(formData);
      showToast('New customer added successfully!', 'success');
      setIsFormOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '', city: 'Mumbai', pincode: '', notes: '' });
      loadCustomers();
    } catch (err) {
      showToast(err.response?.data?.phone?.[0] || 'Failed to create customer', 'error');
    } finally {
      setSubmittingForm(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
            Customer CRM & Khata Ledger
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage customer accounts, track Khata credit dues, receive bill payments, and view purchase history.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsFormOpen(true)} className="self-start sm:self-auto">
          Add New Customer
        </Button>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customers by name, phone..."
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto overflow-x-auto no-scrollbar touch-pan pb-0.5">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === '' 
                ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959]' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'ACTIVE' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('BLOCKED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'BLOCKED' 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            Blocked
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Customers Found"
          description={
            search || statusFilter !== ''
              ? 'No customers match your search query or status filter. Try clearing filters.'
              : 'Your customer directory is empty. Customers will be auto-saved during POS checkout, or you can add them manually.'
          }
          variant="card"
          actionLabel="Add Customer"
          onAction={() => setIsFormOpen(true)}
          actionIcon={Plus}
          secondaryActionLabel={search || statusFilter !== '' ? 'Reset Filters' : undefined}
          onSecondaryAction={() => {
            setSearch('');
            setStatusFilter('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {customers.map((c) => {
            const hasKhataDue = Number(c.pending_payments || 0) > 0;

            return (
              <div
                key={c.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between ${
                  hasKhataDue 
                    ? 'border-rose-300 dark:border-rose-900/60 shadow-xs' 
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#384959]/10 dark:bg-[#88BDF2]/20 text-[#384959] dark:text-[#88BDF2] flex items-center justify-center font-bold text-sm">
                        {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#384959] dark:text-slate-100 leading-tight">{c.name}</h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{c.phone}</span>
                      </div>
                    </div>

                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'} size="xs">
                      {c.status}
                    </Badge>
                  </div>

                  {/* Address / Location */}
                  {c.address && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      {c.address}, {c.city}
                    </p>
                  )}

                  {/* Financial & Khata Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 mt-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Orders</p>
                      <p className="text-xs font-black text-[#384959] dark:text-slate-100">{c.total_orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Spent</p>
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">₹{Number(c.total_spent || 0).toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Khata Due</p>
                      <p className={`text-xs font-black ${hasKhataDue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        ₹{Number(c.pending_payments || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleBlock(c)}
                    className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      c.status === 'ACTIVE' ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" /> {c.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {hasKhataDue && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        icon={Wallet} 
                        onClick={() => handleOpenKhataModal(c)}
                        className="!bg-emerald-600 hover:!bg-emerald-700 !text-white text-xs py-1 px-2.5"
                      >
                        Pay Khata
                      </Button>
                    )}
                    <Button variant="light" size="sm" icon={Eye} onClick={() => handleOpenProfile(c)}>
                      Profile
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Profile Modal with Purchase & Khata History */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Profile - ${selectedCustomer.name}`}
          subtitle="Purchase ledger, Khata credit dues, and store feedback"
          maxWidth="max-w-3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => handleToggleBlock(selectedCustomer)}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                {selectedCustomer.status === 'ACTIVE' ? 'Block this Customer' : 'Unblock Customer'}
              </button>
              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Khata Due Banner if pending balance exists */}
            {Number(selectedCustomer.pending_payments || 0) > 0 ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Pending Khata (Credit) Due</p>
                    <p className="text-lg font-black text-rose-700 dark:text-rose-400 font-heading">
                      ₹{Number(selectedCustomer.pending_payments || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Wallet}
                  onClick={() => handleOpenKhataModal(selectedCustomer)}
                  className="!bg-emerald-600 hover:!bg-emerald-700 !text-white text-xs self-start sm:self-auto"
                >
                  Pay Khata Balance
                </Button>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs">Khata Account Clear — No pending credit dues.</span>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  icon={Wallet}
                  onClick={() => handleOpenKhataModal(selectedCustomer)}
                  className="text-xs"
                >
                  Record Advance
                </Button>
              </div>
            )}

            {/* Overview Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Information</p>
                <p className="text-sm font-bold text-[#384959] dark:text-slate-100 mt-1">{selectedCustomer.name}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{selectedCustomer.phone}</p>
                <p className="text-slate-500 dark:text-slate-400">{selectedCustomer.email || 'No email provided'}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{selectedCustomer.address || 'In-store customer'}</p>
                <p className="text-slate-500 dark:text-slate-400">{selectedCustomer.city} {selectedCustomer.pincode}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Loyalty Stats</p>
                <p className="text-base font-black text-[#384959] dark:text-slate-100 font-heading mt-1">
                  ₹{Number(selectedCustomer.total_spent || 0).toFixed(2)}
                </p>
                <p className="text-slate-500 dark:text-slate-400">{selectedCustomer.total_orders || 0} lifetime orders</p>
              </div>
            </div>

            {/* Customer Feedbacks */}
            {selectedCustomer.recent_feedbacks?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-[#6A89A7]" /> Verified Customer Feedback
                </p>
                <div className="space-y-2">
                  {selectedCustomer.recent_feedbacks.map((f) => (
                    <div key={f.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: f.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 mt-1 italic">"{f.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase History & Khata Bills Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Purchase & Bill Payment History
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Showing latest orders</span>
              </div>
              {loadingHistory ? (
                <div className="py-8 text-center text-slate-400">Loading purchase ledger...</div>
              ) : customerOrders.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto touch-pan">
                  <table className="w-full min-w-[540px] text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Payment Mode</th>
                        <th className="py-2.5 px-3">Payment Status</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerOrders.map((o) => {
                        const isPending = o.payment_status === 'PENDING';
                        return (
                          <tr key={o.id} className={isPending ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#384959] dark:text-slate-200">{o.order_number}</td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                              {new Date(o.created_at).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">{o.payment_method}</td>
                            <td className="py-2.5 px-3">
                              <Badge variant={isPending ? 'danger' : 'success'} size="xs">
                                {o.payment_status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-[#384959] dark:text-slate-100">
                              ₹{Number(o.total_amount).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isPending ? (
                                  <button
                                    onClick={() => handleOpenKhataModal(selectedCustomer, o)}
                                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800"
                                  >
                                    Pay Bill
                                  </button>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mr-1">
                                      <CheckCircle className="w-3 h-3 inline" /> Paid
                                    </span>
                                    <button
                                      onClick={() => handleToggleBillStatus(selectedCustomer, o, 'UNPAID')}
                                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-md border border-rose-200 dark:border-rose-900"
                                      title="Change Paid Bill to Unpaid (Khata Credit)"
                                    >
                                      Make Unpaid
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No previous orders found for this customer.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Khata Bill Payment Modal */}
      {isKhataModalOpen && khataCustomer && (() => {
        const amtNum = parseFloat(khataForm.amount) || 0;
        const tenderedNum = parseFloat(khataForm.cash_tendered) || 0;
        const changeToReturn = Math.max(0, tenderedNum - amtNum);
        const changeNotesObj = changeToReturn > 0 ? autoCalculateDenominations(changeToReturn) : {};
        const changeBreakdownStr = getDenomBreakdownText(changeNotesObj);

        return (
          <Modal
            isOpen={isKhataModalOpen}
            onClose={() => setIsKhataModalOpen(false)}
            title={`Khata Bill Payment — ${khataCustomer.name}`}
            subtitle="Record customer payment with tender cash & change calculator"
            maxWidth="max-w-md"
            footer={
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="md" onClick={() => setIsKhataModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="md" 
                  icon={CheckCircle}
                  onClick={handleRecordKhataPayment} 
                  loading={submittingKhata}
                  className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
                >
                  Confirm Payment Receipt
                </Button>
              </div>
            }
          >
            <form onSubmit={handleRecordKhataPayment} className="space-y-4 text-xs">
              {/* Customer Summary Info */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Account</p>
                  <p className="text-sm font-bold text-[#384959] dark:text-slate-100">{khataCustomer.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{khataCustomer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Current Khata Due</p>
                  <p className="text-base font-black text-rose-600 dark:text-rose-400 font-heading">
                    ₹{Number(khataCustomer.pending_payments || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Payment Method * (ચુકવણી પદ્ધતિ)
                </label>
                <select
                  value={khataForm.payment_method}
                  onChange={(e) => setKhataForm({ ...khataForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#88BDF2] outline-hidden"
                >
                  <option value="CASH">💵 Cash Counter (રોકડ ચુકવણી)</option>
                  <option value="UPI">📱 UPI / QR (Google Pay / PhonePe / Paytm)</option>
                  <option value="CARD">💳 Debit / Credit Card</option>
                  <option value="NET_BANKING">🏦 Bank Transfer / NEFT</option>
                </select>
              </div>

              {/* Payment Settlement Amount Input */}
              <div>
                <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Khata Payment Amount (₹) * (ખાતા જમા રકમ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={khataForm.amount}
                  onChange={(e) => setKhataForm({ ...khataForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 text-base font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100 font-heading"
                />

                {/* Quick Amount Suggestion Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {Number(khataCustomer.pending_payments || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setKhataForm({ ...khataForm, amount: Number(khataCustomer.pending_payments).toFixed(2), cash_tendered: Number(khataCustomer.pending_payments).toFixed(2) })}
                      className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                    >
                      Full Due: ₹{Number(khataCustomer.pending_payments).toFixed(0)}
                    </button>
                  )}
                  {[100, 200, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setKhataForm({ ...khataForm, amount: amt.toString(), cash_tendered: amt.toString() })}
                      className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Tendered & Change Return System (CASH ONLY) */}
              {khataForm.payment_method === 'CASH' && (
                <div className="space-y-3 pt-1">
                  {/* Cash Tendered Input */}
                  <div>
                    <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                      Cash Given by Customer (₹) (ગ્રાહકે આપેલા પૈસા)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={khataForm.cash_tendered}
                      onChange={(e) => setKhataForm({ ...khataForm, cash_tendered: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full px-3.5 py-2 text-base font-black bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-hidden text-emerald-900 dark:text-emerald-300 font-heading"
                    />

                    {/* Quick Tender Suggestions */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400">Quick Tender:</span>
                      {amtNum > 0 && (
                        <button
                          type="button"
                          onClick={() => setKhataForm({ ...khataForm, cash_tendered: String(amtNum) })}
                          className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-200 cursor-pointer"
                        >
                          Exact ₹{amtNum}
                        </button>
                      )}
                      {[500, 1000, 2000].filter(a => a >= amtNum).map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setKhataForm({ ...khataForm, cash_tendered: String(amt) })}
                          className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          ₹{amt} Note
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change Return Box */}
                  <div className={`p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                    changeToReturn > 0
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs uppercase tracking-wider">
                        Change to Return (પરત આપવાના પૈસા)
                      </span>
                      <span className={`text-base font-black font-heading ${changeToReturn > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400'}`}>
                        ₹{changeToReturn.toFixed(2)}
                      </span>
                    </div>

                    {changeToReturn > 0 && changeBreakdownStr && (
                      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mt-1 pt-1 border-t border-amber-200/80 dark:border-amber-800">
                        Suggested Change Notes: {changeBreakdownStr}
                      </p>
                    )}
                  </div>

                  {/* Note Counter System for Cash Payments */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#384959] dark:text-[#88BDF2] flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-[#88BDF2]" />
                        Received Cash Note Breakdown (ચલણી નોટ ગણતરી)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setKhataNoteCounts({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
                          setKhataForm(prev => ({ ...prev, cash_tendered: prev.amount }));
                        }}
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
                        const cnt = khataNoteCounts[denom] || '';
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
                                onChange={(e) => handleKhataNoteChange(denom, e.target.value)}
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
                </div>
              )}

              {/* Non-Cash Information Badge */}
              {khataForm.payment_method !== 'CASH' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-900 dark:text-blue-300 text-xs flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Direct digital payment will be recorded into account ledger via <strong>{khataForm.payment_method}</strong>. No physical cash change required.
                  </span>
                </div>
              )}

              {/* Notes / Reference */}
              <div>
                <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Receipt Note / Reference (નોંધ / યુપીઆઈ લિંક)
                </label>
                <input
                  type="text"
                  value={khataForm.notes}
                  onChange={(e) => setKhataForm({ ...khataForm, notes: e.target.value })}
                  placeholder="e.g. Received at shop counter / UPI Ref 12345"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#88BDF2] outline-hidden"
                />
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Customer Profile"
        subtitle="Register customer in Tulsi Mart CRM for instant billing and loyalty"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateCustomer} loading={submittingForm}>
              Save Customer
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98XXX XXXXX"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[#384959] dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@email.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Delivery Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Flat / Building, Street, Landmark..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="400001"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[#384959] dark:text-slate-100"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerList;

