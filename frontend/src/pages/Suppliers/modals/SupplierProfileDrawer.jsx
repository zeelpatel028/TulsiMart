import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';

export const SupplierProfileDrawer = ({
  viewingSupplierProfile,
  onClose,
  purchaseOrders
}) => {
  if (!viewingSupplierProfile) return null;

  return (
    <Modal
      isOpen={!!viewingSupplierProfile}
      onClose={onClose}
      title={`Supplier Profile: ${viewingSupplierProfile.company_name || viewingSupplierProfile.name}`}
      subtitle="Vendor contact information, payment terms, and transaction ledger"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs font-sans">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Contact Manager</p>
            <p className="font-bold text-sm text-[#384959] dark:text-slate-100 mt-0.5">{viewingSupplierProfile.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p>
            <p className="font-bold text-sm font-mono text-[#384959] dark:text-slate-100 mt-0.5">{viewingSupplierProfile.phone}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">GSTIN</p>
            <p className="font-bold text-sm font-mono text-[#384959] dark:text-slate-100 mt-0.5">{viewingSupplierProfile.gstin || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Category</p>
            <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{viewingSupplierProfile.category || 'General Grocery'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Payment Terms</p>
            <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{viewingSupplierProfile.payment_terms || 'Net 15'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Pending Ledger</p>
            <p className="font-black text-rose-600 dark:text-rose-400 text-sm mt-0.5">
              ₹{Number(viewingSupplierProfile.pending_balance || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-xs text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-2">
            Recent Purchase Orders Issued
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {purchaseOrders
              .filter(po => po.supplier === viewingSupplierProfile.id || po.supplier_name === viewingSupplierProfile.name)
              .slice(0, 4)
              .map(po => (
                <div key={po.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#384959] dark:text-slate-100">{po.po_number}</span>
                    <span className="text-[10px] text-slate-400 block">{po.order_date}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#384959] dark:text-[#88BDF2]">₹{Number(po.total_amount).toLocaleString('en-IN')}</span>
                    <Badge variant="default" size="xs" className="block mt-0.5">{po.status}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SupplierProfileDrawer;
