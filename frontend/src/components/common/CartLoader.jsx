import React from 'react';

export const CartLoader = ({ 
  text = "Loading...", 
  fullScreen = false,
  size = "md"
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-9 h-9 border-3",
    lg: "w-12 h-12 border-4"
  }[size] || "w-9 h-9 border-3";

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 font-sans select-none">
      {/* Simple Animated Spinner */}
      <div 
        className={`${sizeClasses} border-slate-200 dark:border-slate-800 border-t-[#009688] dark:border-t-[#4DB6AC] rounded-full animate-spin`} 
      />
      {text && (
        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default CartLoader;
