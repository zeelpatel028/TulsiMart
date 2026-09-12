import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { 
  Star, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Package, 
  CheckCircle2,
  Tag,
  Share2
} from 'lucide-react';

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  cartQuantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onBuyNow
}) => {
  const [selectedVariant, setSelectedVariant] = useState('standard');

  if (!product) return null;

  const cost = parseFloat(product.cost_price || 0);
  const selling = parseFloat(product.selling_price || 0);
  const mrp = parseFloat(product.mrp || product.selling_price || 0);
  const discountPercent = product.discount_percent 
    ? parseFloat(product.discount_percent) 
    : (mrp > selling && mrp > 0 ? (((mrp - selling) / mrp) * 100).toFixed(0) : 0);

  const packSize = product.unit_name ? `1 ${product.unit_name}` : '500 g';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.category_name || 'Grocery Item'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          {/* Left: Product Image */}
          <div className="sm:col-span-5 bg-[#F0FAF9] dark:bg-slate-800 rounded-3xl p-4 border border-[#B2DFDB]/60 dark:border-slate-700 relative flex items-center justify-center min-h-[220px]">
            <img
              src={product.image || '/logo.png'}
              alt={product.name}
              className="max-h-56 w-full object-contain p-2"
              onError={(e) => { e.target.src = '/logo.png'; }}
            />
            {Number(discountPercent) > 0 && (
              <span className="absolute top-3 left-3 bg-[#00695C] text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Right: Details & Buying */}
          <div className="sm:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#607D8B]">
              <span className="font-semibold text-[#00695C] dark:text-[#4DB6AC]">{product.brand_name || 'Tulsi Mart Organic'}</span>
              <span className="font-mono text-[11px]">SKU: {product.sku}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-[#263238] dark:text-slate-100 font-heading leading-snug">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span>4.8</span>
                <Star className="w-3 h-3 fill-current text-amber-500" />
              </div>
              <span className="text-xs text-[#607D8B] dark:text-slate-400">142 Ratings • 100% Organic Quality</span>
            </div>

            {/* Price Box */}
            <div className="bg-[#F0FAF9] dark:bg-slate-850 p-3 rounded-2xl border border-[#B2DFDB]/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#00695C] dark:text-slate-100 font-heading">
                    ₹{Number(selling).toFixed(2)}
                  </span>
                  {mrp > selling && (
                    <span className="text-sm text-[#607D8B] dark:text-slate-500 line-through">
                      ₹{Number(mrp).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#009688] font-bold mt-0.5">
                  Inclusive of all taxes (GST {product.gst_percent || 0}%)
                </p>
              </div>

              <div className="text-right">
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                  product.stock_quantity > 0 ? 'bg-[#E0F2F1] text-[#00695C]' : 'bg-rose-100 text-rose-600'
                }`}>
                  {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Pack Size Variants */}
            <div>
              <p className="text-xs font-bold text-[#607D8B] dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Select Pack Size / Quantity Unit:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'standard', label: packSize, active: true },
                  { id: 'pack2', label: `2 x ${packSize}`, active: false },
                  { id: 'combo', label: `Family Pack`, active: false }
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedVariant === v.id
                        ? 'bg-[#00695C] text-white border-[#00695C] shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-[#263238] dark:text-slate-300 border-[#B2DFDB] dark:border-slate-700 hover:bg-[#E0F2F1]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to Cart & Buy Buttons */}
            <div className="pt-2 flex items-center gap-3">
              {cartQuantity === 0 ? (
                <Button
                  variant="primary"
                  size="md"
                  icon={ShoppingCart}
                  onClick={() => onAddToCart && onAddToCart(product)}
                  className="flex-1 font-bold py-3 text-sm"
                >
                  Add to Grocery Cart
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-between bg-[#00695C] text-white p-2 rounded-2xl shadow-sm">
                  <span className="text-xs font-extrabold pl-2">Quantity in Cart:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity && onUpdateQuantity(product, cartQuantity - 1)}
                      className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-black text-sm">{cartQuantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity && onUpdateQuantity(product, cartQuantity + 1)}
                      className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {onBuyNow && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    if (cartQuantity === 0 && onAddToCart) onAddToCart(product);
                    onBuyNow(product);
                    onClose();
                  }}
                  className="px-5 py-3 text-sm font-bold bg-[#009688] hover:bg-[#00695C] text-white border-none"
                >
                  Buy Now / POS Bill
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Product Description & Guarantee Pills */}
        <div className="border-t border-[#B2DFDB]/60 dark:border-slate-800 pt-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#607D8B] dark:text-slate-400">
            Product Description & Quality Promise
          </h4>
          <p className="text-xs text-[#263238] dark:text-slate-300 leading-relaxed">
            {product.description || 'Freshly sourced premium grocery product delivered straight from Tulsi Mart warehouses. Guaranteed quality, carefully sorted and hygienic packaging.'}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-semibold text-[#00695C] dark:text-[#4DB6AC]">
            <div className="bg-[#E0F2F1] dark:bg-slate-800/80 p-2 rounded-xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#009688] shrink-0" />
              <span>10 Min Delivery</span>
            </div>
            <div className="bg-[#E0F2F1] dark:bg-slate-800/80 p-2 rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#009688] shrink-0" />
              <span>100% Quality</span>
            </div>
            <div className="bg-[#E0F2F1] dark:bg-slate-800/80 p-2 rounded-xl flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#009688] shrink-0" />
              <span>Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
