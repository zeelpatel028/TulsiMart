import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';

export const SupplierFormModal = ({
  isOpen,
  onClose,
  editingSupplier,
  supplierForm,
  setSupplierForm,
  supplierCategories,
  onSaveSupplier
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSupplier ? "Edit Wholesale Supplier Profile" : "Register New Wholesale Supplier"}
      subtitle="Specify company credentials, GSTIN, payment terms, and credit limit"
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={onSaveSupplier}>
            {editingSupplier ? "Update Supplier" : "Save Supplier"}
          </Button>
        </div>
      }
    >
      <form onSubmit={onSaveSupplier} className="space-y-3 text-xs font-sans">
        <div>
          <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Company / Agency Name *</label>
          <input
            type="text"
            required
            value={supplierForm.company_name}
            onChange={(e) => setSupplierForm({ ...supplierForm, company_name: e.target.value })}
            placeholder="e.g. Shree Ganesh Agro Wholesale Ltd"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Contact Person Name *</label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Supplier Category</label>
            <select
              value={supplierForm.category}
              onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              {supplierCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              placeholder="9876543210"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">GSTIN Number</label>
            <input
              type="text"
              value={supplierForm.gstin}
              onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value })}
              placeholder="27AAACG1122D1Z1"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Payment Terms</label>
            <select
              value={supplierForm.payment_terms}
              onChange={(e) => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="Net 7">Net 7 Days</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="Advance">Advance Payment</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              value={supplierForm.credit_limit}
              onChange={(e) => setSupplierForm({ ...supplierForm, credit_limit: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Address & City</label>
          <input
            type="text"
            value={supplierForm.address}
            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            placeholder="APMC Market Yard, Vashi, Navi Mumbai"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </form>
    </Modal>
  );
};

export default SupplierFormModal;
