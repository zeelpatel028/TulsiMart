import React from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { EmptyState } from '../../../components/common/UiHelpers';
import { FileText, Plus, CheckCircle2, CreditCard, CalendarCheck, Clock } from 'lucide-react';

export const PurchaseOrdersTab = ({
  purchaseOrders,
  onCreatePO,
  onOpenReceiveModal,
  onPayPO
}) => {
  return (
    <Card className="p-0 overflow-hidden font-sans shadow-xs border-slate-200/80 dark:border-slate-800">
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
        <table className="w-full min-w-[780px] text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">PO Number & Timeline</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4 text-right">Total (₹)</th>
              <th className="py-3 px-4 text-right">Paid / Due (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {purchaseOrders.length === 0 ? (
              <EmptyState
                variant="table"
                colSpan={7}
                icon={FileText}
                title="No Purchase Orders"
                description="No procurement orders created. Click Create PO to generate a wholesale order."
                actionLabel="Create PO"
                onAction={onCreatePO}
                actionIcon={Plus}
              />
            ) : (
              purchaseOrders.map((po) => {
                const total = parseFloat(po.total_amount || 0);
                const paid = parseFloat(po.paid_amount || 0);
                const due = Math.max(0, total - paid);
                const isReceived = po.status === 'RECEIVED';
                const recDate = po.received_date || (isReceived ? (po.updated_at ? po.updated_at.split('T')[0] : po.order_date) : null);

                return (
                  <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-mono font-black text-[#384959] dark:text-slate-100 text-sm">{po.po_number}</p>
                      <div className="text-[10px] space-y-0.5 mt-1">
                        <p className="text-slate-500 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Ordered: </span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{po.order_date}</span>
                        </p>
                        {recDate ? (
                          <p className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md w-fit">
                            <CalendarCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Received: </span>
                            <span className="font-mono">{recDate}</span>
                          </p>
                        ) : po.expected_delivery ? (
                          <p className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <span>Expected: </span>
                            <span className="font-mono">{po.expected_delivery}</span>
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#384959] dark:text-slate-100">{po.supplier_name}</p>
                      <p className="text-[10px] text-slate-400">{po.supplier_company}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        {po.items?.length || 1} items
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#384959] dark:text-[#88BDF2]">
                      ₹{total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                        Paid: ₹{paid.toFixed(2)}
                      </p>
                      {due > 0 ? (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold">
                          Due: ₹{due.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-600 font-bold">Settled ✓</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={isReceived ? 'success' : po.status === 'ORDERED' ? 'warning' : 'default'} size="xs">
                        {po.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {due > 0 && onPayPO && (
                          <Button
                            variant="accent"
                            size="sm"
                            icon={CreditCard}
                            onClick={() => onPayPO(po)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Pay Order
                          </Button>
                        )}

                        {!isReceived ? (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={CheckCircle2}
                            onClick={() => onOpenReceiveModal(po)}
                            className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 font-bold"
                          >
                            Receive & Restock
                          </Button>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced
                          </span>
                        )}
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
  );
};

export default PurchaseOrdersTab;
