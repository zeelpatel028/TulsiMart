import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, MapPin, Zap, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileHeader = ({ onMenuClick, cartCount = 0, onOpenSearch }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#B2DFDB] dark:border-slate-800 px-3.5 py-2.5 lg:hidden shadow-xs">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Store Brand & Delivery Pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-xl bg-[#E0F2F1] dark:bg-slate-800 text-[#00695C] dark:text-[#4DB6AC] hover:bg-[#B2DFDB] transition-colors cursor-pointer shrink-0"
            title="Open Drawer Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-[#00695C] p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img 
                src="/logo.png" 
                alt="Tulsi Mart" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.src = '/logo.png'; }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-black text-sm text-[#263238] dark:text-slate-100 font-heading leading-tight truncate">
                  Tulsi Mart
                </span>
                <span className="bg-[#009688] text-white text-[8px] font-black px-1 rounded-xs uppercase">
                  APP
                </span>
              </div>

              {/* Delivery Location Pill */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#00695C] dark:text-[#4DB6AC] truncate leading-tight">
                <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="truncate">10 Mins • Store Outlet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick POS Cart & Profile Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="relative p-2 bg-[#00695C] hover:bg-[#004D40] text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="Cart & POS Billing"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs font-black">POS</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#E53935] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-8 h-8 rounded-xl bg-[#E0F2F1] dark:bg-slate-800 border border-[#B2DFDB] dark:border-slate-700 text-[#00695C] dark:text-[#4DB6AC] font-bold text-xs flex items-center justify-center cursor-pointer"
            title="Profile & Settings"
          >
            {user?.first_name ? user.first_name[0] : (user?.username?.[0] || 'A')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
