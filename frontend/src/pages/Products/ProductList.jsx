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

  const handleOpenCreate = () => {
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
    setIsFormOpen(true);
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
      } else {
        await inventoryApi.createProduct(payload);
        showToast(`New product '${payload.name}' created!`, 'success');
      }

      setIsFormOpen(false);
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Product Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage catalogue, SKU barcodes, prices, stock, and units.
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
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
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
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-medium"
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
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500 text-slate-800 dark:text-slate-100 font-medium"
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
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex-1 sm:flex-initial flex items-center justify-center ${
                viewMode === 'grid' 
                  ? 'bg-teal-600 text-white border-teal-600' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex-1 sm:flex-initial flex items-center justify-center ${
                viewMode === 'table' 
                  ? 'bg-teal-600 text-white border-teal-600' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs overflow-x-auto no-scrollbar">
          <span className="text-slate-500 font-medium text-[11px] mr-1 shrink-0">Stock Status:</span>
          {[
            { id: 'all', label: 'All Products' },
            { id: 'in_stock', label: 'In Stock' },
            { id: 'low_stock', label: 'Low Stock' },
            { id: 'out_of_stock', label: 'Out of Stock' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStockFilter(tab.id); setPage(1); }}
              className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                stockFilter === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content: Grid or Table View */}
      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-[#B2DFDB] dark:border-slate-800">
          <CartLoader text="Loading products catalog..." size="md" />
        </div>
      ) : products.length === 0 ? (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {products.map((p) => (
            <div key={p.id} className="relative group">
              <ProductCard
                product={p}
                cartQuantity={cartQuantities[p.id] || 0}
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
                onOpenDetails={(prod) => setSelectedProductForModal(prod)}
              />
              {/* Quick Admin Actions Overlay Button */}
              <div className="absolute top-2 right-9 flex items-center gap-1 z-10">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}
                  className="p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 text-[#607D8B] hover:text-[#00695C] dark:hover:text-white shadow-xs transition-colors cursor-pointer"
                  title="Edit Product"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

      ) : (
        <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
            <table className="w-full min-w-[840px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-2xs">
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
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
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image || '/logo.png'} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                            <p className="text-[10px] text-slate-500">{p.brand_name || 'Tulsi Mart'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        <div>{p.sku}</div>
                        <div className="text-[10px] text-slate-500">{p.barcode}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{p.category_name || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                        ₹{Number(p.cost_price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-600 dark:text-teal-400 font-mono">
                        ₹{Number(p.selling_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">
                        ₹{Number(p.mrp).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cost > 0 && selling > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-slate-800 dark:text-teal-400 border border-teal-200 dark:border-slate-700">
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
                          <button onClick={() => handleOpenEdit(p)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-teal-600 dark:hover:text-white" title="Edit Product">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingProductId(p.id)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-500 hover:text-rose-600" title="Delete Product">
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

      {/* Add / Edit Product Modal */}
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
                  className="text-xs font-bold text-[#00695C] dark:text-[#4DB6AC] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" /> Configure Tax, Expiry & Media (Optional) →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveFormTab('quick')}
                  className="text-xs font-bold text-[#00695C] dark:text-[#4DB6AC] hover:underline flex items-center gap-1 cursor-pointer"
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
                className="bg-[#00695C] hover:bg-[#004D40] text-white flex items-center gap-1.5 shadow-md px-5 border-none"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
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
              <div className="flex items-center justify-between border-b border-[#B2DFDB]/60 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('quick')}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeFormTab === 'quick'
                        ? 'bg-[#00695C] text-white shadow-sm ring-2 ring-[#00695C]/20'
                        : 'bg-[#E0F2F1] dark:bg-slate-800 text-[#263238] dark:text-slate-400 hover:bg-[#B2DFDB]'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-[#4DB6AC]" />
                    <span>📦 Core Info & Pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFormTab('advanced')}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                      activeFormTab === 'advanced'
                        ? 'bg-[#00695C] text-white shadow-sm ring-2 ring-[#00695C]/20'
                        : 'bg-[#E0F2F1] dark:bg-slate-800 text-[#263238] dark:text-slate-400 hover:bg-[#B2DFDB]'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-[#4DB6AC]" />
                    <span>⚙️ Tax, Batch & Media</span>
                    {(formData.gst_percent > 0 || formData.image || formData.batch_number) && (
                      <span className="w-2 h-2 rounded-full bg-[#009688]" />
                    )}
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-[#607D8B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FBC02D]" />
                  <span>Fill essentials in 10 seconds</span>
                </div>
              </div>

              {/* ================= TAB 1: QUICK CORE DETAILS & PRICING ================= */}
              {activeFormTab === 'quick' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* 1. Product Name */}
                  <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3.5 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-1.5">
                    <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                      Product Name * <span className="text-[#607D8B] font-normal normal-case">(ઉત્પાદનનું નામ)</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Fortune Refined Sunflower Oil 1L / Amul Taaza Milk 500ml"
                      className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/30 outline-hidden text-[#263238] dark:text-slate-100 placeholder:text-[#607D8B]/70 shadow-2xs"
                    />
                  </div>

                  {/* 2. Category & Unit Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Category * <span className="text-[#607D8B] font-normal normal-case">(કેટેગરી)</span>
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl focus:border-[#009688] outline-hidden text-[#263238] dark:text-slate-100 shadow-2xs"
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Unit * <span className="text-[#607D8B] font-normal normal-case">(એકમ - kg / g / L / ml / pc / pkt)</span>
                      </label>
                      <select
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl focus:border-[#009688] outline-hidden text-[#263238] dark:text-slate-100 shadow-2xs"
                      >
                        <option value="">-- Select Unit (kg, g, L, ml, pc, pkt, box) --</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 3. Pricing Section */}
                  <div className="bg-[#E0F2F1]/50 dark:bg-slate-850 p-4 rounded-2xl border border-[#B2DFDB] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#00695C] dark:text-[#4DB6AC] uppercase tracking-wider font-heading">
                        <TrendingUp className="w-4 h-4" />
                        <span>Pricing & Margins (કિંમત અને નફો)</span>
                      </div>
                      
                      {/* Live Profit Margin Pill */}
                      {sellingNum > 0 && costNum > 0 && (
                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-black font-mono border flex items-center gap-1 ${
                          grossProfit >= 0
                            ? 'bg-[#E0F2F1] dark:bg-teal-950/70 text-[#00695C] dark:text-[#4DB6AC] border-[#B2DFDB]'
                            : 'bg-[#FFEBEE] dark:bg-rose-950/70 text-[#E53935] border-[#EF9A9A]'
                        }`}>
                          <span>{grossProfit >= 0 ? `+₹${grossProfit.toFixed(2)}` : `₹${grossProfit.toFixed(2)}`}</span>
                          <span>({grossMarginPercent}% Profit)</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Cost / Purchase Price */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-[#B2DFDB] dark:border-slate-700 space-y-1">
                        <label className="text-[11px] font-bold text-[#263238] dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                          <span>Purchase Price</span>
                          <span className="text-[10px] text-[#607D8B] font-normal">ખરીદ ભાવ</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-[#607D8B]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.cost_price}
                            onChange={(e) => handleCostPriceChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-[#F0FAF9] dark:bg-slate-800 border border-[#B2DFDB] dark:border-slate-600 rounded-lg outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 font-mono"
                          />
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-[#00695C] dark:border-[#009688] space-y-1 relative">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-[#00695C] dark:text-[#4DB6AC] uppercase tracking-wider">
                            Selling Price *
                          </label>
                          <span className="text-[9px] font-bold text-[#607D8B]">વેચાણ ભાવ</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-[#00695C] dark:text-[#4DB6AC]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.selling_price}
                            onChange={(e) => handleSellingPriceChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-[#F0FAF9] dark:bg-slate-800 border border-[#B2DFDB] dark:border-slate-600 rounded-lg outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 font-mono"
                          />
                        </div>

                        {/* Quick Margin Pills */}
                        <div className="pt-1 flex items-center gap-1 flex-wrap">
                          <span className="text-[9px] text-[#607D8B] font-bold">Margin:</span>
                          {[10, 15, 20, 25, 30, 50].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => applyQuickMargin(m)}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#00695C] rounded border border-[#B2DFDB] transition-colors cursor-pointer"
                            >
                              +{m}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Printed MRP */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-[#B2DFDB] dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-[#263238] dark:text-slate-300 uppercase tracking-wider">
                            Printed MRP *
                          </label>
                          {formData.mrp && (
                            <button
                              type="button"
                              onClick={handleMatchMrp}
                              className="text-[10px] font-bold text-[#00695C] hover:underline cursor-pointer"
                            >
                              Match MRP
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm font-bold text-[#607D8B]">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.mrp}
                            onChange={(e) => handleMrpChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 text-sm font-bold bg-[#F0FAF9] dark:bg-slate-800 border border-[#B2DFDB] dark:border-slate-600 rounded-lg outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 font-mono"
                          />
                        </div>
                        {discountAmt > 0 && (
                          <p className="text-[10px] text-[#009688] dark:text-[#4DB6AC] font-bold">
                            Save ₹{discountAmt.toFixed(2)} ({discountPercent}% OFF)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Stock & Barcodes Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Stock Quantity */}
                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3.5 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                          Stock Quantity * <span className="text-[#607D8B] font-normal normal-case">(સ્ટોક સંખ્યા)</span>
                        </label>
                        <span className="text-[10px] font-bold text-[#607D8B]">Quick set:</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.stock_quantity}
                          onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                          placeholder="25"
                          className="w-28 px-3 py-2 text-sm font-bold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 shadow-2xs font-mono"
                        />
                        
                        <div className="flex items-center gap-1 flex-wrap">
                          {[10, 25, 50, 100].map((qty) => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => setFormData({ ...formData, stock_quantity: qty })}
                              className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-[#E0F2F1] text-[#263238] dark:text-slate-200 rounded-lg border border-[#B2DFDB] dark:border-slate-700 cursor-pointer shadow-2xs"
                            >
                              {qty}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* SKU & Barcode Identifiers */}
                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3.5 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* SKU */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[10px] font-heading">
                              SKU *
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateSku}
                              className="text-[9px] font-bold text-[#00695C] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Auto
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-lg outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100"
                          />
                        </div>

                        {/* Barcode */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[10px] font-heading">
                              Barcode
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateBarcode}
                              className="text-[9px] font-bold text-[#00695C] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Barcode className="w-2.5 h-2.5" /> Auto
                            </button>
                          </div>
                          <input
                            type="text"
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder="Barcode"
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-lg outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100"
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
                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Brand <span className="text-[#607D8B] font-normal normal-case">(બ્રાન્ડ - ઓપ્શનલ)</span>
                      </label>
                      <select
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl focus:border-[#009688] outline-hidden text-[#263238] dark:text-slate-100 shadow-2xs"
                      >
                        <option value="">-- Select Brand (Optional) --</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Low Stock Alert Level
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.min_stock_alert}
                        onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                        placeholder="e.g. 10"
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  {/* GST Tax Rate Strip & Breakdown */}
                  <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3.5 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-extrabold text-[#263238] dark:text-slate-100 flex items-center gap-1.5 font-heading">
                        <Percent className="w-4 h-4 text-[#009688]" />
                        <span>GST Tax Rate (GST દર):</span>
                      </label>

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
                                  ? 'bg-[#00695C] text-white border-[#00695C] shadow-2xs'
                                  : 'bg-white dark:bg-slate-900 text-[#263238] dark:text-slate-300 border-[#B2DFDB] dark:border-slate-700 hover:border-[#009688]'
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
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-[#B2DFDB] dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#00695C] dark:text-[#4DB6AC]">
                          <span>GST {gstRate}% Tax Breakdown:</span>
                          <span className="font-mono text-[#607D8B] dark:text-slate-300">
                            Base ₹{taxableBasePrice.toFixed(2)} + GST ₹{totalGstAmount.toFixed(2)} = ₹{sellingNum.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                          <div className="p-1.5 bg-[#F0FAF9] dark:bg-slate-800 rounded-lg">
                            <span className="text-[#607D8B] block font-bold">Base Price</span>
                            <span className="font-mono font-bold text-[#263238] dark:text-slate-200">₹{taxableBasePrice.toFixed(2)}</span>
                          </div>
                          <div className="p-1.5 bg-[#F0FAF9] dark:bg-slate-800 rounded-lg">
                            <span className="text-[#607D8B] block font-bold">CGST ({(gstRate/2).toFixed(1)}%)</span>
                            <span className="font-mono font-bold text-[#00695C]">₹{cgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="p-1.5 bg-[#F0FAF9] dark:bg-slate-800 rounded-lg">
                            <span className="text-[#607D8B] block font-bold">SGST ({(gstRate/2).toFixed(1)}%)</span>
                            <span className="font-mono font-bold text-[#00695C]">₹{sgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="p-1.5 bg-[#00695C] text-white rounded-lg">
                            <span className="text-[#4DB6AC] block font-bold">Final Bill</span>
                            <span className="font-mono font-bold">₹{sellingNum.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Batch & Expiry Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Batch / Lot Number
                      </label>
                      <input
                        type="text"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        placeholder="e.g. BATCH-2026-A"
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 shadow-2xs font-mono"
                      />
                    </div>

                    <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-1">
                      <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] font-heading">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Media & Description */}
                  <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3.5 rounded-2xl border border-[#B2DFDB] dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-9 space-y-2">
                        <div>
                          <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] mb-1 font-heading">
                            Product Image URL
                          </label>
                          <input
                            type="url"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block font-extrabold text-[#263238] dark:text-slate-100 uppercase tracking-wider text-[11px] mb-1 font-heading">
                            Short Highlights / Description
                          </label>
                          <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g. 100% Whole Wheat, No Preservatives"
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-xl outline-hidden focus:border-[#009688] text-[#263238] dark:text-slate-100 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Image Preview Box */}
                      <div className="sm:col-span-3 flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-900 border border-[#B2DFDB] dark:border-slate-700 rounded-2xl h-24">
                        {formData.image ? (
                          <img
                            src={formData.image}
                            alt="Preview"
                            onError={(e) => { e.target.src = '/logo.png'; }}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          <div className="text-center text-[#607D8B] space-y-1">
                            <ImageIcon className="w-5 h-5 mx-auto text-[#607D8B]" />
                            <span className="text-[10px] block">No image URL</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Warnings */}
              {hasLoss && (
                <div className="p-2.5 bg-[#FFEBEE] dark:bg-rose-950/40 rounded-xl border border-[#EF9A9A] dark:border-rose-800/80 text-[#E53935] dark:text-rose-300 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#E53935]" />
                  <span>
                    ⚠️ Warning: Selling price (₹{sellingNum.toFixed(2)}) is lower than purchase price (₹{costNum.toFixed(2)}). You will incur a loss!
                  </span>
                </div>
              )}

              {exceedsMrp && (
                <div className="p-2.5 bg-[#FFF8E1] dark:bg-amber-950/40 rounded-xl border border-[#FBC02D] dark:border-amber-800/80 text-[#263238] dark:text-amber-300 text-[11px] font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#FBC02D]" />
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

