import React from 'react';
import { Card } from '../../../components/common/Card';
import { EmptyState } from '../../../components/common/UiHelpers';
import { Receipt } from 'lucide-react';

export const PaymentsLedgerTab = ({ paymentsList }) => {
  return (
    <Card className="p-0 overflow-hidden font-sans">
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
        <table className="w-full min-w-[700px] text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Date & Ref No</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-right">Amount Paid (₹)</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {paymentsList.length === 0 ? (
              <EmptyState
                variant="table"
                colSpan={5}
                icon={Receipt}
                title="No Supplier Payment Receipts"
                description="Settlements paid to wholesale suppliers will be logged here."
              />
            ) : (
              paymentsList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-[#384959] dark:text-slate-100">{p.payment_date}</p>
                    <p className="text-[10px] font-mono text-slate-400">{p.reference_number || 'REF-N/A'}</p>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#384959] dark:text-slate-100">{p.supplier_name || 'Supplier'}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">{p.payment_method}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{Number(p.amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[200px]">{p.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default PaymentsLedgerTab;
