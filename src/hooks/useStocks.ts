import { useQuery } from '@tanstack/react-query';
import { stockApi, INITIAL_STOCKS } from '../api/stockApi';
import { StockAsset, TimePeriod, HistoricalPrice } from '../types/market';
import { getCachedMarketData, saveCachedMarketData } from '../utils/storage';

export function useStockQuotes(symbols: string[] = INITIAL_STOCKS) {
  return useQuery<Record<string, StockAsset>>({
    queryKey: ['stocks', 'quotes', symbols.join(',')],
    queryFn: async () => {
      try {
        const liveData = await stockApi.getMultipleQuotes(symbols);
        // Persist to local cache
        saveCachedMarketData(liveData);
        return liveData;
      } catch (error) {
        console.warn('Network error fetching stock quotes, attempting local cache:', error);
        const cached = getCachedMarketData();
        const fallback: Record<string, StockAsset> = {};
        let hasAny = false;

        symbols.forEach((sym) => {
          const id = `stock:${sym.toUpperCase()}:NSE`;
          if (cached[id] && cached[id].category === 'stock') {
            fallback[id] = { ...(cached[id] as StockAsset), isOfflineCached: true };
            fallback[sym.toUpperCase()] = fallback[id];
            hasAny = true;
          }
        });

        if (hasAny) {
          return fallback;
        }
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useStockQuote(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE') {
  return useQuery<StockAsset>({
    queryKey: ['stock', 'quote', symbol, exchange],
    queryFn: async () => {
      const id = `stock:${symbol.toUpperCase()}:${exchange}`;
      try {
        const quote = await stockApi.getQuote(symbol, exchange);
        saveCachedMarketData({ [id]: quote });
        return quote;
      } catch (error) {
        const cached = getCachedMarketData();
        if (cached[id] && cached[id].category === 'stock') {
          return { ...(cached[id] as StockAsset), isOfflineCached: true };
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useStockHistory(symbol: string, period: TimePeriod, exchange: 'NSE' | 'BSE' = 'NSE') {
  return useQuery<HistoricalPrice[]>({
    queryKey: ['stock', 'history', symbol, period, exchange],
    queryFn: async () => {
      return await stockApi.getHistoricalData(symbol, period, exchange);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
