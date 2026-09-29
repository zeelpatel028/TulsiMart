import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-20 sm:h-22 bg-gradient-to-r from-[#e0f2f1] via-[#f0faf9] to-[#e0f2f1] dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-[#b2dfdb] dark:border-slate-800 px-3.5 sm:px-6 lg:hidden shadow-xs flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Store Logo & App Name */}
      <div 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0"
      >
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-white/90 shadow-xs">
          <img 
            src="/logo.png" 
            alt="Tulsi Mart" 
            className="w-full h-full object-contain"
            onError={(e) => { e.target.src = '/logo.png'; }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight leading-none font-heading">
              Tulsi <span className="text-[#00796b] dark:text-[#4DB6AC]">Mart</span>
            </span>
            <span className="bg-[#00796b] text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
              APP
            </span>
          </div>
        </div>
      </div>

      {/* Right: 3-Line Hamburger Menu Icon (Replaced User Circle Avatar) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="w-12 h-12 rounded-2xl bg-[#e0f2f1] dark:bg-slate-800 text-[#00695c] dark:text-[#80cbc4] hover:bg-[#b2dfdb] dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-2xs border border-white/60 dark:border-slate-700"
        title="Open Menu Drawer"
      >
        <Menu className="w-6 h-6 stroke-[2.5]" />
      </button>
    </header>
  );
};

export default MobileHeader;
