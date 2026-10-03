import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi, suppliersApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Camera,
  Package,
  Tag,
  FileText,
  AlertTriangle,
  Scale,
  Percent,
  Plus,
  ChevronDown,
  X,
  ClipboardList
} from 'lucide-react';

export const AddProductPage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Dropdown options state
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Auto-generated Product ID state
  const [nextProductId, setNextProductId] = useState('PD-ID-001');

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Image Upload state
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitData, setNewUnitData] = useState({ name: '', short_name: '', base_unit: 'g', conversion_factor: '1000' });
  const [savingUnit, setSavingUnit] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    sku: '',
    price: '',
    discount: '',
    stock_quantity: '',
    unit: '',
    min_stock_alert: '',
    description: '',
    supplier: '',
    purchase_non_tax_price: '',
    purchase_tax: '18',
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMeta();
  }, []);

  const loadMeta = async () => {
    try {
      setLoadingMeta(true);
      const [catRes, unitRes, suppRes, nextIdRes] = await Promise.allSettled([
        inventoryApi.getCategories(),
        inventoryApi.getUnits(),
        suppliersApi.getSuppliers({ page_size: 100 }),
        inventoryApi.getNextProductId()
      ]);

      let catList = [];
      if (catRes.status === 'fulfilled') {
        catList = extractList(catRes.value);
        setCategories(catList);
      }

      let unitList = [];
      if (unitRes.status === 'fulfilled') {
        unitList = extractList(unitRes.value);
        setUnits(unitList);
      }

      let suppList = [];
      if (suppRes.status === 'fulfilled') {
        suppList = extractList(suppRes.value);
        setSuppliers(suppList);
      }

      let generatedSku = 'PD-ID-001';
      if (nextIdRes.status === 'fulfilled' && nextIdRes.value.data?.next_product_id) {
        generatedSku = nextIdRes.value.data.next_product_id;
        setNextProductId(generatedSku);
      }

      setFormData(prev => ({
        ...prev,
        category: catList[0]?.id || '',
        unit: unitList[0]?.id || '',
        supplier: suppList[0]?.id || '',
        sku: generatedSku
      }));
    } catch (err) {
      console.error('Failed to load metadata:', err);
    } finally {
      setLoadingMeta(false);
    }
  };

  // Image Upload Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size exceeds 5MB limit', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock_quantity || parseFloat(formData.stock_quantity) < 0) newErrors.stock_quantity = 'Stock quantity required';
    if (!formData.unit) newErrors.unit = 'Unit is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showToast('Please fill out all required fields (*)', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const priceNum = parseFloat(formData.price) || 0;
      const discountNum = parseFloat(formData.discount) || 0;
      const mrpNum = discountNum > 0 ? (priceNum / (1 - discountNum / 100)) : (priceNum * 1.15);

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku || nextProductId,
        product_code: formData.sku || nextProductId,
        brand: formData.brand.trim() || undefined,
        category: formData.category,
        unit: formData.unit,
        selling_unit: formData.unit,
        supplier: formData.supplier || suppliers[0]?.id || undefined,
        
        selling_price: priceNum,
        mrp: parseFloat(mrpNum.toFixed(2)),
        discount_percent: discountNum,
        
        purchase_non_tax_price: parseFloat((priceNum * 0.8).toFixed(2)),
        purchase_gst_percent: 18,
        cost_price: parseFloat((priceNum * 0.8).toFixed(2)),

        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        min_stock_alert: parseFloat(formData.min_stock_alert) || 10,
        short_description: formData.description.trim() || null,
        description: formData.description.trim() || null,
      };

      await inventoryApi.createProduct(payload);
      showToast(`Product "${formData.name}" added successfully!`, 'success');
      navigate('/inventory');
    } catch (err) {
      console.error('Failed to create product:', err);
      showToast(err.response?.data?.detail || 'Failed to save product. Check required fields.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Category Handler
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setSavingCategory(true);
      const res = await inventoryApi.createCategory({ name: newCategoryName.trim() });
      const created = res.data;
      setCategories(prev => [...prev.filter(c => c.id !== created.id), created]);
      setFormData(prev => ({ ...prev, category: created.id }));
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      showToast(`Category "${created.name}" added and selected!`, 'success');
    } catch (err) {
      showToast('Failed to add category', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  // Add Unit Handler
  const handleSaveUnit = async () => {
    if (!newUnitData.name.trim()) return;
    try {
      setSavingUnit(true);
      const short = newUnitData.short_name.trim() || newUnitData.name.trim().toLowerCase().slice(0, 5);
      const res = await inventoryApi.createUnit({
        name: newUnitData.name.trim(),
        short_name: short,
        base_unit: newUnitData.base_unit.trim() || 'g',
        conversion_factor: parseFloat(newUnitData.conversion_factor) || 1
      });
      const created = res.data;
      setUnits(prev => [...prev.filter(u => u.id !== created.id), created]);
      setFormData(prev => ({ ...prev, unit: created.id }));
      setNewUnitData({ name: '', short_name: '', base_unit: 'g', conversion_factor: '1000' });
      setIsUnitModalOpen(false);
      showToast(`Unit "${created.name}" added and selected!`, 'success');
    } catch (err) {
      showToast('Failed to add unit', 'error');
    } finally {
      setSavingUnit(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECF7F5] dark:bg-slate-950 font-sans pb-28">
      {/* 🔴 Top Header Banner */}
      <div className="bg-gradient-to-b from-[#C4ECE2] via-[#DBF3ED] to-[#ECF7F5] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 px-4 pt-4 pb-6 rounded-b-[2rem] relative overflow-hidden shadow-xs">
        <div className="max-w-2xl mx-auto flex items-start justify-between">
          <div className="space-y-3 z-10">
            {/* Red Circle Back Button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-[#FF3B30] hover:bg-[#E03126] text-white flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                Add Product
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                Add a new product to Tulsi Mart
              </p>
            </div>
          </div>

          {/* Grocery Illustration Top Right */}
          <div className="w-28 sm:w-36 shrink-0 relative -mr-2 -mt-2 pointer-events-none">
            <img
              src="/grocery_bag_header.jpg"
              alt="Grocery Basket"
              className="w-full h-auto object-contain drop-shadow-md rounded-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/grocery_basket.png';
              }}
            />
          </div>
        </div>
      </div>

      {/* 📄 Form Cards Container */}
      <div className="max-w-2xl mx-auto px-4 mt-2 space-y-4">
        
        {/* CARD 1: Product Images */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-[#00695C] dark:text-teal-300">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Product Images</h2>
          </div>

          {/* Upload Area */}
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-400 bg-[#F4F8FB] dark:bg-slate-800/40 rounded-2xl p-6 text-center transition-colors">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-36 mx-auto rounded-xl object-contain shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Camera className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Upload Product Image
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, JPEG (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* CARD 2: Basic Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          {/* Section Header Badge */}
          <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <ClipboardList className="w-4 h-4" />
            <span>Basic Information</span>
          </div>

          <div className="space-y-3.5">
            {/* Product Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter product name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                  errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 font-medium">{errors.name}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-[#00695C] dark:text-teal-300 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Category
                </button>
              </div>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#00695C] focus:outline-none pr-9 ${
                    errors.category ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {errors.category && <p className="text-[11px] text-rose-500 font-medium">{errors.category}</p>}
            </div>

            {/* Grid: Brand & SKU */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Brand</label>
                <input
                  type="text"
                  placeholder="Enter brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">SKU / Product Code</label>
                <input
                  type="text"
                  placeholder="Enter product code"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Pricing & Stock */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          {/* Section Header Badge */}
          <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Tag className="w-4 h-4" />
            <span>Pricing & Stock</span>
          </div>

          <div className="space-y-3.5">
            {/* Grid 1: Price & Discount */}
            <div className="grid grid-cols-2 gap-3">
              {/* Price */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="w-9 h-full rounded-l-xl border-r border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800 absolute left-0 top-0 bottom-0">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter price"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className={`w-full pl-11 pr-3 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                      errors.price ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.price && <p className="text-[11px] text-rose-500 font-medium">{errors.price}</p>}
              </div>

              {/* Discount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Discount</label>
                <div className="relative flex items-center">
                  <div className="w-9 h-full rounded-l-xl border-r border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-bold bg-slate-50 dark:bg-slate-800 absolute left-0 top-0 bottom-0">
                    %
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Enter %"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                    className="w-full pl-11 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Grid 2: Stock Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              {/* Stock Quantity */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="w-9 h-full rounded-l-xl border-r border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 absolute left-0 top-0 bottom-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Enter quantity"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    className={`w-full pl-11 pr-3 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                      errors.stock_quantity ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.stock_quantity && <p className="text-[11px] text-rose-500 font-medium">{errors.stock_quantity}</p>}
              </div>

              {/* Unit */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsUnitModalOpen(true)}
                    className="text-[11px] font-bold text-[#00695C] dark:text-teal-300 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Unit
                  </button>
                </div>
                <div className="relative flex items-center">
                  <div className="w-9 h-full rounded-l-xl border-r border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 absolute left-0 top-0 bottom-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className={`w-full pl-11 pr-8 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                      errors.unit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                {errors.unit && <p className="text-[11px] text-rose-500 font-medium">{errors.unit}</p>}
              </div>
            </div>

            {/* Minimum Stock Level */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Minimum Stock Level</label>
              <div className="relative flex items-center">
                <div className="w-9 h-full rounded-l-xl border-r border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 absolute left-0 top-0 bottom-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  placeholder="Enter minimum level"
                  value={formData.min_stock_alert}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stock_alert: e.target.value }))}
                  className="w-full pl-11 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Description */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          {/* Section Header Badge */}
          <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <FileText className="w-4 h-4" />
            <span>Description</span>
          </div>

          <div className="space-y-1 relative">
            <div className="relative flex items-start border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#00695C]">
              <div className="w-10 pt-3 flex justify-center text-slate-400 shrink-0 bg-white dark:bg-slate-950">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Enter product description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full pr-3 py-2.5 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
              />
            </div>
            <div className="text-right text-[11px] text-slate-400 font-mono pr-2 pt-1">
              {formData.description.length}/500
            </div>
          </div>
        </div>

      </div>

      {/* 🟢 Sticky Bottom Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 z-40 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-1/2 sm:w-auto px-6 py-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-1/2 sm:w-auto px-8 py-3 bg-[#00695C] hover:bg-[#004D40] text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{submitting ? 'Adding...' : 'Add Product'}</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: ADD NEW CATEGORY */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add New Category"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500">Create a new product category.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Name *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Dry Fruits, Beverages, Bakery"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={savingCategory} className="bg-[#00695C] text-white font-bold">
              {savingCategory ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: ADD NEW UNIT */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title="Add New Unit"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500">Add a custom unit of measurement.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit Name *</label>
            <input
              type="text"
              value={newUnitData.name}
              onChange={(e) => setNewUnitData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Kilogram, Packet, Liter"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Abbreviation *</label>
              <input
                type="text"
                value={newUnitData.short_name}
                onChange={(e) => setNewUnitData(prev => ({ ...prev, short_name: e.target.value }))}
                placeholder="e.g. kg, pkt, l"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Conversion Factor</label>
              <input
                type="number"
                value={newUnitData.conversion_factor}
                onChange={(e) => setNewUnitData(prev => ({ ...prev, conversion_factor: e.target.value }))}
                placeholder="1000"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button variant="outline" onClick={() => setIsUnitModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUnit} disabled={savingUnit} className="bg-[#00695C] text-white font-bold">
              {savingUnit ? 'Saving...' : 'Save Unit'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AddProductPage;
