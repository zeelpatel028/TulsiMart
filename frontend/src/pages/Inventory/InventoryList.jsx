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
  Filter,
  ArrowLeft
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
    loadMetaOptions();
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
        limit: 500,
        page_size: 500,
        search: search || undefined,
        stock_status: stockFilter !== 'all' ? stockFilter : undefined,
        expiry: activeTab === 'near_expiry' ? 'near_expiry' : undefined,
      };
      const res = await inventoryApi.getProducts(params);
      const fetchedProducts = extractList(res);
      const count = res.data?.pagination?.total_items || res.data?.count || fetchedProducts.length || 0;
      const pages = Math.ceil(count / 500) || 1;

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

  const getMetaId = (field, idField, p) => {
    if (p[idField] !== undefined && p[idField] !== null && p[idField] !== '') {
      return String(p[idField]);
    }
    if (p[field] && typeof p[field] === 'object' && p[field].id !== undefined && p[field].id !== null) {
      return String(p[field].id);
    }
    if (p[field] && typeof p[field] !== 'object') {
      return String(p[field]);
    }
    return '';
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    const catId = getMetaId('category', 'category_id', p);
    const unitId = getMetaId('unit', 'unit_id', p);
    const suppId = getMetaId('supplier', 'supplier_id', p);

    setEditForm({
      name: p.name || '',
      category: catId,
      unit: unitId,
      supplier: suppId,
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
        category_id: editForm.category ? parseInt(editForm.category) : null,
        unit_id: editForm.unit ? parseInt(editForm.unit) : null,
        supplier_id: editForm.supplier ? parseInt(editForm.supplier) : null,
        category: editForm.category ? parseInt(editForm.category) : null,
        unit: editForm.unit ? parseInt(editForm.unit) : null,
        supplier: editForm.supplier ? parseInt(editForm.supplier) : null,
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

  const [expirySubFilter, setExpirySubFilter] = useState('all'); // 'all' | 'expired' | 'near'

  // Live KPI count calculations for unified pills
  const lowStockCount = products.filter(p => {
    const qty = parseFloat(p.stock_quantity) || 0;
    const alert = parseFloat(p.min_stock_alert) || 0;
    return qty > 0 && qty <= alert;
  }).length;

  const outOfStockCount = products.filter(p => (parseFloat(p.stock_quantity) || 0) <= 0).length;

  const expiredCount = products.filter(p => {
    if (!p.expiry_date) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expDate = new Date(p.expiry_date); expDate.setHours(0, 0, 0, 0);
    return expDate < today;
  }).length;

  const expiringSoonCount = products.filter(p => {
    if (!p.expiry_date) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expDate = new Date(p.expiry_date); expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const totalExpiryCount = products.filter(p => Boolean(p.expiry_date)).length;

  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return { label: 'No Expiry Set', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDateStr);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        label: `Expired (${Math.abs(diffDays)}d ago)`, 
        color: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800', 
        isExpired: true 
      };
    } else if (diffDays <= 30) {
      return { 
        label: `Expiring in ${diffDays} days`, 
        color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800', 
        isNear: true 
      };
    } else {
      return { 
        label: `Expires on ${expiryDateStr}`, 
        color: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
      };
    }
  };

  // Real-time client-side filter for displayed items matching active tab & stock filter
  const displayedProducts = products.filter((p) => {
    const stockQty = parseFloat(p.stock_quantity) || 0;
    const minAlert = parseFloat(p.min_stock_alert) || 0;

    // Search filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const skuMatch = (p.sku || p.product_code || '').toLowerCase().includes(q);
      const catMatch = (p.category?.name || p.category_name || '').toLowerCase().includes(q);
      const barcodeMatch = (p.barcode || '').toLowerCase().includes(q);
      if (!nameMatch && !skuMatch && !catMatch && !barcodeMatch) return false;
    }

    // Stock status filter
    if (activeTab === 'stock') {
      if (stockFilter === 'low_stock') {
        return stockQty > 0 && stockQty <= minAlert;
      }
      if (stockFilter === 'out_of_stock') {
        return stockQty <= 0;
      }
    }

    // Near expiry watchlist filter: show products with expiry_date set
    if (activeTab === 'near_expiry') {
      if (!p.expiry_date) return false;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const expDate = new Date(p.expiry_date); expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (expirySubFilter === 'expired') {
        return diffDays < 0;
      }
      if (expirySubFilter === 'near') {
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    }

    return true;
  });

  // Sort near_expiry products so expired / soonest expiring products come first
  if (activeTab === 'near_expiry') {
    displayedProducts.sort((a, b) => {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date) - new Date(b.expiry_date);
    });
  }

  const filteredMovements = movements.filter(m => {
    if (!search || !search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (m.product_name || '').toLowerCase().includes(q) ||
      (m.reason || '').toLowerCase().includes(q) ||
      (m.movement_type || '').toLowerCase().includes(q) ||
      (m.created_by_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* 📱 MOBILE / TABLET COMPACT PASTEL MINT HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
        {/* SVG Decorative Bottom-Left Wave */}
        <svg
          className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto pointer-events-none text-[#C4EFE9]/70 dark:text-teal-950/40"
          viewBox="0 0 200 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 40C50 60 120 70 200 45V80H0V40Z"
            fill="currentColor"
          />
        </svg>

        {/* SVG Decorative Bottom-Right Mound Curve */}
        <svg
          className="absolute bottom-0 right-0 w-28 sm:w-40 h-auto pointer-events-none text-[#B5ECE5]/80 dark:text-teal-900/40"
          viewBox="0 0 160 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 90C40 40 100 20 160 30V90H20Z"
            fill="currentColor"
          />
        </svg>

        {/* Decorative Floating Mint Dots */}
        <div className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-[#83D9CC] opacity-60 pointer-events-none" />
        <div className="absolute bottom-4 right-20 w-2 h-2 rounded-full bg-[#83D9CC] opacity-50 pointer-events-none" />

        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 1. Pure White Circular Back Button */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-md shadow-teal-900/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6]" />
            </button>

            {/* 2. Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Inventory & <span className="text-[#00695C] dark:text-[#4DB6AC]">Stock Control</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Real-time stock audit, threshold alerts & movement logs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart Edge-to-Edge Desktop Header Banner */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                  Inventory & <span className="text-[#00796b] dark:text-[#80cbc4]">Stock Control</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Audit
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time stock audit, threshold alerts, near-expiry watchlists, and stock movement logs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Redesigned Premium Unified Toolbar Container */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        
        {/* Top Controls: Search Input + View Switcher (Side-by-Side on all screens) */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={activeTab === 'movements' ? "Search movements..." : "Search by SKU, product name..."}
            />
          </div>

          {/* View Switcher (Grid vs Table) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
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

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto no-scrollbar max-w-full touch-pan">
          <button
            onClick={() => { setActiveTab('stock'); setStockFilter('all'); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'stock' && stockFilter === 'all'
                ? 'bg-gradient-to-r from-[#00796b] to-[#004d40] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Live Inventory</span>
          </button>

          <button
            onClick={() => { setActiveTab('stock'); setStockFilter('low_stock'); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stock' && stockFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock</span>
            {lowStockCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                activeTab === 'stock' && stockFilter === 'low_stock'
                  ? 'bg-white/25 text-white'
                  : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
              }`}>
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('stock'); setStockFilter('out_of_stock'); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stock' && stockFilter === 'out_of_stock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/40'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Out of Stock</span>
            {outOfStockCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                activeTab === 'stock' && stockFilter === 'out_of_stock'
                  ? 'bg-white/25 text-white'
                  : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200'
              }`}>
                {outOfStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('near_expiry'); setStockFilter('all'); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'near_expiry'
                ? 'bg-gradient-to-r from-[#00796b] to-[#004d40] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiry Watchlist</span>
            {totalExpiryCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                activeTab === 'near_expiry'
                  ? 'bg-white/25 text-white'
                  : 'bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-200'
              }`}>
                {totalExpiryCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('movements'); setStockFilter('all'); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'movements'
                ? 'bg-gradient-to-r from-[#00796b] to-[#004d40] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Logs</span>
          </button>
        </div>
      </div>

      {/* 🌟 Expiry Watchlist Status Sub-Filter Bar */}
      {activeTab === 'near_expiry' && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 px-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#00796b]" /> Expiry Filter:
          </span>
          <button
            onClick={() => setExpirySubFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expirySubFilter === 'all'
                ? 'bg-gradient-to-r from-[#00796b] to-[#004d40] text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-600'
            }`}
          >
            <span>All Watchlist</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 dark:bg-slate-600 text-current font-extrabold">
              {totalExpiryCount}
            </span>
          </button>
          <button
            onClick={() => setExpirySubFilter('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expirySubFilter === 'expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 hover:bg-rose-50 border border-rose-200 dark:border-rose-900/50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Already Expired</span>
            {expiredCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                expirySubFilter === 'expired' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-900'
              }`}>
                {expiredCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setExpirySubFilter('near')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              expirySubFilter === 'near'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 border border-amber-200 dark:border-amber-900/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiring Soon (&lt;=30d)</span>
            {expiringSoonCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                expirySubFilter === 'near' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {expiringSoonCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Main Dynamic Content Block */}
      {activeTab === 'movements' ? (
        /* Stock Movements Section with Both Grid and Table Support */
        viewMode === 'table' ? (
          /* Table View */
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
                  {filteredMovements.length === 0 ? (
                    <EmptyState
                      variant="table"
                      colSpan={7}
                      icon={History}
                      title="No Movement Logs Found"
                      description="Inventory refills, adjustments, and sales deductions will automatically log here."
                    />
                  ) : (
                    filteredMovements.map((m) => (
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
                              m.movement_type === 'RESTOCK' || m.movement_type === 'IN' || m.movement_type === 'ADD' || m.movement_type === 'RETURN'
                                ? 'success'
                                : m.movement_type === 'DAMAGE' || m.movement_type === 'EXPIRED' || m.movement_type === 'SUBTRACT'
                                ? 'danger'
                                : 'warning'
                            }
                            size="xs"
                          >
                            {m.movement_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {(() => {
                            const changeVal = m.quantity ?? m.quantity_changed ?? 0;
                            return (
                              <span
                                className={
                                  changeVal > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : changeVal < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                }
                              >
                                {changeVal > 0 ? `+${changeVal}` : changeVal}
                              </span>
                            );
                          })()}
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
        ) : (
          /* Grid Card View for Movement Logs */
          filteredMovements.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={History}
                title="No Movement Logs Found"
                description="No stock movement records match your search criteria."
                secondaryActionLabel={search ? 'Clear Search' : undefined}
                onSecondaryAction={() => setSearch('')}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMovements.map((m) => {
                const changeVal = m.quantity ?? m.quantity_changed ?? 0;
                const isPositive = changeVal > 0;
                const isNegative = changeVal < 0;

                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
                  >
                    {/* Header: Date & Action Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(m.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Badge
                        variant={
                          m.movement_type === 'RESTOCK' || m.movement_type === 'IN' || m.movement_type === 'ADD' || m.movement_type === 'RETURN'
                            ? 'success'
                            : m.movement_type === 'DAMAGE' || m.movement_type === 'EXPIRED' || m.movement_type === 'SUBTRACT'
                            ? 'danger'
                            : 'warning'
                        }
                        size="xs"
                      >
                        {m.movement_type}
                      </Badge>
                    </div>

                    {/* Product Title */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate font-heading flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#00796b] shrink-0" />
                        <span className="truncate">{m.product_name}</span>
                      </h4>
                    </div>

                    {/* Highlighted Stat Box */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Change Qty</span>
                        <span className={`text-base font-black ${
                          isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600'
                        }`}>
                          {isPositive ? `+${changeVal}` : changeVal}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Balance After</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-200">
                          {m.balance_after}
                        </span>
                      </div>
                    </div>

                    {/* Reason & Staff */}
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex items-center justify-between gap-2">
                      <span className="truncate italic text-slate-600 dark:text-slate-300 max-w-[60%]" title={m.reason}>
                        {m.reason || 'Manual Adjustment'}
                      </span>
                      <span className="font-semibold text-[11px] text-teal-700 dark:text-teal-400 shrink-0">
                        {m.created_by_name || 'System Admin'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )
      ) : (
        /* Live Products / Expiry Watchlist Section */
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="h-56 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800"></div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={activeTab === 'near_expiry' ? Clock : Package}
                title={activeTab === 'near_expiry' ? "No Expiry Watchlist Items" : "No Inventory Records Found"}
                description={
                  activeTab === 'near_expiry'
                    ? 'No products with expiry date or near expiration records found.'
                    : search || stockFilter !== 'all'
                    ? 'No products match the selected tab, stock status, or search filter.'
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
              {displayedProducts.map((p) => {
                const stockQty = parseFloat(p.stock_quantity) || 0;
                const minAlert = parseFloat(p.min_stock_alert) || 0;
                const isLow = stockQty > 0 && stockQty <= minAlert;
                const isOut = stockQty <= 0;
                const hasCustomImage = p.image && !p.image.includes('logo.png');
                const expInfo = getExpiryStatus(p.expiry_date);

                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group hover:border-teal-300 dark:hover:border-teal-700"
                  >
                    <div>
                      {/* Top Row: Image & Name */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {hasCustomImage ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700 flex items-center justify-center shrink-0 text-[#00796b] dark:text-teal-400 font-bold">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {p.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {p.category?.name || p.category_name || 'General'}
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
                              {p.unit?.short_name || p.unit?.name || p.unit_name || 'pc'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Min Alert Level</span>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">
                            {minAlert} {p.unit?.short_name || p.unit?.name || p.unit_name || 'pc'}
                          </span>
                        </div>

                        {/* Expiry Status Badge */}
                        {p.expiry_date ? (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Expiry Status
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${expInfo.color}`}>
                              {expInfo.label}
                            </span>
                          </div>
                        ) : activeTab === 'near_expiry' ? (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Expiry Status</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                              No Expiry Set
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Bottom Status & Proper Action Button */}
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

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E0F2F1] hover:bg-[#b2dfdb] dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-[#00695C] dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Product</span>
                      </button>
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
                    {displayedProducts.map((p) => {
                      const stockQty = parseFloat(p.stock_quantity) || 0;
                      const minAlert = parseFloat(p.min_stock_alert) || 0;
                      const isLow = stockQty > 0 && stockQty <= minAlert;
                      const isOut = stockQty <= 0;
                      const hasCustomImage = p.image && !p.image.includes('logo.png');
                      const expInfo = getExpiryStatus(p.expiry_date);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {hasCustomImage ? (
                                <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700 flex items-center justify-center shrink-0 text-[#00796b] dark:text-teal-400 font-bold">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.category?.name || p.category_name || 'General'} • ₹{p.selling_price}</p>
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
                            <span className="text-[10px] text-slate-400">{p.unit?.short_name || p.unit?.name || p.unit_name || 'pc'}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">
                            {minAlert} {p.unit?.short_name || p.unit?.name || p.unit_name || 'pc'}
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
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${expInfo.color}`}>
                                <Calendar className="w-3.5 h-3.5" /> {expInfo.label}
                              </span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E0F2F1] hover:bg-[#b2dfdb] dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-[#00695C] dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Update Product</span>
                            </button>
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
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <Modal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          title={`Stock Adjustment - ${adjustingProduct.name}`}
          subtitle={`Current Available Stock: ${adjustingProduct.stock_quantity} ${adjustingProduct.unit_name || 'units'}`}
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
                Quantity ({adjustingProduct.unit_name || 'Units'}) *
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
                  value={String(editForm.category || '')}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                  Supplier
                </label>
                <select
                  value={String(editForm.supplier || '')}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.name} ({s.company_name || 'Vendor'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Unit */}
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
                Product Unit
              </label>
              <select
                value={String(editForm.unit || '')}
                onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">Select Product Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={String(u.id)}>{u.name} ({u.short_name})</option>
                ))}
              </select>
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


