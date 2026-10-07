import React, { useState, useMemo } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
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
  Layers,
  AlertCircle
} from 'lucide-react';

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
  if (!isOpen) return null;

  const [showAllProductsOverride, setShowAllProductsOverride] = useState(false);

  // Selected supplier details
  const selectedSupplier = useMemo(() => {
    if (!poForm.supplier) return null;
    return suppliers.find(s => String(s.id) === String(poForm.supplier) || s.name === poForm.supplier);
  }, [suppliers, poForm.supplier]);

  // Vendor-specific products strict filter
  const vendorProducts = useMemo(() => {
    if (!poForm.supplier) return [];

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
        const catName = typeof p.category === 'object' ? p.category.name : p.category;
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
  }, [products, suppliers, poForm.supplier, selectedSupplier]);

  // Displayed products for dropdown selection
  const availableProducts = useMemo(() => {
    if (!poForm.supplier) return []; // Require selecting vendor first

    if (showAllProductsOverride) {
      return products;
    }

    // If vendor has linked products, show ONLY vendor products!
    if (vendorProducts.length > 0) {
      return vendorProducts;
    }

    // Fallback: If 0 products linked specifically to vendor, return all products so user isn't stuck
    return products;
  }, [products, vendorProducts, poForm.supplier, showAllProductsOverride]);

  const hasSpecificVendorProducts = poForm.supplier && vendorProducts.length > 0;

  // Total order value calculation
  const totalValue = poForm.items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity || 0);
    const cost = parseFloat(item.unit_cost || 0);
    return acc + (qty * cost);
  }, 0);

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
    const updatedItems = [...poForm.items];
    updatedItems[idx].quantity = val;
    setPoForm({ ...poForm, items: updatedItems });
  };

  const handleCostChange = (idx, val) => {
    const updatedItems = [...poForm.items];
    updatedItems[idx].unit_cost = val;
    setPoForm({ ...poForm, items: updatedItems });
  };

  const handleAddLine = () => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title={
        <div className="flex items-center gap-3 text-left font-sans">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-900/20 shrink-0">
            <ShoppingCart className="w-5.5 h-5.5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
              Purchase Product <span className="text-[#00796b] dark:text-teal-400">(Create PO)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Select vendor to filter vendor products, set quantities, and place purchase order
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full font-sans gap-3">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total PO Value</span>
            <span className="font-black text-[#00796b] dark:text-teal-400 text-xl font-mono block">
              ₹{Number(totalValue || poForm.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={onSavePO}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Create PO</span>
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSavePO(e); }} className="space-y-4 font-sans text-slate-800 dark:text-slate-100 pb-1">
        
        {/* Top Header Controls Banner */}
        <div className="bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-teal-50/80 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/80 p-4 rounded-2xl border border-teal-100 dark:border-slate-700/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* PO Number */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00796b]" /> PO Number *
              </label>
              <input
                type="text"
                required
                value={poForm.po_number}
                onChange={(e) => setPoForm({ ...poForm, po_number: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Vendor Selector */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00796b]" /> Select Vendor *
              </label>
              <select
                required
                value={poForm.supplier}
                onChange={(e) => {
                  setPoForm({ ...poForm, supplier: e.target.value });
                  setShowAllProductsOverride(false);
                }}
                className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">-- Choose Vendor --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.company_name || s.name} {s.category ? `(${s.category})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Delivery */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00796b]" /> Expected Delivery
              </label>
              <input
                type="date"
                value={poForm.expected_delivery}
                onChange={(e) => setPoForm({ ...poForm, expected_delivery: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b]/30 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Active Vendor Banner Badge */}
          {selectedSupplier && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-teal-200/80 dark:border-teal-900/50 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800 dark:text-white truncate">
                  Selected Vendor: <span className="text-[#00796b] dark:text-teal-400 font-black">{selectedSupplier.company_name || selectedSupplier.name}</span>
                </span>
                {selectedSupplier.category && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-extrabold bg-teal-50 dark:bg-teal-950 text-[#00695c] dark:text-teal-300 rounded-md border border-teal-200/60">
                    {selectedSupplier.category}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-500 shrink-0">
                Terms: <span className="text-slate-800 dark:text-slate-200">{selectedSupplier.payment_terms || 'Net 15'}</span>
              </div>
            </div>
          )}
        </div>

        {/* PO Items Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#00796b]" />
                Products & Quantities
              </label>

              {/* Vendor Product Filter Indicator */}
              {poForm.supplier ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-[#00695c] dark:bg-teal-950 dark:text-teal-300 border border-teal-200">
                    <Filter className="w-3 h-3 text-[#00796b]" />
                    {hasSpecificVendorProducts && !showAllProductsOverride
                      ? `Showing ONLY products for ${selectedSupplier?.company_name || selectedSupplier?.name} (${availableProducts.length} items)`
                      : `Showing catalog (${availableProducts.length} items)`}
                  </span>

                  {/* Toggle button to switch view if needed */}
                  <button
                    type="button"
                    onClick={() => setShowAllProductsOverride(!showAllProductsOverride)}
                    className="text-[10px] font-bold text-[#00796b] dark:text-teal-400 underline hover:text-[#004d40] cursor-pointer"
                  >
                    {showAllProductsOverride ? 'Show Only Vendor Products' : 'Show All Catalog Products'}
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                  <AlertCircle className="w-3 h-3" />
                  Select a Vendor above to view vendor products
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              icon={Plus}
              onClick={handleAddLine}
              className="border-teal-200 dark:border-slate-700 text-[#00796b] dark:text-teal-400 font-bold rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Add Product Line
            </Button>
          </div>

          {/* Product Items Table Container */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {poForm.items.map((item, idx) => {
              const selectedProd = products.find(p => String(p.id) === String(item.product));
              const lineTotal = (parseFloat(item.quantity || 0)) * (parseFloat(item.unit_cost || 0));

              return (
                <div key={idx} className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5 hover:border-teal-300 dark:hover:border-slate-600 transition-all">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    
                    {/* Product Selector Dropdown */}
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.product}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00796b]/30 outline-none cursor-pointer truncate"
                      >
                        {!poForm.supplier ? (
                          <option value="">-- Please Select Vendor Above First --</option>
                        ) : availableProducts.length === 0 ? (
                          <option value="">-- No products linked to this vendor --</option>
                        ) : (
                          <option value="">-- Choose Product ({selectedSupplier?.company_name || selectedSupplier?.name}) --</option>
                        )}

                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.sku ? `[${p.sku}]` : ''} — Stock: {p.stock_quantity || 0} {p.unit?.short_name || 'unit'} | Cost: ₹{p.cost_price || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Numeric Controls Row */}
                    <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0">
                      
                      {/* Quantity Input */}
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">Qty</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                          className="w-14 text-xs font-black text-center bg-transparent outline-none font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Unit Cost Input */}
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">Cost ₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Cost"
                          value={item.unit_cost}
                          onChange={(e) => handleCostChange(idx, e.target.value)}
                          className="w-16 sm:w-20 text-xs font-black text-right bg-transparent outline-none font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Line Subtotal */}
                      <div className="min-w-[80px] sm:min-w-[95px] text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black font-mono text-[#00796b] dark:text-teal-400 block whitespace-nowrap">
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Delete Line Button */}
                      {poForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Selected Product Specs Pill */}
                  {selectedProd && (
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-1.5 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-teal-100/60 dark:border-teal-900/30">
                      <span className="min-w-0">
                        Category: <strong className="text-slate-800 dark:text-slate-100">{typeof selectedProd.category === 'object' ? selectedProd.category.name : selectedProd.category || 'General'}</strong>
                      </span>
                      <span className="font-mono text-slate-500 shrink-0">
                        SKU: {selectedProd.sku || 'N/A'} | Stock: <strong className="text-[#00796b] dark:text-teal-300">{selectedProd.stock_quantity || 0}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default PurchaseOrderModal;
