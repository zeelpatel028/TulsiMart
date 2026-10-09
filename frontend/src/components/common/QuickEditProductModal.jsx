
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { 
  Package, 
  Tag, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Barcode, 
  Hash, 
  ShieldAlert, 
  Save,
  Building2,
  Calendar,
  Percent,
  FileText,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Receipt,
  Boxes,
  Activity,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { inventoryApi } from '../../services/inventoryApi';
import { suppliersApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const QuickEditProductModal = ({
  isOpen,
  onClose,
  product,
  onProductUpdated
}) => {
  const { showToast } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    product_code: '',
    sku: '',
    barcode: '',
    cost_price: 0,
    selling_price: 0,
    mrp: 0,
    gst_percent: 0,
    purchase_gst_percent: 0,
    selling_gst_percent: 0,
    discount_percent: 0,
    stock_quantity: 0,
    min_stock_alert: 10,
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    category_id: '',
    brand_id: '',
    unit_id: '',
    supplier_id: '',
    description: '',
    short_description: '',
    is_active: true,
    is_featured: false
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        product_code: product.product_code || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        cost_price: product.cost_price || product.purchase_final_price || 0,
        selling_price: product.selling_price || 0,
        mrp: product.mrp || product.selling_price || 0,
        gst_percent: product.gst_percent || 0,
        purchase_gst_percent: product.purchase_gst_percent || product.gst_percent || 0,
        selling_gst_percent: product.selling_gst_percent || product.gst_percent || 0,
        discount_percent: product.discount_percent || 0,
        stock_quantity: product.stock_quantity || 0,
        min_stock_alert: product.min_stock_alert ?? 10,
        batch_number: product.batch_number || '',
        manufacturing_date: product.manufacturing_date || '',
        expiry_date: product.expiry_date || '',
        category_id: product.category_id || product.category?.id || (typeof product.category === 'number' ? product.category : ''),
        brand_id: product.brand_id || product.brand?.id || (typeof product.brand === 'number' ? product.brand : ''),
        unit_id: product.unit_id || product.unit?.id || (typeof product.unit === 'number' ? product.unit : ''),
        supplier_id: product.supplier_id || product.supplier?.id || (typeof product.supplier === 'number' ? product.supplier : ''),
        description: product.description || '',
        short_description: product.short_description || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false
      });
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      loadDropdowns();
    }
  }, [isOpen]);

  const loadDropdowns = async () => {
    try {
      const [catRes, brandRes, unitRes, suppRes] = await Promise.all([
        inventoryApi.getCategories().catch(() => ({ data: [] })),
        inventoryApi.getBrands().catch(() => ({ data: [] })),
        inventoryApi.getUnits().catch(() => ({ data: [] })),
        suppliersApi.getSuppliers().catch(() => ({ data: [] }))
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.results || []));
      setBrands(Array.isArray(brandRes.data) ? brandRes.data : (brandRes.data?.results || []));
      setUnits(Array.isArray(unitRes.data) ? unitRes.data : (unitRes.data?.results || []));
      setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : (suppRes.data?.results || []));
    } catch (err) {
      console.error('Failed to load dropdowns', err);
    }
  };

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const updatePayload = {
        ...formData,
        cost_price: parseFloat(formData.cost_price || 0),
        selling_price: parseFloat(formData.selling_price || 0),
        mrp: parseFloat(formData.mrp || formData.selling_price || 0),
        gst_percent: parseFloat(formData.gst_percent || 0),
        purchase_gst_percent: parseFloat(formData.purchase_gst_percent || formData.gst_percent || 0),
        selling_gst_percent: parseFloat(formData.selling_gst_percent || formData.gst_percent || 0),
        discount_percent: parseFloat(formData.discount_percent || 0),
        stock_quantity: parseFloat(formData.stock_quantity || 0),
        min_stock_alert: parseFloat(formData.min_stock_alert || 0),
        category_id: formData.category_id ? Number(formData.category_id) : null,
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
        unit_id: formData.unit_id ? Number(formData.unit_id) : null,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        manufacturing_date: formData.manufacturing_date || null,
        expiry_date: formData.expiry_date || null,
      };

      const res = await inventoryApi.updateProduct(product.id, updatePayload);
      const updatedProduct = res.data || { ...product, ...updatePayload };
      
      showToast(`Product "${formData.name}" updated successfully!`, 'success');
      if (onProductUpdated) {
        onProductUpdated(updatedProduct);
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.response?.data?.detail || 'Failed to update product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cost = parseFloat(formData.cost_price || 0);
  const sell = parseFloat(formData.selling_price || 0);
  const marginPercent = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(1) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3 font-sans text-slate-900 dark:text-white">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00796b] to-[#004d40] text-white flex items-center justify-center font-bold shadow-md shadow-teal-900/10 shrink-0 border border-white/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">Update Product Details</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-[#00695c] dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                DB ID #{product.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              Edit store database records, SKU codes, pricing, stock levels, GST tax & vendor links
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full font-sans gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 truncate">
            {formData.sku ? (
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#00796b] dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200/60 dark:border-teal-900/40">
                <Hash className="w-3 h-3" /> SKU: {formData.sku}
              </span>
            ) : (
              <span className="text-slate-400 font-medium">SKU not assigned</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-teal-900/10 border border-[#004d40]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{submitting ? 'Saving Changes...' : 'Save Product Changes'}</span>
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4]">
        
        {/* SECTION 1: PRODUCT TITLE & CODES */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#00796b] dark:text-teal-400" />
              Product General Details & Codes
            </span>
            {formData.is_active && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3 h-3" /> Active Item
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              Product Title / Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Package className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Colgate Strong Teeth Toothpaste 200g"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 transition-all text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                SKU Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-1001"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Product Code</label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  placeholder="PROD-2026"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Barcode / EAN</label>
              <div className="relative">
                <Barcode className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="8901234567890"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CATEGORY, BRAND, UNIT & VENDOR */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#00796b] dark:text-teal-400" />
            Classifications & Vendor Mapping
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 font-semibold"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Brand</label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 font-semibold"
              >
                <option value="">-- Select Brand --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
              <select
                value={formData.unit_id}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 font-semibold"
              >
                <option value="">-- Select Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier / Vendor</label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 font-semibold"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.company_name || s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRICING, MRP, GST TAX & MARGIN */}
        <div className="p-4 bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 rounded-2xl border border-teal-100/90 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-black text-[#00796b] dark:text-teal-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> Pricing, GST Tax & Margin Breakdown
            </span>
            <span className={`text-[11px] font-black px-3 py-1 rounded-xl border flex items-center gap-1 ${
              marginPercent >= 15 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/80' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/80'
            }`}>
              <Sparkles className="w-3.5 h-3.5" /> Calculated Profit Margin: {marginPercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Purchase Cost (₹)</label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Selling Price (₹)</label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-[#00796b] dark:text-teal-300 outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">MRP Price (₹)</label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">GST Tax Rate (%)</label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gst_percent}
                  onChange={(e) => setFormData({ ...formData, gst_percent: e.target.value, purchase_gst_percent: e.target.value, selling_gst_percent: e.target.value })}
                  placeholder="18"
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: INVENTORY STOCK, REORDER ALERT & BATCH DETAILS */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#00796b] dark:text-teal-400" />
            Inventory Stock & Batch Tracking
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Current Stock Qty</label>
              <input
                type="number"
                step="0.01"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-black text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Min Reorder Alert</label>
              <input
                type="number"
                step="1"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Batch Number</label>
              <input
                type="text"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="BATCH-2026A"
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 pointer-events-none" /> Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white outline-none focus:border-[#00796b] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: DESCRIPTION & STATUS TOGGLES */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00796b]" /> Description & Notes
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed product descriptions or vendor notes..."
              className="w-full px-3 py-2 bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 resize-none text-xs"
            />
          </div>

          <div className="sm:col-span-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-center space-y-3">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Active Item Status</span>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-[#00796b] rounded cursor-pointer accent-[#00796b]"
              />
            </label>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Featured Item</span>
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-[#00796b] rounded cursor-pointer accent-[#00796b]"
              />
            </label>
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default QuickEditProductModal;
