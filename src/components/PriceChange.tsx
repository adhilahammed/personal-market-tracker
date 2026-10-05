import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatChange, formatPercent } from '../utils/formatters';

interface PriceChangeProps {
  change: number | null | undefined;
  changePercent: number | null | undefined;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
}

export const PriceChange: React.FC<PriceChangeProps> = ({
  change,
  changePercent,
  currency = '₹',
  size = 'md',
  showAmount = true,
}) => {
  const isPositive = changePercent !== null && changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== null && changePercent !== undefined && changePercent < 0;
  const isNeutral = !isPositive && !isNegative;

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  }[size];

  const colorClasses = isPositive
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15'
    : isNegative
    ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15'
    : 'text-slate-500 dark:text-slate-400 bg-slate-500/10';

  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  return (
    <div
      className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium font-mono ${colorClasses} ${sizeClasses}`}
      aria-label={`${isPositive ? 'Increased by' : isNegative ? 'Decreased by' : 'No change in'} ${formatPercent(changePercent)}`}
    >
      {isPositive && <TrendingUp size={iconSize} className="stroke-[2.5]" aria-hidden="true" />}
      {isNegative && <TrendingDown size={iconSize} className="stroke-[2.5]" aria-hidden="true" />}
      {isNeutral && <Minus size={iconSize} className="stroke-[2.5]" aria-hidden="true" />}

      {showAmount && change !== null && change !== undefined && (
        <span>{formatChange(change, currency)}</span>
      )}
      <span>{formatPercent(changePercent)}</span>
    </div>
  );
};
