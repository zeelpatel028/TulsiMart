import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
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
  Clock
} from 'lucide-react';
import { offersApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';

export const OffersList = () => {
  const { showToast } = useNotification();

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
    e.preventDefault();
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
            Offers, Coupons & Festival Deals
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create promotional discounts, manage festival campaigns, and monitor coupon redemption limits.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
          Create New Coupon
        </Button>
      </div>

      {/* Festival Offer Banners */}
      {festivals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {festivals.map((f) => (
            <div
              key={f.id}
              className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-linear-to-r from-[#384959] to-[#6A89A7] dark:from-slate-900 dark:to-slate-800 text-white shadow-md flex flex-col justify-between min-h-[150px] sm:min-h-[160px] border border-slate-700/50"
            >
              <div className="relative z-10">
                <span className="inline-block bg-[#88BDF2] text-[#384959] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                  {f.tag_text || 'Special Festival Deal'}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold font-heading">{f.title}</h3>
                <p className="text-xs text-[#BDDDFC] mt-1 max-w-md">{f.subtitle}</p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs">
                <span className="font-extrabold text-[#BDDDFC] text-xs sm:text-sm">{f.discount_info}</span>
                <span className="text-[10px] sm:text-[11px] text-white/80 font-medium">
                  Valid till {new Date(f.end_date).toLocaleDateString('en-IN')}
                </span>
              </div>

              {/* Faded Background Pattern */}
              <div className="absolute right-0 bottom-0 opacity-15 transform translate-x-4 translate-y-4 pointer-events-none">
                <Gift className="w-40 h-40 sm:w-48 sm:h-48 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Coupons Grid */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-[#384959] dark:text-slate-100 mb-3 flex items-center gap-2 font-heading">
          <Tag className="w-4 h-4 text-[#6A89A7] dark:text-[#88BDF2]" /> Active Store Coupons ({coupons.length})
        </h2>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {coupons.map((c) => {
              const usagePercent = Math.min(100, Math.round((c.used_count / c.usage_limit) * 100));

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 rounded-2xl bg-[#384959]/10 dark:bg-[#88BDF2]/20 text-[#384959] dark:text-[#88BDF2]">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono text-sm font-black text-[#384959] dark:text-slate-100 tracking-wider">
                            {c.code}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-semibold">{c.offer_type}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(c.code)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#BDDDFC]/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#384959] dark:hover:text-white transition-colors cursor-pointer"
                        title="Copy Coupon"
                      >
                        {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-3">{c.title}</h4>

                    {/* Offer Value Highlight */}
                    <div className="mt-3 p-3 rounded-2xl bg-[#BDDDFC]/20 dark:bg-[#88BDF2]/10 border border-[#88BDF2]/30 dark:border-[#88BDF2]/20 text-xs">
                      <span className="text-base font-black text-[#384959] dark:text-[#88BDF2] font-heading">
                        {c.offer_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                      </span>
                      {Number(c.min_order_amount) > 0 && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Min Order: ₹{c.min_order_amount}</p>
                      )}
                    </div>

                    {/* Usage Progress */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Redeemed: {c.used_count} / {c.usage_limit}</span>
                        <span>{usagePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#384959] dark:bg-[#88BDF2] rounded-full transition-all"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ends {c.valid_to}
                    </span>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Create Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Coupon"
        subtitle="Set discount rules, order threshold and usage limits"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateCoupon} loading={submitting}>
              Create Coupon
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FESTIVE25"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Offer Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Flat 15% OFF on Monsoon Grocery Orders"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-[#88BDF2] outline-hidden text-[#384959] dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Discount Type *</label>
              <select
                value={formData.offer_type}
                onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Discount (₹)</option>
                <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                {formData.offer_type === 'PERCENTAGE' ? 'Discount % *' : 'Discount Amount (₹) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder={formData.offer_type === 'PERCENTAGE' ? '15' : '100'}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Max Discount Limit (₹)</label>
              <input
                type="number"
                value={formData.max_discount_amount}
                onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Valid Till Date *</label>
              <input
                type="date"
                required
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">Total Usage Limit</label>
              <input
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OffersList;
