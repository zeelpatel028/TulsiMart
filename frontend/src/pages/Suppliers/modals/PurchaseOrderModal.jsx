import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { QuickEditProductModal } from '../../../components/common/QuickEditProductModal';
import { 
  Plus, 
  Trash2, 
  ShoppingCart, 
  CheckCircle2, 
  Package, 
  Building2, 
  Calendar, 
  FileText,
  Filter,
  AlertCircle,
  Search,
  ChevronDown,
  Minus,
  PackageOpen,
  Receipt,
  Edit3,
  IndianRupee
} from 'lucide-react';

// Custom Searchable Dropdown Component
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option',
  icon: Icon,
  disabled = false,
  required = false,
  error = false,
  errorMessage = '',
  emptyMessage = 'No matching options found'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const selectedOption = useMemo(() => {
    return options.find(opt => String(opt.value) === String(value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => 
      opt.label?.toLowerCase().includes(query) ||
      opt.sublabel?.toLowerCase().includes(query) ||
      opt.badge?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border flex items-center justify-between transition-all outline-none cursor-pointer ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
            : error
            ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/30'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-[#00796b] dark:border-teal-400 ring-2 ring-[#00796b]/20 text-slate-900 dark:text-white shadow-xs'
            : 'bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {Icon && (
            <div className={`p-1 rounded-lg ${value ? 'bg-teal-50 text-[#00796b] dark:bg-teal-950 dark:text-teal-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
            </div>
          )}
          {selectedOption ? (
            <div className="truncate text-left">
              <span className="font-bold text-slate-900 dark:text-white block truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal truncate">
              {placeholder} {required && <span className="text-rose-500">*</span>}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#00796b]' : ''}`} />
      </button>

      {error && errorMessage && (
        <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errorMessage}
        </p>
      )}

      {isOpen && (
        <div className="absolute z-[9999] left-0 min-w-full sm:min-w-[340px] md:min-w-[380px] mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter options..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00796b]/30 text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-0.5 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-1 space-y-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                    String(opt.value) === String(value)
                      ? 'bg-teal-50 dark:bg-teal-950/80 text-[#00796b] dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800/80 shadow-2xs'
                      : 'hover:bg-slate-100/90 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-white leading-snug break-words">
                      {opt.label}
                    </div>
                    {opt.sublabel && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-tight">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                  {opt.badge && (
                    <span className="shrink-0 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const PurchaseOrderModal = ({
  isOpen,
  onClose,
  poForm,
  setPoForm,
  suppliers = [],
  products = [],
  calculatePOTotals,
  onSavePO
}) => {
  const [showAllProductsOverride, setShowAllProductsOverride] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

  const handleOpenQuickEditProduct = (prod) => {
    setEditingProduct(prod);
    setIsQuickEditOpen(true);
  };

  const handleProductUpdated = (updatedProd) => {
    if (!updatedProd) return;
    const updatedItems = poForm.items.map(it => {
      if (String(it.product) === String(updatedProd.id)) {
        return {
          ...it,
          product_name: updatedProd.name,
          unit_cost: updatedProd.cost_price || updatedProd.purchase_final_price || it.unit_cost
        };
      }
      return it;
    });
    setPoForm(prev => ({ ...prev, items: updatedItems }));
  };

  // Selected supplier details
  const selectedSupplier = useMemo(() => {
    if (!poForm?.supplier) return null;
    return suppliers.find(s => String(s.id) === String(poForm.supplier) || s.name === poForm.supplier);
  }, [suppliers, poForm?.supplier]);

  // Vendor-specific products strict filter
  const vendorProducts = useMemo(() => {
    if (!poForm?.supplier) return [];

    const suppId = Number(poForm.supplier);
    const suppName = selectedSupplier?.name?.toLowerCase();
    const suppCompany = selectedSupplier?.company_name?.toLowerCase();
    const suppCategory = selectedSupplier?.category?.toLowerCase();

    return products.filter(p => {
      // 1. Direct supplier ID match
      if (p.supplier_id && (Number(p.supplier_id) === suppId || String(p.supplier_id) === String(poForm.supplier))) {
        return true;
      }
      // 2. Direct supplier object or name match
      if (p.supplier) {
        if (typeof p.supplier === 'object' && (p.supplier.id === suppId || p.supplier.name === selectedSupplier?.name || p.supplier.company_name === selectedSupplier?.company_name)) {
          return true;
        }
        if (typeof p.supplier === 'string' && ((suppName && p.supplier.toLowerCase().includes(suppName)) || (suppCompany && p.supplier.toLowerCase().includes(suppCompany)))) {
          return true;
        }
      }
      // 3. Wholesale category match
      if (suppCategory && p.category) {
        const catName = (p.category && typeof p.category === 'object') ? p.category.name : p.category;
        if (typeof catName === 'string' && (
          catName.toLowerCase() === suppCategory ||
          catName.toLowerCase().includes(suppCategory) ||
          suppCategory.includes(catName.toLowerCase())
        )) {
          return true;
        }
      }
      return false;
    });
  }, [products, poForm?.supplier, selectedSupplier]);

  // Available products for selection
  const availableProducts = useMemo(() => {
    if (!poForm?.supplier) return [];
    if (showAllProductsOverride) return products;
    if (vendorProducts.length > 0) return vendorProducts;
    return products;
  }, [products, vendorProducts, poForm?.supplier, showAllProductsOverride]);

  const hasSpecificVendorProducts = poForm?.supplier && vendorProducts.length > 0;

  // Options formatted for SearchableSelect
  const supplierOptions = useMemo(() => {
    return suppliers.map(s => ({
      value: s.id,
      label: s.company_name || s.name,
      sublabel: s.category ? `Category: ${s.category} | Terms: ${s.payment_terms || 'Net 15'}` : `Terms: ${s.payment_terms || 'Net 15'}`,
      badge: s.category || 'Vendor'
    }));
  }, [suppliers]);

  const productOptions = useMemo(() => {
    return availableProducts.map(p => ({
      value: p.id,
      label: p.name,
      sublabel: `Stock: ${p.stock_quantity || 0} ${p.unit?.short_name || 'unit'} | Cost: ₹${p.cost_price || p.purchase_final_price || 0}`,
      badge: p.sku ? `SKU: ${p.sku}` : (p.category?.name || (typeof p.category === 'string' ? p.category : 'General'))
    }));
  }, [availableProducts]);

  // Total calculation
  const totalValue = useMemo(() => {
    if (!poForm?.items) return 0;
    if (typeof calculatePOTotals === 'function') {
      const totals = calculatePOTotals(poForm.items, poForm.gst_mode, poForm.tax_type);
      if (totals && (totals.grandTotal !== undefined || totals.subtotal !== undefined)) {
        return totals.grandTotal !== undefined ? totals.grandTotal : totals.subtotal;
      }
    }
    return poForm.items.reduce((acc, item) => {
      const qty = parseFloat(item.quantity || 0);
      const cost = parseFloat(item.unit_cost || 0);
      return acc + (qty * cost);
    }, 0);
  }, [poForm?.items, poForm?.gst_mode, poForm?.tax_type, calculatePOTotals]);

  // Form validity check
  const isFormValid = useMemo(() => {
    if (!poForm?.supplier || !poForm?.po_number || !poForm?.items || poForm.items.length === 0) return false;
    return poForm.items.every(it => it.product && Number(it.quantity) > 0);
  }, [poForm]);

  if (!isOpen) return null;

  const handleProductSelect = (idx, productIdStr) => {
    const selectedProd = products.find(p => String(p.id) === String(productIdStr));
    const updatedItems = [...poForm.items];
    updatedItems[idx] = {
      ...updatedItems[idx],
      product: productIdStr,
      product_name: selectedProd ? selectedProd.name : '',
      unit_cost: selectedProd ? (selectedProd.cost_price || selectedProd.purchase_final_price || selectedProd.price || 0) : 0
    };
    setPoForm({ ...poForm, items: updatedItems });
  };

  const handleQtyChange = (idx, val) => {
    const numericVal = Math.max(1, parseInt(val || 1, 10));
    const updatedItems = [...poForm.items];
    updatedItems[idx].quantity = numericVal;
    setPoForm({ ...poForm, items: updatedItems });
  };

  const handleCostChange = (idx, val) => {
    const numericVal = Math.max(0, parseFloat(val || 0));
    const updatedItems = [...poForm.items];
    updatedItems[idx].unit_cost = numericVal;
    setPoForm({ ...poForm, items: updatedItems });
  };

  const handleAddLine = () => {
    if (!poForm.supplier) {
      setShowValidation(true);
      return;
    }
    setPoForm(prev => ({
      ...prev,
      items: [...prev.items, { product: '', product_name: '', quantity: 10, unit_cost: 0, discount_rate: 0, tax_rate: 0 }]
    }));
  };

  const handleRemoveLine = (idx) => {
    if (poForm.items.length <= 1) return;
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    setShowValidation(true);
    if (isFormValid) {
      onSavePO(e);
    }
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]} - ${parts[1]} - ${parts[0]}`;
      }
    } catch (e) {
      return dateStr;
    }
    return dateStr;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title={
        <div className="flex items-center gap-3 text-left font-sans">
          <div className="w-10 h-10 rounded-xl bg-[#00796b] dark:bg-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Purchase Product
              </h2>
              <span className="text-xs font-bold text-[#00796b] dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-900/40">
                (Create PO)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
              Select vendor to filter vendor products, set quantities and create your purchase order.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full font-sans gap-3">
          <div className="text-left min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total PO Value</span>
            <span className="font-black text-[#00796b] dark:text-teal-400 text-lg sm:text-xl font-mono block truncate">
              ₹{Number(totalValue || poForm.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="primary" 
              onClick={handleFormSubmit}
              disabled={showValidation && !isFormValid}
              className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-[#00796b] hover:bg-[#005b50] active:scale-98 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all ${
                !isFormValid ? 'opacity-90' : ''
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Purchase Order</span>
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-5 font-sans text-slate-800 dark:text-slate-100 pb-1">
        
        {/* PURCHASE ORDER DETAILS CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#00796b] dark:text-teal-400" />
              Purchase Order Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PO Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                PO Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={poForm.po_number || ''}
                  onChange={(e) => setPoForm({ ...poForm, po_number: e.target.value })}
                  placeholder="e.g. PO-2026-0001"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold bg-slate-50/50 dark:bg-slate-900/60 border ${
                    showValidation && !poForm.po_number
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20'
                  } rounded-xl outline-none text-slate-900 dark:text-white transition-all`}
                />
              </div>
              {showValidation && !poForm.po_number && (
                <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> PO number is required
                </p>
              )}
            </div>

            {/* Select Vendor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                Select Vendor <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                icon={Building2}
                placeholder="-- Choose Vendor --"
                options={supplierOptions}
                value={poForm.supplier}
                onChange={(val) => {
                  setPoForm({ ...poForm, supplier: val });
                  setShowAllProductsOverride(false);
                }}
                required
                error={showValidation && !poForm.supplier}
                errorMessage="Vendor selection is required"
                emptyMessage="No suppliers found"
              />
            </div>

            {/* Expected Delivery */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                Expected Delivery
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={poForm.expected_delivery || ''}
                  onChange={(e) => setPoForm({ ...poForm, expected_delivery: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 outline-none text-slate-900 dark:text-white transition-all cursor-pointer"
                />
              </div>
              {poForm.expected_delivery && (
                <p className="text-[10px] font-semibold text-slate-400 mt-1">
                  Format: {formatDateForDisplay(poForm.expected_delivery)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCTS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Package className="w-4.5 h-4.5 text-[#00796b] dark:text-teal-400" />
                Products & Quantities
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add products from the selected vendor and specify quantities.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddLine}
              className={`border-teal-200 dark:border-slate-700 text-[#00796b] dark:text-teal-400 font-bold rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs transition-all ${
                !poForm.supplier ? 'opacity-80' : ''
              }`}
            >
              + Add Product
            </Button>
          </div>

          {/* Inline Warning state if no vendor is selected */}
          {!poForm.supplier ? (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Select a vendor to view available products</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-3 bg-teal-50/60 dark:bg-slate-800/80 rounded-2xl border border-teal-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-[#00796b] dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {hasSpecificVendorProducts && !showAllProductsOverride
                    ? `Showing ONLY products for ${selectedSupplier?.company_name || selectedSupplier?.name} (${availableProducts.length} items)`
                    : `Showing catalog (${availableProducts.length} items)`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAllProductsOverride(!showAllProductsOverride)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-teal-200 dark:border-slate-700 text-[#00796b] dark:text-teal-400 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 transition-all shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>{showAllProductsOverride ? 'Show Only Vendor Products' : 'Show All Catalog Products'}</span>
              </button>
            </div>
          )}

          {/* Product Cards List */}
          {poForm.items.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <PackageOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No products added to this purchase order yet.</p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={Plus}
                onClick={handleAddLine}
                className="text-[#00796b] border-teal-200 font-bold rounded-xl"
              >
                + Add Product
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {poForm.items.map((item, idx) => {
                const selectedProd = products.find(p => String(p.id) === String(item.product));
                const lineTotal = (parseFloat(item.quantity || 0)) * (parseFloat(item.unit_cost || 0));

                return (
                  <div
                    key={idx}
                    style={{ zIndex: 100 - idx }}
                    className="relative p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5 hover:border-teal-300 dark:hover:border-teal-700/60 transition-all"
                  >
                    {/* Horizontal layout on desktop, stacked on mobile */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      
                      {/* Product Selector */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 md:hidden">
                          Product
                        </label>
                        <SearchableSelect
                          icon={Package}
                          placeholder={poForm.supplier ? "Select product" : "Select vendor first"}
                          disabled={!poForm.supplier}
                          options={productOptions}
                          value={item.product}
                          onChange={(val) => handleProductSelect(idx, val)}
                          required
                          error={showValidation && !item.product}
                          errorMessage="Please select a product"
                          emptyMessage="No available products"
                        />
                      </div>

                      {/* Numeric Controls Row */}
                      <div className="grid grid-cols-2 md:flex items-center gap-3 shrink-0">
                        
                        {/* Quantity Stepper */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                            Qty
                          </label>
                          <div className="flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, Math.max(1, (parseInt(item.quantity || 1, 10) - 1)))}
                              disabled={Number(item.quantity || 1) <= 1}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(idx, e.target.value)}
                              className="w-12 text-center text-xs font-mono font-black bg-transparent outline-none text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, (parseInt(item.quantity || 0, 10) + 1))}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Unit Cost */}
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                            Unit Cost
                          </label>
                          <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 px-2.5 py-1.5">
                            <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_cost}
                              onChange={(e) => handleCostChange(idx, e.target.value)}
                              className="w-20 text-xs font-mono font-bold bg-transparent outline-none text-right text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="col-span-2 md:col-span-1 md:w-28 text-right md:pt-4 flex md:block items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider md:hidden">
                            Line Total:
                          </span>
                          <span className="text-sm font-black font-mono text-[#00796b] dark:text-teal-400 block whitespace-nowrap">
                            ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Delete Button */}
                        <div className="md:pt-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={poForm.items.length <= 1}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete product line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* Compact Selected Product Specs & Quick Update Bar */}
                    {selectedProd && (() => {
                      const stock = parseFloat(selectedProd.stock_quantity || 0);
                      const minStock = parseFloat(selectedProd.min_stock_alert ?? 10);
                      const costP = parseFloat(selectedProd.cost_price || selectedProd.purchase_final_price || item.unit_cost || 0);
                      const sellP = parseFloat(selectedProd.selling_price || 0);
                      const marginP = sellP > 0 ? (((sellP - costP) / sellP) * 100).toFixed(1) : 0;
                      const unitName = selectedProd.unit?.short_name || selectedProd.unit_name || 'unit';

                      const stockBadgeClass = stock <= 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                        : stock <= minStock
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';

                      const stockStatusText = stock <= 0 ? 'Out of Stock' : stock <= minStock ? 'Low Stock' : 'In Stock';

                      return (
                        <div className="mt-2 px-3 py-1.5 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${stockBadgeClass}`}>
                              <Package className="w-3 h-3" />
                              <span>{stockStatusText}: {stock} {unitName}</span>
                            </span>

                            <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                              Cat: <strong className="text-slate-900 dark:text-white font-bold">{selectedProd.category?.name || (typeof selectedProd.category === 'string' ? selectedProd.category : 'General')}</strong>
                            </span>

                            {marginP > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-[10px]">
                                {marginP}% Margin
                              </span>
                            )}

                            {selectedProd.sku && (
                              <span className="font-mono text-slate-400 text-[10px] hidden sm:inline">
                                SKU: {selectedProd.sku}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenQuickEditProduct(selectedProd)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 text-[#00796b] dark:text-teal-300 font-extrabold text-[11px] rounded-lg border border-teal-200 dark:border-teal-800 shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
                          >
                            <Edit3 className="w-3 h-3 text-[#00796b]" />
                            <span>Edit Product</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EXECUTIVE PURCHASE ORDER SUMMARY CARD */}
        <div className="bg-gradient-to-r from-teal-50/80 via-slate-50 to-emerald-50/60 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border border-teal-100/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="w-11 h-11 rounded-2xl bg-[#00796b] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-900/10 shrink-0">
                <Receipt className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Purchase Order Summary
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                    <Package className="w-3 h-3 text-[#00796b]" />
                    {poForm.items.length} Product Line(s)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                    INR (₹)
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto text-center sm:text-right bg-white dark:bg-slate-900 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-teal-100/80 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                Total PO Value
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#00796b] dark:text-teal-400 block tracking-tight">
                ₹{Number(totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

          </div>
        </div>

      </form>

      {/* QUICK EDIT PRODUCT MODAL */}
      <QuickEditProductModal
        isOpen={isQuickEditOpen}
        onClose={() => setIsQuickEditOpen(false)}
        product={editingProduct}
        onProductUpdated={handleProductUpdated}
      />
    </Modal>
  );
};

export default PurchaseOrderModal;

