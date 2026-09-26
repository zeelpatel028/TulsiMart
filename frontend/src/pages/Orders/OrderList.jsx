import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, Pagination, EmptyState } from '../../components/common/UiHelpers';
import { 
  ShoppingCart, 
  Plus, 
  Printer, 
  Eye, 
  CheckCircle, 
  Truck, 
  Clock, 
  XCircle, 
  RotateCcw, 
  Search,
  Filter,
  User,
  Phone,
  MapPin,
  Sparkles,
  FileText,
  LayoutGrid,
  List
} from 'lucide-react';
import { ordersApi } from '../../api';
import { getCachedData, setCachedData } from '../../utils/metaCache';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import InvoiceModal from '../../components/invoices/InvoiceModal';

export const OrderList = () => {
  const { showToast } = useNotification();
  const { openQuickOrder } = useOutletContext() || {};
  const { storeSettings } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Image 2 style) or 'table'

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Order Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [page, search, selectedStatus, paymentStatusFilter, dateFrom, dateTo]);

  const loadOrders = async () => {
    const cacheKey = `orders_${page}_${search}_${selectedStatus}_${paymentStatusFilter}_${dateFrom}_${dateTo}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
      setOrders(cached.orders);
      setTotalCount(cached.totalCount);
      setTotalPages(cached.totalPages);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const params = {
        page,
        search,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        payment_status: paymentStatusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
      const res = await ordersApi.getOrders(params);
      const fetchedOrders = res.data?.results || res.data || [];
      const count = res.data?.count !== undefined ? res.data.count : fetchedOrders.length;
      const pages = Math.ceil(count / 20) || 1;

      setOrders(fetchedOrders);
      setTotalCount(count);
      setTotalPages(pages);

      setCachedData(cacheKey, { orders: fetchedOrders, totalCount: count, totalPages: pages }, 2 * 60 * 1000);
    } catch (err) {
      if (err.response?.status === 404 && page > 1) {
        setPage(1);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, newPayStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await ordersApi.updateOrderStatus(orderId, {
        status: newStatus,
        payment_status: newPayStatus
      });
      showToast(`Order status updated to ${newStatus}`, 'success');
      setSelectedOrder(res.data);
      loadOrders();
    } catch (err) {
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusTabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'NEW', label: 'New' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'PACKED', label: 'Packed' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'RETURNED', label: 'Returned' },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 🌟 Tulsi Mart Top Header Banner - Full Width Edge-to-Edge Background */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        {/* Banner Grid Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Left: Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Bill <span className="text-[#00796b] dark:text-[#80cbc4]">Management</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Invoices & Receipts
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                View store bills, track payment status, download PDF invoices & manage customer receipts
              </p>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0">
            <button
              onClick={openQuickOrder}
              className="px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white flex items-center justify-center gap-2 shadow-sm shadow-teal-900/20 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>New Bill / POS Counter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Status Pipeline */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs space-y-3 sm:space-y-4">
        {/* Status Pipeline Tabs & View Mode Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan pb-1 text-xs">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setSelectedStatus(tab.id); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl font-extrabold shrink-0 transition-all cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher: Card Grid vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#00796b] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Card Grid View (Image 2 style)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#00796b] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center pt-2.5 border-t border-teal-100/70 dark:border-slate-800">
          <div className="sm:col-span-4">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              placeholder="Search Order ID, Invoice No, Customer..."
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl outline-none focus:border-[#00796b] text-slate-800 dark:text-slate-100 font-bold"
            >
              <option value="">All Payment Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div className="sm:col-span-5 flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#00796b]"
              title="From Date"
            />
            <span className="text-slate-400 text-xs font-bold shrink-0">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#00796b]"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Orders List Rendering */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-[#00796b] border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading Bill Statements...</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No Orders Found"
          description="No grocery orders match your search criteria or date filters."
          secondaryActionLabel={
            search || selectedStatus !== 'ALL' || paymentStatusFilter || dateFrom || dateTo
              ? 'Reset Filters'
              : undefined
          }
          onSecondaryAction={() => {
            setSearch('');
            setSelectedStatus('ALL');
            setPaymentStatusFilter('');
            setDateFrom('');
            setDateTo('');
            setPage(1);
          }}
        />
      ) : viewMode === 'grid' ? (
        /* 🌟 Card Grid View (Exact Match to Image 2 UI) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {orders.map((o) => {
            const itemCount = (o.items || []).reduce((sum, i) => sum + i.quantity, 0);
            const invNo = o.invoice_number || (o.order_number ? o.order_number.replace('TM-ORD-', 'TM-INV-') : '—');
            const formattedDate = new Date(o.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={o.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-[#00796b] dark:hover:border-[#80cbc4] transition-all flex flex-col justify-between"
              >
                {/* Top Header: Order ID, Invoice No & Order Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-black text-sm text-[#00796b] dark:text-[#80cbc4] tracking-tight">
                      {o.order_number}
                    </p>
                    <p className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Inv: <span className="font-semibold">{invNo}</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#00796b] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80 shadow-2xs">
                    {o.status}
                  </span>
                </div>

                {/* Middle Body: Customer Info & Amount + Payment Status */}
                <div className="flex items-center justify-between text-xs py-2.5 my-1 border-t border-b border-teal-100/60 dark:border-slate-800">
                  <div className="min-w-0 pr-2">
                    <p className="font-black text-base text-slate-900 dark:text-slate-100 truncate">
                      {o.customer_name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {o.customer_phone || 'Walk-in Customer'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-[#00796b] dark:text-[#80cbc4] font-heading block">
                      ₹{Number(o.total_amount).toFixed(2)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-0.5 ${
                      o.payment_status === 'PAID'
                        ? 'bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200/80'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/80'
                    }`}>
                      {o.payment_status} • {o.payment_method}
                    </span>
                  </div>
                </div>

                {/* Bottom Footer: Date & Action Buttons */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {formattedDate}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-teal-50 text-[#00796b] dark:bg-slate-800 dark:text-[#80cbc4] hover:bg-teal-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setInvoiceOrder(o)}
                      className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#00796b] text-white hover:bg-[#004d40] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="p-0 overflow-hidden border border-teal-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
          <div className="overflow-x-auto touch-pan">
            <table className="w-full min-w-[840px] text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs shadow-2xs">
                <tr className="border-b border-teal-100 dark:border-slate-700/80 text-[#00796b] dark:text-[#80cbc4] font-black uppercase tracking-wider text-[11px] whitespace-nowrap">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                {orders.map((o) => {
                  const itemCount = (o.items || []).reduce((sum, i) => sum + i.quantity, 0);
                  const invNo = o.invoice_number || (o.order_number ? o.order_number.replace('TM-ORD-', 'TM-INV-') : '—');
                  const formattedDate = new Date(o.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) + ' ' + new Date(o.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  });

                  return (
                    <tr key={o.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-[#00796b] dark:text-[#80cbc4] whitespace-nowrap">
                        {o.order_number}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                        {invNo}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-extrabold text-slate-900 dark:text-slate-100">{o.customer_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{o.customer_phone || 'Walk-in'}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="bg-teal-50 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] border border-teal-200/80 dark:border-teal-800/50 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                          {itemCount || o.items?.length || 1} items
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sm text-[#00796b] dark:text-[#80cbc4] font-heading whitespace-nowrap">
                        ₹{Number(o.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          o.payment_status === 'PAID'
                            ? 'bg-teal-100 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200'
                        }`}>
                          {o.payment_status} • {o.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Badge variant="default" size="xs">{o.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-[#00796b] dark:hover:text-white hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setInvoiceOrder(o)}
                            className="p-1.5 text-[#00796b] dark:text-[#80cbc4] hover:text-[#004d40] dark:hover:text-white hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
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

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details - ${selectedOrder.order_number}`}
          subtitle={`Placed on ${new Date(selectedOrder.created_at).toLocaleString('en-IN')}`}
          maxWidth="max-w-3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => {
                  setInvoiceOrder(selectedOrder);
                }}
                className="border-teal-300 dark:border-slate-700 text-[#00796b] dark:text-[#80cbc4]"
              >
                Generate Tax Invoice
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs">
            {/* Quick Status Bar */}
            <div className="p-4 bg-teal-50/60 dark:bg-slate-800/60 rounded-2xl border border-teal-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Change Order Status</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {['NEW', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'].map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate(selectedOrder.id, st, selectedOrder.payment_status)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        selectedOrder.status === st
                          ? 'bg-[#00796b] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Payment Status</p>
                <div className="flex items-center gap-1 mt-1">
                  {['PAID', 'PENDING', 'REFUNDED'].map((pst) => (
                    <button
                      key={pst}
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate(selectedOrder.id, selectedOrder.status, pst)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                        selectedOrder.payment_status === pst
                          ? 'bg-[#00796b] text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-50'
                      }`}
                    >
                      {pst}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-teal-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Customer Information</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{selectedOrder.customer_name}</p>
                <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedOrder.customer_phone || 'Walk-in'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Delivery Address</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{selectedOrder.customer_address || 'In-store Counter Purchase'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Order Items ({selectedOrder.items?.length || 0})
              </p>
              <div className="border border-teal-100 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-teal-100 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-center">GST</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800">
                    {(selectedOrder.items || []).map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{item.product_name}</p>
                          {item.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{item.gst_percent}%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#00796b] dark:text-[#80cbc4]">₹{Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-teal-50/60 dark:bg-slate-800/60 rounded-2xl border border-teal-100 dark:border-slate-700 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal:</span>
                <span>₹{Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>GST Tax:</span>
                <span>₹{Number(selectedOrder.tax_amount).toFixed(2)}</span>
              </div>
              {Number(selectedOrder.discount_amount) > 0 && (
                <div className="flex justify-between text-[#00796b] dark:text-[#80cbc4] font-semibold">
                  <span>Discount:</span>
                  <span>-₹{Number(selectedOrder.discount_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(selectedOrder.delivery_charge) > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Delivery Charge:</span>
                  <span>₹{Number(selectedOrder.delivery_charge).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-teal-200 dark:border-slate-700">
                <span>Grand Total:</span>
                <span className="font-heading text-[#00796b] dark:text-[#80cbc4]">₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
              </div>

              {selectedOrder.payment_method === 'CASH' && selectedOrder.cash_tendered && Number(selectedOrder.cash_tendered) > 0 && (
                <div className="pt-2 mt-2 border-t border-dashed border-teal-200 space-y-1 bg-teal-100/60 dark:bg-slate-800 p-2.5 rounded-xl">
                  <div className="flex justify-between text-[#00796b] dark:text-[#80cbc4] font-bold">
                    <span>Cash Tendered by Customer:</span>
                    <span>₹{Number(selectedOrder.cash_tendered).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                    <span>Change Returned:</span>
                    <span>₹{Number(selectedOrder.change_returned || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Modal Viewer */}
      {invoiceOrder && (
        <InvoiceModal
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          order={invoiceOrder}
          store={storeSettings}
        />
      )}
    </div>
  );
};

export default OrderList;
