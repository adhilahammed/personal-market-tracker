import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, WifiOff, Coins } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useStockQuote } from '../hooks/useStocks';
import { useCryptoQuote } from '../hooks/useCrypto';
import { useCommodityQuote } from '../hooks/useCommodities';
import { StockAsset, CryptoAsset, CommodityAsset } from '../types/market';
import { AssetTargetsSection } from '../components/AssetTargetsSection';

export const AssetDetailsPage: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { isFavorite, isRecentFavorite, toggleFavorite, favorites } = useFavorites();

  const decodedId = decodeURIComponent(assetId || '');
  const [category, symbolOrId, exchangeOrParam] = decodedId.split(':');

  const isStock = category === 'stock';
  const isCrypto = category === 'crypto';
  const isCommodity = category === 'commodity';

  // Quotes for metadata/name/status
  const { data: stockData } = useStockQuote(
    symbolOrId || '',
    (exchangeOrParam as 'NSE' | 'BSE') || 'NSE'
  );
  const { data: cryptoData } = useCryptoQuote(symbolOrId || '');
  const { data: commodityData } = useCommodityQuote(decodedId);

  const currentAsset = isStock ? stockData : isCrypto ? cryptoData : isCommodity ? commodityData : null;

  // Fallback name from favorites if quote hasn't returned yet
  const favoriteMatch = favorites.find((f) => f.id === decodedId);
  const displayName = currentAsset?.name || favoriteMatch?.name || symbolOrId || 'Asset';

  const isFav = currentAsset ? isFavorite(currentAsset.id) : isFavorite(decodedId);
  const isRecent = currentAsset ? isRecentFavorite(currentAsset.id) : isRecentFavorite(decodedId);

  const currencySymbol = isCrypto ? '$' : '₹';

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto">
      {/* Top Navigation Bar: Back & Favorite */}
      <div className="flex items-center justify-between -mx-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back to previous screen"
          className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-sm font-bold"
        >
          <ArrowLeft size={18} className="stroke-[2.5]" />
          <span>Back</span>
        </button>

        <button
          type="button"
          aria-label={
            isFav
              ? `Remove ${displayName} from favorites${isRecent ? ' (Added in last 30 days)' : ''}`
              : `Add ${displayName} to favorites`
          }
          title={
            isFav
              ? isRecent
                ? 'Added to favorites in last 30 days'
                : 'Added to favorites before 30 days'
              : 'Add to favorites'
          }
          onClick={() => {
            if (currentAsset) {
              toggleFavorite(currentAsset);
            } else {
              toggleFavorite({
                id: decodedId,
                category: (category as any) || 'stock',
                symbol: symbolOrId || '',
                name: displayName,
                price: null,
                change: null,
                changePercent: null,
                lastUpdated: new Date().toISOString(),
              });
            }
          }}
          className="flex items-center justify-center w-11 h-11 rounded-full text-slate-400 hover:text-amber-400 active:scale-90 transition-transform"
        >
          <Star
            size={24}
            className={`transition-colors ${
              isFav
                ? isRecent
                  ? 'fill-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.55)]'
                  : 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                : 'text-slate-400 dark:text-slate-600'
            }`}
          />
        </button>
      </div>

      {/* Asset Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {displayName}
          </h1>
          {isStock && (currentAsset as StockAsset)?.subType === 'reit' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <Coins size={12} className="stroke-[2.5]" /> REIT
            </span>
          )}
          {isStock && (currentAsset as StockAsset)?.subType === 'invit' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
              <Coins size={12} className="stroke-[2.5]" /> InvIT
            </span>
          )}
          {isStock && !(currentAsset as StockAsset)?.subType && (currentAsset as StockAsset)?.dividendFrequency === 'Quarterly' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <Coins size={12} className="stroke-[2.5]" /> Quarterly Dividend
            </span>
          )}
          {currentAsset?.isOfflineCached && (
            <span
              title="Showing cached data"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full"
            >
              <WifiOff size={11} /> Offline Cached
            </span>
          )}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
          {isStock && `${(currentAsset as StockAsset)?.symbol || symbolOrId} · ${(currentAsset as StockAsset)?.exchange || exchangeOrParam || 'NSE'}${(currentAsset as StockAsset)?.subType ? ` · ${(currentAsset as StockAsset)?.subType?.toUpperCase()}` : (currentAsset as StockAsset)?.capCategory ? ` · ${(currentAsset as StockAsset).capCategory?.toUpperCase()} CAP` : ''}`}
          {isCrypto && `${(currentAsset as CryptoAsset)?.symbol || symbolOrId} · Crypto`}
          {isCommodity && `${(currentAsset as CommodityAsset)?.symbol || symbolOrId} · ${(currentAsset as CommodityAsset)?.unit || 'Precious Metal'}`}
        </div>
      </div>

      {/* Customized Target Levels Section */}
      <AssetTargetsSection
        assetId={decodedId}
        currencySymbol={currencySymbol}
        assetName={displayName}
      />
    </div>
  );
};
