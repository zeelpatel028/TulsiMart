import React from 'react';
import { PackageOpen, Plus, RefreshCw } from 'lucide-react';

/**
 * Modern, premium Empty State Notice UI component
 * 
 * @param {Object} props
 * @param {React.ComponentType} [props.icon] - Lucide icon component
 * @param {string} [props.title] - Main notice title
 * @param {string} [props.description] - Subtext or explanatory guide
 * @param {string} [props.actionLabel] - Primary action button text
 * @param {Function} [props.onAction] - Primary action click handler
 * @param {React.ComponentType} [props.actionIcon] - Icon for primary action
 * @param {string} [props.secondaryActionLabel] - Secondary action button text
 * @param {Function} [props.onSecondaryAction] - Secondary action click handler
 * @param {React.ComponentType} [props.secondaryActionIcon] - Icon for secondary action
 * @param {'default' | 'card' | 'table' | 'compact'} [props.variant='default'] - Visual style
 * @param {number} [props.colSpan=1] - Column span for table variant
 * @param {string} [props.className] - Additional custom classes
 * @param {React.ReactNode} [props.children] - Optional custom content
 */
export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No Data Found',
  description = 'There are no records available at the moment.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionIcon: SecondaryActionIcon = RefreshCw,
  variant = 'default',
  colSpan = 1,
  className = '',
  children,
}) => {
  const isCompact = variant === 'compact';

  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200 ${
        isCompact ? 'py-6 px-3' : 'py-12 sm:py-16 px-4'
      } ${
        variant === 'card'
          ? 'bg-white/60 dark:bg-slate-900/60 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-xs'
          : ''
      } ${className}`}
    >
      {/* Ambient glowing icon container */}
      <div className="relative mb-3 sm:mb-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#88BDF2]/30 to-[#BDDDFC]/20 dark:from-[#88BDF2]/20 dark:to-transparent rounded-3xl blur-md" />
        <div
          className={`relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-center ${
            isCompact ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'
          }`}
        >

          <Icon
            className={`text-[#384959] dark:text-[#88BDF2] ${
              isCompact ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'
            }`}
            strokeWidth={1.75}
          />
        </div>
      </div>

      {/* Title */}
      <h3
        className={`font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading ${
          isCompact ? 'text-sm' : 'text-base sm:text-lg'
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={`text-slate-500 dark:text-slate-400 mt-1 max-w-sm sm:max-w-md mx-auto leading-relaxed ${
            isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'
          }`}
        >
          {description}
        </p>
      )}

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel || children) && (
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-[#384959] hover:bg-[#273440] dark:bg-[#88BDF2] dark:hover:bg-[#BDDDFC] text-white dark:text-[#384959] shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {SecondaryActionIcon && <SecondaryActionIcon className="w-3.5 h-3.5" />}
              <span>{secondaryActionLabel}</span>
            </button>
          )}

          {children}
        </div>
      )}
    </div>
  );

  if (variant === 'table') {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          {content}
        </td>
      </tr>
    );
  }

  return content;
};

export default EmptyState;
