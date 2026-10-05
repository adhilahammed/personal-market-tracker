import { useQuery } from '@tanstack/react-query';
import { commodityApi } from '../api/commodityApi';
import { CommodityAsset, HistoricalPrice, TimePeriod } from '../types/market';
import { getCachedMarketData, saveCachedMarketData } from '../utils/storage';

export function useCommodityQuotes() {
  return useQuery<Record<string, CommodityAsset>>({
    queryKey: ['commodities', 'quotes'],
    queryFn: async () => {
      try {
        const liveData = await commodityApi.getAllCommodities();
        saveCachedMarketData(liveData);
        return liveData;
      } catch (error) {
        console.warn('Network error fetching commodity quotes, attempting local cache:', error);
        const cached = getCachedMarketData();
        const fallback: Record<string, CommodityAsset> = {};
        let hasAny = false;

        Object.keys(cached).forEach((key) => {
          if (cached[key].category === 'commodity') {
            fallback[key] = { ...(cached[key] as CommodityAsset), isOfflineCached: true };
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

export function useCommodityQuote(id: string) {
  return useQuery<CommodityAsset>({
    queryKey: ['commodity', 'quote', id],
    queryFn: async () => {
      try {
        const quote = await commodityApi.getQuote(id);
        saveCachedMarketData({ [id]: quote });
        return quote;
      } catch (error) {
        const cached = getCachedMarketData();
        if (cached[id] && cached[id].category === 'commodity') {
          return { ...(cached[id] as CommodityAsset), isOfflineCached: true };
        }
        throw error;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useCommodityHistory(id: string, period: TimePeriod) {
  return useQuery<HistoricalPrice[]>({
    queryKey: ['commodity', 'history', id, period],
    queryFn: async () => {
      return await commodityApi.getHistoricalData(id, period);
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
