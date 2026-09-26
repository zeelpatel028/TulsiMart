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
  Settings,
  Palette
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { inventoryApi, ordersApi } from '../../api';
import { EmptyState } from '../common/UiHelpers';

export const Navbar = ({ onMenuClick, onOpenQuickOrder }) => {
  const { user, logout, login, storeSettings } = useAuth();
  const { theme, toggleTheme, isDark, colorTheme, setColorTheme, colorPresets } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], orders: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const paletteRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
      if (paletteRef.current && !paletteRef.current.contains(e.target)) setShowPaletteMenu(false);
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

  return (
    <header className="h-20 bg-gradient-to-r from-[#e0f2f1] via-[#f0faf9] to-[#e0f2f1] dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 backdrop-blur-md border-b border-[#B2DFDB] dark:border-slate-800 px-3 sm:px-6 sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 shadow-xs">
      {/* Left: Mobile Toggle & Page Title / Quick Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-[#00695C] dark:text-slate-200 hover:bg-[#E0F2F1] dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Live Search Bar */}
        <div className="relative w-full" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#607D8B] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery) setShowSearchDropdown(true); }}
              placeholder="Search products, SKU, barcodes, orders..."
              className="w-full pl-9 sm:pl-10 pr-16 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 hover:bg-[#F0FAF9] dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 border border-[#B2DFDB] dark:border-slate-700 focus:border-[#009688] rounded-xl outline-hidden transition-all text-[#263238] dark:text-slate-100 placeholder:text-[#607D8B]/70 focus:ring-2 focus:ring-[#009688]/20"
            />
            <div className="absolute right-3 pointer-events-none text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded-md hidden sm:block">
              Ctrl + K
            </div>
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && (searchQuery.trim().length > 0) && (
            <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[480px] mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[#B2DFDB] dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 max-w-[calc(100vw-24px)]">
              <div className="p-3 border-b border-[#B2DFDB]/60 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-[#607D8B] dark:text-slate-400 bg-[#F0FAF9] dark:bg-slate-900">
                <span>Quick Search Results for "{searchQuery}"</span>
                {isSearching && <span className="text-[#009688] font-normal animate-pulse">Searching...</span>}
              </div>

              <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#E0F2F1] dark:divide-slate-700">
                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div className="py-2">
                    <p className="text-[11px] font-bold text-[#607D8B] uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#009688]" /> Products ({searchResults.products.length})
                    </p>
                    {searchResults.products.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          navigate('/products');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#E0F2F1]/50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#263238] dark:text-slate-100">{p.name}</p>
                          <p className="text-[10px] text-[#607D8B] dark:text-slate-400 font-mono">SKU: {p.sku} | Stock: {p.stock_quantity}</p>
                        </div>
                        <span className="text-xs font-extrabold text-[#00695C] dark:text-[#4DB6AC]">₹{p.selling_price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div className="py-2">
                    <p className="text-[11px] font-bold text-[#607D8B] uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-[#009688]" /> Orders ({searchResults.orders.length})
                    </p>
                    {searchResults.orders.map(o => (
                      <div
                        key={o.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          navigate('/orders');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#E0F2F1]/50 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#263238] dark:text-slate-100 font-mono">{o.order_number}</p>
                          <p className="text-[10px] text-[#607D8B] dark:text-slate-400">{o.customer_name} • {o.payment_method}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#00695C] dark:text-[#4DB6AC]">₹{o.total_amount}</span>
                          <span className="block text-[10px] text-[#009688] font-medium">{o.status}</span>
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

      {/* Right: Theme Toggle + Bell Notification + Settings + Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-[#E0F2F1] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => navigate('/orders')}
          className="relative p-2 sm:p-2.5 rounded-xl bg-white hover:bg-[#E0F2F1] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[7px] text-white font-bold">
            1
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-[#E0F2F1] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0 shadow-2xs"
          title="Store Settings"
        >
          <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Profile Dropdown Pill */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl bg-white hover:bg-[#E0F2F1] dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <div className="w-7 h-7 rounded-xl bg-[#00796b] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.first_name ? user.first_name[0].toLowerCase() : (user?.username?.[0]?.toLowerCase() || 't')}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 leading-none mb-0.5">
                {user?.username || user?.first_name || 'tulsi'}
              </span>
              <span className="block text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
                {user?.role?.replace('_', ' ') || 'STORE MANAGER'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {/* Profile Menu Popover */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-[#B2DFDB] dark:border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 bg-[#F0FAF9] dark:bg-slate-900 rounded-xl mb-2 border border-[#B2DFDB]/60">
                <p className="text-xs font-bold text-[#263238] dark:text-slate-100">{user?.first_name} {user?.last_name}</p>
                <p className="text-[11px] text-[#607D8B] dark:text-slate-400">{user?.email || 'admin@tulsimart.com'}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="bg-[#00695C] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                    {user?.role?.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#009688] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#009688] rounded-full animate-pulse" /> Active Session
                  </span>
                </div>
              </div>

              {/* Admin Quick Nav Menu */}
              <div className="py-2 border-t border-[#B2DFDB]/60 dark:border-slate-700 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/billing');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#263238] dark:text-slate-200 hover:bg-[#E0F2F1] dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#009688]" /> POS Billing Terminal
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/staff');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#263238] dark:text-slate-200 hover:bg-[#E0F2F1] dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-[#009688]" /> Store Staff Management
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#263238] dark:text-slate-200 hover:bg-[#E0F2F1] dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#009688]" /> Store Settings & Profile
                </button>
              </div>

              <div className="pt-2 border-t border-[#B2DFDB]/60 dark:border-slate-700">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#E53935] hover:bg-[#FFEBEE] dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
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
