import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, Clock, WifiOff, Coins, BarChart3, Layers } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useStockQuote, useStockHistory } from '../hooks/useStocks';
import { useCryptoQuote, useCryptoHistory } from '../hooks/useCrypto';
import { useCommodityQuote, useCommodityHistory } from '../hooks/useCommodities';
import { PriceChange } from '../components/PriceChange';
import { MarketChart } from '../components/MarketChart';
import { TimePeriod, StockAsset, CryptoAsset, CommodityAsset } from '../types/market';
import { formatCurrency, formatCompactNumber, formatTimestamp } from '../utils/formatters';
import { AssetTargetsSection } from '../components/AssetTargetsSection';

export const AssetDetailsPage: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<TimePeriod>('1M');
  const { isFavorite, isRecentFavorite, toggleFavorite, favorites } = useFavorites();

  const decodedId = decodeURIComponent(assetId || '');
  const [category, symbolOrId, exchangeOrParam] = decodedId.split(':');

  // Check if navigation originated from Favorites
  const fromSource = searchParams.get('from');
  const isFromFavorites = fromSource === 'favorites';

  // Active view: defaults to 'targets' if from favorites, otherwise 'overview'
  const [activeTab, setActiveTab] = useState<'overview' | 'targets'>(() =>
    isFromFavorites ? 'targets' : 'overview'
  );

  // Sync tab if user navigates between assets or query changes
  useEffect(() => {
    setActiveTab(isFromFavorites ? 'targets' : 'overview');
  }, [isFromFavorites, decodedId]);

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

  // Fallback name from favorites if available
  const favoriteMatch = favorites.find((f) => f.id === decodedId);
  const displayName = currentAsset?.name || favoriteMatch?.name || symbolOrId || 'Asset';

  const isFav = currentAsset ? isFavorite(currentAsset.id) : isFavorite(decodedId);
  const isRecent = currentAsset ? isRecentFavorite(currentAsset.id) : isRecentFavorite(decodedId);
  const isPositive =
    currentAsset?.changePercent !== null &&
    currentAsset?.changePercent !== undefined &&
    currentAsset.changePercent >= 0;

  const currencySymbol = isCrypto ? '$' : '₹';

  // Handle Tab Switch and update URL search param cleanly
  const handleTabChange = (tab: 'overview' | 'targets') => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'targets') {
      newParams.set('from', 'favorites');
    } else {
      newParams.delete('from');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Loading state for overview mode when no asset data is ready
  if (activeTab === 'overview' && isLoading && !currentAsset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading asset details...
        </span>
      </div>
    );
  }

  // Error state for overview mode
  if (activeTab === 'overview' && error && !currentAsset) {
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
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Please verify the asset symbol or check your connection.
          </p>
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

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-border-light dark:border-border-dark text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('targets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'targets'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Target Strategy</span>
          </button>
        </div>

        {/* Favorite Button */}
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

      {/* Asset Hero Header */}
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

      {/* VIEW 1: TARGET STRATEGY (Default when clicked from Favorites) */}
      {activeTab === 'targets' && (
        <AssetTargetsSection
          assetId={decodedId}
          currencySymbol={currencySymbol}
          assetName={displayName}
        />
      )}

      {/* VIEW 2: ORIGINAL DETAILS FLOW (Default when clicked from Stocks, Crypto, Commodities, etc.) */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Hero Price & Change Badge */}
          <div className="flex items-baseline justify-between gap-3 p-4 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                Current Price
              </div>
              <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-950 dark:text-white">
                {formatCurrency(currentAsset?.price, currencySymbol)}
              </div>
            </div>

            <PriceChange
              change={currentAsset?.change}
              changePercent={currentAsset?.changePercent}
              currency={currencySymbol}
              size="lg"
              showAmount={true}
            />
          </div>

          {/* REIT / InvIT Quarterly Distribution Educational Banner */}
          {isStock && ((currentAsset as StockAsset)?.subType === 'reit' || (currentAsset as StockAsset)?.subType === 'invit' || (currentAsset as StockAsset)?.dividendFrequency === 'Quarterly') && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <Coins size={18} className="stroke-[2.5]" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                  {(currentAsset as StockAsset)?.subType === 'reit'
                    ? 'REIT · SEBI Mandated Quarterly Distribution'
                    : (currentAsset as StockAsset)?.subType === 'invit'
                    ? 'InvIT · SEBI Mandated Quarterly Distribution'
                    : 'Quarterly Dividend Paying Asset'}
                </div>
                <p className="leading-relaxed opacity-90 text-[11px]">
                  {(currentAsset as StockAsset)?.subType === 'reit' || (currentAsset as StockAsset)?.subType === 'invit'
                    ? 'Under SEBI regulations, at least 90% of Net Distributable Cash Flows (NDCF) must be distributed to unitholders. In practice, listed Indian trusts pay distributions every quarter (interest, dividends, and capital repayments).'
                    : 'This asset distributes cash dividends to shareholders on a regular quarterly schedule.'}
                </p>
              </div>
            </div>
          )}

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
              currency={currencySymbol}
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
                  <StatItem
                    label="Segment"
                    value={
                      (currentAsset as StockAsset)?.subType === 'reit'
                        ? 'Real Estate Inv. Trust'
                        : (currentAsset as StockAsset)?.subType === 'invit'
                        ? 'Infrastructure Inv. Trust'
                        : (currentAsset as StockAsset)?.capCategory === 'large'
                        ? 'Large Cap (Nifty 50)'
                        : (currentAsset as StockAsset)?.capCategory === 'mid'
                        ? 'Mid Cap'
                        : (currentAsset as StockAsset)?.capCategory === 'small'
                        ? 'Small Cap'
                        : 'NSE Listed'
                    }
                  />
                  <StatItem
                    label="Payout Frequency"
                    value={
                      (currentAsset as StockAsset)?.subType === 'reit' || (currentAsset as StockAsset)?.subType === 'invit' || (currentAsset as StockAsset)?.dividendFrequency === 'Quarterly'
                        ? 'Quarterly (Every 3 Mo)'
                        : 'Periodic'
                    }
                  />
                  <StatItem label="Exchange" value={(currentAsset as StockAsset)?.exchange || 'NSE'} />
                  <StatItem label="Currency" value="INR (₹)" />
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
                  <StatItem
                    label="Weight / Unit"
                    value={
                      decodedId.includes('8G')
                        ? '8 grams'
                        : decodedId.includes('1G')
                        ? '1 gram'
                        : decodedId.includes('10G')
                        ? '10 grams'
                        : decodedId.includes('1KG')
                        ? '1 kg'
                        : (currentAsset as CommodityAsset)?.unit || 'N/A'
                    }
                  />
                  <StatItem label="Day High" value={formatCurrency((currentAsset as CommodityAsset)?.high24h, '₹')} />
                  <StatItem label="Day Low" value={formatCurrency((currentAsset as CommodityAsset)?.low24h, '₹')} />
                  <StatItem label="Prev. Close" value={formatCurrency((currentAsset as CommodityAsset)?.previousClose, '₹')} />
                  <StatItem
                    label="Benchmark"
                    value={
                      decodedId.includes('KERALA')
                        ? 'Retail Market Benchmark'
                        : 'LBMA / Bullion Spot'
                    }
                  />
                  <StatItem
                    label="Market Type"
                    value={
                      decodedId.includes('KERALA')
                        ? 'Physical Jewellery Retail'
                        : 'Spot Bullion Trading'
                    }
                  />
                  {decodedId.includes('KERALA') && (
                    <>
                      <StatItem
                        label="Purity Grade"
                        value={decodedId.includes('22K') ? '22K (916 Hallmark)' : '24K (999 Pure)'}
                      />
                      <StatItem label="Standard" value="BIS 916 Hallmark" />
                    </>
                  )}
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
      )}
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
