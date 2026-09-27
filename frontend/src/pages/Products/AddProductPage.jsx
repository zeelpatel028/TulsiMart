import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { inventoryApi, suppliersApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { calculateSellingUnitPrice, getUnitConversionRatio } from '../../utils/unitConversion';
import {
  Package,
  Truck,
  DollarSign,
  Tag,
  Layers,
  ArrowLeft,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Barcode as BarcodeIcon,
  Calendar,
  Sparkles,
  Info,
  Building,
  Check
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
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitData, setNewUnitData] = useState({ name: '', short_name: '', base_unit: 'g', conversion_factor: '1000' });
  const [savingUnit, setSavingUnit] = useState(false);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({ name: '', company_name: '', phone: '', email: '', gstin: '', address: '' });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '', // Product Unit
    selling_unit: '', // Selling Unit
    supplier: '',
    purchase_tax: '18', // 0, 5, 12, 18, 28
    purchase_non_tax_price: '',
    selling_tax: '18',
    selling_non_tax_price: '',
    mrp: '',
    selling_price: '',
    stock_quantity: '25',
    barcode: '',
    low_stock_alert: '10',
    manufacturing_date: '',
    expiry_date: '',
    short_description: '',
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch initial meta dropdowns & next product ID
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
        catList = catRes.value.data?.results || catRes.value.data || [];
        setCategories(catList);
      }

      let unitList = [];
      if (unitRes.status === 'fulfilled') {
        unitList = unitRes.value.data?.results || unitRes.value.data || [];
        setUnits(unitList);
      }

      let suppList = [];
      if (suppRes.status === 'fulfilled') {
        suppList = suppRes.value.data?.results || suppRes.value.data || [];
        setSuppliers(suppList);
      }

      if (nextIdRes.status === 'fulfilled' && nextIdRes.value.data?.next_product_id) {
        setNextProductId(nextIdRes.value.data.next_product_id);
      }

      // Pre-select defaults if available
      const defaultKg = unitList.find(u => u.short_name.toLowerCase() === 'kg') || unitList[0];
      const defaultG = unitList.find(u => u.short_name.toLowerCase() === 'g') || unitList[0];
      
      setFormData(prev => ({
        ...prev,
        category: catList[0]?.id || '',
        unit: defaultKg?.id || '',
        selling_unit: defaultG?.id || defaultKg?.id || '',
        supplier: suppList[0]?.id || ''
      }));

    } catch (err) {
      console.error('Failed to load meta:', err);
      showToast('Error loading initial options', 'error');
    } finally {
      setLoadingMeta(false);
    }
  };

  // Generate random barcode
  const handleGenerateBarcode = () => {
    const randomBarcode = `890${Math.floor(100000000 + Math.random() * 900000000)}`;
    setFormData(prev => ({ ...prev, barcode: randomBarcode }));
  };

  // Calculated values
  const purchaseNonTax = parseFloat(formData.purchase_non_tax_price) || 0;
  const purchaseTaxRate = parseFloat(formData.purchase_tax) || 0;
  const purchaseTaxAmount = (purchaseNonTax * purchaseTaxRate) / 100;
  const purchaseFinalPrice = purchaseNonTax + purchaseTaxAmount;

  const sellingNonTax = parseFloat(formData.selling_non_tax_price) || 0;
  const sellingTaxRate = parseFloat(formData.selling_tax) || 0;
  const sellingTaxAmount = (sellingNonTax * sellingTaxRate) / 100;
  const taxInclusiveSellingPrice = sellingNonTax + sellingTaxAmount;

  // Auto-sync selling_price when non-tax selling price updates, if selling_price not manually customized
  const handleNonTaxSellingChange = (val) => {
    const nonTax = parseFloat(val) || 0;
    const taxRate = parseFloat(formData.selling_tax) || 0;
    const calculatedTaxInc = nonTax + (nonTax * taxRate) / 100;
    setFormData(prev => ({
      ...prev,
      selling_non_tax_price: val,
      selling_price: val ? String(calculatedTaxInc.toFixed(2)) : '',
      mrp: prev.mrp || (val ? String((calculatedTaxInc * 1.15).toFixed(2)) : '')
    }));
  };

  const handleSellingTaxChange = (val) => {
    const taxRate = parseFloat(val) || 0;
    const nonTax = parseFloat(formData.selling_non_tax_price) || 0;
    const calculatedTaxInc = nonTax + (nonTax * taxRate) / 100;
    setFormData(prev => ({
      ...prev,
      selling_tax: val,
      selling_price: nonTax ? String(calculatedTaxInc.toFixed(2)) : prev.selling_price
    }));
  };

  // Unit conversion ratio calculation
  const prodUnitObj = units.find(u => String(u.id) === String(formData.unit));
  const sellUnitObj = units.find(u => String(u.id) === String(formData.selling_unit));
  const conversionRatio = getUnitConversionRatio(prodUnitObj, sellUnitObj);

  // Field validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required.';
    if (!formData.category) newErrors.category = 'Category is required.';
    if (!formData.unit) newErrors.unit = 'Product unit is required.';
    if (!formData.selling_unit) newErrors.selling_unit = 'Selling unit is required.';
    if (!formData.supplier) newErrors.supplier = 'Supplier is required.';

    if (!formData.purchase_non_tax_price || parseFloat(formData.purchase_non_tax_price) < 0) {
      newErrors.purchase_non_tax_price = 'Valid non-tax purchase price is required.';
    }

    const sellingPriceNum = parseFloat(formData.selling_price) || 0;
    const mrpNum = parseFloat(formData.mrp) || 0;

    if (!formData.selling_price || sellingPriceNum <= 0) {
      newErrors.selling_price = 'Valid selling price is required.';
    }

    if (!formData.mrp || mrpNum <= 0) {
      newErrors.mrp = 'Valid MRP is required.';
    } else if (mrpNum > 0 && sellingPriceNum > mrpNum) {
      newErrors.selling_price = `Selling price (₹${sellingPriceNum}) cannot exceed MRP (₹${mrpNum}).`;
    }

    if (!formData.stock_quantity || parseFloat(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = 'Stock quantity cannot be negative.';
    }

    if (formData.manufacturing_date && formData.expiry_date) {
      if (new Date(formData.expiry_date) < new Date(formData.manufacturing_date)) {
        newErrors.expiry_date = 'Expiry date cannot be before manufacturing date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e, addAnother = false) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix validation errors before saving.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setSaveAndAddAnother(addAnother);

      const payload = {
        name: formData.name.trim(),
        sku: nextProductId,
        product_code: nextProductId,
        category: formData.category,
        unit: formData.unit,
        selling_unit: formData.selling_unit,
        supplier: formData.supplier,
        
        purchase_gst_percent: parseFloat(formData.purchase_tax) || 0,
        purchase_non_tax_price: parseFloat(formData.purchase_non_tax_price) || 0,
        purchase_tax_amount: parseFloat(purchaseTaxAmount.toFixed(2)),
        purchase_final_price: parseFloat(purchaseFinalPrice.toFixed(2)),
        cost_price: parseFloat(purchaseFinalPrice.toFixed(2)),

        selling_gst_percent: parseFloat(formData.selling_tax) || 0,
        selling_non_tax_price: parseFloat(formData.selling_non_tax_price) || 0,
        selling_tax_amount: parseFloat(sellingTaxAmount.toFixed(2)),
        selling_tax_price: parseFloat(taxInclusiveSellingPrice.toFixed(2)),
        mrp: parseFloat(formData.mrp) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,

        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        min_stock_alert: parseFloat(formData.low_stock_alert) || 10,
        barcode: formData.barcode.trim() || undefined,
        manufacturing_date: formData.manufacturing_date || null,
        expiry_date: formData.expiry_date || null,
        short_description: formData.short_description.trim() || null,
        description: formData.short_description.trim() || null,
      };

      const res = await inventoryApi.createProduct(payload);
      showToast(`Product "${formData.name}" saved successfully!`, 'success');

      if (addAnother) {
        // Reset form for next product
        const nextIdRes = await inventoryApi.getNextProductId();
        if (nextIdRes.data?.next_product_id) {
          setNextProductId(nextIdRes.data.next_product_id);
        }
        setFormData({
          name: '',
          category: categories[0]?.id || '',
          unit: units[0]?.id || '',
          selling_unit: units[0]?.id || '',
          supplier: suppliers[0]?.id || '',
          purchase_tax: '18',
          purchase_non_tax_price: '',
          selling_tax: '18',
          selling_non_tax_price: '',
          mrp: '',
          selling_price: '',
          stock_quantity: '25',
          barcode: '',
          low_stock_alert: '10',
          manufacturing_date: '',
          expiry_date: '',
          short_description: '',
        });
        setErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/inventory');
      }
    } catch (err) {
      console.error('Failed to save product:', err);
      const backendErr = err.response?.data;
      if (backendErr && typeof backendErr === 'object') {
        const mapped = {};
        Object.keys(backendErr).forEach(k => {
          mapped[k] = Array.isArray(backendErr[k]) ? backendErr[k].join(', ') : backendErr[k];
        });
        setErrors(mapped);
      }
      showToast(err.response?.data?.detail || 'Failed to save product. Check inputs.', 'error');
    } finally {
      setSubmitting(false);
      setSaveAndAddAnother(false);
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
      setFormData(prev => ({ ...prev, unit: created.id, selling_unit: created.id }));
      setNewUnitData({ name: '', short_name: '', base_unit: 'g', conversion_factor: '1000' });
      setIsUnitModalOpen(false);
      showToast(`Unit "${created.name}" added and selected!`, 'success');
    } catch (err) {
      showToast('Failed to add unit', 'error');
    } finally {
      setSavingUnit(false);
    }
  };

  // Add Supplier Handler
  const handleSaveSupplier = async () => {
    if (!newSupplierData.name.trim() || !newSupplierData.phone.trim()) {
      showToast('Supplier Name and Phone are required.', 'warning');
      return;
    }
    try {
      setSavingSupplier(true);
      const res = await suppliersApi.createSupplier(newSupplierData);
      const created = res.data;
      setSuppliers(prev => [...prev.filter(s => s.id !== created.id), created]);
      setFormData(prev => ({ ...prev, supplier: created.id }));
      setNewSupplierData({ name: '', company_name: '', phone: '', email: '', gstin: '', address: '' });
      setIsSupplierModalOpen(false);
      showToast(`Supplier "${created.name}" added and selected!`, 'success');
    } catch (err) {
      showToast('Failed to add supplier', 'error');
    } finally {
      setSavingSupplier(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 font-sans max-w-7xl mx-auto">
      {/* 🟢 Top Header Banner - Matching BillingPage Style */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />

        {/* Banner Grid Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10">
          {/* Left: Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              to="/inventory"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10 hover:scale-105 transition-all"
              title="Back to Stock & Inventory"
            >
              <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Add <span className="text-[#00796b] dark:text-[#80cbc4]">Product</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {nextProductId}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Create a new grocery item with supplier details, tax structure, and billing unit conversions.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start sm:self-center overflow-x-auto no-scrollbar max-w-full pb-0.5">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={submitting}
              className="px-4 py-2 sm:py-2.5 text-xs font-bold rounded-xl bg-teal-50/90 dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#00695C] dark:text-teal-300" />
              <span>{submitting && saveAndAddAnother ? 'Saving...' : 'Save & Add Another'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={submitting}
              className="px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white shadow-md shadow-teal-900/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting && !saveAndAddAnother ? 'Saving Product...' : 'Save Product'}</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        
        {/* SECTION 1: PRODUCT INFORMATION */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F0FAF9] dark:bg-slate-800/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#00695C] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">1. Product Information</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Basic identifier, grocery classification, and selling units</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#00695C] dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 whitespace-nowrap shrink-0 font-mono shadow-2xs">
              Auto ID: {nextProductId}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product ID (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Product ID <span className="text-xs text-slate-400 font-normal">(System Generated)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={nextProductId}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-mono font-bold text-sm cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-extrabold bg-[#00695C] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                  AUTO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Auto-incremented from database. Unique identifier.</p>
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Tata Sampann Unpolished Arhar Dal / Sugar"
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                  errors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 font-semibold">{errors.name}</p>}
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-bold text-[#00695C] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Category
                </button>
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                  errors.category ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-rose-500 font-semibold">{errors.category}</p>}
            </div>

            {/* Product Unit Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Product Unit (Purchase / Stock) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(true)}
                  className="text-xs font-bold text-[#00695C] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Unit
                </button>
              </div>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                  errors.unit ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                <option value="">Select Product Unit</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                ))}
              </select>
              {errors.unit && <p className="text-xs text-rose-500 font-semibold">{errors.unit}</p>}
            </div>

            {/* Selling Unit Dropdown */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selling Unit (Billing / POS) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.selling_unit}
                onChange={(e) => setFormData(prev => ({ ...prev, selling_unit: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                  errors.selling_unit ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                <option value="">Select Selling Unit</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                ))}
              </select>
              {errors.selling_unit && <p className="text-xs text-rose-500 font-semibold">{errors.selling_unit}</p>}

              {/* Conversion Preview Box */}
              {prodUnitObj && sellUnitObj && (
                <div className="mt-2.5 p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#00695C] dark:text-teal-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-[#00695C] dark:text-teal-300">Unit Conversion Logic: </span>
                    1 {prodUnitObj.short_name} = {conversionRatio} {sellUnitObj.short_name}.
                    {conversionRatio !== 1 ? (
                      <span> Selling {sellUnitObj.name} in billing will automatically calculate proportional prices. (e.g. 200 {sellUnitObj.short_name}, 500 {sellUnitObj.short_name}).</span>
                    ) : (
                      <span> Direct 1:1 selling ratio.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* SECTION 2: SUPPLIER INFORMATION */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F0FAF9] dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00695C] text-white flex items-center justify-center font-bold shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Supplier Information</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vendor database record and purchase tax rate</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Supplier Name Searchable Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Supplier Name <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="text-xs font-bold text-[#00695C] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Supplier
                </button>
              </div>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                  errors.supplier ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.company_name ? `(${s.company_name})` : ''} - {s.phone}
                  </option>
                ))}
              </select>
              {errors.supplier && <p className="text-xs text-rose-500 font-semibold">{errors.supplier}</p>}
            </div>

            {/* Supplier Tax Rate Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Supplier Purchase Tax (GST)
              </label>
              <select
                value={formData.purchase_tax}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_tax: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white"
              >
                <option value="0">No Tax / Exempt (0%)</option>
                <option value="0">GST 0%</option>
                <option value="5">GST 5%</option>
                <option value="12">GST 12%</option>
                <option value="18">GST 18%</option>
                <option value="28">GST 28%</option>
              </select>
            </div>
          </div>
        </Card>

        {/* SECTION 3: PURCHASE PRICE */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F0FAF9] dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00695C] text-white flex items-center justify-center font-bold shadow-xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Purchase Price</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Base cost, tax amount, and calculated final purchase price</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Non-Tax Purchase Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Non-Tax Purchase Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_non_tax_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_non_tax_price: e.target.value }))}
                  placeholder="100.00"
                  className={`w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                    errors.purchase_non_tax_price ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.purchase_non_tax_price && <p className="text-xs text-rose-500 font-semibold">{errors.purchase_non_tax_price}</p>}
            </div>

            {/* Calculated Tax Purchase Price Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tax Amount (GST {purchaseTaxRate}%)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="text"
                  readOnly
                  value={purchaseTaxAmount.toFixed(2)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400">Auto calculated: Base × GST%</p>
            </div>

            {/* Final Purchase Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#00695C] dark:text-teal-300">
                Final Purchase Price (Tax-Inclusive)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#00695C] dark:text-teal-400 font-black">₹</span>
                <input
                  type="text"
                  readOnly
                  value={purchaseFinalPrice.toFixed(2)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 rounded-xl text-sm font-black text-[#00695C] dark:text-teal-300 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Non-Tax Price + Tax Amount</p>
            </div>
          </div>
        </Card>

        {/* SECTION 4: SELLING PRICE */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F0FAF9] dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00695C] text-white flex items-center justify-center font-bold shadow-xs">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Selling Price & MRP</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Billing POS selling price, tax rate, and maximum retail price (MRP)</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tax Rate Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selling GST Tax Rate
              </label>
              <select
                value={formData.selling_tax}
                onChange={(e) => handleSellingTaxChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white"
              >
                <option value="0">No Tax (0%)</option>
                <option value="0">GST 0%</option>
                <option value="5">GST 5%</option>
                <option value="12">GST 12%</option>
                <option value="18">GST 18%</option>
                <option value="28">GST 28%</option>
              </select>
            </div>

            {/* Non-Tax Selling Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Non-Tax Selling Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_non_tax_price}
                  onChange={(e) => handleNonTaxSellingChange(e.target.value)}
                  placeholder="120.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white"
                />
              </div>
            </div>

            {/* Tax Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Selling Tax Amount (GST {sellingTaxRate}%)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="text"
                  readOnly
                  value={sellingTaxAmount.toFixed(2)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>

            {/* MRP Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                MRP (Maximum Retail Price) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mrp}
                  onChange={(e) => setFormData(prev => ({ ...prev, mrp: e.target.value }))}
                  placeholder="150.00"
                  className={`w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                    errors.mrp ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.mrp && <p className="text-xs text-rose-500 font-semibold">{errors.mrp}</p>}
            </div>

            {/* Final Selling Price (POS Counter Price) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#00695C] dark:text-teal-300 flex items-center justify-between">
                <span>Final POS Counter Selling Price (₹) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-medium text-slate-400">Used by Billing POS Counter</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#00695C] dark:text-teal-400 font-black">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                  placeholder="141.60"
                  className={`w-full pl-8 pr-3.5 py-2.5 bg-teal-50/50 dark:bg-teal-950/40 border rounded-xl text-sm font-black text-[#00695C] dark:text-teal-300 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                    errors.selling_price ? 'border-rose-500 ring-1 ring-rose-500' : 'border-teal-300 dark:border-teal-800'
                  }`}
                />
              </div>
              {errors.selling_price && <p className="text-xs text-rose-500 font-bold mt-1">{errors.selling_price}</p>}
              {!errors.selling_price && (
                <p className="text-[11px] text-slate-500">
                  Tax-Inclusive Price: ₹{taxInclusiveSellingPrice.toFixed(2)}. Final price must be &le; MRP (₹{formData.mrp || 0}).
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* SECTION 5: OTHER INFORMATION */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F0FAF9] dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00695C] text-white flex items-center justify-center font-bold shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">5. Stock & Expiry Information</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Inventory count, low stock trigger, barcode, and dates</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stock Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                placeholder="e.g. 25 or 25.5"
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                  errors.stock_quantity ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.stock_quantity && <p className="text-xs text-rose-500 font-semibold">{errors.stock_quantity}</p>}
            </div>

            {/* Low Stock Alert */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Low Stock Alert Limit
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.low_stock_alert}
                onChange={(e) => setFormData(prev => ({ ...prev, low_stock_alert: e.target.value }))}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white"
              />
              <p className="text-[11px] text-slate-400">Triggers low stock alert when stock &le; this limit.</p>
            </div>

            {/* Barcode Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Barcode (EAN / UPC)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-xs font-bold text-[#00695C] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto Generate
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="e.g. 890123456789"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white"
                />
                <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Manufacturing Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={formData.manufacturing_date}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturing_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white ${
                  errors.expiry_date ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.expiry_date && <p className="text-xs text-rose-500 font-semibold">{errors.expiry_date}</p>}
            </div>

            {/* Short Description */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Short Description / Note (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Enter additional storage instructions, batch note, or product description..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] focus:outline-none dark:text-white custom-scrollbar-thin"
              />
            </div>
          </div>
        </Card>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory')}
            className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 font-bold"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl bg-teal-50/90 dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#00695C] dark:text-teal-300" />
            <span>{submitting && saveAndAddAnother ? 'Saving Product...' : 'Save & Add Another'}</span>
          </button>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-[#00695C] hover:bg-[#004D40] text-white font-bold px-8 shadow-lg shadow-[#00695C]/30 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting && !saveAndAddAnother ? 'Saving Product...' : 'Save Product'}</span>
          </Button>
        </div>
      </form>

      {/* MODAL 1: ADD NEW CATEGORY */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add New Category"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500">Create a new grocery category. It will immediately appear in the category dropdown.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Name *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Organic Foods, Spices & Herbs"
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
          <p className="text-xs text-slate-500">Add a custom measurement unit and conversion factor relative to base unit.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit Full Name *</label>
            <input
              type="text"
              value={newUnitData.name}
              onChange={(e) => setNewUnitData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Kilogram, Bundle, Carton"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Short Name (Abbreviation) *</label>
              <input
                type="text"
                value={newUnitData.short_name}
                onChange={(e) => setNewUnitData(prev => ({ ...prev, short_name: e.target.value }))}
                placeholder="e.g. kg, bdl, ctn"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Conversion Factor</label>
              <input
                type="number"
                step="0.001"
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

      {/* MODAL 3: ADD NEW SUPPLIER */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Add New Supplier"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500">Create a new vendor profile in the supplier database.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Person Name *</label>
              <input
                type="text"
                value={newSupplierData.name}
                onChange={(e) => setNewSupplierData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company Name</label>
              <input
                type="text"
                value={newSupplierData.company_name}
                onChange={(e) => setNewSupplierData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="e.g. Tata Consumer Products Ltd"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number *</label>
              <input
                type="text"
                value={newSupplierData.phone}
                onChange={(e) => setNewSupplierData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GSTIN Number</label>
              <input
                type="text"
                value={newSupplierData.gstin}
                onChange={(e) => setNewSupplierData(prev => ({ ...prev, gstin: e.target.value }))}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00695C] dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button variant="outline" onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSupplier} disabled={savingSupplier} className="bg-[#00695C] text-white font-bold">
              {savingSupplier ? 'Saving...' : 'Save Supplier'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddProductPage;
