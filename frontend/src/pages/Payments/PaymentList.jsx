import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { SearchInput, Pagination, EmptyState } from '../../components/common/UiHelpers';
import { 
  CreditCard, 
  IndianRupee, 
  QrCode, 
  Banknote, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Receipt,
  Search,
  Filter
} from 'lucide-react';
import { ordersApi } from '../../api';

export const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadPayments();
  }, [search, selectedMethod, selectedStatus]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await ordersApi.getPayments({
        search,
        method: selectedMethod || undefined,
        status: selectedStatus || undefined
      });
      setPayments(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalCollected = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const upiCollected = payments.filter(p => p.status === 'PAID' && p.payment_method === 'UPI').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const cashCollected = payments.filter(p => p.status === 'PAID' && p.payment_method === 'CASH').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const cardCollected = payments.filter(p => p.status === 'PAID' && p.payment_method === 'CARD').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
          Payment Ledger & Settlements
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real-time transaction log across UPI QR codes, Cash counters, POS card swiping, and Cash on Delivery.
        </p>
      </div>

      {/* 4 Method Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Settlements"
          value={totalCollected}
          prefix="₹"
          icon={IndianRupee}
          color="navy"
        />
        <StatCard
          title="UPI / QR Payments"
          value={upiCollected}
          prefix="₹"
          icon={QrCode}
          color="sky"
        />
        <StatCard
          title="Counter Cash"
          value={cashCollected}
          prefix="₹"
          icon={Banknote}
          color="slate"
        />
        <StatCard
          title="Cards / Net Banking"
          value={cardCollected}
          prefix="₹"
          icon={CreditCard}
          color="light"
        />
      </div>

      {/* Filters & Table */}
      <Card className="p-0 overflow-hidden">
        {/* Filter row */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900">
          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by Transaction ID, Order #..."
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-[#384959] dark:text-slate-100"
            >
              <option value="">All Payment Modes</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="KHATA">Khata / Credit</option>
              <option value="COD">COD</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-[#384959] dark:text-slate-100"
            >
              <option value="">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto touch-pan">
          <table className="w-full min-w-[680px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Transaction ID</th>

                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {payments.length === 0 ? (
                <EmptyState
                  variant="table"
                  colSpan={7}
                  icon={CreditCard}
                  title="No Payment Transactions"
                  description={
                    search || selectedStatus || selectedMethod
                      ? 'No transactions match your search or filter settings.'
                      : 'No payments have been recorded yet. Completed orders and settlements will appear here.'
                  }
                  secondaryActionLabel={search || selectedStatus || selectedMethod ? 'Reset Filters' : undefined}
                  onSecondaryAction={() => {
                    setSearch('');
                    setSelectedStatus('');
                    setSelectedMethod('');
                  }}
                />
              ) : (

                payments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#384959] dark:text-slate-100 block">{t.transaction_id}</span>
                      {t.notes && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                          {t.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#6A89A7] dark:text-[#88BDF2] font-semibold">{t.order_number}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{t.customer_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 block">{t.payment_method}</span>
                      {t.payment_method === 'CASH' && t.notes && t.notes.includes('Tendered') && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Cash Tendered
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#384959] dark:text-[#88BDF2]">
                      ₹{Number(t.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={t.status === 'PAID' ? 'success' : 'warning'} size="xs">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 dark:text-slate-500">
                      {new Date(t.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </Card>
    </div>
  );
};

export default PaymentList;
