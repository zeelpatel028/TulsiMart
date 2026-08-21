import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  PlusCircle, 
  ShoppingCart, 
  User, 
  ChevronDown, 
  CheckCheck, 
  AlertTriangle,
  Package,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Sun,
  Moon,
  Settings
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { inventoryApi, ordersApi } from '../../api';
import { EmptyState } from '../common/UiHelpers';

export const Navbar = ({ onMenuClick, onOpenQuickOrder }) => {
  const { user, logout, login, storeSettings } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], orders: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ products: [], orders: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [prodRes, orderRes] = await Promise.all([
          inventoryApi.getProducts({ search: searchQuery }),
          ordersApi.getOrders({ search: searchQuery })
        ]);
        setSearchResults({
          products: (prodRes.data?.results || prodRes.data || []).slice(0, 5),
          orders: (orderRes.data?.results || orderRes.data || []).slice(0, 5),
        });
        setShowSearchDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Demo role switcher for testing
  const switchRole = async (username, password) => {
    setShowProfileMenu(false);
    await login(username, password);
    navigate('/');
  };

  return (
    <header className="h-18 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 shadow-xs">
      {/* Left: Mobile Toggle & Page Title / Quick Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-[#384959] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Live Search Bar */}
        <div className="relative w-full" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery) setShowSearchDropdown(true); }}
              placeholder="Search products, SKU, barcodes, orders..."
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#88BDF2] rounded-xl outline-hidden transition-all text-[#384959] dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#88BDF2]/20"
            />
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && (searchQuery.trim().length > 0) && (
            <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[480px] mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 max-w-[calc(100vw-24px)]">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900">
                <span>Quick Search Results for "{searchQuery}"</span>
                {isSearching && <span className="text-[#88BDF2] font-normal animate-pulse">Searching...</span>}
              </div>


              <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-700">
                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div className="py-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Products ({searchResults.products.length})
                    </p>
                    {searchResults.products.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          navigate('/products');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#384959] dark:text-slate-100">{p.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">SKU: {p.sku} | Stock: {p.stock_quantity}</p>
                        </div>
                        <span className="text-xs font-extrabold text-[#384959] dark:text-[#88BDF2]">₹{p.selling_price}</span>

                      </div>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div className="py-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5" /> Orders ({searchResults.orders.length})
                    </p>
                    {searchResults.orders.map(o => (
                      <div
                        key={o.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          navigate('/orders');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#384959] dark:text-slate-100 font-mono">{o.order_number}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{o.customer_name} • {o.payment_method}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#384959] dark:text-[#88BDF2]">₹{o.total_amount}</span>
                          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.products.length === 0 && searchResults.orders.length === 0 && !isSearching && (
                  <EmptyState
                    variant="compact"
                    icon={Search}
                    title="No Matches Found"
                    description={`No grocery products or store orders match "${searchQuery}"`}
                  />
                )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle + Quick Action POS + Smart Alerts + Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#384959] dark:text-[#88BDF2] transition-all cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400 animate-in spin-in-180 duration-300" /> : <Moon className="w-4.5 h-4.5 text-[#384959] transition-transform" />}
        </button>

        {/* Quick POS / New Order Action */}
        <button
          onClick={() => navigate('/billing')}
          className="flex items-center gap-2 bg-[#88BDF2] hover:bg-[#6A89A7] text-[#384959] hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">POS Billing</span>
          <span className="sm:hidden">POS</span>
        </button>

        {/* Profile & Demo Role Switcher Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#384959] dark:bg-[#6A89A7] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.first_name ? user.first_name[0] : (user?.username?.[0] || 'A')}
            </div>
            <div className="hidden md:block text-left pr-1">
              <span className="block text-xs font-bold text-[#384959] dark:text-slate-100 leading-tight">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Admin')}
              </span>
              <span className="block text-[10px] text-[#6A89A7] dark:text-[#88BDF2] font-semibold leading-tight">
                {user?.role?.replace('_', ' ') || 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Profile Menu Popover */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-2">
                <p className="text-xs font-bold text-[#384959] dark:text-slate-100">{user?.first_name} {user?.last_name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email || 'admin@tulsimart.com'}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="bg-[#384959] dark:bg-[#6A89A7] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                    {user?.role?.replace('_', ' ')}
                  </span>

                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active Session
                  </span>
                </div>
              </div>
              {/* Admin Quick Nav Menu */}
              <div className="py-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/billing');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#BDDDFC]/20 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#6A89A7] dark:text-[#88BDF2]" /> POS Billing Terminal
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/staff');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#BDDDFC]/20 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-[#6A89A7] dark:text-[#88BDF2]" /> Store Staff Management
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-[#BDDDFC]/20 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#6A89A7] dark:text-[#88BDF2]" /> Store Settings & Profile
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
