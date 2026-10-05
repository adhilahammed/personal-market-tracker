import React, { useState, useMemo } from 'react';
import { HistoricalPrice, TimePeriod } from '../types/market';
import { formatCurrency } from '../utils/formatters';

interface MarketChartProps {
  data: HistoricalPrice[];
  isLoading?: boolean;
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  currency?: string;
  isPositive?: boolean;
}

const PERIODS: TimePeriod[] = ['1W', '1M', '6M', '1Y'];

export const MarketChart: React.FC<MarketChartProps> = ({
  data,
  isLoading = false,
  selectedPeriod,
  onPeriodChange,
  currency = '₹',
  isPositive = true,
}) => {
  const [touchIndex, setTouchIndex] = useState<number | null>(null);

  // Compute min, max, points
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    // Viewport SVG coordinates: 360 wide, 180 high
    const width = 360;
    const height = 180;
    const paddingX = 10;
    const paddingTop = 20;
    const paddingBottom = 20;
    const usableHeight = height - paddingTop - paddingBottom;
    const usableWidth = width - paddingX * 2;

    const points = data.map((d, index) => {
      const x = paddingX + (index / (data.length - 1 || 1)) * usableWidth;
      const normalizedPrice = (d.price - min) / range;
      const y = height - paddingBottom - normalizedPrice * usableHeight;
      return { x, y, ...d };
    });

    // Create SVG path
    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x.toFixed(1)},${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }, '');

    // Area fill path closing down to bottom
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height} L ${points[0].x.toFixed(1)},${height} Z`;

    return {
      points,
      pathD,
      areaD,
      min,
      max,
      width,
      height,
    };
  }, [data]);

  const activePoint = touchIndex !== null && chartData ? chartData.points[touchIndex] : null;

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    if (!chartData || chartData.points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = offsetX / rect.width;
    const targetIdx = Math.round(ratio * (chartData.points.length - 1));
    setTouchIndex(Math.max(0, Math.min(chartData.points.length - 1, targetIdx)));
  };

  const handleTouchEnd = () => {
    setTouchIndex(null);
  };

  const strokeColor = isPositive ? '#10B981' : '#EF4444';
  const fillGradientStart = isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';

  return (
    <div className="w-full flex flex-col rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-4 shadow-sm select-none">
      {/* Chart Header: Active Scrubber Price or Min/Max Range */}
      <div className="flex items-center justify-between mb-3 min-h-[36px]">
        <div>
          {activePoint ? (
            <div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {formatCurrency(activePoint.price, currency)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {new Date(activePoint.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          ) : chartData ? (
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Low: <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(chartData.min, currency)}</span> · High: <span className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(chartData.max, currency)}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Price Performance</span>
          )}
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onPeriodChange(period)}
              className={`min-w-[40px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === period
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative w-full h-44 flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading chart...</span>
          </div>
        ) : !chartData || chartData.points.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-xs text-slate-400 dark:text-slate-500">
            <span>Historical data unavailable</span>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${chartData.width} ${chartData.height}`}
            className="w-full h-full overflow-visible touch-none"
            preserveAspectRatio="none"
            onTouchStart={handleTouchMove}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleTouchMove}
            onMouseLeave={handleTouchEnd}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillGradientStart} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* Grid Line */}
            <line
              x1="0"
              y1={chartData.height - 20}
              x2={chartData.width}
              y2={chartData.height - 20}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-slate-200 dark:text-slate-800"
            />

            {/* Area Fill */}
            <path d={chartData.areaD} fill="url(#chartGradient)" />

            {/* Line Stroke */}
            <path
              d={chartData.pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Touch Indicator Crosshair & Dot */}
            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={0}
                  x2={activePoint.x}
                  y2={chartData.height}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="text-slate-400 dark:text-slate-500"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="5"
                  fill={strokeColor}
                  className="stroke-white dark:stroke-slate-900 stroke-2"
                />
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
};
