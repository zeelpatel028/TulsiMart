import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SearchInput, EmptyState } from '../common/UiHelpers';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Tag, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Truck, 
  User, 
  Sparkles,
  Percent
} from 'lucide-react';
import { inventoryApi, ordersApi, customersApi, offersApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';

export const QuickOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const { showToast } = useNotification();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('PAID');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Mobile tab switch for POS: 'catalog' | 'cart'
  const [mobileTab, setMobileTab] = useState('catalog');

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      setMobileTab('catalog');
    } else {
      // reset form
      setCart([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCouponCode('');
      setAppliedCoupon(null);
      setMobileTab('catalog');
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        inventoryApi.getProducts({ is_active: 'true' }),
        inventoryApi.getCategories()
      ]);
      setProducts(prodRes.data?.results || prodRes.data || []);
      setCategories(catRes.data?.results || catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      showToast(`${product.name} is Out of Stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          showToast(`Only ${product.stock_quantity} available in stock.`, 'info');
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          selling_price: parseFloat(product.selling_price),
          gst_percent: parseFloat(product.gst_percent || 0),
          stock_quantity: product.stock_quantity,
          image: product.image,
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock_quantity) {
              showToast(`Max stock reached (${item.stock_quantity})`, 'info');
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const taxAmount = cart.reduce(
    (sum, item) => sum + item.selling_price * item.quantity * (item.gst_percent / 100),
    0
  );
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const deliveryCharge = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount + deliveryCharge);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponLoading(true);
      const res = await offersApi.validateCoupon({
        code: couponCode.trim(),
        order_amount: subtotal
      });
      setAppliedCoupon(res.data);
      showToast(res.data.message || 'Coupon applied!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid coupon code or minimum order condition not met.', 'error');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Please add items to create order.', 'error');
      return;
    }

    try {
      setLoading(true);
      const orderPayload = {
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone || '',
        status: 'DELIVERED',
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        delivery_charge: deliveryCharge,
        total_amount: grandTotal,
        coupon_applied: appliedCoupon ? appliedCoupon.code : '',
        items: cart.map((item) => ({
          product: item.id,
          product_name: item.name,
          sku: item.sku,
          unit_price: item.selling_price,
          quantity: item.quantity,
          gst_percent: item.gst_percent,
        })),
      };

      const res = await ordersApi.createOrder(orderPayload);
      
      // Celebrate
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      showToast(`Order #${res.data.order_number} created successfully!`, 'success');
      onClose();
      if (onOrderCreated) onOrderCreated(res.data);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category == selectedCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tulsi Mart POS / Quick Billing"
      subtitle="Point of Sale counter terminal for fast grocery billing"
      maxWidth="max-w-6xl"
    >
      {/* Mobile Tab Switcher (Visible only on mobile/tablet < lg) */}
      <div className="flex lg:hidden items-center bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-[#384959] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#384959]'
          }`}
        >
          <span>Catalog ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'cart'
              ? 'bg-[#384959] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#384959]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="bg-[#88BDF2] text-[#384959] text-[10px] px-1.5 py-0.2 rounded-full font-black">
              ₹{grandTotal.toFixed(0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection Grid (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'cart' ? 'hidden lg:block' : 'block'}`}>
          {/* Search & Category Tabs */}
          <div className="space-y-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, SKU or barcode..."
            />

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar touch-pan">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#384959] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-[#384959] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[460px] overflow-y-auto pr-1 touch-pan">
            {filteredProducts.map((p) => {
              const inCartItem = cart.find((i) => i.id === p.id);
              const isOutOfStock = p.stock_quantity <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`relative p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    isOutOfStock
                      ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : inCartItem
                      ? 'bg-[#BDDDFC]/20 border-[#88BDF2] shadow-xs cursor-pointer'
                      : 'bg-white border-slate-200/80 hover:border-[#88BDF2] hover:shadow-md cursor-pointer'
                  }`}
                >
                  {inCartItem && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-[#384959] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                      {inCartItem.quantity}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold text-[#6A89A7] uppercase truncate">
                        {p.category_name || 'Grocery'}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-[#384959] line-clamp-2 leading-snug">
                      {p.name}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-0.5">{p.sku || p.unit || '1 Unit'}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-[#384959]">₹{p.selling_price}</span>
                      {Number(p.mrp) > Number(p.selling_price) && (
                        <span className="text-[10px] text-slate-400 line-through ml-1">₹{p.mrp}</span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-700'
                          : p.stock_quantity <= p.min_stock_alert
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isOutOfStock ? '0' : `${p.stock_quantity} left`}
                    </span>
                  </div>
                </div>

              );
            })}
          </div>

          {/* Mobile Floating Cart Summary Button */}
          {cart.length > 0 && (
            <div className="block lg:hidden pt-2">
              <button
                onClick={() => setMobileTab('cart')}
                className="w-full py-2.5 px-4 bg-[#384959] text-white rounded-xl font-bold text-xs flex items-center justify-between shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#88BDF2]" />
                  <span>{cart.reduce((s, i) => s + i.quantity, 0)} Items Added</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-[#88BDF2]">₹{grandTotal.toFixed(2)}</span>
                  <span>View Bill →</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Bill / Checkout (5 cols) */}
        <div className={`lg:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col justify-between min-h-[460px] ${mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
          <div>
            {/* Customer Inputs */}
            <div className="pb-3 border-b border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#384959]">
                <User className="w-3.5 h-3.5 text-[#6A89A7]" /> Customer Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden focus:border-[#88BDF2]"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-hidden focus:border-[#88BDF2]"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="py-2 max-h-52 overflow-y-auto divide-y divide-slate-200/60 touch-pan">
              {cart.length === 0 ? (
                <EmptyState
                  variant="compact"
                  icon={ShoppingCart}
                  title="Cart is Empty"
                  description="Tap products on the catalog to add to bill."
                />
              ) : (

                cart.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1 min-w-0 pr-1 truncate">
                      <p className="font-bold text-[#384959] truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">₹{item.selling_price} × {item.quantity}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-200 text-[#384959] flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-extrabold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-200 text-[#384959] flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-extrabold text-[#384959] w-14 text-right shrink-0">
                      ₹{(item.selling_price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Coupon Code Input */}
            <div className="py-3 border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="PROMO (e.g. TULSI10)"
                className="flex-1 px-3 py-1.5 text-xs uppercase font-mono bg-white border border-slate-200 rounded-lg outline-hidden focus:border-[#88BDF2]"
              />
              <Button variant="outline" size="sm" onClick={applyCoupon} loading={couponLoading}>
                Apply
              </Button>
            </div>
            {appliedCoupon && (
              <div className="mb-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between">
                <span>✓ Applied '{appliedCoupon.code}' (-₹{appliedCoupon.discount_amount})</span>
                <button onClick={() => setAppliedCoupon(null)} className="text-emerald-700 hover:underline cursor-pointer">
                  Remove
                </button>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="py-2 border-t border-slate-200 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Payment Method
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'COD', label: 'COD', icon: Truck },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-semibold transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-[#384959] text-white border-[#384959] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Total & Checkout Button */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST:</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-[#384959] pt-2 border-t border-slate-200">
                <span>Payable Amount:</span>
                <span className="font-heading">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold text-xs sm:text-sm py-3"
              onClick={handleCheckout}
              loading={loading}
              disabled={cart.length === 0}
            >
              Complete Sale & Print (₹{grandTotal.toFixed(2)})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QuickOrderModal;
