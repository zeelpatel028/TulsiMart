import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  trendLabel = 'vs last month',
  color = 'navy', // navy, sky, slate, light
  prefix = '',
  suffix = '',
  onClick
}) => {
  const colorSchemes = {
    navy: {
      iconBg: 'bg-[#384959]/10 text-[#384959] dark:bg-[#88BDF2]/20 dark:text-[#88BDF2]',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-[#384959]/5 dark:bg-[#88BDF2]/10 text-[#384959] dark:text-[#88BDF2]'
    },
    sky: {
      iconBg: 'bg-[#88BDF2]/20 text-[#384959] dark:bg-[#88BDF2]/30 dark:text-[#BDDDFC]',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300'
    },
    slate: {
      iconBg: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
    },
    light: {
      iconBg: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.navy;

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 ${scheme.cardBg} ${onClick ? 'cursor-pointer hover:border-[#88BDF2]/50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide truncate">{title}</p>
          <h3 className="text-2xl font-black text-[#384959] dark:text-slate-100 mt-1.5 font-heading tracking-tight truncate">
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl shrink-0 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>


      {change !== undefined && (
        <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 text-[11px] sm:text-xs">
          <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
            isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {change}%
          </span>
          <span className="text-slate-400 font-medium truncate">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
