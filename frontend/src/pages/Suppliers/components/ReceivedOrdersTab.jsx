import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { EmptyState } from '../../../components/common/UiHelpers';
import { PackageCheck, Calendar, CheckCircle2, LayoutGrid, List, Truck, Layers } from 'lucide-react';

const formatDateGroupKey = (dateStr) => {
  if (!dateStr) return 'Unspecified Date';
  try {
    const today = new Date().toISOString().split('T')[0];
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unspecified Date';
    const formatted = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    if (cleanDateStr === today) {
      return `Today (${formatted})`;
    }
    return formatted;
  } catch (e) {
    return 'Unspecified Date';
  }
};

export const ReceivedOrdersTab = ({
  purchaseOrders,
  onPayPO,
  viewMode: propViewMode
}) => {
  const [internalViewMode, setInternalViewMode] = useState('grid');
  const viewMode = propViewMode || internalViewMode;

  // Filter only RECEIVED purchase orders
  const receivedList = useMemo(() => {
    const list = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    return list.filter(po => po && (po.status?.toUpperCase() === 'RECEIVED' || po.is_received));
  }, [purchaseOrders]);

  // Group received orders day-wise
  const dayGroups = useMemo(() => {
    const groups = {};
    receivedList.forEach(po => {
      const dateVal = po.received_date || po.updated_at || po.order_date;
      const dateKey = formatDateGroupKey(dateVal);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(po);
    });
    return groups;
  }, [receivedList]);

  if (receivedList.length === 0) {
    return (
      <Card className="p-0 overflow-hidden font-sans border border-teal-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <EmptyState
          variant="default"
          icon={PackageCheck}
          title="No Received Orders Yet"
          description="Purchase orders marked as Received will be stored and organized day-wise here."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {!propViewMode && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-[#00796b] dark:text-[#80cbc4]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Received Wholesale Orders ({receivedList.length})
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setInternalViewMode('grid')}
              title="Grid View (Cards)"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setInternalViewMode('table')}
              title="Table View (List)"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Day-Wise Grouped Received Orders */}
      {Object.entries(dayGroups).map(([dateName, dayPOs]) => {
        const dateTotal = dayPOs.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0);
        const dateDue = dayPOs.reduce((sum, po) => sum + Math.max(0, parseFloat(po.total_amount || 0) - parseFloat(po.paid_amount || 0)), 0);

        return (
          <div key={dateName} className="space-y-3">
            {/* 📅 Date Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-slate-50/80 dark:from-slate-800 dark:via-slate-850 dark:to-emerald-950/40 p-3 px-4 rounded-2xl border border-emerald-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-900/50">
                  <Calendar className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading whitespace-nowrap">
                  {dateName}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 whitespace-nowrap shrink-0">
                  {dayPOs.length} Received {dayPOs.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono font-bold whitespace-nowrap shrink-0">
                <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Total Valuation: <strong className="text-[#00796b] dark:text-teal-300 text-sm font-black">₹{dateTotal.toLocaleString('en-IN')}</strong>
                </span>
                {dateDue > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/80 whitespace-nowrap shrink-0">
                    Pending Due: ₹{dateDue.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 whitespace-nowrap shrink-0">
                    Fully Paid ✓
                  </span>
                )}
              </div>
            </div>

            {/* View Grid vs Table */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                {dayPOs.map((po) => {
                  const total = parseFloat(po.total_amount || 0);
                  const paid = parseFloat(po.paid_amount || 0);
                  const due = Math.max(0, total - paid);
                  const recDate = po.received_date || (po.updated_at ? po.updated_at.split('T')[0] : po.order_date);
                  const itemsList = Array.isArray(po.items) ? po.items : [];

                  return (
                    <div
                      key={po.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {/* Top Row: PO Number & Date */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono font-black text-sm text-[#00796b] dark:text-[#80cbc4] tracking-tight">
                            {po.po_number}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Received Date: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{recDate}</span>
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RECEIVED
                        </span>
                      </div>

                      {/* Supplier Details */}
                      <div className="space-y-1 py-1 border-t border-teal-100/60 dark:border-slate-800">
                        <p className="font-black text-base text-slate-900 dark:text-slate-100 truncate">
                          {po.supplier_name || 'Wholesale Vendor'}
                        </p>
                        {po.supplier_company && (
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                            {po.supplier_company}
                          </p>
                        )}
                      </div>

                      {/* Product Items Breakdown */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Received Products ({itemsList.length || 1})
                        </span>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1 font-mono">
                          {itemsList.length > 0 ? (
                            itemsList.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                                <span className="truncate pr-2">{item.product_name || 'Generic Item'}</span>
                                <span className="shrink-0 font-bold">x{item.quantity} (₹{item.unit_cost})</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-500">1 Bulk Procurement Batch</div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Financial Status & Pay Action */}
                      <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono block">
                            ₹{total.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold block">
                            {due > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-black">
                                Due: ₹{due.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                Settled ✓
                              </span>
                            )}
                          </span>
                        </div>

                        {due > 0 && onPayPO && (
                          <button
                            onClick={() => onPayPO(po)}
                            className="px-3 py-1.5 bg-[#00796b] hover:bg-[#004d40] text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
                          >
                            Pay Order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
                  <table className="w-full min-w-[750px] text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-teal-50/80 dark:bg-slate-800 shadow-xs">
                      <tr className="bg-teal-50/80 dark:bg-slate-800 border-b border-teal-200/80 dark:border-slate-800 text-[#00695c] dark:text-teal-300 font-extrabold uppercase tracking-wider text-[11px] whitespace-nowrap">
                        <th className="py-3.5 px-4">PO Number</th>
                        <th className="py-3.5 px-4">Supplier</th>
                        <th className="py-3.5 px-4">Received Date</th>
                        <th className="py-3.5 px-4">Received Products</th>
                        <th className="py-3.5 px-4 text-right">Valuation</th>
                        <th className="py-3.5 px-4 text-right">Payment</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {dayPOs.map((po) => {
                        const total = parseFloat(po.total_amount || 0);
                        const paid = parseFloat(po.paid_amount || 0);
                        const due = Math.max(0, total - paid);
                        const recDate = po.received_date || (po.updated_at ? po.updated_at.split('T')[0] : po.order_date);
                        const itemsList = Array.isArray(po.items) ? po.items : [];

                        return (
                          <tr key={po.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                            <td className="py-3 px-4 font-mono font-black text-[#00796b] dark:text-[#80cbc4]">
                              {po.po_number}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                              {po.supplier_name || 'Wholesale Vendor'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                              {recDate}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                              {itemsList.map(it => it.product_name).join(', ') || `${itemsList.length || 1} Products`}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 font-mono">
                              ₹{total.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold">
                              {due > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-black">
                                  Due: ₹{due.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                  Paid ✓
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {due > 0 && onPayPO && (
                                <button
                                  onClick={() => onPayPO(po)}
                                  className="px-2.5 py-1 bg-[#00796b] hover:bg-[#004d40] text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer shadow-2xs"
                                >
                                  Pay
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReceivedOrdersTab;
