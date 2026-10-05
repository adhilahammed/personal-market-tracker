import React, { useMemo } from 'react';
import { useCommodityQuotes } from '../hooks/useCommodities';
import { useFavorites } from '../hooks/useFavorites';
import { AssetCard } from '../components/AssetCard';
import { INITIAL_COMMODITIES } from '../api/commodityApi';

export const CommoditiesPage: React.FC = () => {
  const { data: quotes, isLoading, isError, refetch } = useCommodityQuotes();
  const { isFavorite, toggleFavorite } = useFavorites();

  const commodityAssets = useMemo(() => {
    if (!quotes) return [];
    return INITIAL_COMMODITIES.map((id) => {
      return (
        quotes[id] || {
          id,
          symbol: id.includes('GOLD') ? 'GOLD' : 'SILVER',
          name: id.includes('GOLD_10G')
            ? 'Gold (24K, 10g)'
            : id.includes('GOLD_1G')
            ? 'Gold (24K, 1g)'
            : id.includes('SILVER_1KG')
            ? 'Silver (1kg)'
            : 'Silver (1g)',
          category: 'commodity' as const,
          unit: id.includes('10G') ? '10 grams' : id.includes('1KG') ? '1 kg' : '1 gram',
          price: null,
          change: null,
          changePercent: null,
          lastUpdated: new Date().toISOString(),
        }
      );
    });
  }, [quotes]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Precious Metals (INR)
        </h2>
        {isLoading && (
          <span className="text-xs text-blue-500 font-medium animate-pulse">
            Loading live commodity rates...
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
        {commodityAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            isFavorite={isFavorite(asset.id)}
            onToggleFavorite={() => toggleFavorite(asset)}
          />
        ))}
      </div>
    </div>
  );
};
