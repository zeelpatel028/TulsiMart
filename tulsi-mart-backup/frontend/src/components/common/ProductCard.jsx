import React from 'react';
import { Plus, Minus } from 'lucide-react';

export const ProductCard = ({
  product,
  cartQuantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails,
  className = ''
}) => {
  if (!product) return null;

  const selling = parseFloat(product.selling_price || 0);
  const mrp = parseFloat(product.mrp || product.selling_price || 0);
  const discountPercent = product.discount_percent 
    ? parseFloat(product.discount_percent) 
    : (mrp > selling && mrp > 0 ? (((mrp - selling) / mrp) * 100).toFixed(0) : 0);

  const unitLabel = product.unit_name ? `1 ${product.unit_name}` : '';

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between hover:border-teal-500 transition-colors ${className}`}
    >
      <div>
        {/* Product Image */}
        <div 
          className="relative aspect-square w-full rounded-lg bg-slate-50 dark:bg-slate-800 mb-2 overflow-hidden border border-slate-100 dark:border-slate-700 flex items-center justify-center cursor-pointer"
          onClick={() => onOpenDetails && onOpenDetails(product)}
        >
          <img
            src={product.image || '/logo.png'}
            alt={product.name}
            className="w-full h-full object-cover p-1"
            onError={(e) => { e.target.src = '/logo.png'; }}
          />

          {Number(discountPercent) > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-teal-700 text-white font-bold text-[10px] px-1.5 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Category & Pack Size */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
          <span className="truncate font-medium">{product.category_name || 'Grocery'}</span>
          {unitLabel && (
            <span className="text-[10px] text-slate-400 font-normal">
              {unitLabel}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onOpenDetails && onOpenDetails(product)}
          className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug cursor-pointer hover:text-teal-600 transition-colors"
        >
          {product.name}
        </h3>
      </div>

      {/* Pricing & Add/Qty Action */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            ₹{Number(selling).toFixed(0)}
          </span>
          {mrp > selling && (
            <span className="text-[11px] text-slate-400 line-through">
              ₹{Number(mrp).toFixed(0)}
            </span>
          )}
        </div>

        <div>
          {cartQuantity === 0 ? (
            <button
              type="button"
              onClick={() => onAddToCart && onAddToCart(product)}
              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white dark:bg-slate-800 dark:hover:bg-teal-600 dark:text-teal-400 dark:hover:text-white rounded-lg text-xs font-bold transition-colors border border-teal-200 dark:border-slate-700 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="flex items-center bg-teal-600 text-white rounded-lg overflow-hidden p-0.5">
              <button
                type="button"
                onClick={() => onUpdateQuantity && onUpdateQuantity(product, cartQuantity - 1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-black/10 rounded transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 text-center font-bold text-xs">
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity && onUpdateQuantity(product, cartQuantity + 1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-black/10 rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
