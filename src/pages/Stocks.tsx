import React, { useState, useMemo } from 'react';
import { useStockQuotes } from '../hooks/useStocks';
import { useFavorites } from '../hooks/useFavorites';
import {
  INITIAL_STOCKS,
  LARGE_CAP_STOCKS,
  MID_CAP_STOCKS,
  SMALL_CAP_STOCKS,
  stockApi,
} from '../api/stockApi';
import { AssetCard } from '../components/AssetCard';
import { SearchBar } from '../components/SearchBar';
import { SearchResult, MarketCapCategory } from '../types/market';
import { Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CapFilter = 'all' | MarketCapCategory;

const CAP_TABS: { id: CapFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'large', label: 'Large Cap' },
  { id: 'mid', label: 'Mid Cap' },
  { id: 'small', label: 'Small Cap' },
];

export const StocksPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCap, setActiveCap] = useState<CapFilter>('all');
  const navigate = useNavigate();

  // Symbols to fetch based on active tab
  const activeSymbols = useMemo(() => {
    switch (activeCap) {
      case 'large':
        return LARGE_CAP_STOCKS;
      case 'mid':
        return MID_CAP_STOCKS;
      case 'small':
        return SMALL_CAP_STOCKS;
      case 'all':
      default:
        return INITIAL_STOCKS;
    }
  }, [activeCap]);

  const { data: quotes, isLoading, isError, refetch } = useStockQuotes(activeSymbols);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Handle Search
  const searchResults: SearchResult[] = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return stockApi.searchStocks(searchQuery);
  }, [searchQuery]);

  // Active stock assets
  const currentStockAssets = useMemo(() => {
    if (!quotes) return [];
    return activeSymbols.map((sym) => {
      const id = `stock:${sym}:NSE`;
      return (
        quotes[id] ||
        quotes[sym] || {
          id,
          symbol: sym,
          name: stockApi.getStockName(sym),
          category: 'stock' as const,
          exchange: 'NSE' as const,
          capCategory: stockApi.getStockCapCategory(sym),
          price: null,
          change: null,
          changePercent: null,
          open: null,
          high24h: null,
          low24h: null,
          previousClose: null,
          volume: null,
          lastUpdated: new Date().toISOString(),
        }
      );
    });
  }, [quotes, activeSymbols]);

  const getCapBadge = (cap?: MarketCapCategory) => {
    switch (cap) {
      case 'large':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Large Cap
          </span>
        );
      case 'mid':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Mid Cap
          </span>
        );
      case 'small':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Small Cap
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search stocks (e.g. Zomato, Trent, Suzlon, IRFC)..."
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Market Cap Filter Chips (Only show when not actively searching) */}
      {!searchQuery.trim() && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CAP_TABS.map((tab) => {
            const isActive = activeCap === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCap(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-card-light dark:bg-card-dark text-slate-600 dark:text-slate-400 border border-border-light dark:border-border-dark hover:border-slate-400 active:scale-95'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* If Searching, show search results */}
      {searchQuery.trim() ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Search Results ({searchResults.length})
          </div>

          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark">
              No matching stocks found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((res) => {
                const fav = isFavorite(res.id);
                const isDirectLookup = res.name.includes('Direct NSE Lookup');
                return (
                  <div
                    key={res.id}
                    onClick={() => navigate(`/asset/${encodeURIComponent(res.id)}`)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {res.name}
                        </span>
                        {getCapBadge(res.capCategory)}
                        {isDirectLookup && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Live Lookup
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {res.symbol} · {res.exchange || 'NSE'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        aria-label={fav ? `Remove ${res.name} from favorites` : `Add ${res.name} to favorites`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(res);
                        }}
                        className="flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-amber-400 active:scale-90 transition-transform"
                      >
                        <Star
                          size={20}
                          className={fav ? 'fill-amber-400 text-amber-400' : 'text-slate-400 dark:text-slate-600'}
                        />
                      </button>
                      <ArrowRight size={16} className="text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Regular Stocks List */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {activeCap === 'all'
                ? 'Featured Stocks (Large, Mid & Small)'
                : activeCap === 'large'
                ? 'Large Cap Stocks (Nifty 50)'
                : activeCap === 'mid'
                ? 'Mid Cap Stocks (High Growth)'
                : 'Small Cap Stocks (High Momentum)'}
            </h2>
            {isLoading && (
              <span className="text-xs text-blue-500 font-medium animate-pulse">
                Loading live quotes...
              </span>
            )}
          </div>

          {isError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
              <span>Unable to load stock quotes. Showing cached data if available.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="font-bold underline ml-2"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {currentStockAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isFavorite={isFavorite(asset.id)}
                onToggleFavorite={() => toggleFavorite(asset)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
