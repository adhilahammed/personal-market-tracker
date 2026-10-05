import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, PlusCircle } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useStockQuotes } from '../hooks/useStocks';
import { useCryptoQuotes } from '../hooks/useCrypto';
import { useCommodityQuotes } from '../hooks/useCommodities';
import { AssetCard } from '../components/AssetCard';
import { MarketAsset } from '../types/market';

export const FavoritesPage: React.FC = () => {
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  // Split favorite IDs by category
  const favoriteStockSymbols = useMemo(() => {
    return favorites
      .filter((f) => f.category === 'stock')
      .map((f) => f.symbol);
  }, [favorites]);

  const favoriteCryptoIds = useMemo(() => {
    return favorites
      .filter((f) => f.category === 'crypto')
      .map((f) => f.id.split(':')[1] || f.symbol.toLowerCase());
  }, [favorites]);

  // Fetch data
  const { data: stockData, isLoading: isStocksLoading } = useStockQuotes(
    favoriteStockSymbols.length > 0 ? favoriteStockSymbols : undefined
  );
  const { data: cryptoData, isLoading: isCryptoLoading } = useCryptoQuotes(
    favoriteCryptoIds.length > 0 ? favoriteCryptoIds : undefined
  );
  const { data: commodityData, isLoading: isCommoditiesLoading } = useCommodityQuotes();

  const isLoading = isStocksLoading || isCryptoLoading || isCommoditiesLoading;

  // Build ordered asset list
  const assetMap = useMemo(() => {
    const map: Record<string, MarketAsset> = {};
    if (stockData) Object.assign(map, stockData);
    if (cryptoData) Object.assign(map, cryptoData);
    if (commodityData) Object.assign(map, commodityData);
    return map;
  }, [stockData, cryptoData, commodityData]);

  const favoriteAssets = useMemo(() => {
    return favorites
      .map((fav) => {
        const found =
          assetMap[fav.id] ||
          assetMap[fav.symbol.toUpperCase()] ||
          assetMap[fav.symbol.toLowerCase()];

        if (found) return found;

        // Fallback placeholder while loading or if not fetched
        return {
          id: fav.id,
          name: fav.name,
          symbol: fav.symbol,
          category: fav.category,
          price: null,
          change: null,
          changePercent: null,
          lastUpdated: new Date().toISOString(),
        } as MarketAsset;
      })
      .filter(Boolean);
  }, [favorites, assetMap]);

  return (
    <div className="space-y-4">
      {/* Section Subtitle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Watchlist ({favorites.length})
        </h2>
        {isLoading && (
          <span className="text-xs text-blue-500 font-medium animate-pulse">
            Syncing prices...
          </span>
        )}
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark mt-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
            <Star size={28} className="stroke-[2]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Favorites Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1 mb-5">
            Add your favorite Indian stocks, cryptocurrencies, and commodities to track them in one place.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              to="/stocks"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-transform"
            >
              <TrendingUp size={14} />
              Browse Stocks
            </Link>
            <Link
              to="/crypto"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold active:scale-95 transition-transform"
            >
              <PlusCircle size={14} />
              Browse Crypto
            </Link>
          </div>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="grid grid-cols-1 gap-3">
          {favoriteAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              isFavorite={isFavorite(asset.id)}
              onToggleFavorite={() => toggleFavorite(asset)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
