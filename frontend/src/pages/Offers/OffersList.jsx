import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/UiHelpers';
import { 
  Tag, 
  Plus, 
  Sparkles, 
  Percent, 
  Calendar, 
  Trash2, 
  Copy, 
  Check, 
  Gift, 
  ShoppingBag,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Ticket
} from 'lucide-react';
import { offersApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const OffersList = () => {
  const { storeSettings } = useAuth();
  const { showToast } = useNotification();

  const storeName = storeSettings?.store_name || 'Tulsi Mart';
  const tagline = storeSettings?.tagline || 'Supermarket POS & Management System';

  const [coupons, setCoupons] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    offer_type: 'PERCENTAGE',
    discount_value: '',
    min_order_amount: 0,
    max_discount_amount: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    usage_limit: 100,
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const [couponRes, festRes] = await Promise.all([
        offersApi.getCoupons(),
        offersApi.getFestivalOffers()
      ]);
      setCoupons(couponRes.data?.results || couponRes.data || []);
      setFestivals(festRes.data?.results || festRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied!`, 'info');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleCreateCoupon = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      
      const today = new Date().toISOString().split('T')[0];
      const defaultValidTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        valid_from: formData.valid_from || today,
        valid_to: formData.valid_to || defaultValidTo,
        discount_value: parseFloat(formData.discount_value || 0),
        min_order_amount: parseFloat(formData.min_order_amount || 0),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: parseInt(formData.usage_limit || 100),
      };

      await offersApi.createCoupon(payload);
      showToast(`Coupon ${payload.code} created successfully!`, 'success');
      setIsModalOpen(false);
      setFormData({
        code: '',
        title: '',
        description: '',
        offer_type: 'PERCENTAGE',
        discount_value: '',
        min_order_amount: 0,
        max_discount_amount: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '',
        usage_limit: 100,
      });
      loadOffers();
    } catch (err) {
      const errData = err.response?.data;
      let errorMsg = 'Failed to create coupon. Please check input values.';
      if (typeof errData === 'object' && errData !== null) {
        const firstKey = Object.keys(errData)[0];
        if (firstKey) {
          const val = errData[firstKey];
          errorMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : typeof val === 'string' ? val : errorMsg;
        }
      }
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await offersApi.deleteCoupon(id);
      showToast('Coupon deleted', 'success');
      loadOffers();
    } catch (err) {
      showToast('Failed to delete coupon', 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 🌟 Tulsi Mart POS Top Header Banner - Full Width Edge-to-Edge Background like Bill Page */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Banner Grid Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left: Tag Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Tag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Offers & <span className="text-[#00796b] dark:text-[#80cbc4]">Coupons</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Discounts
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Create promotional discount coupons, manage festival deals & track redemption limits
              </p>
            </div>
          </div>

          {/* Right: Quick Stat Cards & Create Coupon Button */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2.5 flex-1 sm:flex-initial">
              {/* Stat Card 1: Active Coupons */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl p-2 sm:px-3 sm:py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1 whitespace-nowrap">
                    ACTIVE COUPONS
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-heading leading-none block whitespace-nowrap">
                    {coupons.length} Active
                  </span>
                </div>
              </div>

              {/* Stat Card 2: Festival Deals */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl p-2 sm:px-3 sm:py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1 whitespace-nowrap">
                    FESTIVAL DEALS
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#00796b] dark:text-[#80cbc4] leading-none block whitespace-nowrap">
                    {festivals.length} Live
                  </span>
                </div>
              </div>
            </div>

            {/* Create Coupon Action Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#00796b] hover:bg-[#004d40] text-white font-bold rounded-2xl shadow-md border border-[#004d40]/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Coupon</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 FESTIVAL DEAL BANNERS - STYLED MATCHING BILLING PAGE CARDS */}
      {festivals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {festivals.map((f) => (
            <div
              key={f.id}
              className="bg-white dark:bg-slate-850 border border-teal-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px] group hover:border-[#00796b] dark:hover:border-[#80cbc4]"
            >
              <div className="relative z-10">
                <span className="inline-block bg-[#00796b] text-white dark:bg-[#80cbc4] dark:text-[#004d40] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-2xs">
                  {f.tag_text || 'Special Festival Deal'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-heading">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 max-w-md font-medium">{f.subtitle}</p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-extrabold text-[#00796b] dark:text-[#80cbc4] text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {f.discount_info}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                  Ends {new Date(f.end_date).toLocaleDateString('en-IN')}
                </span>
              </div>

              {/* Faded Background Icon Pattern */}
              <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-10 transform translate-x-4 translate-y-4 pointer-events-none group-hover:scale-110 transition-transform">
                <Gift className="w-44 h-44 text-[#00796b]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🌟 ACTIVE STORE COUPONS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
            <Ticket className="w-5 h-5 text-[#00796b] dark:text-[#80cbc4]" /> Active Store Coupons ({coupons.length})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Auto-applied during POS checkout</span>
        </div>

        {coupons.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No Active Coupons"
            description="Create promotional discount coupons and percentage promo codes to boost store sales."
            variant="card"
            actionLabel="Create Coupon"
            onAction={() => setIsModalOpen(true)}
            actionIcon={Plus}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => {
              const usagePercent = Math.min(100, Math.round((c.used_count / c.usage_limit) * 100));

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:border-[#00796b] dark:hover:border-[#80cbc4] shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
                >
                  <div>
                    {/* Top Row: Coupon Code & Copy Button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200/80 dark:border-teal-800/60 text-[#00796b] dark:text-[#80cbc4]">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono text-sm font-black text-[#00796b] dark:text-[#80cbc4] tracking-widest uppercase">
                            {c.code}
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{c.offer_type}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(c.code)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-[#00796b] hover:text-white dark:bg-slate-800 dark:hover:bg-[#00796b] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                        title="Copy Coupon Code"
                      >
                        {copiedCode === c.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-3.5 leading-snug">{c.title}</h4>

                    {/* Offer Value Card */}
                    <div className="mt-3.5 p-3 rounded-xl bg-teal-50/60 dark:bg-slate-800 border border-teal-100 dark:border-slate-750 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-amber-600 dark:text-amber-400 font-heading">
                          {c.offer_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#00695c] dark:text-[#80cbc4] bg-teal-100 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md uppercase">
                          Active
                        </span>
                      </div>
                      {Number(c.min_order_amount) > 0 && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Min Order Threshold: ₹{c.min_order_amount}</p>
                      )}
                    </div>

                    {/* Usage Progress */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Redeemed: {c.used_count} / {c.usage_limit}</span>
                        <span className="text-[#00796b] dark:text-[#80cbc4]">{usagePercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00796b] via-[#009688] to-[#4DB6AC] rounded-full transition-all"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Ends {c.valid_to}
                    </span>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌟 CREATE COUPON MODAL - STYLED MATCHING BILLING PAGE INPUTS & MODALS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Coupon"
        subtitle="Set discount rules, order threshold and usage limits"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCoupon}
              disabled={submitting}
              className="px-5 py-2.5 bg-[#00796b] hover:bg-[#004d40] text-white font-bold rounded-xl shadow-xs border border-[#004d40]/20 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Save Coupon'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-sans">
          {/* Coupon Code Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FESTIVE25"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-mono uppercase transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Offer Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Offer Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Flat 15% OFF on Monsoon Grocery Orders"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] focus:ring-2 focus:ring-[#00796b]/20 outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Discount Type *
              </label>
              <select
                value={formData.offer_type}
                onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none text-xs text-slate-900 dark:text-slate-100 transition-all"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Discount (₹)</option>
                <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {formData.offer_type === 'PERCENTAGE' ? 'Discount % *' : 'Discount Amount (₹) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder={formData.offer_type === 'PERCENTAGE' ? '15' : '100'}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-mono transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Order Thresholds */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-mono transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Max Discount Limit (₹)
              </label>
              <input
                type="number"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                placeholder="Optional"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-mono transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Dates & Usage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Valid Till Date *
              </label>
              <input
                type="date"
                required
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none text-xs text-slate-900 dark:text-slate-100 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Total Usage Limit
              </label>
              <input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#00796b] outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-mono transition-all"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OffersList;

