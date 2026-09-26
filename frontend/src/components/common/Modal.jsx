import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#004D40]/50 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-[#B2DFDB] dark:border-slate-800 overflow-hidden z-10 transition-all transform animate-in zoom-in-95 my-auto max-h-[90vh] sm:max-h-[92vh] flex flex-col`}>
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-[#B2DFDB]/60 dark:border-slate-800 flex items-center justify-between bg-[#F0FAF9] dark:bg-slate-800/80 gap-2">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-[#263238] dark:text-slate-100 truncate font-heading">{title}</h3>
            {subtitle && <p className="text-[11px] sm:text-xs text-[#607D8B] dark:text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#607D8B] hover:text-[#00695C] dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-[#E0F2F1] dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 touch-pan text-[#263238] dark:text-slate-200">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#F0FAF9]/80 dark:bg-slate-800/80 border-t border-[#B2DFDB]/60 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
