import { useQuery } from '@tanstack/react-query';
import { cryptoApi, INITIAL_CRYPTO_IDS } from '../api/cryptoApi';
import { CryptoAsset, HistoricalPrice, TimePeriod } from '../types/market';
import { getCachedMarketData, saveCachedMarketData } from '../utils/storage';

export function useCryptoQuotes(ids: string[] = INITIAL_CRYPTO_IDS) {
  return useQuery<Record<string, CryptoAsset>>({
    queryKey: ['crypto', 'quotes', ids.join(',')],
    queryFn: async () => {
      try {
        const liveData = await cryptoApi.getMultipleQuotes(ids);
        saveCachedMarketData(liveData);
        return liveData;
      } catch (error) {
        console.warn('Network error fetching crypto quotes, attempting local cache:', error);
        const cached = getCachedMarketData();
        const fallback: Record<string, CryptoAsset> = {};
        let hasAny = false;

        ids.forEach((id) => {
          const resolved = cryptoApi.resolveId(id);
          const fullId = `crypto:${resolved}:INR`;
          if (cached[fullId] && cached[fullId].category === 'crypto') {
            fallback[fullId] = { ...(cached[fullId] as CryptoAsset), isOfflineCached: true };
            fallback[resolved] = fallback[fullId];
            hasAny = true;
          }
        });

        if (hasAny) {
          return fallback;
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useCryptoQuote(idOrSymbol: string) {
  return useQuery<CryptoAsset>({
    queryKey: ['crypto', 'quote', idOrSymbol],
    queryFn: async () => {
      const resolved = cryptoApi.resolveId(idOrSymbol);
      const fullId = `crypto:${resolved}:INR`;
      try {
        const quote = await cryptoApi.getQuote(idOrSymbol);
        saveCachedMarketData({ [fullId]: quote });
        return quote;
      } catch (error) {
        const cached = getCachedMarketData();
        if (cached[fullId] && cached[fullId].category === 'crypto') {
          return { ...(cached[fullId] as CryptoAsset), isOfflineCached: true };
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useCryptoHistory(idOrSymbol: string, period: TimePeriod) {
  return useQuery<HistoricalPrice[]>({
    queryKey: ['crypto', 'history', idOrSymbol, period],
    queryFn: async () => {
      return await cryptoApi.getHistoricalData(idOrSymbol, period);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
