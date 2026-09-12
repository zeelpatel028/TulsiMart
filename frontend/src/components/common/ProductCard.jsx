import React, { useState } from 'react';
import { Plus, Minus, Heart, Star, ShoppingCart, Zap } from 'lucide-react';

export const ProductCard = ({
  product,
  cartQuantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onOpenDetails,
  className = ''
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) return null;

  const cost = parseFloat(product.cost_price || 0);
  const selling = parseFloat(product.selling_price || 0);
  const mrp = parseFloat(product.mrp || product.selling_price || 0);
  const discountPercent = product.discount_percent 
    ? parseFloat(product.discount_percent) 
    : (mrp > selling && mrp > 0 ? (((mrp - selling) / mrp) * 100).toFixed(0) : 0);

  const unitLabel = product.unit_name ? product.unit_name : 'unit';
  const packSize = product.unit_name ? `1 ${product.unit_name}` : '500 g';

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-[#B2DFDB] dark:border-slate-800 p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 grocery-card-shadow group relative overflow-hidden ${className}`}
    >
      <div>
        {/* Top Badges & Heart Wishlist */}
        <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl bg-[#F0FAF9] dark:bg-slate-800/80 mb-3 overflow-hidden border border-[#B2DFDB]/60 dark:border-slate-700 flex items-center justify-center cursor-pointer group-hover:scale-[1.02] transition-transform duration-200"
             onClick={() => onOpenDetails && onOpenDetails(product)}>
          
          <img
            src={product.image || '/logo.png'}
            alt={product.name}
            className="w-full h-full object-cover p-2"
            onError={(e) => { e.target.src = '/logo.png'; }}
          />

          {/* Discount Badge */}
          {Number(discountPercent) > 0 && (
            <span className="absolute top-2 left-2 bg-[#00695C] text-white font-extrabold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg shadow-sm tracking-wide">
              {discountPercent}% OFF
            </span>
          )}

          {/* Fast Delivery Badge */}
          <span className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-900/90 text-[#00695C] dark:text-[#4DB6AC] text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-0.5 border border-[#B2DFDB]/40">
            <Zap className="w-2.5 h-2.5 fill-[#009688] text-[#009688]" /> 10 MINS
          </span>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all cursor-pointer ${
              isWishlisted 
                ? 'bg-rose-500 text-white shadow-md scale-110' 
                : 'bg-white/80 dark:bg-slate-800/80 text-[#607D8B] hover:text-rose-500 backdrop-blur-xs'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Category & Weight */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-[#607D8B] dark:text-slate-400 font-semibold mb-1">
          <span className="truncate text-[#00695C] dark:text-[#4DB6AC]">{product.category_name || 'Grocery'}</span>
          <span className="bg-[#E0F2F1] dark:bg-slate-800 text-[#263238] dark:text-slate-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0">
            {packSize}
          </span>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onOpenDetails && onOpenDetails(product)}
          className="text-xs sm:text-sm font-bold text-[#263238] dark:text-slate-100 line-clamp-2 leading-snug font-heading cursor-pointer hover:text-[#00695C] dark:hover:text-[#4DB6AC] transition-colors"
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            <span>4.8</span>
            <Star className="w-2.5 h-2.5 fill-current text-amber-500" />
          </div>
          <span className="text-[10px] text-[#607D8B] dark:text-slate-500">(120+)</span>
        </div>
      </div>

      {/* Pricing & Add/Qty Selector Button */}
      <div className="mt-3 pt-2.5 border-t border-[#B2DFDB]/60 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm sm:text-base font-black text-[#00695C] dark:text-slate-100 font-heading">
              ₹{Number(selling).toFixed(0)}
            </span>
            {mrp > selling && (
              <span className="text-[11px] text-[#607D8B] dark:text-slate-500 line-through">
                ₹{Number(mrp).toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Add to Cart / Quantity Stepper Button */}
        <div>
          {cartQuantity === 0 ? (
            <button
              type="button"
              onClick={() => onAddToCart && onAddToCart(product)}
              className="px-3 py-1.5 bg-[#E0F2F1] hover:bg-[#00695C] text-[#00695C] hover:text-white dark:bg-teal-950 dark:hover:bg-[#009688] dark:text-[#4DB6AC] dark:hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-[#009688]/30 hover:border-[#00695C] cursor-pointer shadow-2xs hover:shadow-sm flex items-center gap-1 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="flex items-center bg-[#00695C] text-white rounded-xl shadow-sm overflow-hidden p-0.5 border border-[#004D40]">
              <button
                type="button"
                onClick={() => onUpdateQuantity && onUpdateQuantity(product, cartQuantity - 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="Decrease Qty"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center font-extrabold text-xs">
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity && onUpdateQuantity(product, cartQuantity + 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title="Increase Qty"
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
