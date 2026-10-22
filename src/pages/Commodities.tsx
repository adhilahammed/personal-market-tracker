import React, { useMemo, useState } from 'react';
import { useCommodityQuotes } from '../hooks/useCommodities';
import { useFavorites } from '../hooks/useFavorites';
import { AssetCard } from '../components/AssetCard';
import { INITIAL_COMMODITIES } from '../api/commodityApi';
import { Sparkles } from 'lucide-react';

type CommodityFilter = 'all' | 'market' | 'spot' | 'forex';

export const CommoditiesPage: React.FC = () => {
  const { data: quotes, isLoading, isError, refetch } = useCommodityQuotes();
  const { isFavorite, isRecentFavorite, toggleFavorite } = useFavorites();
  const [filter, setFilter] = useState<CommodityFilter>('all');

  const commodityAssets = useMemo(() => {
    if (!quotes) return [];
    return INITIAL_COMMODITIES.map((id) => {
      const getCommodityName = (commodityId: string) => {
        if (commodityId.includes('KERALA_GOLD_8G_22K')) return 'Gold 22K (8g)';
        if (commodityId.includes('KERALA_GOLD_1G_22K')) return 'Gold 22K (1g)';
        if (commodityId.includes('KERALA_GOLD_8G_24K')) return 'Gold 24K (8g)';
        if (commodityId.includes('USD')) return 'US Dollar (USD)';
        if (commodityId.includes('GOLD_8G_22K')) return 'Gold Spot 22K (8g)';
        if (commodityId.includes('GOLD_8G_24K')) return 'Gold Spot 24K (8g)';
        if (commodityId.includes('GOLD_1G_22K')) return 'Gold Spot 22K (1g)';
        if (commodityId.includes('GOLD_10G')) return 'Gold Spot 24K (10g)';
        if (commodityId.includes('GOLD_1G')) return 'Gold Spot 24K (1g)';
        if (commodityId.includes('SILVER_1KG')) return 'Silver (1kg)';
        return 'Silver (1g)';
      };

      const getCommodityUnit = (commodityId: string) => {
        if (commodityId.includes('KERALA_GOLD_8G_22K')) return '22K';
        if (commodityId.includes('KERALA_GOLD_1G_22K')) return '22K';
        if (commodityId.includes('KERALA_GOLD_8G_24K')) return '24K Pure';
        if (commodityId.includes('USD')) return '1 USD ($)';
        if (commodityId.includes('GOLD_8G_22K')) return '22K (Spot)';
        if (commodityId.includes('GOLD_8G_24K')) return '24K (Spot)';
        if (commodityId.includes('GOLD_1G_22K')) return '22K (Spot)';
        if (commodityId.includes('GOLD_10G')) return '24K (Spot)';
        if (commodityId.includes('GOLD_1G')) return '24K (Spot)';
        if (commodityId.includes('SILVER_1KG')) return '1 kg';
        return '1 gram';
      };

      return (
        quotes[id] || {
          id,
          symbol: id.includes('22K')
            ? 'GOLD 22K'
            : id.includes('USD')
            ? 'USD'
            : id.includes('GOLD_8G')
            ? 'GOLD 8G'
            : id.includes('GOLD')
            ? 'GOLD'
            : 'SILVER',
          name: getCommodityName(id),
          category: 'commodity' as const,
          unit: getCommodityUnit(id),
          price: null,
          change: null,
          changePercent: null,
          lastUpdated: new Date().toISOString(),
        }
      );
    });
  }, [quotes]);

  const filteredAssets = useMemo(() => {
    if (filter === 'market') {
      return commodityAssets.filter((a) => a.id.includes('KERALA'));
    }
    if (filter === 'spot') {
      return commodityAssets.filter((a) => a.category === 'commodity' && !a.id.includes('KERALA') && a.id.includes('GOLD'));
    }
    if (filter === 'forex') {
      return commodityAssets.filter((a) => a.id.includes('USD') || a.id.includes('SILVER'));
    }
    return commodityAssets;
  }, [commodityAssets, filter]);

  const marketHighlightAsset = useMemo(() => {
    return commodityAssets.find((a) => a.id === 'commodity:KERALA_GOLD_8G_22K:INR');
  }, [commodityAssets]);

  return (
    <div className="space-y-4">
      {/* Featured Market Gold Highlight Banner */}
      {marketHighlightAsset && marketHighlightAsset.price && (
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-amber-600/5 border border-amber-500/30 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Sparkles size={14} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Gold Market Benchmark (22K)
              </span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
              Live Retail Rate
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                22K (8g)
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                ₹{marketHighlightAsset.price.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                22K 1 Gram
              </div>
              <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
                ₹{((marketHighlightAsset.price) / 8).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
            <span>Standard retail jewellery benchmark (22K 916)</span>
            <span>Excl. GST & making charges</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-card-light dark:bg-card-dark text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border-light dark:border-border-dark'
          }`}
        >
          All Rates
        </button>
        <button
          type="button"
          onClick={() => setFilter('market')}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'market'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'bg-card-light dark:bg-card-dark text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border-light dark:border-border-dark'
          }`}
        >
          <span>Market Rate (22K)</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter('spot')}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'spot'
              ? 'bg-sky-500 text-white font-bold shadow-sm'
              : 'bg-card-light dark:bg-card-dark text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border-light dark:border-border-dark'
          }`}
        >
          <span>Spot Trading</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter('forex')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'forex'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'bg-card-light dark:bg-card-dark text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border-light dark:border-border-dark'
          }`}
        >
          USD & Silver
        </button>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {filter === 'market'
            ? 'Retail Market Rates (22K / 24K)'
            : filter === 'spot'
            ? 'Spot & Bullion Trading Rates'
            : filter === 'forex'
            ? 'Forex & Precious Metals'
            : 'Commodities & Metals (INR)'}
        </h2>
        {isLoading && (
          <span className="text-xs text-blue-500 font-medium animate-pulse">
            Loading live rates...
          </span>
        )}
      </div>

      {isError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <span>Unable to load commodity data. Showing cached data if available.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-bold underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Commodity Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            isFavorite={isFavorite(asset.id)}
            isRecentFavorite={isRecentFavorite(asset.id)}
            onToggleFavorite={() => toggleFavorite(asset)}
            source="commodities"
          />
        ))}
      </div>
    </div>
  );
};
