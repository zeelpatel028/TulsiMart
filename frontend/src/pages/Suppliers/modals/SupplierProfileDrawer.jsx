import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Star, 
  CreditCard, 
  FileText, 
  UserCheck, 
  Calendar, 
  ShieldAlert,
  Wallet,
  Receipt
} from 'lucide-react';

export const SupplierProfileDrawer = ({
  viewingSupplierProfile,
  onClose,
  purchaseOrders = []
}) => {
  if (!viewingSupplierProfile) return null;

  const supplierPOs = purchaseOrders.filter(
    po => po.supplier === viewingSupplierProfile.id || po.supplier_id === viewingSupplierProfile.id || po.supplier_name === viewingSupplierProfile.name
  );

  const pendingBal = Number(viewingSupplierProfile.pending_balance || 0);
  const creditLimit = Number(viewingSupplierProfile.credit_limit || 0);

  const getInitials = (name) => {
    if (!name) return 'SU';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Modal
      isOpen={Boolean(viewingSupplierProfile)}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={
        <span className="flex items-center gap-3 text-left">
          <span className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-teal-600/20 shrink-0 tracking-wider">
            {getInitials(viewingSupplierProfile.company_name || viewingSupplierProfile.name)}
          </span>
          <span className="block min-w-0">
            <span className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                {viewingSupplierProfile.company_name || viewingSupplierProfile.name}
              </span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                #SUP-{viewingSupplierProfile.id}
              </span>
            </span>
            <span className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                viewingSupplierProfile.is_active === false 
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60' 
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${viewingSupplierProfile.is_active === false ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                {viewingSupplierProfile.is_active === false ? 'Inactive Supplier' : 'Active Vendor'}
              </span>
              {viewingSupplierProfile.category && (
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  • {viewingSupplierProfile.category}
                </span>
              )}
            </span>
          </span>
        </span>
      }
      footer={
        <div className="w-full flex items-center justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer text-sm shadow-xs"
          >
            Close Profile
          </Button>
        </div>
      }
    >
      <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 pb-2">
        
        {/* 1. Summary Cards (3-Card Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Dues Card */}
          <div className="p-4 bg-gradient-to-br from-rose-50/80 to-amber-50/40 dark:from-slate-800/90 dark:to-rose-950/30 rounded-2xl border border-rose-200/80 dark:border-rose-800/50 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                Pending Dues
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${pendingBal > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              ₹{pendingBal.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-medium text-rose-700/80 dark:text-rose-400 mt-1">
              {pendingBal > 0 ? 'Outstanding payable balance' : 'No pending dues'}
            </p>
          </div>

          {/* Credit Limit Card */}
          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-slate-800/90 dark:to-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                Credit Limit
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              ₹{creditLimit.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] font-medium text-blue-700/80 dark:text-blue-400 mt-1">
              Approved credit terms
            </p>
          </div>

          {/* Vendor Rating Card */}
          <div className="p-4 bg-gradient-to-br from-amber-50/80 to-yellow-50/40 dark:from-slate-800/90 dark:to-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Vendor Rating
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {viewingSupplierProfile.rating || 5}.0
              </span>
              <div className="flex items-center gap-0.5 text-amber-500 ml-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < (viewingSupplierProfile.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                ))}
              </div>
            </div>
            <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400 mt-1">
              {viewingSupplierProfile.payment_terms || 'Net 15 Days'}
            </p>
          </div>
        </div>

        {/* 2. Supplier Information Section */}
        <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Supplier Details & Contact
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Contact Name */}
            <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Contact Person</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {viewingSupplierProfile.name || '-'}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Phone Number</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                  {viewingSupplierProfile.phone || '-'}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Email Address</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate block">
                  {viewingSupplierProfile.email || 'Not available'}
                </span>
              </div>
            </div>

            {/* GSTIN */}
            <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <Tag className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">GSTIN / Tax ID</span>
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 block">
                  {viewingSupplierProfile.gstin || 'Not registered'}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-2xs sm:col-span-2">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase block">Office / Warehouse Address</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug block">
                  {[viewingSupplierProfile.address, viewingSupplierProfile.city].filter(Boolean).join(', ') || 'Not available'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Purchase Orders & Ledger Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Purchase Orders & Stock Receipts
            </h4>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {supplierPOs.length} {supplierPOs.length === 1 ? 'order' : 'orders'} created
            </span>
          </div>

          {supplierPOs.length === 0 ? (
            /* Empty State */
            <div className="py-10 px-4 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 shadow-xs">
                <Receipt className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No purchase orders yet
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                No purchase orders or stock deliveries recorded for this vendor yet.
              </p>
            </div>
          ) : (
            /* PO List */
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {supplierPOs.map((po) => (
                <div 
                  key={po.id}
                  className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-700/70 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/50">
                        {po.po_number}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {po.order_date || po.created_at ? new Date(po.order_date || po.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                        ₹{Number(po.total_amount || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="mt-0.5">
                        <Badge 
                          variant={
                            po.status === 'RECEIVED' || po.status === 'COMPLETED' ? 'success' : 
                            po.status === 'CANCELLED' ? 'danger' : 'warning'
                          } 
                          size="xs"
                        >
                          {po.status || 'PENDING'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
};

export default SupplierProfileDrawer;
