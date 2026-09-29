import React from 'react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { EmptyState } from '../../../components/common/UiHelpers';
import { Package, CheckCircle2 } from 'lucide-react';

export const GrnLedgerTab = ({ grnList }) => {
  if (grnList.length === 0) {
    return (
      <Card className="p-0 overflow-hidden font-sans border border-teal-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <EmptyState
          variant="default"
          icon={Package}
          title="No Goods Receipt Notes (GRN)"
          description="When purchase orders are verified and received, generated GRN vouchers will appear here."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 🌟 Responsive Card Grid View (Image 2 POS Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {grnList.map((grn) => (
          <div
            key={grn.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-[#00796b] dark:hover:border-[#80cbc4] transition-all flex flex-col justify-between"
          >
            {/* Top Row: GRN Number, PO Ref & Verified Badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono font-black text-sm text-[#00796b] dark:text-[#80cbc4] tracking-tight">
                  {grn.grn_number}
                </p>
                <p className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  PO: <span className="font-semibold text-slate-700 dark:text-slate-300">{grn.po_number}</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-[#00796b] dark:text-[#80cbc4]" /> Verified
              </span>
            </div>

            {/* Middle Row: Supplier & Stock Valuation */}
            <div className="flex items-center justify-between text-xs py-2.5 my-1 border-t border-b border-teal-100/60 dark:border-slate-800">
              <div className="min-w-0 pr-2">
                <p className="font-black text-base text-slate-900 dark:text-slate-100 truncate">
                  {grn.supplier_name}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {grn.total_items} items restocked
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-[#00796b] dark:text-[#80cbc4] font-heading block">
                  ₹{Number(grn.total_valuation).toFixed(2)}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Stock Updated ✓
                </span>
              </div>
            </div>

            {/* Bottom Row: Received Date */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {grn.received_date}
              </span>
              <span className="text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] bg-teal-50 dark:bg-slate-800 px-3 py-1 rounded-xl">
                GRN Voucher Logged
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrnLedgerTab;
