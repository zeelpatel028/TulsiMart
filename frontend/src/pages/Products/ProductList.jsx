import React, { useState, useEffect } from 'react';
import { fetchWithCache, getCachedData, setCachedData, invalidateCache } from '../../utils/metaCache';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, Pagination, ConfirmDialog, EmptyState } from '../../components/common/UiHelpers';
import { 
  ShoppingBag, 
  Plus, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Layers, 
  Grid, 
  List, 
  Filter, 
  Sparkles, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Percent,
  Barcode,
  Tag,
  Package,
  Boxes,
  RefreshCw,
  Info,
  DollarSign,
  Store,
  Clock,
  Zap,
  Sliders,
  Eye
} from 'lucide-react';
import { inventoryApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductDetailModal } from '../../components/common/ProductDetailModal';
import { CartLoader } from '../../components/common/CartLoader';

export const ProductList = () => {
  const { showToast } = useNotification();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [cartQuantities, setCartQuantities] = useState({});
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, in_stock, low_stock, out_of_stock
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('quick'); // 'quick' | 'advanced'
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    unit: '',
    cost_price: '',
    selling_price: '',
    mrp: '',
    discount_percent: 0,
    gst_percent: 0,
    stock_quantity: 25,
    min_stock_alert: 10,
    expiry_date: '',
    batch_number: '',
    image: '',
    description: '',
  });

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, search, selectedCategory, selectedBrand, stockFilter]);

  const loadMeta = async () => {
    try {
      const [catRes, brandRes, unitRes] = await Promise.all([
        fetchWithCache('categories', () => inventoryApi.getCategories()),
        fetchWithCache('brands', () => inventoryApi.getBrands()),
        fetchWithCache('units', () => inventoryApi.getUnits())
      ]);
      setCategories(catRes.data?.results || catRes.data || []);
      setBrands(brandRes.data?.results || brandRes.data || []);
      setUnits(unitRes.data?.results || unitRes.data || []);
    } catch (err) {
      console.error('Failed to load meta', err);
    }
  };

  const loadProducts = async () => {
    const cacheKey = `products_${page}_${search}_${selectedCategory}_${selectedBrand}_${stockFilter}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
      setProducts(cached.products);
      setTotalCount(cached.totalCount);
      setTotalPages(cached.totalPages);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const params = { page, search };
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (stockFilter === 'in_stock') params.in_stock = 'true';
      if (stockFilter === 'low_stock') params.low_stock = 'true';
      if (stockFilter === 'out_of_stock') params.out_of_stock = 'true';

      const res = await inventoryApi.getProducts(params);
      const data = res.data;

      let fetchedProducts = [];
      let count = 0;
      let pages = 1;

      if (data.results) {
        fetchedProducts = data.results;
        count = data.count;
        pages = Math.ceil(data.count / 20);
      } else {
        fetchedProducts = Array.isArray(data) ? data : [];
        count = fetchedProducts.length || 0;
        pages = 1;
      }

      setProducts(fetchedProducts);
      setTotalCount(count);
      setTotalPages(pages);
      setCachedData(cacheKey, { products: fetchedProducts, totalCount: count, totalPages: pages }, 3 * 60 * 1000);
    } catch (err) {
      if (!cached) showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `TM-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: `${Math.floor(890000000000 + Math.random() * 999999999)}`,
      category: categories[0]?.id || '',
      brand: brands[0]?.id || '',
      unit: units[0]?.id || '',
      cost_price: '',
      selling_price: '',
      mrp: '',
      discount_percent: 0,
      gst_percent: 0,
      stock_quantity: 25,
      min_stock_alert: 10,
      expiry_date: '',
      batch_number: '',
      image: '',
      description: '',
    });
    setActiveFormTab('quick');
  };

  const handleOpenCreate = () => {
    handleResetForm();
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      category: prod.category || '',
      brand: prod.brand || '',
      unit: prod.unit || '',
      cost_price: prod.cost_price !== undefined ? prod.cost_price : '',
      selling_price: prod.selling_price || '',
      mrp: prod.mrp || '',
      discount_percent: prod.discount_percent || 0,
      gst_percent: prod.gst_percent || 0,
      stock_quantity: prod.stock_quantity !== undefined ? prod.stock_quantity : 25,
      min_stock_alert: prod.min_stock_alert || 10,
      expiry_date: prod.expiry_date || '',
      batch_number: prod.batch_number || '',
      image: prod.image || '',
      description: prod.description || '',
    });
    setActiveFormTab('quick');
    setIsFormOpen(true);
  };

  const handleGenerateSku = () => {
    setFormData(prev => ({ ...prev, sku: `TM-${Math.floor(100000 + Math.random() * 900000)}` }));
  };

  const handleGenerateBarcode = () => {
    setFormData(prev => ({ ...prev, barcode: `${Math.floor(890000000000 + Math.random() * 999999999)}` }));
  };

  const handleCostPriceChange = (val) => {
    const cost = parseFloat(val) || 0;
    const selling = parseFloat(formData.selling_price) || 0;
    setFormData(prev => ({
      ...prev,
      cost_price: val,
      mrp: prev.mrp || val,
      selling_price: prev.selling_price || val
    }));
  };

  const handleSellingPriceChange = (val) => {
    const selling = parseFloat(val) || 0;
    const mrp = parseFloat(formData.mrp) || 0;
    let disc = 0;
    if (mrp > 0 && mrp > selling) {
      disc = (((mrp - selling) / mrp) * 100).toFixed(1);
    }
    setFormData(prev => ({
      ...prev,
      selling_price: val,
      mrp: prev.mrp ? prev.mrp : val,
      discount_percent: disc
    }));
  };

  const handleMrpChange = (val) => {
    const mrp = parseFloat(val) || 0;
    const selling = parseFloat(formData.selling_price) || 0;
    let disc = 0;
    if (mrp > 0 && mrp > selling) {
      disc = (((mrp - selling) / mrp) * 100).toFixed(1);
    }
    setFormData(prev => ({
      ...prev,
      mrp: val,
      discount_percent: disc
    }));
  };

  const handleMatchMrp = () => {
    if (formData.mrp) {
      setFormData(prev => ({
        ...prev,
        selling_price: prev.mrp,
        discount_percent: 0
      }));
    }
  };

  const applyQuickMargin = (marginPercent) => {
    const cost = parseFloat(formData.cost_price) || 0;
    if (cost > 0) {
      const selling = cost * (1 + marginPercent / 100);
      const roundedSelling = Math.ceil(selling);
      const roundedMrp = Math.ceil(roundedSelling * 1.1);
      const disc = (((roundedMrp - roundedSelling) / roundedMrp) * 100).toFixed(1);
      setFormData(prev => ({
        ...prev,
        selling_price: roundedSelling.toString(),
        mrp: roundedMrp.toString(),
        discount_percent: disc
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.category || !formData.unit) {
      showToast('Please fill in required fields (Name, Category, Unit)', 'error');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || `TM-${Math.floor(100000 + Math.random() * 900000)}`,
        barcode: formData.barcode.trim() || null,
        category: formData.category,
        brand: formData.brand || null,
        unit: formData.unit,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
        selling_price: parseFloat(formData.selling_price || 0),
        mrp: parseFloat(formData.mrp || formData.selling_price || 0),
        discount_percent: parseFloat(formData.discount_percent || 0),
        gst_percent: parseFloat(formData.gst_percent || 0),
        stock_quantity: parseInt(formData.stock_quantity || 0, 10),
        min_stock_alert: parseInt(formData.min_stock_alert || 10, 10),
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number.trim() || null,
        image: formData.image.trim() || null,
        description: formData.description.trim() || '',
        is_active: true,
      };

      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, payload);
        showToast(`Product '${payload.name}' updated!`, 'success');
        setEditingProduct(null);
      } else {
        await inventoryApi.createProduct(payload);
        showToast(`New product '${payload.name}' created!`, 'success');
      }

      handleResetForm();
      invalidateCache('products_');
      loadProducts();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to save product.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProductId) return;
    try {
      await inventoryApi.deleteProduct(deletingProductId);
      showToast('Product deleted from inventory', 'success');
      setDeletingProductId(null);
      invalidateCache('products_');
      loadProducts();
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  // Bulk CSV Upload
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      showToast('Please select a CSV file to upload', 'error');
      return;
    }
    try {
      setBulkUploading(true);
      const fd = new FormData();
      fd.append('file', bulkFile);
      const res = await inventoryApi.bulkUploadProducts(fd);
      showToast(`Successfully imported ${res.data.imported_count} products!`, 'success');
      setIsBulkOpen(false);
      setBulkFile(null);
      invalidateCache('products_');
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Bulk upload failed', 'error');
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "sku,name,category,unit,mrp,selling_price,cost_price,stock_quantity,min_stock_alert,barcode\n" +
      "TM-ATT-099,Fortune Chakki Fresh Atta 5kg,Atta,kg,280,250,210,50,15,890123456789\n" +
      "TM-DAL-098,Tata Moong Dal 1kg,Pulses,kg,180,160,135,40,10,890123456790";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tulsi_mart_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans pb-12">
      {/* 🌟 Tulsi Mart Top Header Banner - Full Width Edge-to-Edge Background */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-4 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        {/* Banner Grid Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10">
          {/* Left: Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Add <span className="text-[#00796b] dark:text-[#80cbc4]">Product</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Entry Station
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Fast product creation with SKU, pricing, GST & inventory setup
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center justify-center gap-1.5 text-xs border-teal-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-3 py-2 flex-1 sm:flex-initial font-bold"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>Bulk CSV Upload</span>
            </Button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#00796b] hover:bg-[#004d40] text-white flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4" />
              <span>Reset Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📦 Main Add Product Form Card */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {(() => {
          const costNum = parseFloat(formData.cost_price) || 0;
          const sellingNum = parseFloat(formData.selling_price) || 0;
          const mrpNum = parseFloat(formData.mrp) || 0;
          const gstRate = parseFloat(formData.gst_percent) || 0;

          const taxableBasePrice = gstRate > 0 && sellingNum > 0 ? (sellingNum / (1 + gstRate / 100)) : sellingNum;
          const grossProfit = sellingNum > 0 && costNum > 0 ? (sellingNum - costNum) : 0;
          const grossMarginPercent = sellingNum > 0 && costNum > 0 ? (((sellingNum - costNum) / sellingNum) * 100).toFixed(1) : '0';

          const hasLoss = costNum > 0 && sellingNum > 0 && (gstRate > 0 ? taxableBasePrice < costNum : sellingNum < costNum);
          const exceedsMrp = mrpNum > 0 && sellingNum > mrpNum;

          return (
            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-5 text-xs font-sans">
              {/* Active Edit Banner */}
              {editingProduct && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-[#00796b] dark:text-[#80cbc4] text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate">Editing Product: <strong>{editingProduct.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-teal-200 dark:border-slate-700 shrink-0 cursor-pointer shadow-2xs"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}

              {/* Navigation Tabs Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('quick')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
                      activeFormTab === 'quick'
                        ? 'bg-[#00796b] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeFormTab === 'quick' ? 'text-emerald-300' : 'text-slate-500'}`} />
                    <span className="whitespace-nowrap">Core Info & Pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFormTab('advanced')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
                      activeFormTab === 'advanced'
                        ? 'bg-[#00796b] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sliders className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeFormTab === 'advanced' ? 'text-emerald-300' : 'text-slate-500'}`} />
                    <span className="whitespace-nowrap">Tax, Batch & Media</span>
                    {(formData.gst_percent > 0 || formData.image || formData.batch_number) && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fill essentials in seconds</span>
                </div>
              </div>

              {/* ================= TAB 1: QUICK CORE DETAILS & PRICING ================= */}
              {activeFormTab === 'quick' && (
                <div className="space-y-3.5 sm:space-y-4">
                  {/* 1. Product Name */}
                  <div className="bg-slate-50/70 dark:bg-slate-850 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                    <label className="block font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Fortune Refined Sunflower Oil 1L / Amul Taaza Milk 500ml"
                      className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/30 outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>

                  {/* 2. Category & Unit Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-hidden text-slate-800 dark:text-slate-100 shadow-2xs cursor-pointer truncate"
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Unit *
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-hidden text-slate-800 dark:text-slate-100 shadow-2xs cursor-pointer truncate"
                      >
                        <option value="">-- Select Unit (kg, g, L, ml, pc, pkt, box) --</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3. Pricing Section */}
                  <div className="bg-teal-50/40 dark:bg-slate-850 p-3 sm:p-4 rounded-2xl border border-teal-100 dark:border-slate-800 space-y-3 shadow-2xs">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-heading">
                        <TrendingUp className="w-4 h-4 shrink-0" />
                        <span>Pricing & Margins</span>
                      </div>
                      
                      {sellingNum > 0 && costNum > 0 && (
                        <div className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold font-mono border flex items-center gap-1 ${
                          grossProfit >= 0
                            ? 'bg-emerald-100/80 dark:bg-teal-950/70 text-[#00796b] dark:text-[#80cbc4] border-emerald-200'
                            : 'bg-rose-100/80 dark:bg-rose-950/70 text-rose-600 border-rose-200'
                        }`}>
                          <span>{grossProfit >= 0 ? `+₹${grossProfit.toFixed(2)}` : `₹${grossProfit.toFixed(2)}`}</span>
                          <span>({grossMarginPercent}% Profit)</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cost / Purchase Price */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Purchase Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.cost_price}
                            onChange={(e) => handleCostPriceChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-[#00796b] dark:border-[#80cbc4] space-y-1 relative">
                        <label className="text-[11px] font-black text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider">
                          Selling Price *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-[#00796b] dark:text-[#80cbc4]">₹</span>
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            value={formData.selling_price}
                            onChange={(e) => handleSellingPriceChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-xs sm:text-sm font-black bg-white dark:bg-slate-800 border border-teal-200 dark:border-slate-600 rounded-lg outline-hidden focus:border-[#00796b] text-[#00796b] dark:text-[#80cbc4]"
                          />
                        </div>
                      </div>

                      {/* MRP */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Printed MRP
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.mrp}
                            onChange={(e) => handleMrpChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Stock & Barcode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                      <label className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading block">
                        Stock Quantity *
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                          className="w-full xs:w-28 px-3 py-2 text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs"
                        />
                        <div className="flex items-center gap-1 flex-wrap">
                          {[10, 25, 50, 100].map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => setFormData({ ...formData, stock_quantity: qty })}
                              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                            >
                              +{qty}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[10px] font-heading">
                              SKU *
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateSku}
                              className="text-[9px] font-bold text-[#00796b] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Auto
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[10px] font-heading">
                              Barcode
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateBarcode}
                              className="text-[9px] font-bold text-[#00796b] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Barcode className="w-2.5 h-2.5" /> Auto
                            </button>
                          </div>
                          <input
                            type="text"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder="Optional EAN"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: ADVANCED DETAILS ================= */}
              {activeFormTab === 'advanced' && (
                <div className="space-y-3.5 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Brand Name
                      </label>
                      <select
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs cursor-pointer truncate"
                      >
                        <option value="">-- Select Brand --</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        GST Tax Rate (%)
                      </label>
                      <select
                        value={formData.gst_percent}
                        onChange={(e) => setFormData({ ...formData, gst_percent: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs cursor-pointer truncate"
                      >
                        <option value="0">0% (Tax Exempted)</option>
                        <option value="5">5% GST (Grocery Essentials)</option>
                        <option value="12">12% GST (Processed Foods)</option>
                        <option value="18">18% GST (Personal Care/Standard)</option>
                        <option value="28">28% GST (Aerated Drinks/Luxury)</option>
                      </select>
                    </div>

                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Min Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.min_stock_alert}
                        onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Batch & Expiry */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        placeholder="e.g. BATCH-2026-09"
                        className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs"
                      />
                    </div>

                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Image URL & Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Product Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/product-image.jpg"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs"
                      />
                    </div>

                    <div className="bg-slate-50/70 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Short Description / Notes
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Product notes, features, or details"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Warnings */}
              {hasLoss && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    ⚠️ Warning: Selling price (₹{sellingNum.toFixed(2)}) is lower than purchase price (₹{costNum.toFixed(2)}). You will incur a loss!
                  </span>
                </div>
              )}

              {exceedsMrp && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>
                    ⚠️ Warning: Selling price (₹{sellingNum.toFixed(2)}) exceeds package printed MRP (₹{mrpNum.toFixed(2)})!
                  </span>
                </div>
              )}

              {/* Bottom Action Footer Row */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Clear Form
                </button>
                
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-[#00796b] hover:bg-[#004d40] text-white flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>{formSubmitting ? 'Saving Product...' : (editingProduct ? 'Update Product' : 'Create & Save Product')}</span>
                </button>
              </div>
            </form>
          );
        })()}
      </div>


      {/* Bulk CSV Upload Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Product Import (CSV / Excel)"
        subtitle="Upload hundreds of products in seconds using a CSV spreadsheet"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={downloadCsvTemplate}
              className="text-xs font-bold text-[#00695C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV Sample
            </button>
            <Button variant="primary" size="md" onClick={handleBulkUpload} loading={bulkUploading}>
              Upload & Import
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-[#B2DFDB] hover:border-[#009688] rounded-2xl p-8 text-center transition-colors">
            <Upload className="w-10 h-10 text-[#009688] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#263238] font-heading">Select or Drop your CSV file here</p>
            <p className="text-xs text-[#607D8B] mt-1">Accepts UTF-8 .csv files with SKU, Name, Price, and Stock.</p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files[0])}
              className="mt-4 text-xs"
            />
          </div>
          {bulkFile && (
            <div className="p-3 bg-[#E0F2F1] text-[#00695C] border border-[#B2DFDB] rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#009688]" />
              Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      </Modal>

      {/* Product Details Modal */}
      {selectedProductForModal && (
        <ProductDetailModal
          isOpen={!!selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          product={selectedProductForModal}
          cartQuantity={cartQuantities[selectedProductForModal.id] || 0}
          onAddToCart={(prod) => {
            setCartQuantities(prev => ({ ...prev, [prod.id]: (prev[prod.id] || 0) + 1 }));
            showToast(`Added '${prod.name}' to cart!`, 'success');
          }}
          onUpdateQuantity={(prod, newQty) => {
            if (newQty <= 0) {
              setCartQuantities(prev => { const c = { ...prev }; delete c[prod.id]; return c; });
            } else {
              setCartQuantities(prev => ({ ...prev, [prod.id]: newQty }));
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        onConfirm={handleDelete}
        title="Delete Grocery Product?"
        message="Are you sure you want to remove this product from the inventory catalog? Historical order records will be preserved."
      />
    </div>
  );
};

export default ProductList;

