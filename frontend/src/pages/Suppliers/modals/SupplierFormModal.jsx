import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  CreditCard, 
  Wallet, 
  MapPin, 
  Tag, 
  CheckCircle2 
} from 'lucide-react';

export const SupplierFormModal = ({
  isOpen,
  onClose,
  editingSupplier,
  supplierForm,
  setSupplierForm,
  supplierCategories = [],
  onSaveSupplier
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      title={
        <div className="flex items-center gap-3 text-left font-sans">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-900/20 shrink-0">
            <Building2 className="w-5.5 h-5.5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
              {editingSupplier ? "Edit Wholesale Supplier Profile" : "Register New Wholesale Supplier"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Specify company credentials, GSTIN, payment terms, and credit limits
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full font-sans">
          <Button 
            variant="outline" 
            size="md" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            onClick={onSaveSupplier}
            className="px-6 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white shadow-md flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingSupplier ? "Update Supplier" : "Save Supplier"}</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSaveSupplier(e); }} className="space-y-4 font-sans text-slate-800 dark:text-slate-100 pb-1">
        
        {/* Section 1: Vendor & Contact Identity */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#00796b] dark:text-teal-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Company & Vendor Credentials
          </h3>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Company / Agency Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={supplierForm.company_name}
                onChange={(e) => setSupplierForm({ ...supplierForm, company_name: e.target.value })}
                placeholder="e.g. Shree Ganesh Agro Wholesale Ltd"
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-[#00796b]" /> Contact Person Name *
              </label>
              <input
                type="text"
                required
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#00796b]" /> Supplier Category
              </label>
              <select
                value={supplierForm.category}
                onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white cursor-pointer"
              >
                {supplierCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Tax Details */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#00796b] dark:text-teal-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Phone, Email & GSTIN Tax Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#00796b]" /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#00796b]" /> Email Address
              </label>
              <input
                type="email"
                value={supplierForm.email || ''}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="vendor@example.com"
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#00796b]" /> GSTIN Number
              </label>
              <input
                type="text"
                value={supplierForm.gstin}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value })}
                placeholder="27AAACG1122D1Z1"
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Commercial Terms & Location */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#00796b] dark:text-teal-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Payment Terms & Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#00796b]" /> Payment Terms
              </label>
              <select
                value={supplierForm.payment_terms}
                onChange={(e) => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="Advance">Advance Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-[#00796b]" /> Credit Limit (₹)
              </label>
              <input
                type="number"
                value={supplierForm.credit_limit}
                onChange={(e) => setSupplierForm({ ...supplierForm, credit_limit: e.target.value })}
                placeholder="100000"
                className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#00796b]" /> Address & City Location
            </label>
            <input
              type="text"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              placeholder="APMC Market Yard, Vashi, Navi Mumbai"
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default SupplierFormModal;
