import React from 'react';
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
  Building
} from 'lucide-react';

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
  onPaySupplier
}) => {
  const filteredSuppliers = suppliers.filter(s => {
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesSearch = !search || (
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.company_name && s.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search)) ||
      (s.gstin && s.gstin.toLowerCase().includes(search.toLowerCase()))
    );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search vendor name, company, GSTIN..."
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="ALL">All Wholesale Categories</option>
            {supplierCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => {
            const pendingBal = Number(s.pending_balance || 0);

            return (
              <div
                key={s.id}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 hover:border-sky-300 dark:hover:border-sky-700/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top Ambient Glow */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all pointer-events-none"></div>

                <div>
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#384959] to-[#273440] dark:from-slate-800 dark:to-slate-900 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                        {(s.company_name || s.name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#384959] dark:text-slate-100 font-heading group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {s.company_name || s.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Contact: {s.name}</p>
                      </div>
                    </div>
                    <Badge variant={s.is_active !== false ? 'success' : 'secondary'} size="xs">
                      {s.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Info Meta */}
                  <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{s.phone}</span>
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
                      className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="View Profile Drawer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditSupplier(s)}
                      className="p-2 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Pay Supplier
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuppliersDirectoryTab;
