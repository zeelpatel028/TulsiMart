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
            <p className="font-bold text-sm text-[#263238] dark:text-slate-100 mt-0.5">{viewingSupplierProfile.name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
            <p className="font-bold text-sm font-mono text-[#263238] dark:text-slate-100 mt-0.5">{viewingSupplierProfile.phone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">GSTIN</p>
            <p className="font-bold text-sm font-mono text-[#263238] dark:text-slate-100 mt-0.5">{viewingSupplierProfile.gstin || 'N/A'}</p>
          </div>
        </div>

        {/* Financial metrics */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Purchase Dues</p>
            <p className="text-sm font-black text-amber-600 dark:text-amber-400">
              ₹{Number(viewingSupplierProfile.pending_balance || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Credit Limit</p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              ₹{Number(viewingSupplierProfile.credit_limit || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Recent POs */}
        <div>
          <h4 className="font-bold text-xs text-[#263238] dark:text-slate-200 uppercase tracking-wider mb-2">
            Purchase Orders ({supplierPOs.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {supplierPOs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No purchase orders created yet.</p>
            ) : (
              supplierPOs.map(po => (
                <div key={po.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[#00695C] dark:text-[#4DB6AC]">{po.po_number}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{po.order_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#263238] dark:text-[#4DB6AC]">₹{Number(po.total_amount).toLocaleString('en-IN')}</span>
                    <Badge variant="default" size="xs" className="block mt-0.5">{po.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SupplierProfileDrawer;
