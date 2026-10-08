import React from 'react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { EmptyState } from '../../../components/common/UiHelpers';
import { 
  Building2, 
  Plus, 
  Phone, 
  Eye, 
  Edit, 
  Trash2,
  CreditCard
} from 'lucide-react';
import { Card } from '../../../components/common/Card';

export const SuppliersDirectoryTab = ({
  suppliers = [],
  purchaseOrders = [],
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  supplierCategories,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
  onViewProfile,
  onPaySupplier,
  viewMode = 'grid'
}) => {
  const suppList = Array.isArray(suppliers) ? suppliers : [];
  const filteredSuppliers = suppList.filter(s => {
    if (!s) return false;
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesSearch = !search || (
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.company_name && s.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search)) ||
      (s.gstin && s.gstin.toLowerCase().includes(search.toLowerCase()))
    );
    return matchesCategory && matchesSearch;
  });

  const getInitials = (name) => {
    if (!name) return 'SU';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 font-sans">

      {filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Suppliers Found"
          description="Your wholesale vendor list is empty. Register suppliers to manage inventory reordering and ledger balances."
          variant="card"
          actionLabel="Add Supplier"
          onAction={onAddSupplier}
          actionIcon={Plus}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => {
            const pendingBal = Number(s.pending_balance || 0);
            const martName = s.company_name || s.name || 'Vendor Mart';
            const contactName = s.name || 'N/A';

            // Calculate PO/Bill counts for this supplier
            const supplierPOs = (purchaseOrders || []).filter(po => 
              po && (
                String(po.supplier) === String(s.id) || 
                String(po.supplier_id) === String(s.id) ||
                (s.name && po.supplier_name === s.name) ||
                (s.company_name && po.supplier_company === s.company_name)
              )
            );
            const totalBillCount = supplierPOs.length || s.total_pos || s.total_bills || 0;
            const pendingBillCount = supplierPOs.filter(po => 
              po.status === 'ORDERED' || po.status === 'PARTIAL' || (parseFloat(po.total_amount || 0) > parseFloat(po.paid_amount || 0))
            ).length || s.pending_pos || s.pending_bills || (pendingBal > 0 ? 1 : 0);

            return (
              <div
                key={s.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-lg transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Ambient Glow Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>

                <div>
                  {/* Header Row: Initials Avatar, Supplier Mart Name, Supplier Name, Active Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-[#00796b] text-white font-black flex items-center justify-center text-sm shadow-md shadow-teal-700/20 shrink-0 tracking-wider">
                        {getInitials(martName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        {/* Supplier Mart Name */}
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 font-heading group-hover:text-[#00796b] dark:group-hover:text-teal-400 transition-colors truncate leading-snug">
                          {martName}
                        </h3>
                        {/* Supplier Name */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate">
                          Contact: <span className="text-slate-800 dark:text-slate-200 font-bold">{contactName}</span>
                        </p>
                      </div>
                    </div>
                    <Badge variant={s.is_active !== false ? 'success' : 'secondary'} size="xs" className="shrink-0">
                      {s.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Phone Number Row */}
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-[#00796b] dark:text-teal-400 shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm tracking-wide">
                      {s.phone || 'N/A'}
                    </span>
                  </div>

                  {/* Metrics Row: Pending Balance, Pending Bill Count, Total Bill Count */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                    {/* Pending Balance */}
                    <div className="text-left border-r border-slate-200/60 dark:border-slate-700/60 pr-1">
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">
                        Pending Bal
                      </p>
                      <p className={`font-black text-sm font-mono mt-0.5 truncate ${pendingBal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ₹{pendingBal.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Pending Bill Count */}
                    <div className="border-r border-slate-200/60 dark:border-slate-700/60 px-1">
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">
                        Pending Bills
                      </p>
                      <p className="font-black text-sm font-mono text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                        {pendingBillCount} <span className="text-[10px] font-normal text-slate-400">Bills</span>
                      </p>
                    </div>

                    {/* Total Bill Count */}
                    <div className="text-right pl-1">
                      <p className="text-[10px] text-slate-400 dark:text-slate-400 font-extrabold uppercase tracking-wider truncate">
                        Total Bills
                      </p>
                      <p className="font-black text-sm font-mono text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {totalBillCount} <span className="text-[10px] font-normal text-slate-400">Bills</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons: View Profile (Eye), Edit Profile (Edit), Delete (Trash2), Pay Supplier / Bill Pay */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* View Profile */}
                    <button
                      type="button"
                      onClick={() => onViewProfile(s)}
                      className="p-2 text-slate-500 hover:text-[#00796b] dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Profile */}
                    <button
                      type="button"
                      onClick={() => onEditSupplier(s)}
                      className="p-2 text-slate-500 hover:text-[#00796b] dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteSupplier(s.id, s.company_name || s.name)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pay Supplier / Bill Pay */}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CreditCard}
                    onClick={() => onPaySupplier(s)}
                    className="bg-[#00796b] hover:bg-[#004d40] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer px-3.5 py-2"
                  >
                    Pay Supplier
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
            <table className="w-full min-w-[750px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-teal-50/90 dark:bg-slate-800 shadow-2xs">
                <tr className="border-b border-teal-200/80 dark:border-slate-800 text-[#00796b] dark:text-teal-300 font-extrabold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  <th className="py-3.5 px-4">Supplier Mart / Name</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4 text-center">Pending Bills</th>
                  <th className="py-3.5 px-4 text-center">Total Bills</th>
                  <th className="py-3.5 px-4 text-right">Pending Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSuppliers.map((s) => {
                  const pendingBal = Number(s.pending_balance || 0);
                  const martName = s.company_name || s.name || '';
                  const contactName = s.name || 'N/A';

                  const supplierPOs = (purchaseOrders || []).filter(po => 
                    po && (
                      String(po.supplier) === String(s.id) || 
                      String(po.supplier_id) === String(s.id) ||
                      (s.name && po.supplier_name === s.name) ||
                      (s.company_name && po.supplier_company === s.company_name)
                    )
                  );
                  const totalBillCount = supplierPOs.length || s.total_pos || s.total_bills || 0;
                  const pendingBillCount = supplierPOs.filter(po => 
                    po.status === 'ORDERED' || po.status === 'PARTIAL' || (parseFloat(po.total_amount || 0) > parseFloat(po.paid_amount || 0))
                  ).length || s.pending_pos || s.pending_bills || (pendingBal > 0 ? 1 : 0);

                  return (
                    <tr key={s.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#00796b] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {getInitials(martName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{martName}</p>
                            <p className="text-[11px] text-slate-500">Contact: {contactName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {s.phone || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                        {pendingBillCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {totalBillCount}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono">
                        <span className={pendingBal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          ₹{pendingBal.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={s.is_active !== false ? 'success' : 'secondary'} size="xs">
                          {s.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onViewProfile(s)}
                            className="p-1.5 text-slate-500 hover:text-[#00796b] hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditSupplier(s)}
                            className="p-1.5 text-slate-500 hover:text-[#00796b] hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSupplier(s.id, s.company_name || s.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {onPaySupplier && (
                            <Button
                              variant="primary"
                              size="xs"
                              icon={CreditCard}
                              onClick={() => onPaySupplier(s)}
                              className="bg-[#00796b] hover:bg-[#004d40] text-white font-bold cursor-pointer ml-1"
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SuppliersDirectoryTab;
