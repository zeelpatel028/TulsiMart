import React, { useState } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { EmptyState } from '../../../components/common/UiHelpers';
import { FileText, Plus, CheckCircle2, CreditCard, CalendarCheck, Clock, Layers, LayoutGrid, List } from 'lucide-react';

export const PurchaseOrdersTab = ({
  purchaseOrders,
  onCreatePO,
  onOpenReceiveModal,
  onPayPO,
  viewMode: propViewMode
}) => {
  const [internalViewMode, setInternalViewMode] = useState('table');
  const viewMode = propViewMode || internalViewMode;
  const poList = Array.isArray(purchaseOrders) ? purchaseOrders : [];

  if (poList.length === 0) {
    return (
      <Card className="p-0 overflow-hidden font-sans border border-teal-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <EmptyState
          variant="default"
          icon={FileText}
          title="No Purchase Orders"
          description="No procurement orders created. Click Create PO to generate a wholesale order."
          actionLabel="Create PO"
          onAction={onCreatePO}
          actionIcon={Plus}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {!propViewMode && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00796b] dark:text-[#80cbc4]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Wholesale Purchase Orders ({poList.length})
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

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {poList.map((po) => {
            const total = parseFloat(po.total_amount || 0);
            const paid = parseFloat(po.paid_amount || 0);
            const due = Math.max(0, total - paid);
            const isReceived = po.status === 'RECEIVED';
            const recDate = po.received_date || (isReceived ? (po.updated_at ? po.updated_at.split('T')[0] : po.order_date) : null);

            return (
              <div
                key={po.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-[#00796b] dark:hover:border-[#80cbc4] transition-all flex flex-col justify-between"
              >
                {/* Top Row: PO Number, Date & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-black text-sm text-[#00796b] dark:text-[#80cbc4] tracking-tight">
                      {po.po_number}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Ordered: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{po.order_date}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                    isReceived
                      ? 'bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200'
                      : po.status === 'ORDERED'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {po.status}
                  </span>
                </div>

                {/* Middle Row: Supplier & Amount + Payment Breakdown */}
                <div className="flex items-center justify-between text-xs py-2.5 my-1 border-t border-b border-teal-100/60 dark:border-slate-800">
                  <div className="min-w-0 pr-2">
                    <p className="font-black text-base text-slate-900 dark:text-slate-100 truncate">
                      {po.supplier_name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                      {po.supplier_company || `${po.items?.length || 1} items on order`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-[#00796b] dark:text-[#80cbc4] font-heading block">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                    <div className="text-[10px] font-bold mt-0.5">
                      {due > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-black">
                          Due: ₹{due.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          Paid & Settled ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Received Status & Actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    {recDate ? (
                      <span className="text-[10px] font-black text-[#00796b] dark:text-[#80cbc4] bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-lg border border-teal-200/80">
                        Received: {recDate}
                      </span>
                    ) : po.expected_delivery ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        Exp: {po.expected_delivery}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {po.items?.length || 1} items
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {due > 0 && onPayPO && (
                      <button
                        onClick={() => onPayPO(po)}
                        className="px-3 py-1.5 bg-[#00796b] hover:bg-[#004d40] text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        Pay Order
                      </button>
                    )}

                    {!isReceived ? (
                      <button
                        onClick={() => onOpenReceiveModal(po)}
                        className="px-3 py-1.5 bg-teal-50 dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-100 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Receive
                      </button>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Synced
                      </span>
                    )}
                  </div>
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
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4 text-right">Total Valuation</th>
                  <th className="py-3.5 px-4 text-right">Payment Status</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {poList.map((po) => {
                  const total = parseFloat(po.total_amount || 0);
                  const paid = parseFloat(po.paid_amount || 0);
                  const due = Math.max(0, total - paid);
                  const isReceived = po.status === 'RECEIVED';
                  return (
                    <tr key={po.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                      <td className="py-3 px-4 font-mono font-black text-[#00796b] dark:text-[#80cbc4]">
                        {po.po_number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {po.supplier_name || 'Wholesale Vendor'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                        {po.order_date}
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
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isReceived
                            ? 'bg-teal-100 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300'
                            : po.status === 'ORDERED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {due > 0 && onPayPO && (
                            <button
                              onClick={() => onPayPO(po)}
                              className="px-2.5 py-1 bg-[#00796b] hover:bg-[#004d40] text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer shadow-2xs"
                            >
                              Pay
                            </button>
                          )}
                          {!isReceived ? (
                            <button
                              onClick={() => onOpenReceiveModal(po)}
                              className="px-2.5 py-1 bg-teal-50 dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-100 font-extrabold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              Receive
                            </button>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                              Synced ✓
                            </span>
                          )}
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
    </div>
  );
};

export default PurchaseOrdersTab;
