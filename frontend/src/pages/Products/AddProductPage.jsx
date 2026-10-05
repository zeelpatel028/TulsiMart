import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { inventoryApi, suppliersApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { useNotification } from '../../context/NotificationContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { getUnitConversionRatio } from '../../utils/unitConversion';
import {
  ArrowLeft,
  Package,
  Truck,
  DollarSign,
  Tag,
  Layers,
  Plus,
  Save,
  Sparkles,
  Info,
  ChevronDown,
  ClipboardList,
  Barcode as BarcodeIcon,
  FileText
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
    brand: '',
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

      if (nextIdRes.status === 'fulfilled' && nextIdRes.value.data?.next_product_id) {
        setNextProductId(nextIdRes.value.data.next_product_id);
      }

      // Pre-select defaults if available
      const defaultKg = Array.isArray(unitList) ? (unitList.find(u => u?.short_name && u.short_name.toLowerCase() === 'kg') || unitList[0]) : null;
      const defaultG = Array.isArray(unitList) ? (unitList.find(u => u?.short_name && u.short_name.toLowerCase() === 'g') || unitList[0]) : null;
      
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

  // Auto-sync selling_price when non-tax selling price updates
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
  const unitsList = Array.isArray(units) ? units : [];
  const prodUnitObj = unitsList.find(u => u && String(u.id) === String(formData.unit));
  const sellUnitObj = unitsList.find(u => u && String(u.id) === String(formData.selling_unit));
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
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix validation errors before saving.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || undefined,
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

      await inventoryApi.createProduct(payload);
      showToast(`Product "${formData.name}" saved successfully!`, 'success');
      navigate('/inventory');
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
    <div className="space-y-6 font-sans overscroll-y-contain overscroll-contain">
      
      {/* 💻 DESKTOP TOP HEADER BANNER (Shown on Desktop lg: screens) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10 max-w-7xl mx-auto">
          {/* Left: Icon & Title with Status Badge */}
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/inventory"
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10 hover:scale-105 transition-all"
              title="Back to Stock & Inventory"
            >
              <Package className="w-7 h-7 text-white" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Add <span className="text-[#00796b] dark:text-[#80cbc4]">Product</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {nextProductId}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Create a new grocery item with supplier details, tax structure, and billing unit conversions.
              </p>
            </div>
          </div>

          {/* Right Desktop Action Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white shadow-md shadow-teal-900/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Product...' : 'Save Product'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE / TABLET COMPACT PASTEL MINT HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden">
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

        {/* SVG Decorative Bottom-Right Mound Curve under Basket */}
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

        {/* Decorative Floating Mint Dots/Leaves on Right */}
        <div className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-[#83D9CC] opacity-60 pointer-events-none" />
        <div className="absolute bottom-4 right-20 w-2 h-2 rounded-full bg-[#83D9CC] opacity-50 pointer-events-none" />

        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            
            {/* 1. Pure White Circular Back Button with Dark Teal Arrow */}
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/inventory');
                }
              }}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-md shadow-teal-900/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6]" />
            </button>

            {/* 2. Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Add <span className="text-[#00695C] dark:text-[#4DB6AC]">Product</span>
              </h1>

              {/* Subtitle */}
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Add a new product to Tulsi Mart catalog
              </p>
            </div>
          </div>

          {/* 3. Right-side Grocery Items Cart */}
          <div className="w-18 sm:w-22 shrink-0 relative pointer-events-none -mr-1">
            <img
              src="/grocery_items_cart.jpg"
              alt="Grocery Items Cart"
              className="w-full h-auto object-contain drop-shadow-md rounded-xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/grocery_bag_transparent.png';
              }}
            />
          </div>
        </div>
      </div>

      {/* 📄 Form Container */}
      <form onSubmit={(e) => handleSubmit(e)} className="max-w-3xl lg:max-w-7xl mx-auto px-4 lg:px-0 mt-3 lg:mt-0 space-y-6 pb-20 lg:pb-12">
        
        {/* CARD 1: Basic Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3.5 py-1.5 rounded-xl text-xs font-bold">
              <ClipboardList className="w-4 h-4" />
              <span>1. Basic Information</span>
            </div>
            
            {/* Show Auto ID badge on Desktop */}
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-[#00695C] dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 font-mono">
              Auto ID: {nextProductId}
            </span>
          </div>

          <div className="space-y-4">
            {/* Product ID & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Product ID (System Generated)</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={nextProductId}
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-extrabold bg-[#00695C] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                    AUTO
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter product name (e.g. Tata Sampann Arhar Dal)"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                    errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500 font-medium">{errors.name}</p>}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-bold text-[#00695C] dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Category
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

            {/* Brand & SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Brand</label>
                <input
                  type="text"
                  placeholder="Enter brand"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">SKU / Product Code</label>
                <input
                  type="text"
                  placeholder="Enter product code"
                  value={nextProductId}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>

            {/* Units: Product Unit & Selling Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Product Unit (Stock) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsUnitModalOpen(true)}
                    className="text-xs font-bold text-[#00695C] dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Unit
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#00695C] focus:outline-none pr-9 ${
                      errors.unit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select Product Unit</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                {errors.unit && <p className="text-[11px] text-rose-500 font-medium">{errors.unit}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Selling Unit (POS Billing) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.selling_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, selling_unit: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#00695C] focus:outline-none pr-9 ${
                      errors.selling_unit ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select Selling Unit</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                {errors.selling_unit && <p className="text-[11px] text-rose-500 font-medium">{errors.selling_unit}</p>}
              </div>
            </div>

            {/* Conversion Ratio Preview Box */}
            {prodUnitObj && sellUnitObj && (
              <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Info className="w-4 h-4 text-[#00695C] dark:text-teal-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#00695C] dark:text-teal-300">Unit Ratio: </span>
                  1 {prodUnitObj.short_name} = {conversionRatio} {sellUnitObj.short_name}.
                  {conversionRatio !== 1 ? (
                    <span> Selling in {sellUnitObj.name} will auto-calculate fractional billing amounts.</span>
                  ) : (
                    <span> Standard 1:1 unit ratio.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: Supplier Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Truck className="w-4 h-4" />
            <span>2. Supplier Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Supplier Name <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="text-xs font-bold text-[#00695C] dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Supplier
                </button>
              </div>
              <div className="relative">
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#00695C] focus:outline-none pr-9 ${
                    errors.supplier ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.company_name ? `(${s.company_name})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {errors.supplier && <p className="text-[11px] text-rose-500 font-medium">{errors.supplier}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Supplier Purchase Tax (GST)</label>
              <div className="relative">
                <select
                  value={formData.purchase_tax}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_tax: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#00695C] focus:outline-none pr-9"
                >
                  <option value="0">No Tax (0%)</option>
                  <option value="5">GST 5%</option>
                  <option value="12">GST 12%</option>
                  <option value="18">GST 18%</option>
                  <option value="28">GST 28%</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Purchase Price */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <DollarSign className="w-4 h-4" />
            <span>3. Purchase Price</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Non-Tax Purchase Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={formData.purchase_non_tax_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_non_tax_price: e.target.value }))}
                  className={`w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                    errors.purchase_non_tax_price ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.purchase_non_tax_price && <p className="text-[11px] text-rose-500 font-medium">{errors.purchase_non_tax_price}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tax Amount (GST {purchaseTaxRate}%)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="text"
                  readOnly
                  value={purchaseTaxAmount.toFixed(2)}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#00695C] dark:text-teal-300">
                Final Purchase Price
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#00695C] dark:text-teal-400 font-black">₹</span>
                <input
                  type="text"
                  readOnly
                  value={purchaseFinalPrice.toFixed(2)}
                  className="w-full pl-8 pr-3 py-2.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 rounded-xl text-sm font-black text-[#00695C] dark:text-teal-300 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: Selling Price & MRP */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Tag className="w-4 h-4" />
            <span>4. Selling Price & MRP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Selling GST Rate</label>
              <div className="relative">
                <select
                  value={formData.selling_tax}
                  onChange={(e) => handleSellingTaxChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-[#00695C] focus:outline-none pr-9"
                >
                  <option value="0">No Tax (0%)</option>
                  <option value="5">GST 5%</option>
                  <option value="12">GST 12%</option>
                  <option value="18">GST 18%</option>
                  <option value="28">GST 28%</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Non-Tax Selling Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="120.00"
                  value={formData.selling_non_tax_price}
                  onChange={(e) => handleNonTaxSellingChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                MRP (Max Retail Price) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="150.00"
                  value={formData.mrp}
                  onChange={(e) => setFormData(prev => ({ ...prev, mrp: e.target.value }))}
                  className={`w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                    errors.mrp ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.mrp && <p className="text-[11px] text-rose-500 font-medium">{errors.mrp}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-bold text-[#00695C] dark:text-teal-300 flex items-center justify-between">
                <span>Final POS Counter Selling Price (₹) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-medium text-slate-400">Used at billing counter</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#00695C] dark:text-teal-400 font-black">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="141.60"
                  value={formData.selling_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                  className={`w-full pl-8 pr-3 py-2.5 bg-teal-50/50 dark:bg-teal-950/40 border rounded-xl text-sm font-black text-[#00695C] dark:text-teal-300 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                    errors.selling_price ? 'border-rose-500' : 'border-teal-300 dark:border-teal-800'
                  }`}
                />
              </div>
              {errors.selling_price && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.selling_price}</p>}
            </div>
          </div>
        </div>

        {/* CARD 5: Stock & Expiry Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xs border border-teal-100/60 dark:border-slate-800 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#DDF3ED] dark:bg-teal-950/80 text-[#00695C] dark:text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Layers className="w-4 h-4" />
            <span>5. Stock & Expiry Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="e.g. 25"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                  errors.stock_quantity ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.stock_quantity && <p className="text-[11px] text-rose-500 font-medium">{errors.stock_quantity}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Low Stock Alert Limit</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="10"
                value={formData.low_stock_alert}
                onChange={(e) => setFormData(prev => ({ ...prev, low_stock_alert: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Barcode (EAN/UPC)</label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-xs font-bold text-[#00695C] dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 890123456789"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#00695C] focus:outline-none"
                />
                <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Manufacturing Date</label>
              <input
                type="date"
                value={formData.manufacturing_date}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturing_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00695C] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Expiry Date</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00695C] focus:outline-none ${
                  errors.expiry_date ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.expiry_date && <p className="text-[11px] text-rose-500 font-medium">{errors.expiry_date}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Short Description / Note (Optional)</label>
              <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#00695C]">
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Enter product storage instructions, batch note, or details..."
                  value={formData.short_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  className="w-full p-3 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
                />
              </div>
              <div className="text-right text-[11px] text-slate-400 font-mono pr-2 pt-0.5">
                {formData.short_description.length}/500
              </div>
            </div>
          </div>
        </div>

        {/* 💻 DESKTOP BOTTOM ACTION BUTTONS (Shown on Desktop lg: screens) */}
        <div className="hidden lg:flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory')}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 font-bold px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#00695C] hover:bg-[#004D40] text-white font-bold px-8 shadow-lg shadow-[#00695C]/30 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Product...' : 'Save Product'}</span>
          </Button>
        </div>

        {/* 📱 MOBILE / TABLET STICKY BOTTOM ACTION FOOTER (Shown on Mobile < lg screens) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 z-40 shadow-2xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/inventory');
                }
              }}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm transition-all active:scale-98 cursor-pointer text-center flex items-center justify-center"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="flex-[1.4] py-3.5 px-6 bg-[#00695C] hover:bg-[#004D40] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#00695C]/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer border border-teal-500/20"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{submitting ? 'Saving Product...' : 'Save Product'}</span>
            </button>
          </div>
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
