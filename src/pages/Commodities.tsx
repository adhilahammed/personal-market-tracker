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
      const getCommodityName = (commodityId: string) => {
        if (commodityId.includes('USD')) return 'US Dollar (USD)';
        if (commodityId.includes('GOLD_8G_22K')) return 'Gold 22K (8g / 1 Pavan)';
        if (commodityId.includes('GOLD_8G_24K')) return 'Gold 24K (8g)';
        if (commodityId.includes('GOLD_1G_22K')) return 'Gold 22K (1g)';
        if (commodityId.includes('GOLD_10G')) return 'Gold 24K (10g)';
        if (commodityId.includes('GOLD_1G')) return 'Gold 24K (1g)';
        if (commodityId.includes('SILVER_1KG')) return 'Silver (1kg)';
        return 'Silver (1g)';
      };

      const getCommodityUnit = (commodityId: string) => {
        if (commodityId.includes('USD')) return '1 USD ($)';
        if (commodityId.includes('GOLD_8G_22K')) return '8 grams · 1 Pavan (22K)';
        if (commodityId.includes('GOLD_8G_24K')) return '8 grams (24K)';
        if (commodityId.includes('GOLD_1G_22K')) return '1 gram (22K)';
        if (commodityId.includes('GOLD_10G')) return '10 grams';
        if (commodityId.includes('SILVER_1KG')) return '1 kg';
        return '1 gram';
      };

      return (
        quotes[id] || {
          id,
          symbol: id.includes('USD')
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

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Commodities & Currencies (INR)
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
