import React, { useState } from 'react';
import { Minus, Plus, Trash2, Edit3 } from 'lucide-react';
import {
  getUnitTypeInfo,
  getAvailablePortionOptions,
  calculateCartItemPricing,
  calculateCustomPortionRatio,
  UNIT_TYPES
} from '../../utils/portionCalculator';
import { formatUnit } from '../../utils/apiHelpers';

export const CartProductCard = ({
  item,
  onUpdatePortion,
  onUpdateCustomPortion,
  onUpdateCartQty,
  onUpdateGst,
  onUpdateBasePrice,
  onRemove,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customQtyInput, setCustomQtyInput] = useState('');
  const [customUnitInput, setCustomUnitInput] = useState('g');

  const product = item.product || item;
  const productName = product.name || item.name || 'Grocery Item';
  const basePriceVal = item.basePrice !== undefined ? item.basePrice : parseFloat(product.selling_price || product.price || item.unitPrice || 0);
  const basePriceNum = parseFloat(basePriceVal) || 0;
  const baseUnitShort = formatUnit(product.unit_name || product.unit || item.productUnitShort || 'kg');

  const info = getUnitTypeInfo(baseUnitShort);
  const portionOptions = getAvailablePortionOptions(baseUnitShort);

  // Active portion option
  const activeRatio = item.portionRatio || 1;
  const activeLabel = item.portionLabel || (portionOptions[0]?.label || `1 ${baseUnitShort}`);
  const cartQty = item.cartQuantity || item.quantity || 1;
  const gst = item.gstPercent !== undefined ? item.gstPercent : (product.selling_gst_percent || product.gst_percent || 0);

  // Pricing math
  const pricing = calculateCartItemPricing({
    basePrice: basePriceNum,
    baseUnit: baseUnitShort,
    portionRatio: activeRatio,
    portionLabel: activeLabel,
    cartQuantity: cartQty,
    gstPercent: gst,
  });

  const handleApplyCustom = () => {
    if (!customQtyInput || parseFloat(customQtyInput) <= 0) return;
    const unitStr = customUnitInput || (info.type === UNIT_TYPES.WEIGHT ? 'g' : info.type === UNIT_TYPES.VOLUME ? 'ml' : baseUnitShort);
    const customRatio = calculateCustomPortionRatio(customQtyInput, unitStr, baseUnitShort);
    const customLabel = `${customQtyInput}${unitStr}`;

    if (onUpdateCustomPortion) {
      onUpdateCustomPortion(product.id, customRatio, customLabel);
    } else if (onUpdatePortion) {
      onUpdatePortion(product.id, { label: customLabel, value: customLabel, ratio: customRatio });
    }
    setShowCustomModal(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-teal-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3 font-sans relative overflow-hidden group">
      {/* 🟢 TOP ROW: Left (Name, Base Price, GST) | Right (Item Total Price) */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate font-heading group-hover:text-[#00695C] transition-colors">
              {productName}
            </h4>

            {/* Editable Base Rate Pill for Bill */}
            {onUpdateBasePrice ? (
              <div
                className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[#00695C] dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-lg border border-teal-300 dark:border-teal-700 font-mono shadow-2xs hover:border-[#00695C] transition-all"
                title="Edit base price rate for this bill"
              >
                <span className="text-[#00695C] dark:text-teal-300 font-extrabold">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={basePriceVal === '' ? '' : basePriceVal}
                  onChange={(e) => onUpdateBasePrice(product.id, e.target.value)}
                  placeholder="0.00"
                  className="w-16 bg-transparent text-[#00695C] dark:text-teal-300 font-black outline-none border-b border-dashed border-[#00695C]/50 focus:border-[#00695C] focus:bg-white dark:focus:bg-slate-800 px-0.5 rounded-xs"
                />
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">/ {baseUnitShort}</span>
                <Edit3 className="w-2.5 h-2.5 text-[#00695C]/60 dark:text-teal-400/60 ml-0.5 shrink-0 pointer-events-none" />
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#00695C] dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md border border-teal-200/80 dark:border-teal-800/60 font-mono">
                ₹{basePriceNum.toFixed(2)} / {baseUnitShort}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {/* GST selector/badge */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">GST</span>
              {onUpdateGst ? (
                <select
                  value={gst}
                  onChange={(e) => onUpdateGst(product.id, parseFloat(e.target.value))}
                  className="bg-transparent text-[11px] font-black text-[#00695C] dark:text-teal-300 outline-none cursor-pointer"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              ) : (
                <span className="text-[11px] font-black text-[#00695C] dark:text-teal-300">{gst}%</span>
              )}
            </div>

            <span className="text-slate-300 dark:text-slate-700">•</span>
            
            {/* Display ratio multiplier text e.g. 200g × 2 = 400g */}
            <span className="font-mono text-slate-600 dark:text-slate-300 font-bold truncate">
              {activeLabel} {cartQty > 1 ? `× ${cartQty} (${(activeRatio * cartQty).toFixed(2).replace(/\.00$/, '')} ${baseUnitShort} total)` : ''}
            </span>
          </div>
        </div>

        {/* Right side: Item Total Price */}
        <div className="text-right shrink-0">
          <div className="text-sm sm:text-base font-black text-[#00695C] dark:text-teal-300 font-mono">
            ₹{pricing.itemTotal.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
            ₹{pricing.portionPrice.toFixed(2)} / {activeLabel}
          </div>
        </div>
      </div>

      {/* 🟡 MIDDLE ROW: Quick Weight / Portion Selector Pills */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
            {info.type === UNIT_TYPES.WEIGHT ? 'Quick Weight' : info.type === UNIT_TYPES.VOLUME ? 'Quick Volume' : 'Select Quantity'}
          </span>

          <button
            type="button"
            onClick={() => {
              setCustomQtyInput('');
              setCustomUnitInput(info.type === UNIT_TYPES.WEIGHT ? 'g' : info.type === UNIT_TYPES.VOLUME ? 'ml' : baseUnitShort);
              setShowCustomModal(!showCustomModal);
            }}
            className="text-[10px] font-bold text-[#00695C] dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Custom Qty</span>
          </button>
        </div>

        {/* Horizontal scrollable portion pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan pb-0.5">
          {portionOptions.map((opt) => {
            const isSelected = Math.abs(activeRatio - opt.ratio) < 0.0001;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdatePortion(product.id, opt)}
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#00695C] text-white border-[#00695C] shadow-xs scale-102 font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#00695C] hover:text-[#00695C]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Custom Input Inline Modal */}
        {showCustomModal && (
          <div className="p-2.5 bg-teal-50/70 dark:bg-slate-800/80 rounded-xl border border-teal-200 dark:border-slate-700 flex items-center gap-2 mt-2 animate-in fade-in">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">Custom Qty:</span>
            <input
              type="number"
              step="any"
              min="0.001"
              value={customQtyInput}
              onChange={(e) => setCustomQtyInput(e.target.value)}
              placeholder="e.g. 750"
              className="w-20 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-mono font-bold text-slate-900 dark:text-white"
            />
            {info.type === UNIT_TYPES.WEIGHT && (
              <select
                value={customUnitInput}
                onChange={(e) => setCustomUnitInput(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="mg">mg</option>
              </select>
            )}
            {info.type === UNIT_TYPES.VOLUME && (
              <select
                value={customUnitInput}
                onChange={(e) => setCustomUnitInput(e.target.value)}
                className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="ml">ml</option>
                <option value="L">L</option>
              </select>
            )}
            <button
              type="button"
              onClick={handleApplyCustom}
              className="px-3 py-1 bg-[#00695C] hover:bg-[#004D40] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 🔵 BOTTOM ROW: Quantity Stepper [-] Qty [+] & Remove Icon */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Cart Qty:</span>
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => onUpdateCartQty(product.id, Math.max(0, cartQty - 1))}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-[#00695C] dark:text-teal-300 flex items-center justify-center font-black text-sm hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95 min-h-[32px] min-w-[32px]"
              title="Decrease Cart Quantity"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>

            <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white font-mono">
              {cartQty}
            </span>

            <button
              type="button"
              onClick={() => onUpdateCartQty(product.id, cartQty + 1)}
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 text-[#00695C] dark:text-teal-300 flex items-center justify-center font-black text-sm hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95 min-h-[32px] min-w-[32px]"
              title="Increase Cart Quantity"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Delete / Remove Icon Button */}
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
          title="Remove from Cart"
        >
          <Trash2 className="w-4 h-4 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};

export default CartProductCard;
