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
  Sparkles
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
      console.error(err);
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#263238] dark:text-slate-100 tracking-tight font-heading">
            Bill Management
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            View store bills, track payment status, download PDF invoices, and manage customer receipts.
          </p>
        </div>

        <Button variant="accent" size="sm" icon={ShoppingCart} onClick={openQuickOrder} className="self-start sm:self-auto">
          New Bill / POS Counter
        </Button>
      </div>


      {/* Filter and Status Pipeline */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
        {/* Status Pipeline Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan pb-1 text-xs">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setSelectedStatus(tab.id); setPage(1); }}
              className={`px-3 sm:px-3.5 py-2 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-[#00695C] dark:bg-[#009688] text-white dark:text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'

              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-4">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              placeholder="Search by Order ID, Customer..."
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 font-medium"
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
              className="w-full px-2.5 sm:px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#263238] dark:text-slate-100"
              title="From Date"
            />
            <span className="text-slate-400 text-xs font-bold shrink-0">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2.5 sm:px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#263238] dark:text-slate-100"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {/* Responsive View: Mobile Cards (block md:hidden) & Desktop Table (hidden md:block) */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No Orders Found"
            description="No orders match your search filters."
          />
        ) : (
          orders.map((o) => {
            const itemCount = (o.items || []).reduce((sum, i) => sum + i.quantity, 0);
            return (
              <div
                key={o.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 p-3.5 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#00695C] dark:text-[#4DB6AC]">
                      {o.order_number}
                    </span>
                    <Badge variant="default" size="xs">{o.status}</Badge>
                  </div>
                  <span className="text-sm font-black text-[#00695C] dark:text-[#4DB6AC] font-heading">
                    ₹{Number(o.total_amount).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#263238] dark:text-slate-200 pt-1 border-t border-[#E0F2F1] dark:border-slate-800">
                  <div>
                    <p className="font-bold">{o.customer_name}</p>
                    <p className="text-[10px] text-[#607D8B] font-mono">{o.customer_phone || 'Walk-in'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      o.payment_status === 'PAID' ? 'bg-[#E0F2F1] text-[#00695C]' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {o.payment_status} • {o.payment_method}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#E0F2F1] dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-[#607D8B]">
                    {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-2.5 py-1 bg-[#E0F2F1] text-[#00695C] font-bold text-[11px] rounded-lg cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setInvoiceOrder(o)}
                      className="px-2.5 py-1 bg-[#00695C] text-white font-bold text-[11px] rounded-lg cursor-pointer"
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <Card className="p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto touch-pan">
          <table className="w-full min-w-[760px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F0FAF9] dark:bg-slate-800 border-b border-[#B2DFDB] dark:border-slate-800 text-[#607D8B] dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Items Qty</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {orders.length === 0 ? (
                <EmptyState
                  variant="table"
                  colSpan={8}
                  icon={ShoppingCart}
                  title="No Orders Found"
                  description={
                    search || selectedStatus !== 'ALL' || paymentStatusFilter || dateFrom || dateTo
                      ? 'No grocery orders match your search criteria or date filters.'
                      : 'No orders have been recorded yet. Start billing via the POS counter to create orders.'
                  }
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
              ) : (

                orders.map((o) => {
                  const itemCount = (o.items || []).reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <tr key={o.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-[#00695C] dark:text-[#4DB6AC]">{o.order_number}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#263238] dark:text-slate-100">{o.customer_name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{o.customer_phone || 'Walk-in'}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-[#E0F2F1] dark:bg-slate-800 text-[#00695C] dark:text-[#4DB6AC] font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {itemCount || o.items?.length || 1} items
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-sm text-[#00695C] dark:text-[#4DB6AC] font-heading">
                        ₹{Number(o.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{o.payment_method}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          o.payment_status === 'PAID' ? 'bg-[#E0F2F1] text-[#00695C] dark:bg-[#00695C]/30 dark:text-[#4DB6AC]' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400'
                        }`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="default" size="xs">{o.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-[#00695C] dark:hover:text-slate-100 hover:bg-[#E0F2F1] dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setInvoiceOrder(o)}
                            className="p-1.5 text-[#009688] dark:text-[#4DB6AC] hover:text-[#00695C] dark:hover:text-white hover:bg-[#E0F2F1] dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </Card>

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
            <div className="p-4 bg-[#F0FAF9] dark:bg-slate-800/60 rounded-2xl border border-[#B2DFDB] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Change Order Status</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {['NEW', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'].map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate(selectedOrder.id, st, selectedOrder.payment_status)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        selectedOrder.status === st
                          ? 'bg-[#00695C] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#E0F2F1]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</p>
                <div className="flex items-center gap-1 mt-1">
                  {['PAID', 'PENDING', 'REFUNDED'].map((pst) => (
                    <button
                      key={pst}
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate(selectedOrder.id, selectedOrder.status, pst)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                        selectedOrder.payment_status === pst
                          ? 'bg-[#009688] text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#E0F2F1]'
                      }`}
                    >
                      {pst}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Information</p>
                <p className="text-sm font-bold text-[#263238] dark:text-slate-100 mt-1">{selectedOrder.customer_name}</p>
                <p className="text-slate-500 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedOrder.customer_phone || 'Walk-in'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address</p>
                <p className="text-slate-600 dark:text-slate-300 mt-1">{selectedOrder.customer_address || 'In-store Counter Purchase'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Order Items ({selectedOrder.items?.length || 0})
              </p>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0FAF9] dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-center">GST</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(selectedOrder.items || []).map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-[#263238] dark:text-slate-100">{item.product_name}</p>
                          {item.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{item.gst_percent}%</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#00695C] dark:text-[#4DB6AC]">₹{Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-[#F0FAF9] dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal:</span>
                <span>₹{Number(selectedOrder.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>GST Tax:</span>
                <span>₹{Number(selectedOrder.tax_amount).toFixed(2)}</span>
              </div>
              {Number(selectedOrder.discount_amount) > 0 && (
                <div className="flex justify-between text-[#00695C] dark:text-[#4DB6AC] font-semibold">
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
              <div className="flex justify-between text-base font-black text-[#263238] dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total:</span>
                <span className="font-heading text-[#00695C] dark:text-[#4DB6AC]">₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
              </div>

              {selectedOrder.payment_method === 'CASH' && selectedOrder.cash_tendered && Number(selectedOrder.cash_tendered) > 0 && (
                <div className="pt-2 mt-2 border-t border-dashed border-[#B2DFDB] space-y-1 bg-[#E0F2F1]/60 dark:bg-slate-800 p-2.5 rounded-xl">
                  <div className="flex justify-between text-[#00695C] dark:text-[#4DB6AC] font-bold">
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
