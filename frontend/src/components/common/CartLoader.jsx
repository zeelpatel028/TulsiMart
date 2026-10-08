import React from 'react';

export const CartLoader = ({
  text = "Loading...",
  fullScreen = false,
  size = "md",
  showLogo = true
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 border-3",
    md: "w-12 h-12 border-4",
    lg: "w-16 h-16 border-4"
  }[size] || "w-12 h-12 border-4";

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans select-none">
      {/* 1. Tulsi Mart Logo */}
      {showLogo && (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white p-2.5 rounded-2xl shadow-lg border border-teal-100 dark:border-slate-700 flex items-center justify-center animate-pulse">
          <img 
            src="/logo.png" 
            alt="Tulsi Mart Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* 2. Blue / Teal Circular Loading Spinner */}
      <div className="relative flex items-center justify-center">
        {/* Background Track Ring */}
        <div className={`${sizeClasses} rounded-full border-teal-100 dark:border-slate-800/80`} />
        {/* Animated Active Blue-Teal Circle Ring */}
        <div
          className={`absolute top-0 left-0 ${sizeClasses} rounded-full border-transparent border-t-[#00796b] border-r-[#009688] dark:border-t-[#4DB6AC] dark:border-r-[#80cbc4] animate-spin`}
        />
      </div>

      {/* 3. Loading Text */}
      {text && (
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-wider uppercase font-heading animate-pulse">
            {text}
          </p>
          <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
            Please wait a moment...
          </p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
        <div className="bg-white/95 dark:bg-slate-900/95 border border-teal-100 dark:border-slate-800 p-8 rounded-3xl shadow-2xl max-w-xs w-full">
          {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
};

export default CartLoader;

