import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  LayoutGrid,
  List,
  Box,
  Tag,
  TrendingDown,
  ChevronRight,
  Plus,
  Filter
} from 'lucide-react';
import { inventoryApi, suppliersApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { getCachedData, setCachedData } from '../../utils/metaCache';
import { useNotification } from '../../context/NotificationContext';
import { Edit3 } from 'lucide-react';

export const InventoryList = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movements' | 'near_expiry'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low_stock, out_of_stock, in_stock
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('ADD'); // 'ADD' | 'SUBTRACT' | 'SET'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Refill / Purchase');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Update Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    unit: '',
    selling_unit: '',
    supplier: '',
    selling_price: '',
    mrp: '',
    stock_quantity: '',
    min_stock_alert: '',
    sku: '',
    barcode: '',
    expiry_date: ''
  });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    if (activeTab === 'stock' || activeTab === 'near_expiry') {
      loadProducts();
    } else if (activeTab === 'movements') {
      loadMovements();
    }
  }, [activeTab, page, search, stockFilter]);

  const loadProducts = async () => {
    const cacheKey = `inv_products_${activeTab}_${page}_${search}_${stockFilter}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
      setProducts(cached.products || []);
      setTotalPages(cached.totalPages || 1);
      setTotalCount(cached.totalCount || 0);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const params = {
        page,
        search,
        stock_status: stockFilter !== 'all' ? stockFilter : undefined,
        expiry: activeTab === 'near_expiry' ? 'near_expiry' : undefined,
      };
      const res = await inventoryApi.getProducts(params);
      const fetchedProducts = extractList(res);
      const count = res.data?.pagination?.total_items || res.data?.count || fetchedProducts.length || 0;
      const pages = Math.ceil(count / 50) || 1;

      setProducts(fetchedProducts);
      setTotalCount(count);
      setTotalPages(pages);
      setCachedData(cacheKey, { products: fetchedProducts, totalPages: pages, totalCount: count }, 2 * 60 * 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    const cacheKey = `inv_movements_${search}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
      setMovements(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await inventoryApi.getStockMovements();
      const data = extractList(res);
      setMovements(data);
      setCachedData(cacheKey, data, 2 * 60 * 1000);
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
    const qtyVal = parseFloat(adjustQty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      showToast('Please enter a valid stock quantity', 'error');
      return;
    }

    try {
      setSubmittingAdjust(true);
      await inventoryApi.adjustStock(adjustingProduct.id, {
        type: adjustType,
        quantity: qtyVal,
        reason: adjustReason
      });
      showToast(`Stock updated successfully for ${adjustingProduct.name}`, 'success');
      setAdjustingProduct(null);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to adjust stock', 'error');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Load Meta options on demand for Edit modal
  const loadMetaOptions = async () => {
    try {
      const [catRes, unitRes, suppRes] = await Promise.allSettled([
        inventoryApi.getCategories(),
        inventoryApi.getUnits(),
        suppliersApi.getSuppliers({ page_size: 100 })
      ]);
      if (catRes.status === 'fulfilled') setCategories(extractList(catRes.value));
      if (unitRes.status === 'fulfilled') setUnits(extractList(unitRes.value));
      if (suppRes.status === 'fulfilled') setSuppliers(extractList(suppRes.value));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name || '',
      category: p.category || p.category_id || '',
      unit: p.unit || p.unit_id || '',
      selling_unit: p.selling_unit || p.selling_unit_id || '',
      supplier: p.supplier || p.supplier_id || '',
      selling_price: p.selling_price || '',
      mrp: p.mrp || '',
      stock_quantity: p.stock_quantity !== undefined ? String(p.stock_quantity) : '',
      min_stock_alert: p.min_stock_alert !== undefined ? String(p.min_stock_alert) : '10',
      sku: p.sku || p.product_code || '',
      barcode: p.barcode || '',
      expiry_date: p.expiry_date || ''
    });
    loadMetaOptions();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editForm.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    try {
      setSubmittingEdit(true);
      const payload = {
        name: editForm.name.trim(),
        category: editForm.category || undefined,
        unit: editForm.unit || undefined,
        selling_unit: editForm.selling_unit || undefined,
        supplier: editForm.supplier || undefined,
        selling_price: parseFloat(editForm.selling_price) || 0,
        mrp: parseFloat(editForm.mrp) || parseFloat(editForm.selling_price) || 0,
        stock_quantity: parseFloat(editForm.stock_quantity) || 0,
        min_stock_alert: parseFloat(editForm.min_stock_alert) || 10,
        sku: editForm.sku.trim() || undefined,
        product_code: editForm.sku.trim() || undefined,
        barcode: editForm.barcode.trim() || undefined,
        expiry_date: editForm.expiry_date || null
      };

      await inventoryApi.updateProduct(editingProduct.id, payload);
      showToast(`Product "${editForm.name}" updated successfully!`, 'success');
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
      showToast(err.response?.data?.detail || 'Failed to update product', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // KPI calculations
  const totalStockCount = products.reduce((acc, p) => acc + (parseFloat(p.stock_quantity) || 0), 0);
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert).length;
  const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Edge-to-Edge Banner Header */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border-b border-teal-100/80 dark:border-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Inventory & Stock Control
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time stock audit, threshold alerts, near-expiry watchlists, and stock movement logs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* Navigation Tab Switcher */}
            <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto no-scrollbar max-w-full">
              <button
                onClick={() => { setActiveTab('stock'); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'stock'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" /> Live Inventory
              </button>
              <button
                onClick={() => { setActiveTab('near_expiry'); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'near_expiry'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Expiry Watchlist
              </button>
              <button
                onClick={() => { setActiveTab('movements'); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'movements'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" /> Movement Logs
              </button>
            </div>

            {/* Quick Add Product Button */}
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => navigate('/products/add')}
              className="shadow-sm shadow-teal-600/20 whitespace-nowrap shrink-0"
            >
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* 3 Quick KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-teal-200 dark:hover:border-teal-900 transition-all">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 rounded-xl border border-teal-100 dark:border-teal-900/50 shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide truncate">Total Store Units</p>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-heading">
              {Number(totalStockCount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-amber-200 dark:hover:border-amber-900 transition-all">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/50 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide truncate">Low Stock Alerts</p>
            <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 font-heading">{lowStockCount} Products</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-rose-200 dark:hover:border-rose-900 transition-all">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50 shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide truncate">Out of Stock Items</p>
            <p className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-400 font-heading">{outOfStockCount} Products</p>
          </div>
        </div>
      </div>

      {activeTab === 'stock' || activeTab === 'near_expiry' ? (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filters & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-full sm:w-80">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by SKU, product name..."
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
              {activeTab === 'stock' && (
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar touch-pan pb-0.5">
                  <button
                    onClick={() => { setStockFilter('all'); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                      stockFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    onClick={() => { setStockFilter('low_stock'); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                      stockFilter === 'low_stock'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/50'
                    }`}
                  >
                    Low Stock
                  </button>
                  <button
                    onClick={() => { setStockFilter('out_of_stock'); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                      stockFilter === 'out_of_stock'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50'
                    }`}
                  >
                    Out of Stock
                  </button>
                </div>
              )}

              {/* View Switcher: Grid vs Table */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View (Card layout)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Table View (List layout)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Render Products in Selected ViewMode */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="h-56 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={Package}
                title="No Inventory Records Found"
                description={
                  search || stockFilter !== 'all'
                    ? 'No products match the selected stock status or search filter.'
                    : 'No products in inventory yet. Click below to add your first product.'
                }
                actionLabel="Add Product"
                onAction={() => navigate('/products/add')}
                secondaryActionLabel={search || stockFilter !== 'all' ? 'Reset Filters' : undefined}
                onSecondaryAction={() => {
                  setSearch('');
                  setStockFilter('all');
                }}
              />
            </Card>
          ) : viewMode === 'grid' ? (
            /* CARD GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => {
                const stockQty = parseFloat(p.stock_quantity) || 0;
                const minAlert = parseFloat(p.min_stock_alert) || 0;
                const isLow = stockQty > 0 && stockQty <= minAlert;
                const isOut = stockQty <= 0;

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group hover:border-teal-300 dark:hover:border-teal-700"
                  >
                    <div>
                      {/* Top Row: Image & Name */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.image || '/logo.png'}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800"
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {p.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.category_name || 'General'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stock Pill & SKU Details */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">SKU Barcode</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {p.sku || p.product_code || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Selling Price</span>
                          <span className="font-black text-slate-900 dark:text-slate-100">
                            ₹{Number(p.selling_price || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Available Stock</span>
                          <div className="flex items-center gap-1 font-bold">
                            <span className={`text-base font-black ${
                              isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                            }`}>
                              {stockQty}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {p.unit_name || p.selling_unit || 'units'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Min Alert Level</span>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">
                            {minAlert} {p.unit_name || 'units'}
                          </span>
                        </div>

                        {p.expiry_date && (
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" /> Expiry Date
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {p.expiry_date}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status & Action */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isOut 
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900' 
                          : isLow 
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900' 
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}>
                        {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                      </span>

                      <Button
                        variant="light"
                        size="xs"
                        icon={Edit3}
                        onClick={() => handleOpenEdit(p)}
                        className="whitespace-nowrap font-bold"
                      >
                        Update Product
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
                <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                      <th className="py-3.5 px-4">Product Details</th>
                      <th className="py-3.5 px-4">SKU / Code</th>
                      <th className="py-3.5 px-4 text-center">Available Stock</th>
                      <th className="py-3.5 px-4 text-center">Min Alert Level</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Expiry Status</th>
                      <th className="py-3.5 px-4 text-right">Stock Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {products.map((p) => {
                      const stockQty = parseFloat(p.stock_quantity) || 0;
                      const minAlert = parseFloat(p.min_stock_alert) || 0;
                      const isLow = stockQty > 0 && stockQty <= minAlert;
                      const isOut = stockQty <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img src={p.image || '/logo.png'} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800" />
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.category_name || 'General'} • ₹{p.selling_price}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                              {p.sku || p.product_code || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                              {stockQty}
                            </span>{' '}
                            <span className="text-[10px] text-slate-400">{p.unit_name || p.selling_unit || 'units'}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">
                            {minAlert} {p.unit_name || 'units'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
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
                              icon={Edit3}
                              onClick={() => handleOpenEdit(p)}
                              className="whitespace-nowrap font-bold"
                            >
                              Update Product
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab !== 'movements' && totalPages > 1 && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <Pagination currentPage={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
            </div>
          )}
        </div>
      ) : (
        /* Stock Movements Audit History */
        <Card className="p-0 overflow-hidden" title="Stock Movement Audit Trail">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
            <table className="w-full min-w-[850px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4 text-center">Change Qty</th>
                  <th className="py-3.5 px-4 text-center">Balance After</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4 text-right">Staff</th>
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
                    <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {new Date(m.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
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
                      <td className="py-3 px-4 text-center font-extrabold text-slate-900 dark:text-slate-100">
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
          subtitle={`Current Available Stock: ${adjustingProduct.stock_quantity} ${adjustingProduct.unit_name || adjustingProduct.selling_unit || 'units'}`}
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
              <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Adjustment Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('ADD')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    adjustType === 'ADD' ? 'bg-teal-600 text-white border-teal-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('SUBTRACT')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    adjustType === 'SUBTRACT' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  - Deduct / Damage
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('SET')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    adjustType === 'SET' ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Set Count
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                Quantity ({adjustingProduct.unit_name || adjustingProduct.selling_unit || 'Units'}) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="Enter quantity (e.g. 10 or 2.5)"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 outline-hidden text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                Reason / Audit Remarks *
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
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

      {/* UPDATE PRODUCT MODAL */}
      {editingProduct && (
        <Modal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          title={`Update Product - ${editingProduct.name}`}
          subtitle="Modify product details, category, pricing, stock levels, and barcode"
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button variant="outline" size="md" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                loading={submittingEdit}
                className="bg-[#00695C] hover:bg-[#004D40] text-white font-bold px-6 shadow-md"
              >
                Save Changes
              </Button>
            </div>
          }
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-sans">
            {/* Product Name */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Product name"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 outline-hidden text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            {/* Category & Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Supplier
                </label>
                <select
                  value={editForm.supplier}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company_name || 'Vendor'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Unit & Selling Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Product Unit
                </label>
                <select
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Select Product Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Selling Unit (POS)
                </label>
                <select
                  value={editForm.selling_unit}
                  onChange={(e) => setEditForm({ ...editForm, selling_unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Select Selling Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* MRP & Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.mrp}
                  onChange={(e) => setEditForm({ ...editForm, mrp: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editForm.selling_price}
                  onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-teal-700 dark:text-teal-400"
                />
              </div>
            </div>

            {/* Stock Quantity & Min Stock Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Available Stock *
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={editForm.stock_quantity}
                  onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Min Alert Level
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={editForm.min_stock_alert}
                  onChange={(e) => setEditForm({ ...editForm, min_stock_alert: e.target.value })}
                  placeholder="10"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* SKU / Barcode & Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  SKU / Barcode
                </label>
                <input
                  type="text"
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value, barcode: e.target.value })}
                  placeholder="Barcode or SKU"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editForm.expiry_date}
                  onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InventoryList;


