import React, { useState, useEffect } from 'react';
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

export const ProductList = () => {
  const { showToast } = useNotification();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
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

  // Form inputs with full pricing support (Purchase Price, Selling Price, MRP)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    unit: '',
    cost_price: '',      // Purchase / Cost Price (ખરીદ કિંમત)
    selling_price: '',   // Selling Price (વેચાણ કિંમત)
    mrp: '',             // Printed MRP (મહત્તમ છૂટક કિંમત)
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
        inventoryApi.getCategories(),
        inventoryApi.getBrands(),
        inventoryApi.getUnits()
      ]);
      setCategories(catRes.data?.results || catRes.data || []);
      setBrands(brandRes.data?.results || brandRes.data || []);
      setUnits(unitRes.data?.results || unitRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        search,
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        stock_status: stockFilter !== 'all' ? stockFilter : undefined,
      };
      const res = await inventoryApi.getProducts(params);
      setProducts(res.data?.results || res.data || []);
      if (res.data?.count !== undefined) {
        setTotalCount(res.data.count);
        setTotalPages(Math.ceil(res.data.count / 20));
      } else {
        setTotalCount(products.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setActiveFormTab('quick');
    setFormData({
      name: '',
      sku: `TM-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
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
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setActiveFormTab('quick');
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category || '',
      brand: p.brand || '',
      unit: p.unit || '',
      cost_price: p.cost_price || '',
      selling_price: p.selling_price || '',
      mrp: p.mrp || '',
      discount_percent: p.discount_percent || 0,
      gst_percent: p.gst_percent || 0,
      stock_quantity: p.stock_quantity ?? 0,
      min_stock_alert: p.min_stock_alert ?? 10,
      expiry_date: p.expiry_date || '',
      batch_number: p.batch_number || '',
      image: p.image || '',
      description: p.description || '',
    });
    setIsFormOpen(true);
  };

  // Pricing Helpers
  const handleCostPriceChange = (val) => {
    setFormData((prev) => ({ ...prev, cost_price: val }));
  };

  const handleSellingPriceChange = (val) => {
    const sPrice = parseFloat(val) || 0;
    const mrpPrice = parseFloat(formData.mrp) || 0;
    let disc = 0;
    if (mrpPrice > 0 && sPrice < mrpPrice) {
      disc = (((mrpPrice - sPrice) / mrpPrice) * 100).toFixed(1);
    }
    setFormData((prev) => ({
      ...prev,
      selling_price: val,
      discount_percent: disc,
    }));
  };

  const handleMrpChange = (val) => {
    const mrpPrice = parseFloat(val) || 0;
    const sPrice = parseFloat(formData.selling_price) || 0;
    let disc = 0;
    if (mrpPrice > 0 && sPrice > 0 && sPrice < mrpPrice) {
      disc = (((mrpPrice - sPrice) / mrpPrice) * 100).toFixed(1);
    }
    setFormData((prev) => ({
      ...prev,
      mrp: val,
      discount_percent: disc,
    }));
  };

  const applyQuickMargin = (percentage) => {
    const cost = parseFloat(formData.cost_price) || 0;
    if (cost <= 0) {
      showToast('Please enter Purchase / Cost Price first', 'error');
      return;
    }
    const calculatedSelling = (cost * (1 + percentage / 100)).toFixed(2);
    handleSellingPriceChange(calculatedSelling);
  };

  const handleMatchMrp = () => {
    if (!formData.mrp) return;
    handleSellingPriceChange(formData.mrp);
  };

  const handleGenerateSku = () => {
    const prefix = formData.name
      ? formData.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
      : 'PRD';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `TM-${prefix || 'PRD'}-${rand}` }));
  };

  const handleGenerateBarcode = () => {
    const barcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    setFormData((prev) => ({ ...prev, barcode }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const generatedSku = formData.sku?.trim() || `TM-${(formData.name || 'PRD').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const mrpNum = parseFloat(formData.mrp || 0);
      const sellingNum = parseFloat(formData.selling_price || formData.mrp || 0);
      const costNum = parseFloat(formData.cost_price || 0);

      const payload = {
        ...formData,
        sku: generatedSku,
        category: formData.category ? Number(formData.category) : null,
        brand: formData.brand ? Number(formData.brand) : null,
        unit: formData.unit ? Number(formData.unit) : null,
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number || null,
        mrp: mrpNum,
        selling_price: sellingNum,
        cost_price: costNum,
        stock_quantity: parseInt(formData.stock_quantity || 0),
        min_stock_alert: parseInt(formData.min_stock_alert || 10),
      };

      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await inventoryApi.createProduct(payload);
        showToast('New product added to inventory!', 'success');
      }

      setIsFormOpen(false);
      loadProducts();
    } catch (err) {
      const errData = err.response?.data;
      let errorMsg = 'Failed to save product. Check required fields.';
      if (typeof errData === 'object' && errData !== null) {
        const firstKey = Object.keys(errData)[0];
        if (firstKey) {
          const val = errData[firstKey];
          errorMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : typeof val === 'string' ? val : errorMsg;
        }
      }
      showToast(errorMsg, 'error');
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
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Bulk upload failed', 'error');
    } finally {
      setBulkUploading(false);
    }
  };

  // Sample CSV Template Downloader
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
            Product Management
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage catalogue, SKU barcodes, MRP & discounts, stock thresholds, and units.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={Upload} onClick={() => setIsBulkOpen(true)} className="flex-1 sm:flex-initial">
            Bulk CSV Upload
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate} className="flex-1 sm:flex-initial">
            Add New Product
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
          <div className="sm:col-span-5 lg:col-span-4">
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPage(1); }}
              placeholder="Search by title, SKU, barcode..."
            />
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-medium"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 lg:col-span-3">
            <select
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-medium"
            >
              <option value="">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="sm:col-span-12 lg:col-span-2 flex items-center justify-end gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex-1 sm:flex-initial flex items-center justify-center ${
                viewMode === 'grid' 
                  ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] border-[#384959] dark:border-[#88BDF2]' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex-1 sm:flex-initial flex items-center justify-center ${
                viewMode === 'table' 
                  ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] border-[#384959] dark:border-[#88BDF2]' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs overflow-x-auto no-scrollbar touch-pan pb-1">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mr-1 shrink-0">Stock Status:</span>
          {[
            { id: 'all', label: 'All Products' },
            { id: 'in_stock', label: 'In Stock' },
            { id: 'low_stock', label: 'Low Stock' },
            { id: 'out_of_stock', label: 'Out of Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStockFilter(tab.id); setPage(1); }}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer shrink-0 ${
                stockFilter === tab.id
                  ? 'bg-[#88BDF2] text-[#384959] shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}

        </div>
      </div>

      {/* Content: Grid or Table View */}
      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Products Found"
          description={
            search || selectedCategory || selectedBrand || stockFilter !== 'all'
              ? 'No grocery products match your current filters. Try resetting search or category filters.'
              : 'Your product catalog is currently empty. Click below to add your first grocery product.'
          }
          variant="card"
          actionLabel="Add New Product"
          onAction={handleOpenCreate}
          actionIcon={Plus}
          secondaryActionLabel={
            search || selectedCategory || selectedBrand || stockFilter !== 'all' ? 'Reset Filters' : undefined
          }
          onSecondaryAction={() => {
            setSearch('');
            setSelectedCategory('');
            setSelectedBrand('');
            setStockFilter('all');
            setPage(1);
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p) => {
            const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert;
            const isOut = p.stock_quantity <= 0;
            const cost = parseFloat(p.cost_price || 0);
            const selling = parseFloat(p.selling_price || 0);
            const mrp = parseFloat(p.mrp || 0);
            const profit = selling > 0 && cost > 0 ? (selling - cost) : 0;
            const margin = selling > 0 && cost > 0 ? (((selling - cost) / selling) * 100).toFixed(0) : 0;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-[#384959]/10 dark:bg-[#88BDF2]/15 text-[#384959] dark:text-[#88BDF2] text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg truncate">
                      {p.category_name || 'Grocery'}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs shrink-0 ${
                      isOut ? 'bg-rose-500 text-white' : isLow ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {isOut ? 'OUT OF STOCK' : isLow ? `LOW: ${p.stock_quantity} left` : `${p.stock_quantity} ${p.unit_name || 'units'}`}
                    </span>
                  </div>

                  {/* Title & Brand */}
                  <h3 className="text-sm font-bold text-[#384959] dark:text-slate-100 mt-1 line-clamp-2 leading-snug">
                    {p.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                    {p.brand_name && <span className="text-[#6A89A7] dark:text-[#88BDF2] font-semibold">{p.brand_name}</span>}
                    {p.brand_name && <span>•</span>}
                    <span className="font-mono text-[11px]">{p.sku}</span>
                  </div>

                  {/* Profit Margin Pill for Store Staff */}
                  {cost > 0 && selling > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-500">
                      <span>Buy: <strong className="text-slate-700 dark:text-slate-300">₹{cost.toFixed(2)}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        +{margin}% Margin (+₹{profit.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Price & Action Row */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-[#384959] dark:text-slate-100 font-heading">
                        ₹{Number(p.selling_price).toFixed(2)}
                      </span>
                      {Number(p.mrp) > Number(p.selling_price) && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{Number(p.mrp).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {Number(p.discount_percent) > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {p.discount_percent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#384959] dark:hover:text-slate-100 hover:bg-[#BDDDFC]/30 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit Product & Prices"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingProductId(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto touch-pan">
            <table className="w-full min-w-[840px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">SKU / Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Purchase (Cost)</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4 text-center">Margin / Profit</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Expiry</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {products.map((p) => {
                  const cost = parseFloat(p.cost_price || 0);
                  const selling = parseFloat(p.selling_price || 0);
                  const margin = selling > 0 && cost > 0 ? (((selling - cost) / selling) * 100).toFixed(0) : 0;
                  const profit = selling > 0 && cost > 0 ? (selling - cost).toFixed(2) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image || '/logo.png'} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                          <div>
                            <p className="font-bold text-[#384959] dark:text-slate-100">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.brand_name || 'Tulsi Mart'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        <div>{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{p.category_name || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        ₹{Number(p.cost_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#384959] dark:text-[#88BDF2] font-mono">
                        ₹{Number(p.selling_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        ₹{Number(p.mrp).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cost > 0 && selling > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            +{margin}% (+₹{profit})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="default" size="xs">
                          {p.stock_quantity} {p.unit_name || 'units'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400">{p.expiry_date || 'N/A'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenEdit(p)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#384959] dark:hover:text-white" title="Edit Product">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingProductId(p.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600" title="Delete Product">
                            <Trash2 className="w-4 h-4" />
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


      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={20}
        onPageChange={setPage}
      />

      {/* 🌟 Redesigned Simple & Powerful Add / Edit Product Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product'}
        subtitle="Simple, fast product entry for inventory management & POS billing"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {activeFormTab === 'quick' ? (
                <button
                  type="button"
                  onClick={() => setActiveFormTab('advanced')}
                  className="text-xs font-bold text-[#384959] dark:text-[#88BDF2] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" /> Configure Tax, Expiry & Media (Optional) →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveFormTab('quick')}
                  className="text-xs font-bold text-[#384959] dark:text-[#88BDF2] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Core Details
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFormSubmit}
                loading={formSubmitting}
                className="bg-[#384959] hover:bg-[#2B3844] text-white flex items-center gap-1.5 shadow-md px-5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#88BDF2]" />
                {editingProduct ? 'Save Changes' : 'Create & Save Product'}
              </Button>
            </div>
          </div>
        }
      >
        {(() => {
          const costNum = parseFloat(formData.cost_price) || 0;
          const sellingNum = parseFloat(formData.selling_price) || 0;
          const mrpNum = parseFloat(formData.mrp) || 0;
          const gstRate = parseFloat(formData.gst_percent) || 0;

          const taxableBasePrice = gstRate > 0 && sellingNum > 0 ? (sellingNum / (1 + gstRate / 100)) : sellingNum;
          const totalGstAmount = sellingNum > 0 ? (sellingNum - taxableBasePrice) : 0;
          const cgstAmount = totalGstAmount / 2;
          const sgstAmount = totalGstAmount / 2;

          const grossProfit = sellingNum > 0 && costNum > 0 ? (sellingNum - costNum) : 0;
          const grossMarginPercent = sellingNum > 0 && costNum > 0 ? (((sellingNum - costNum) / sellingNum) * 100).toFixed(1) : '0';

          const discountAmt = mrpNum > sellingNum ? (mrpNum - sellingNum) : 0;
          const discountPercent = mrpNum > 0 && mrpNum > sellingNum ? (((mrpNum - sellingNum) / mrpNum) * 100).toFixed(1) : '0';

          const hasLoss = costNum > 0 && sellingNum > 0 && (gstRate > 0 ? taxableBasePrice < costNum : sellingNum < costNum);
          const exceedsMrp = mrpNum > 0 && sellingNum > mrpNum;

          return (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
              {/* Navigation Tabs Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('quick')}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeFormTab === 'quick'
                        ? 'bg-[#384959] text-white shadow-sm ring-2 ring-[#384959]/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-[#88BDF2]" />
                    <span>📦 Core Info & Pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFormTab('advanced')}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeFormTab === 'advanced'
                        ? 'bg-[#384959] text-white shadow-sm ring-2 ring-[#384959]/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-[#88BDF2]" />
                    <span>⚙️ Tax, Batch & Media</span>
                    {(formData.gst_percent > 0 || formData.image || formData.batch_number) && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </button>
                </div>

                {/* Quick Info Badge */}
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fill essentials in 10 seconds</span>
                </div>
              </div>

              {/* ================= TAB 1: QUICK CORE DETAILS & PRICING ================= */}
              {activeFormTab === 'quick' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* 1. Product Name */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                      Product Name * <span className="text-slate-400 font-normal normal-case">(ઉત્પાદનનું નામ)</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Fortune Refined Sunflower Oil 1L / Amul Taaza Milk 500ml"
                      className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/30 outline-hidden text-[#384959] dark:text-slate-100 placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>

                  {/* 2. Category & Unit Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                        Category * <span className="text-slate-400 font-normal normal-case">(કેટેગરી)</span>
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100 shadow-2xs"
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                        Unit * <span className="text-slate-400 font-normal normal-case">(એકમ - kg / g / L / ml / pc / pkt)</span>
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100 shadow-2xs"
                      >
                        <option value="">-- Select Unit (kg, g, L, ml, pc, pkt, box) --</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3. Pricing Section (Purchase Price, Selling Price, Printed MRP) */}
                  <div className="bg-[#BDDDFC]/15 dark:bg-slate-850 p-4 rounded-2xl border border-[#88BDF2]/40 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#384959] dark:text-[#88BDF2] uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4" />
                        <span>Pricing & Margins (કિંમત અને નફો)</span>
                      </div>
                      
                      {/* Live Profit Margin Pill */}
                      {sellingNum > 0 && costNum > 0 && (
                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-black font-mono border flex items-center gap-1 ${
                          grossProfit >= 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}>
                          <span>{grossProfit >= 0 ? `+₹${grossProfit.toFixed(2)}` : `₹${grossProfit.toFixed(2)}`}</span>
                          <span>({grossMarginPercent}% Profit)</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cost / Purchase Price */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Purchase Price</span>
                          <span className="text-[10px] text-slate-400 font-normal">ખરીદ ભાવ</span>
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
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-mono"
                          />
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-[#384959] dark:border-[#88BDF2] space-y-1 relative">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-[#384959] dark:text-[#88BDF2] uppercase tracking-wider">
                            Selling Price *
                          </label>
                          <span className="text-[9px] font-bold text-slate-400">વેચાણ ભાવ</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-[#384959] dark:text-[#88BDF2]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.selling_price}
                            onChange={(e) => handleSellingPriceChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-mono"
                          />
                        </div>

                        {/* Quick Margin Pills */}
                        <div className="pt-1 flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] text-slate-400 font-bold">Margin:</span>
                          {[10, 15, 20, 25, 30, 50].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => applyQuickMargin(m)}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-[#BDDDFC]/30 hover:bg-[#BDDDFC]/60 text-[#384959] dark:text-[#88BDF2] rounded border border-[#88BDF2]/40 transition-colors cursor-pointer"
                            >
                              +{m}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Printed MRP */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Printed MRP *
                          </label>
                          {formData.mrp && (
                            <button
                              type="button"
                              onClick={handleMatchMrp}
                              className="text-[10px] font-bold text-[#6A89A7] hover:underline cursor-pointer"
                            >
                              Match MRP
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.mrp}
                            onChange={(e) => handleMrpChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-mono"
                          />
                        </div>
                        {discountAmt > 0 && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Save ₹{discountAmt.toFixed(2)} ({discountPercent}% OFF)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Stock & Barcodes Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Stock Quantity */}
                    <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                          Stock Quantity * <span className="text-slate-400 font-normal normal-case">(સ્ટોક સંખ્યા)</span>
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Quick set:</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                          placeholder="25"
                          className="w-28 px-3 py-2 text-sm font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 shadow-2xs font-mono"
                        />
                        
                        {/* Interactive Quick Stock Chips */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[10, 25, 50, 100].map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => setFormData({ ...formData, stock_quantity: qty })}
                              className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-[#384959] dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                            >
                              {qty}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SKU & Barcode Identifiers */}
                    <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* SKU */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[10px]">
                              SKU *
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateSku}
                              className="text-[9px] font-bold text-[#6A89A7] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Auto
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
                          />
                        </div>

                        {/* Barcode */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[10px]">
                              Barcode
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateBarcode}
                              className="text-[9px] font-bold text-[#6A89A7] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Barcode className="w-2.5 h-2.5" /> Auto
                            </button>
                          </div>
                          <input
                            type="text"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder="Barcode"
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: ADVANCED (TAX, BATCH, BRAND, MEDIA) ================= */}
              {activeFormTab === 'advanced' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Brand & GST Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Brand */}
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                        Brand <span className="text-slate-400 font-normal normal-case">(બ્રાન્ડ - ઓપ્શનલ)</span>
                      </label>
                      <select
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100 shadow-2xs"
                      >
                        <option value="">-- Select Brand (Optional) --</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Low Stock Alert */}
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                        Low Stock Alert Level
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.min_stock_alert}
                        onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                        placeholder="e.g. 10"
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  {/* GST Tax Rate Strip & Breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-extrabold text-[#384959] dark:text-slate-100 flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-[#88BDF2]" />
                        <span>GST Tax Rate (GST દર):</span>
                      </label>

                      {/* Presets */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {[
                          { rate: '0', label: '0% (Essential/Grains)' },
                          { rate: '5', label: '5% (Oil/Spices)' },
                          { rate: '12', label: '12% (Ghee)' },
                          { rate: '18', label: '18% (Snacks)' },
                          { rate: '28', label: '28% (Luxury)' }
                        ].map((p) => {
                          const isSel = String(formData.gst_percent) === p.rate;
                          return (
                            <button
                              key={p.rate}
                              type="button"
                              onClick={() => setFormData({ ...formData, gst_percent: p.rate })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-[#384959] text-white border-[#384959] shadow-2xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#88BDF2]'
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* GST Calculation Breakdown Card */}
                    {gstRate > 0 && sellingNum > 0 && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#384959] dark:text-[#88BDF2]">
                          <span>GST {gstRate}% Tax Breakdown:</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                            Base ₹{taxableBasePrice.toFixed(2)} + GST ₹{totalGstAmount.toFixed(2)} = ₹{sellingNum.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-slate-400 block font-bold">Base Price</span>
                            <span className="font-mono font-bold text-[#384959] dark:text-slate-200">₹{taxableBasePrice.toFixed(2)}</span>
                          </div>
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-slate-400 block font-bold">CGST ({(gstRate/2).toFixed(1)}%)</span>
                            <span className="font-mono font-bold text-[#6A89A7]">₹{cgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-slate-400 block font-bold">SGST ({(gstRate/2).toFixed(1)}%)</span>
                            <span className="font-mono font-bold text-[#6A89A7]">₹{sgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="p-1.5 bg-[#384959] text-white rounded-lg">
                            <span className="text-[#88BDF2] block font-bold">Final Bill</span>
                            <span className="font-mono font-bold">₹{sellingNum.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Batch & Expiry Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                        Batch / Lot Number
                      </label>
                      <input
                        type="text"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        placeholder="e.g. BATCH-2026-A"
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 shadow-2xs font-mono"
                      />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px]">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Media & Description */}
                  <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-9 space-y-2">
                        <div>
                          <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px] mb-1">
                            Product Image URL
                          </label>
                          <input
                            type="url"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block font-extrabold text-[#384959] dark:text-slate-100 uppercase tracking-wider text-[11px] mb-1">
                            Short Highlights / Description
                          </label>
                          <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g. 100% Whole Wheat, No Preservatives"
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Image Preview Box */}
                      <div className="sm:col-span-3 flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl h-24">
                        {formData.image ? (
                          <img
                            src={formData.image}
                            alt="Preview"
                            onError={(e) => { e.target.src = '/logo.png'; }}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <div className="text-center text-slate-400 space-y-1">
                            <ImageIcon className="w-5 h-5 mx-auto text-slate-300 dark:text-slate-600" />
                            <span className="text-[10px] block">No image URL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Warnings (Always visible if issue exists) */}
              {hasLoss && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    ⚠️ Warning: Selling price (₹{sellingNum.toFixed(2)}) is lower than purchase price (₹{costNum.toFixed(2)}). You will incur a loss!
                  </span>
                </div>
              )}

              {exceedsMrp && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    ⚠️ Warning: Selling price (₹{sellingNum.toFixed(2)}) exceeds package printed MRP (₹{mrpNum.toFixed(2)})!
                  </span>
                </div>
              )}
            </form>
          );
        })()}
      </Modal>


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
              className="text-xs font-bold text-[#6A89A7] hover:text-[#384959] flex items-center gap-1 cursor-pointer"
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
          <div className="border-2 border-dashed border-slate-300 hover:border-[#88BDF2] rounded-2xl p-8 text-center transition-colors">
            <Upload className="w-10 h-10 text-[#6A89A7] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#384959]">Select or Drop your CSV file here</p>
            <p className="text-xs text-slate-500 mt-1">Accepts UTF-8 .csv files with SKU, Name, Price, and Stock.</p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files[0])}
              className="mt-4 text-xs"
            />
          </div>
          {bulkFile && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Selected: {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      </Modal>

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
