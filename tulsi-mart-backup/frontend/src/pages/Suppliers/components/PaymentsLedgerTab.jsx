import React from 'react';
import { Card } from '../../../components/common/Card';
import { EmptyState } from '../../../components/common/UiHelpers';
import { Receipt, CheckCircle2 } from 'lucide-react';

export const PaymentsLedgerTab = ({ paymentsList }) => {
  if (paymentsList.length === 0) {
    return (
      <Card className="p-0 overflow-hidden font-sans border border-teal-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <EmptyState
          variant="default"
          icon={Receipt}
          title="No Supplier Payment Receipts"
          description="Settlements paid to wholesale suppliers will be logged here."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 🌟 Responsive Card Grid View (Image 2 POS Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {paymentsList.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-[#00796b] dark:hover:border-[#80cbc4] transition-all flex flex-col justify-between"
          >
            {/* Top Row: Date, Reference & Payment Method Badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono font-black text-sm text-[#00796b] dark:text-[#80cbc4] tracking-tight">
                  {p.payment_date}
                </p>
                <p className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Ref: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.reference_number || 'REF-N/A'}</span>
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 shadow-2xs">
                {p.payment_method || 'BANK TRANSFER'}
              </span>
            </div>

            {/* Middle Row: Supplier Name & Amount Paid */}
            <div className="flex items-center justify-between text-xs py-2.5 my-1 border-t border-b border-teal-100/60 dark:border-slate-800">
              <div className="min-w-0 pr-2">
                <p className="font-black text-base text-slate-900 dark:text-slate-100 truncate">
                  {p.supplier_name || 'Wholesale Supplier'}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                  {p.notes || 'Payout Logged'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-[#00796b] dark:text-[#80cbc4] font-heading block">
                  ₹{Number(p.amount).toFixed(2)}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Settled Outflow ✓
                </span>
              </div>
            </div>

            {/* Bottom Row: Notes / Receipt Indicator */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                {p.notes || 'Gulla/Bank Voucher'}
              </span>
              <span className="text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] bg-teal-50 dark:bg-slate-800 px-3 py-1 rounded-xl">
                Payment Receipt
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentsLedgerTab;
