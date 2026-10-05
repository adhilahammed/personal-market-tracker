import React, { useState, useMemo } from 'react';
import { useCryptoQuotes } from '../hooks/useCrypto';
import { useFavorites } from '../hooks/useFavorites';
import { INITIAL_CRYPTO_IDS, cryptoApi } from '../api/cryptoApi';
import { AssetCard } from '../components/AssetCard';
import { SearchBar } from '../components/SearchBar';
import { SearchResult } from '../types/market';
import { Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CryptoPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: quotes, isLoading, isError, refetch } = useCryptoQuotes(INITIAL_CRYPTO_IDS);
  const { isFavorite, toggleFavorite } = useFavorites();

  // Handle Search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await cryptoApi.searchCrypto(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const initialCryptoAssets = useMemo(() => {
    if (!quotes) return [];
    return INITIAL_CRYPTO_IDS.map((id) => {
      const fullId = `crypto:${id}:INR`;
      return (
        quotes[fullId] ||
        quotes[id] || {
          id: fullId,
          symbol: id.toUpperCase(),
          name: id.charAt(0).toUpperCase() + id.slice(1),
          category: 'crypto' as const,
          price: null,
          change: null,
          changePercent: null,
          high24h: null,
          low24h: null,
          marketCap: null,
          volume: null,
          lastUpdated: new Date().toISOString(),
        }
      );
    });
  }, [quotes]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search crypto (e.g. Bitcoin, Solana, ADA)..."
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* If Searching */}
      {searchQuery.trim() ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span>Search Results ({searchResults.length})</span>
            {isSearching && <span className="text-blue-500 animate-pulse">Searching...</span>}
          </div>

          {!isSearching && searchResults.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark">
              No matching cryptocurrencies found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((res) => {
                const fav = isFavorite(res.id);
                return (
                  <div
                    key={res.id}
                    onClick={() => navigate(`/asset/${encodeURIComponent(res.id)}`)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {res.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {res.symbol} · INR
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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
        /* Top Crypto List */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Top Cryptocurrencies (INR)
            </h2>
            {isLoading && (
              <span className="text-xs text-blue-500 font-medium animate-pulse">
                Loading live quotes...
              </span>
            )}
          </div>

          {isError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
              <span>Unable to load crypto quotes. Showing cached data if available.</span>
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
            {initialCryptoAssets.map((asset) => (
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
