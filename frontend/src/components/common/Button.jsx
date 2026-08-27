import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline, danger, ghost, light
  size = 'md', // sm, md, lg
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none select-none gap-2";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const variantStyles = {
    primary: "bg-[#384959] hover:bg-[#273440] dark:bg-[#88BDF2] dark:hover:bg-[#BDDDFC] text-white dark:text-[#0F172A] shadow-xs hover:shadow-md border border-[#384959] dark:border-[#88BDF2] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border-slate-300 dark:disabled:border-slate-700",
    accent: "bg-[#88BDF2] hover:bg-[#6A89A7] text-[#384959] dark:text-[#0F172A] hover:text-white shadow-xs hover:shadow-md font-extrabold",
    secondary: "bg-[#6A89A7] hover:bg-[#384959] dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-xs",
    outline: "border border-slate-300 dark:border-slate-700 hover:border-[#6A89A7] dark:hover:border-[#88BDF2] text-[#384959] dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700",
    light: "bg-[#BDDDFC]/50 dark:bg-[#88BDF2]/20 hover:bg-[#BDDDFC] dark:hover:bg-[#88BDF2]/30 text-[#384959] dark:text-[#88BDF2] font-semibold",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
    ghost: "text-slate-600 dark:text-slate-300 hover:text-[#384959] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
  };


  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default Button;
