import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { CheckCircle2 } from 'lucide-react';

export const GoodsReceiveModal = ({
  isOpen,
  onClose,
  selectedPOForReceive,
  receiveItems,
  setReceiveItems,
  onConfirmManualReceive
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manual Goods Receipt & Restock (માલ ચકાસણી પત્રક)`}
      subtitle={`Verify physical goods received & stock quantity for PO #${selectedPOForReceive?.po_number}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full font-sans">
          <div className="text-xs text-left">
            <span className="text-slate-500 font-semibold">Total Verified Stock Value: </span>
            <span className="font-extrabold text-[#384959] dark:text-[#88BDF2]">
              ₹{receiveItems.reduce((acc, i) => acc + (parseFloat(i.unit_cost || 0) * parseInt(i.received_quantity || 0, 10)), 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={CheckCircle2}
              onClick={onConfirmManualReceive}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Restock Stock
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-300">
          <p className="font-bold flex items-center gap-1.5">
            <span>📦</span> Manual Stock Verification Mode
          </p>
          <p className="text-[11px] mt-0.5 opacity-90">
            Vendor: <strong>{selectedPOForReceive?.supplier_name || 'Supplier'}</strong> ({selectedPOForReceive?.supplier_company || 'Company'})
          </p>
          <p className="text-[11px] mt-1 text-slate-600 dark:text-slate-400">
            Please enter the exact received physical quantity, batch number, and expiry date below. Clicking confirm will manually add these verified quantities directly to your store stock inventory.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3 text-center">Ordered</th>
                <th className="py-2.5 px-3 text-center">Received Qty</th>
                <th className="py-2.5 px-3 text-center">Batch / Expiry</th>
                <th className="py-2.5 px-3 text-right">Unit Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {receiveItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-[#384959] dark:text-slate-100">
                    {item.product_name}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {item.ordered_quantity} pcs
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={item.received_quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReceiveItems(prev => prev.map((it, i) => i === idx ? { ...it, received_quantity: val } : it));
                      }}
                      className="w-20 px-2 py-1 text-center font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="text"
                      value={item.batch_number}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReceiveItems(prev => prev.map((it, i) => i === idx ? { ...it, batch_number: val } : it));
                      }}
                      className="w-28 px-1.5 py-1 text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReceiveItems(prev => prev.map((it, i) => i === idx ? { ...it, unit_cost: val } : it));
                      }}
                      className="w-24 px-2 py-1 text-right font-mono font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default GoodsReceiveModal;
