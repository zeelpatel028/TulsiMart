import React, { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { SearchInput, EmptyState } from '../../../components/common/UiHelpers';
import { 
  Building2, 
  Plus, 
  Phone, 
  Tag, 
  MapPin, 
  Star, 
  Eye, 
  Edit, 
  Trash2,
  CreditCard,
  Building,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card } from '../../../components/common/Card';

export const SuppliersDirectoryTab = ({
  suppliers,
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
            const supName = s.company_name || s.name || '';

            return (
              <div
                key={s.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 hover:border-teal-300 dark:hover:border-teal-700/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Ambient Glow */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-all pointer-events-none"></div>

                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-teal-600/20 shrink-0 tracking-wider">
                        {getInitials(supName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-sm text-[#263238] dark:text-slate-100 font-heading group-hover:text-[#00796b] dark:group-hover:text-[#80cbc4] transition-colors truncate">
                          {s.company_name || s.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">Contact: {s.name}</p>
                      </div>
                    </div>
                    <Badge variant={s.is_active !== false ? 'success' : 'secondary'} size="xs">
                      {s.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Info Meta */}
                  <div className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{s.phone}</span>
                    </div>
                    {s.gstin && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-600 dark:text-slate-300">
                          GST: {s.gstin}
                        </span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-center gap-2 text-[11px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{s.address}, {s.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Balance Summary */}
                  <div className="mt-4 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Balance</p>
                      <p className={`font-black text-sm font-mono mt-0.5 ${pendingBal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ₹{pendingBal.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vendor Rating</p>
                      <div className="flex items-center gap-0.5 text-amber-500 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < (s.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewProfile(s)}
                      className="p-2 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="View Profile Dashboard"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditSupplier(s)}
                      className="p-2 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Supplier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSupplier(s.id, s.company_name || s.name)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={CreditCard}
                    onClick={() => onPaySupplier(s)}
                    className="bg-[#00796b] hover:bg-[#004d40] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
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
                  <th className="py-3.5 px-4">Supplier / Company</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Phone / GSTIN</th>
                  <th className="py-3.5 px-4 text-right">Credit Limit</th>
                  <th className="py-3.5 px-4 text-right">Pending Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSuppliers.map((s) => {
                  const pendingBal = Number(s.pending_balance || 0);
                  const supName = s.company_name || s.name || '';
                  return (
                    <tr key={s.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {getInitials(supName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{s.company_name || s.name}</p>
                            <p className="text-[11px] text-slate-500">Contact: {s.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {s.category || 'General Grocery'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.phone}</p>
                        {s.gstin && <p className="text-[10px] font-mono text-slate-400">GST: {s.gstin}</p>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-600 dark:text-slate-400">
                        ₹{Number(s.credit_limit || 0).toLocaleString('en-IN')}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {onPaySupplier && (
                            <Button
                              variant="primary"
                              size="xs"
                              icon={CreditCard}
                              onClick={() => onPaySupplier(s)}
                              className="bg-[#00796b] hover:bg-[#004d40] text-white font-bold cursor-pointer"
                            >
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="light"
                            size="xs"
                            icon={Eye}
                            onClick={() => onViewProfile(s)}
                            className="font-bold cursor-pointer"
                          >
                            Ledger
                          </Button>
                          <button
                            onClick={() => onEditSupplier(s)}
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
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
