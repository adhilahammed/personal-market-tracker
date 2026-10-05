import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, WifiOff } from 'lucide-react';
import { MarketAsset } from '../types/market';
import { PriceChange } from './PriceChange';
import { formatCurrency } from '../utils/formatters';

interface AssetCardProps {
  asset: MarketAsset;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isFavorite,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/asset/${encodeURIComponent(asset.id)}`);
  };

  const getSubtitle = () => {
    if (asset.category === 'stock') {
      return `${asset.symbol} · ${asset.exchange}`;
    }
    if (asset.category === 'crypto') {
      return `${asset.symbol} · Crypto`;
    }
    return `${asset.symbol} · ${asset.unit}`;
  };

  const currency = asset.category === 'crypto' ? '$' : '₹';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm hover:border-blue-500/40 active:scale-[0.98] transition-all cursor-pointer select-none"
      id={`asset-card-${asset.symbol.toLowerCase()}`}
    >
      {/* Header: Name, Subtitle and Star */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {asset.name}
            </h2>
            {asset.isOfflineCached && (
              <span
                title="Cached data (offline)"
                className="inline-flex items-center text-amber-500"
                aria-label="Offline cached"
              >
                <WifiOff size={13} />
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
            {getSubtitle()}
          </p>
        </div>

        {/* Favorite Button (Minimum 44x44px touch target) */}
        <button
          type="button"
          aria-label={
            isFavorite
              ? `Remove ${asset.name} from favorites`
              : `Add ${asset.name} to favorites`
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className="flex items-center justify-center -mr-2 -mt-2 w-11 h-11 rounded-full text-slate-400 hover:text-amber-400 active:scale-90 transition-transform focus:outline-none"
        >
          <Star
            size={22}
            className={`transition-colors ${
              isFavorite
                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : 'text-slate-400 dark:text-slate-600 hover:text-amber-400'
            }`}
          />
        </button>
      </div>

      {/* Price & Change */}
      <div className="mt-3.5 flex items-baseline justify-between gap-2">
        <div className="text-xl font-bold font-mono tracking-tight text-slate-950 dark:text-white">
          {formatCurrency(asset.price, currency)}
        </div>
        <PriceChange
          change={asset.change}
          changePercent={asset.changePercent}
          currency={currency}
          size="sm"
          showAmount={true}
        />
      </div>
    </div>
  );
};
