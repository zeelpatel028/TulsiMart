import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { SearchInput, EmptyState } from '../../components/common/UiHelpers';
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
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Ticket,
  LayoutGrid,
  List,
  Filter,
  IndianRupee,
  ShoppingBag
} from 'lucide-react';
import { offersApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const OffersList = () => {
  const navigate = useNavigate();
  const { storeSettings } = useAuth();
  const { showToast } = useNotification();

  const [coupons, setCoupons] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Filters & Layout State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('coupons');

  // Modal State
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
      setCoupons(extractList(couponRes));
      setFestivals(extractList(festRes));
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

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    let list = Array.isArray(coupons) ? coupons : [];
    if (typeFilter !== 'ALL') {
      list = list.filter(c => c && c.offer_type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => 
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [coupons, typeFilter, search]);

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 📱 Mobile & Tablet Top App Header - Pastel Mint Theme */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
        {/* SVG Decorative Waves */}
        <svg className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto pointer-events-none text-[#C4EFE9]/70 dark:text-teal-950/40" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40C50 60 120 70 200 45V80H0V40Z" fill="currentColor" />
        </svg>

        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-md shadow-teal-900/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6]" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Offers & <span className="text-[#00695C] dark:text-[#4DB6AC]">Coupons</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Promotions & discount codes
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Coupon</span>
          </button>
        </div>
      </div>

      {/* 🌟 Top Header Banner (Desktop Only) - Matching Supplier Header */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          {/* Left: Tag Icon & Title */}
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
                  Live Discounts & Deals
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Create promotional discount coupons, manage festival deals & track redemption limits
              </p>
            </div>
          </div>

          {/* Right: Quick Stat Badges & Create Button */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                    ACTIVE COUPONS
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-heading leading-none block">
                    {coupons.length} Active
                  </span>
                </div>
              </div>

              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xs flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                    FESTIVAL DEALS
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#00796b] dark:text-[#80cbc4] leading-none block">
                    {festivals.length} Live
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white font-extrabold rounded-2xl shadow-sm shadow-teal-900/20 border border-[#004d40]/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Coupon</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 Segmented Main Tab Navigation Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Store Coupons ({coupons.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('festivals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer ${
              activeTab === 'festivals'
                ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Festival Deals ({festivals.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#00796b] text-white hover:bg-[#004d40] text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* 🌟 FESTIVAL DEALS TAB CONTENT */}
      {activeTab === 'festivals' && (
        <div className="space-y-4">
          {festivals.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Festival Deals Active"
              description="There are currently no active seasonal or festival promotional banners."
              variant="card"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {festivals.map((f) => (
                <div
                  key={f.id}
                  className="bg-white dark:bg-slate-900 border border-teal-100/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-teal-400/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[170px] group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00695C] via-[#009688] to-[#4DB6AC] rounded-t-3xl" />

                  <div className="relative z-10 mt-1">
                    <span className="inline-block bg-[#00796b] text-white dark:bg-[#80cbc4] dark:text-[#004d40] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2.5 shadow-2xs">
                      {f.tag_text || 'Special Festival Deal'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-heading">{f.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 max-w-md font-medium">{f.subtitle}</p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-black text-[#00796b] dark:text-[#80cbc4] text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      {f.discount_info}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold">
                      Valid Till {new Date(f.end_date).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-10 transform translate-x-4 translate-y-4 pointer-events-none group-hover:scale-110 transition-transform">
                    <Gift className="w-44 h-44 text-[#00796b]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🌟 STORE COUPONS TAB CONTENT */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          {/* Filter, Search & Layout Controls Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="w-full md:w-72 lg:w-80 shrink-0">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                placeholder="Search coupon code or title..."
              />
            </div>

            {/* Right Controls: Type Filter Tabs + Layout Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto">
              {/* Type Filter Pills */}
              <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: 'All Deals' },
                  { id: 'PERCENTAGE', label: 'Percentage (%)' },
                  { id: 'FLAT', label: 'Flat Discount (₹)' },
                  { id: 'BOGO', label: 'BOGO Deals' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTypeFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      typeFilter === tab.id
                        ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle: Table vs Cards */}
              <div className="bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-[#00695C] dark:text-[#4DB6AC] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-[#00695C] dark:text-[#4DB6AC] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* List Display: Empty State vs Cards vs Table */}
          {filteredCoupons.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No Coupons Found"
              description="There are currently no active promotional coupons matching your search criteria."
              variant="card"
              actionLabel="Create Coupon"
              onAction={() => setIsModalOpen(true)}
              actionIcon={Plus}
            />
          ) : viewMode === 'table' ? (
            /* RICH COUPON DATA TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-sm font-black text-[#263238] dark:text-slate-100 uppercase tracking-wider">
                    Promotional Coupons Directory ({filteredCoupons.length} Active Deals)
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Managed in POS Checkout API</span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs min-w-[760px] border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider font-black border-b border-teal-100 dark:border-slate-700/80 text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Code & Type</th>
                      <th className="px-4 py-3 whitespace-nowrap">Offer Title</th>
                      <th className="px-4 py-3 whitespace-nowrap">Discount Value</th>
                      <th className="px-4 py-3 whitespace-nowrap">Min Order</th>
                      <th className="px-4 py-3 whitespace-nowrap">Redeemed / Limit</th>
                      <th className="px-4 py-3 whitespace-nowrap">Valid Till</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                    {filteredCoupons.map((c) => {
                      const usagePercent = Math.min(100, Math.round((c.used_count / c.usage_limit) * 100));

                      return (
                        <tr key={c.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200/80 dark:border-teal-800/60 text-[#00796b] dark:text-[#80cbc4] shrink-0">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-mono text-xs font-black text-[#00796b] dark:text-[#80cbc4] tracking-wider uppercase block">
                                  {c.code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{c.offer_type}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {c.title}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
                              {c.offer_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                            {Number(c.min_order_amount) > 0 ? `₹${c.min_order_amount}` : 'No Min Limit'}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>{c.used_count} / {c.usage_limit}</span>
                                <span className="text-[#00796b]">{usagePercent}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#00796b] to-[#4DB6AC] rounded-full"
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {c.valid_to}
                          </td>

                          <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleCopy(c.code)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#00796b] dark:bg-slate-800 dark:text-[#80cbc4] hover:bg-teal-100 font-extrabold text-[11px] cursor-pointer inline-flex items-center gap-1"
                              title="Copy Coupon Code"
                            >
                              {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>Copy</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* RICH COUPON CARDS VIEW - MATCHING SUPPLIER CARD UI */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredCoupons.map((c) => {
                const usagePercent = Math.min(100, Math.round((c.used_count / c.usage_limit) * 100));

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-100/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-teal-400/50 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Accent Gradient Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00695C] via-[#009688] to-[#4DB6AC] rounded-t-3xl" />

                    <div>
                      {/* Top Row: Coupon Icon + Code & Copy Button */}
                      <div className="flex items-start justify-between gap-3 mt-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00695C] to-[#009688] text-white flex items-center justify-center shrink-0 shadow-md border border-white/20 group-hover:scale-105 transition-transform">
                            <Tag className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono text-base font-black text-[#00796b] dark:text-[#80cbc4] tracking-wider uppercase block truncate">
                              {c.code}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950 text-[#00695c] dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 mt-1 uppercase">
                              {c.offer_type}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopy(c.code)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-[#00796b] hover:text-white dark:bg-slate-800 dark:hover:bg-[#00796b] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shrink-0"
                          title="Copy Coupon Code"
                        >
                          {copiedCode === c.code ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-3.5 leading-snug">
                        {c.title}
                      </h4>

                      {/* Offer Value Card */}
                      <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-amber-600 dark:text-amber-400 font-heading">
                            {c.offer_type === 'PERCENTAGE' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        </div>
                        {Number(c.min_order_amount) > 0 && (
                          <p className="text-[11px] text-slate-500 font-medium">Min Order: ₹{c.min_order_amount}</p>
                        )}
                      </div>

                      {/* Usage Progress */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span>Redeemed: {c.used_count} / {c.usage_limit}</span>
                          <span className="text-[#00796b] dark:text-[#80cbc4]">{usagePercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00695C] via-[#009688] to-[#4DB6AC] rounded-full transition-all"
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-mono font-bold text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Ends {c.valid_to}
                      </span>
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
      )}

      {/* 🌟 CREATE COUPON MODAL - MATCHING SUPPLIER FORM MODALS */}
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
