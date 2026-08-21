import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, Pagination, EmptyState } from '../../components/common/UiHelpers';
import { 
  Layers, 
  AlertTriangle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw, 
  History, 
  Clock, 
  Package, 
  Sliders, 
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { inventoryApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const InventoryList = () => {
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movements' | 'near_expiry'
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low_stock, out_of_stock, in_stock

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('ADD'); // 'ADD' | 'SUBTRACT' | 'SET'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Refill / Purchase');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  useEffect(() => {
    if (activeTab === 'stock' || activeTab === 'near_expiry') {
      loadProducts();
    } else if (activeTab === 'movements') {
      loadMovements();
    }
  }, [activeTab, search, stockFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        stock_status: stockFilter !== 'all' ? stockFilter : undefined,
        expiry: activeTab === 'near_expiry' ? 'near_expiry' : undefined,
      };
      const res = await inventoryApi.getProducts(params);
      setProducts(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getStockMovements();
      setMovements(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (p) => {
    setAdjustingProduct(p);
    setAdjustType('ADD');
    setAdjustQty('10');
    setAdjustReason('Physical Inventory Count Audit');
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustQty) return;
    try {
      setSubmittingAdjust(true);
      await inventoryApi.adjustStock(adjustingProduct.id, {
        type: adjustType,
        quantity: parseInt(adjustQty),
        reason: adjustReason
      });
      showToast(`Stock updated for ${adjustingProduct.name}`, 'success');
      setAdjustingProduct(null);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to adjust stock', 'error');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // KPI calculations
  const totalStockCount = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert).length;
  const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
            Inventory & Stock Control
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time stock audit, threshold alerts, near-expiry alerts, and stock in/out history.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto no-scrollbar touch-pan w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === 'stock' ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-[#384959] dark:hover:text-white'
            }`}
          >
            Live Inventory
          </button>
          <button
            onClick={() => setActiveTab('near_expiry')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'near_expiry' ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-[#384959] dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Expiry Watchlist
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'movements' ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-[#384959] dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Movement Logs
          </button>
        </div>
      </div>

      {/* 3 Quick Inventory KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-[#384959]/10 dark:bg-[#88BDF2]/20 text-[#384959] dark:text-[#88BDF2] rounded-xl shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Total Units in Store</p>
            <p className="text-lg sm:text-xl font-black text-[#384959] dark:text-slate-100 font-heading">{totalStockCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Low Stock Alerts</p>
            <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 font-heading">{lowStockCount} Products</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 rounded-xl shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase truncate">Out of Stock Items</p>
            <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-400 font-heading">{outOfStockCount} Products</p>
          </div>
        </div>
      </div>

      {activeTab === 'stock' || activeTab === 'near_expiry' ? (
        <Card className="p-0 overflow-hidden">
          {/* Table Search & Filter Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900">
            <div className="w-full sm:w-80">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search stock by SKU, product name..."
              />
            </div>

            {activeTab === 'stock' && (
              <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto overflow-x-auto no-scrollbar touch-pan pb-0.5">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    stockFilter === 'all' ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959]' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockFilter('low_stock')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    stockFilter === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setStockFilter('out_of_stock')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    stockFilter === 'out_of_stock' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            )}
          </div>

          {/* Inventory Table */}
          <div className="overflow-x-auto touch-pan">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Min Alert Level</th>

                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Expiry Status</th>
                  <th className="py-3 px-4 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {products.length === 0 ? (
                  <EmptyState
                    variant="table"
                    colSpan={7}
                    icon={Package}
                    title="No Inventory Records"
                    description={
                      search || stockFilter !== 'all'
                        ? 'No products match the selected stock status or search filter.'
                        : 'No products in inventory yet. Add products to the catalog to manage store stock.'
                    }
                    secondaryActionLabel={search || stockFilter !== 'all' ? 'Reset Filters' : undefined}
                    onSecondaryAction={() => {
                      setSearch('');
                      setStockFilter('all');
                      setPage(1);
                    }}
                  />
                ) : (
                  products.map((p) => {
                    const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert;
                    const isOut = p.stock_quantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image || '/logo.png'} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                            <div>
                              <p className="font-bold text-[#384959] dark:text-slate-100">{p.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.category_name} • ₹{p.selling_price}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-extrabold text-[#384959] dark:text-slate-100">
                            {p.stock_quantity}
                          </span>{' '}
                          <span className="text-[10px] text-slate-400">{p.unit_name || 'units'}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">
                          {p.min_stock_alert} units
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            isOut ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400' : isLow ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400'
                          }`}>
                            {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.expiry_date ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {p.expiry_date}
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="light"
                            size="sm"
                            icon={Sliders}
                            onClick={() => handleOpenAdjust(p)}
                          >
                            Adjust Stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Stock Movements Audit History */
        <Card className="p-0 overflow-hidden" title="Stock Movement Audit Trail">
          <div className="overflow-x-auto touch-pan">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4 text-center">Change Qty</th>
                  <th className="py-3 px-4 text-center">Balance After</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-right">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {movements.length === 0 ? (
                  <EmptyState
                    variant="table"
                    colSpan={7}
                    icon={History}
                    title="No Movement Logs"
                    description="Inventory refills, adjustments, and sales deductions will automatically log here."
                  />
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {new Date(m.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#384959] dark:text-slate-100">
                        {m.product_name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            m.movement_type === 'RESTOCK' || m.movement_type === 'IN' || m.movement_type === 'RETURN'
                              ? 'success'
                              : m.movement_type === 'DAMAGE' || m.movement_type === 'EXPIRED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="xs"
                        >
                          {m.movement_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={
                            m.quantity_changed > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : m.quantity_changed < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {m.quantity_changed > 0 ? `+${m.quantity_changed}` : m.quantity_changed}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-[#384959] dark:text-slate-100">
                        {m.balance_after}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {m.reason || 'Manual Adjustment'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">
                        {m.created_by_name || 'System Admin'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <Modal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          title={`Stock Adjustment - ${adjustingProduct.name}`}
          subtitle={`Current Available Stock: ${adjustingProduct.stock_quantity} units`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setAdjustingProduct(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleAdjustSubmit} loading={submittingAdjust}>
                Apply Adjustment
              </Button>
            </div>
          }
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Adjustment Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('ADD')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    adjustType === 'ADD' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('SUBTRACT')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    adjustType === 'SUBTRACT' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  - Deduct / Damage
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('SET')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    adjustType === 'SET' ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] border-[#384959] dark:border-[#88BDF2]' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Set Count
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                Quantity Units *
              </label>
              <input
                type="number"
                min="1"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                Reason / Audit Remarks *
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              >
                <option value="Physical Inventory Count Audit">Physical Inventory Count Audit</option>
                <option value="Stock Refill / Fresh Delivery">Stock Refill / Fresh Delivery</option>
                <option value="Damaged / Expired Goods Write-off">Damaged / Expired Goods Write-off</option>
                <option value="Customer Return Restock">Customer Return Restock</option>
                <option value="Internal Warehouse Transfer">Internal Warehouse Transfer</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InventoryList;
