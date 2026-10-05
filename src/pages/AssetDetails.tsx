import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, WifiOff } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useStockQuote, useStockHistory } from '../hooks/useStocks';
import { useCryptoQuote, useCryptoHistory } from '../hooks/useCrypto';
import { useCommodityQuote, useCommodityHistory } from '../hooks/useCommodities';
import { PriceChange } from '../components/PriceChange';
import { MarketChart } from '../components/MarketChart';
import { TimePeriod, StockAsset, CryptoAsset, CommodityAsset } from '../types/market';
import { formatCurrency, formatCompactNumber, formatTimestamp } from '../utils/formatters';

export const AssetDetailsPage: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<TimePeriod>('1M');
  const { isFavorite, toggleFavorite } = useFavorites();

  const decodedId = decodeURIComponent(assetId || '');
  const [category, symbolOrId, exchangeOrParam] = decodedId.split(':');

  // Hooks for each category
  const isStock = category === 'stock';
  const isCrypto = category === 'crypto';
  const isCommodity = category === 'commodity';

  // Stock queries
  const {
    data: stockData,
    isLoading: isStockLoading,
    error: stockError,
  } = useStockQuote(symbolOrId || '', (exchangeOrParam as 'NSE' | 'BSE') || 'NSE');
  const { data: stockHistory, isLoading: isStockHistoryLoading } = useStockHistory(
    symbolOrId || '',
    period,
    (exchangeOrParam as 'NSE' | 'BSE') || 'NSE'
  );

  // Crypto queries
  const {
    data: cryptoData,
    isLoading: isCryptoLoading,
    error: cryptoError,
  } = useCryptoQuote(symbolOrId || '');
  const { data: cryptoHistory, isLoading: isCryptoHistoryLoading } = useCryptoHistory(
    symbolOrId || '',
    period
  );

  // Commodity queries
  const {
    data: commodityData,
    isLoading: isCommodityLoading,
    error: commodityError,
  } = useCommodityQuote(decodedId);
  const { data: commodityHistory, isLoading: isCommodityHistoryLoading } = useCommodityHistory(
    decodedId,
    period
  );

  // Combine data
  const currentAsset = isStock ? stockData : isCrypto ? cryptoData : isCommodity ? commodityData : null;
  const isLoading = isStock ? isStockLoading : isCrypto ? isCryptoLoading : isCommodityLoading;
  const historyData = isStock ? stockHistory : isCrypto ? cryptoHistory : commodityHistory;
  const isHistoryLoading = isStock ? isStockHistoryLoading : isCrypto ? isCryptoHistoryLoading : isCommodityHistoryLoading;
  const error = isStock ? stockError : isCrypto ? cryptoError : commodityError;

  const isFav = currentAsset ? isFavorite(currentAsset.id) : false;
  const isPositive = currentAsset?.changePercent !== null && currentAsset?.changePercent !== undefined && currentAsset.changePercent >= 0;

  if (isLoading && !currentAsset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading asset details...
        </span>
      </div>
    );
  }

  if (error && !currentAsset) {
    return (
      <div className="space-y-4 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            Unable to load market data for this asset.
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Please verify the asset symbol or check your connection.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
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

        {currentAsset && (
          <button
            type="button"
            aria-label={
              isFav
                ? `Remove ${currentAsset.name} from favorites`
                : `Add ${currentAsset.name} to favorites`
            }
            onClick={() => toggleFavorite(currentAsset)}
            className="flex items-center justify-center w-11 h-11 rounded-full text-slate-400 hover:text-amber-400 active:scale-90 transition-transform"
          >
            <Star
              size={24}
              className={`transition-colors ${
                isFav
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            />
          </button>
        )}
      </div>

      {/* Asset Hero Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {currentAsset?.name || symbolOrId}
          </h1>
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
          {isStock && `${(currentAsset as StockAsset)?.symbol || symbolOrId} · ${(currentAsset as StockAsset)?.exchange || 'NSE'}`}
          {isCrypto && `${(currentAsset as CryptoAsset)?.symbol || symbolOrId} · Crypto`}
          {isCommodity && `${(currentAsset as CommodityAsset)?.symbol || symbolOrId} · ${(currentAsset as CommodityAsset)?.unit || 'Precious Metal'}`}
        </div>
      </div>

      {/* Hero Price & Change Badge */}
      <div className="flex items-baseline justify-between gap-3 p-4 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            Current Price
          </div>
          <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-950 dark:text-white">
            {formatCurrency(currentAsset?.price, isCrypto ? '$' : '₹')}
          </div>
        </div>

        <PriceChange
          change={currentAsset?.change}
          changePercent={currentAsset?.changePercent}
          currency={isCrypto ? '$' : '₹'}
          size="lg"
          showAmount={true}
        />
      </div>

      {/* Responsive Market Chart */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
          Historical Performance
        </div>
        <MarketChart
          data={historyData || []}
          isLoading={isHistoryLoading}
          selectedPeriod={period}
          onPeriodChange={setPeriod}
          currency={isCrypto ? '$' : '₹'}
          isPositive={isPositive}
        />
      </div>

      {/* Market Statistics & Key Information Grid */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Market Information
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* For Stocks */}
          {isStock && (
            <>
              <StatItem label="Open" value={formatCurrency((currentAsset as StockAsset)?.open, '₹')} />
              <StatItem label="Day High" value={formatCurrency((currentAsset as StockAsset)?.high24h, '₹')} />
              <StatItem label="Day Low" value={formatCurrency((currentAsset as StockAsset)?.low24h, '₹')} />
              <StatItem label="Prev. Close" value={formatCurrency((currentAsset as StockAsset)?.previousClose, '₹')} />
              <StatItem label="Volume" value={formatCompactNumber((currentAsset as StockAsset)?.volume, '₹')} />
              <StatItem label="Exchange" value={(currentAsset as StockAsset)?.exchange || 'NSE'} />
            </>
          )}

          {/* For Crypto */}
          {isCrypto && (
            <>
              <StatItem label="24h High" value={formatCurrency((currentAsset as CryptoAsset)?.high24h, '$')} />
              <StatItem label="24h Low" value={formatCurrency((currentAsset as CryptoAsset)?.low24h, '$')} />
              <StatItem label="Market Cap" value={formatCompactNumber((currentAsset as CryptoAsset)?.marketCap, '$')} />
              <StatItem label="24h Volume" value={formatCompactNumber((currentAsset as CryptoAsset)?.volume, '$')} />
              <StatItem
                label="Rank"
                value={(currentAsset as CryptoAsset)?.marketCapRank ? `#${(currentAsset as CryptoAsset).marketCapRank}` : 'N/A'}
              />
              <StatItem label="Pair" value="USD ($)" />
            </>
          )}

          {/* For Commodities */}
          {isCommodity && (
            <>
              <StatItem label="Unit" value={(currentAsset as CommodityAsset)?.unit || 'N/A'} />
              <StatItem label="Day High" value={formatCurrency((currentAsset as CommodityAsset)?.high24h, '₹')} />
              <StatItem label="Day Low" value={formatCurrency((currentAsset as CommodityAsset)?.low24h, '₹')} />
              <StatItem label="Prev. Close" value={formatCurrency((currentAsset as CommodityAsset)?.previousClose, '₹')} />
              <StatItem label="Benchmark" value="LBMA / Physical Spot" />
              <StatItem label="Currency" value="INR (₹)" />
            </>
          )}
        </div>
      </div>

      {/* Footer Update Notice */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2">
        <Clock size={13} />
        <span>Last data timestamp: {formatTimestamp(currentAsset?.lastUpdated)}</span>
      </div>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100 mt-0.5 truncate">
        {value}
      </span>
    </div>
  );
};
