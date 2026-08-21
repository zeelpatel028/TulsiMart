import React, { useState, useEffect } from 'react';

export const CartLoader = ({ 
  text = "Tulsi Mart Supermarket Portal", 
  duration = 5000,
  fullScreen = false
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervalTime = 50; // update every 50ms
    const step = (intervalTime / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration]);

  const loaderContent = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 font-sans select-none max-w-sm mx-auto">
      
      {/* Transparent Project Logo with Glowing Orbit & Floating Animation */}
      <div className="relative flex items-center justify-center">
        
        {/* Soft Ambient Glow Pulse */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#88BDF2]/40 via-blue-500/20 to-emerald-400/30 blur-3xl animate-pulse" />

        {/* SVG Circular Progress Orbit Ring around Transparent Logo */}
        <svg className="w-32 h-32 sm:w-36 sm:h-36 absolute -inset-3 z-0 animate-spin-slow" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            className="text-slate-700/30 dark:text-slate-800/50"
            fill="none" 
          />
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="url(#logoRingGrad)" 
            strokeWidth="3.5" 
            strokeDasharray="276"
            strokeDashoffset={276 - (276 * progress) / 100}
            strokeLinecap="round" 
            fill="none" 
            className="transition-all duration-75"
          />
          <defs>
            <linearGradient id="logoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#88BDF2" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Transparent Tulsi Mart Logo Image (Clean isolated artwork) */}
        <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center p-1 group hover:scale-105 transition-all duration-300">
          <img
            src="/logo-transparent.png"
            alt="Tulsi Mart Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(136,189,242,0.6)] animate-bounce"
            style={{ animationDuration: '2.2s' }}
          />
        </div>
      </div>

      {/* Brand Header & Progress Status */}
      <div className="w-full space-y-3">
        <h2 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-white tracking-tight font-heading flex items-center justify-center gap-2">
          Tulsi Mart
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#88BDF2]/20 text-[#88BDF2] border border-[#88BDF2]/30 shadow-xs">
            v2.0 🌿
          </span>
        </h2>
        
        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
          {text}
        </p>

        {/* 5-Second Animated Smooth Progress Bar */}
        <div className="w-full pt-2">
          <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-[#88BDF2] via-sky-400 to-emerald-400 rounded-full transition-all duration-75 ease-out shadow-sm"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1.5 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Loading store workspace...
            </span>
            <span className="font-bold text-[#88BDF2]">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl">
        <div className="bg-slate-900/90 rounded-3xl p-8 shadow-2xl border border-slate-800/90 max-w-sm w-full mx-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#88BDF2] to-transparent opacity-80" />
          {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
};

export default CartLoader;
