import React from 'react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { EmptyState } from '../../../components/common/UiHelpers';
import { Package } from 'lucide-react';

export const GrnLedgerTab = ({ grnList }) => {
  return (
    <Card className="p-0 overflow-hidden font-sans">
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
        <table className="w-full min-w-[700px] text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">GRN Number & Date</th>
              <th className="py-3 px-4">PO Reference</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4 text-center">Items Received</th>
              <th className="py-3 px-4 text-right">Total Stock Value (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {grnList.length === 0 ? (
              <EmptyState
                variant="table"
                colSpan={6}
                icon={Package}
                title="No Goods Receipt Notes (GRN)"
                description="When purchase orders are verified and received, generated GRN vouchers will appear here."
              />
            ) : (
              grnList.map((grn) => (
                <tr key={grn.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                  <td className="py-3 px-4 font-mono font-bold text-[#384959] dark:text-slate-100">
                    {grn.grn_number}
                    <p className="text-[10px] text-slate-400 font-normal">{grn.received_date}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{grn.po_number}</td>
                  <td className="py-3 px-4 font-bold text-[#384959] dark:text-slate-100">{grn.supplier_name}</td>
                  <td className="py-3 px-4 text-center font-bold">{grn.total_items} items verified</td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{Number(grn.total_valuation).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="success" size="xs">GRN Verified</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default GrnLedgerTab;
