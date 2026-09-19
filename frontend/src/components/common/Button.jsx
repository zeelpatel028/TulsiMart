import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // primary, accent, secondary, light, outline, danger, ghost
  size = 'md', // sm, md, lg
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none select-none gap-2 whitespace-nowrap";


  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const variantStyles = {
    primary: "bg-[#00695C] hover:bg-[#004D40] text-white shadow-xs hover:shadow-md border border-[#00695C] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border-slate-300 dark:disabled:border-slate-700",
    accent: "bg-[#009688] hover:bg-[#00695C] text-white shadow-xs hover:shadow-md font-bold",
    secondary: "bg-[#4DB6AC] hover:bg-[#009688] text-white shadow-xs hover:shadow-md font-bold",
    light: "bg-[#E0F2F1] hover:bg-[#B2DFDB] text-[#00695C] dark:bg-[#00695C]/30 dark:hover:bg-[#00695C]/50 dark:text-[#4DB6AC] font-bold border border-[#B2DFDB] dark:border-[#00695C]/50",
    outline: "border border-[#B2DFDB] dark:border-slate-700 hover:border-[#009688] dark:hover:border-[#4DB6AC] text-[#263238] dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-[#F0FAF9] dark:hover:bg-slate-700",
    danger: "bg-[#E53935] hover:bg-[#c62828] text-white shadow-xs font-bold",
    ghost: "text-[#607D8B] dark:text-slate-300 hover:text-[#00695C] dark:hover:text-white hover:bg-[#E0F2F1]/60 dark:hover:bg-slate-800 border border-transparent",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default Button;
