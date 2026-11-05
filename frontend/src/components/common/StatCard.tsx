import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  changePercentage?: number | null;
  changeLabel?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-emerald-500/10',
  iconColor = 'text-emerald-400',
  changePercentage,
  changeLabel = 'vs last month',
  subtitle,
}) => {
  const isPositive = (changePercentage ?? 0) >= 0;

  return (
    <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgColor} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      </div>

      {(changePercentage !== undefined && changePercentage !== null) || subtitle ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {changePercentage !== undefined && changePercentage !== null ? (
            <>
              <span
                className={`inline-flex items-center gap-0.5 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                  isPositive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? `+${changePercentage}%` : `${changePercentage}%`}
              </span>
              <span className="text-slate-400">{changeLabel}</span>
            </>
          ) : (
            <span className="text-slate-400">{subtitle}</span>
          )}
        </div>
      ) : null}
    </div>
  );
};
