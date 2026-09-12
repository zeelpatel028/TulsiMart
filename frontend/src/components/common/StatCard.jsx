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
      iconBg: 'bg-[#E0F2F1] text-[#00695C] dark:bg-[#00695C]/30 dark:text-[#4DB6AC]',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-[#E0F2F1]/50 dark:bg-[#00695C]/20 text-[#00695C] dark:text-[#4DB6AC]'
    },
    sky: {
      iconBg: 'bg-[#E0F2F1] text-[#009688] dark:bg-teal-950/40 dark:text-[#4DB6AC]',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-[#E0F2F1] dark:bg-teal-950/30 text-[#009688] dark:text-[#4DB6AC]'
    },
    slate: {
      iconBg: 'bg-[#FFF8E1] text-[#FBC02D] dark:bg-amber-950/30 dark:text-amber-400',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-[#FFF8E1] dark:bg-amber-950/30 text-[#263238] dark:text-amber-300'
    },
    light: {
      iconBg: 'bg-[#E0F2F1] text-[#00695C] dark:bg-teal-950/40 dark:text-[#4DB6AC]',
      cardBg: 'bg-white dark:bg-slate-900',
      tagBg: 'bg-[#E0F2F1] dark:bg-teal-950/30 text-[#00695C] dark:text-[#4DB6AC]'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.navy;

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-3xl border border-[#B2DFDB] dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 ${scheme.cardBg} ${onClick ? 'cursor-pointer hover:border-[#009688]' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#607D8B] dark:text-slate-400 tracking-wide truncate">{title}</p>
          <h3 className="text-2xl font-black text-[#263238] dark:text-slate-100 mt-1.5 font-heading tracking-tight truncate">
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
            isPositive ? 'text-[#00695C] bg-[#E0F2F1]' : 'text-[#E53935] bg-[#FFEBEE]'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {change}%
          </span>
          <span className="text-[#607D8B] dark:text-slate-400 font-medium truncate">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
