import { CryptoAsset, HistoricalPrice, SearchResult, TimePeriod } from '../types/market';

export const INITIAL_CRYPTO_IDS = ['bitcoin', 'ethereum', 'solana'];

export const CRYPTO_DIRECTORY: { id: string; symbol: string; name: string }[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
];

class CryptoApiService {
  private baseUrl = 'https://api.coingecko.com/api/v3';

  // Normalize id: if user passed BTC or Bitcoin, resolve to CoinGecko coin id
  public resolveId(input: string): string {
    const clean = input.trim().toLowerCase();
    const found = CRYPTO_DIRECTORY.find(
      (c) => c.id === clean || c.symbol.toLowerCase() === clean || c.name.toLowerCase() === clean
    );
    return found ? found.id : clean;
  }

  async getQuote(idOrSymbol: string): Promise<CryptoAsset> {
    const id = this.resolveId(idOrSymbol);
    const url = `${this.baseUrl}/coins/markets?vs_currency=inr&ids=${encodeURIComponent(id)}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API returned status ${response.status}`);
    }

    const data = await response.json();
    const item = Array.isArray(data) ? data[0] : null;

    if (!item) {
      throw new Error(`No crypto data found for ${id}`);
    }

    const assetId = `crypto:${item.id}:INR`;

    return {
      id: assetId,
      symbol: (item.symbol || id).toUpperCase(),
      name: item.name || id,
      category: 'crypto',
      price: item.current_price ?? null,
      change: item.price_change_24h ?? null,
      changePercent: item.price_change_percentage_24h ?? null,
      high24h: item.high_24h ?? null,
      low24h: item.low_24h ?? null,
      marketCap: item.market_cap ?? null,
      volume: item.total_volume ?? null,
      marketCapRank: item.market_cap_rank ?? undefined,
      lastUpdated: item.last_updated || new Date().toISOString(),
    };
  }

  async getMultipleQuotes(ids: string[]): Promise<Record<string, CryptoAsset>> {
    const cleanIds = Array.from(new Set(ids.map((id) => this.resolveId(id))));
    const results: Record<string, CryptoAsset> = {};

    if (cleanIds.length === 0) return results;

    const url = `${this.baseUrl}/coins/markets?vs_currency=inr&ids=${encodeURIComponent(cleanIds.join(','))}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          data.forEach((item) => {
            const assetId = `crypto:${item.id}:INR`;
            const quote: CryptoAsset = {
              id: assetId,
              symbol: (item.symbol || item.id).toUpperCase(),
              name: item.name || item.id,
              category: 'crypto',
              price: item.current_price ?? null,
              change: item.price_change_24h ?? null,
              changePercent: item.price_change_percentage_24h ?? null,
              high24h: item.high_24h ?? null,
              low24h: item.low_24h ?? null,
              marketCap: item.market_cap ?? null,
              volume: item.total_volume ?? null,
              marketCapRank: item.market_cap_rank ?? undefined,
              lastUpdated: item.last_updated || new Date().toISOString(),
            };
            results[assetId] = quote;
            results[item.id] = quote;
            results[item.symbol?.toUpperCase()] = quote;
          });
          return results;
        }
      }
    } catch (e) {
      console.warn('Batch crypto fetch failed:', e);
    }

    return results;
  }

  async getHistoricalData(idOrSymbol: string, period: TimePeriod): Promise<HistoricalPrice[]> {
    const id = this.resolveId(idOrSymbol);
    let days = '7';

    switch (period) {
      case '1W':
        days = '7';
        break;
      case '1M':
        days = '30';
        break;
      case '6M':
        days = '180';
        break;
      case '1Y':
        days = '365';
        break;
    }

    const url = `${this.baseUrl}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=inr&days=${days}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const prices: [number, number][] = data.prices || [];

      return prices.map(([ts, price]) => ({
        timestamp: ts,
        date: new Date(ts).toISOString(),
        price: Number(price.toFixed(2)),
      }));
    } catch (error) {
      console.warn(`Crypto historical chart failed for ${id}:`, error);
      return [];
    }
  }

  async searchCrypto(query: string): Promise<SearchResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // First check local directory for instant response
    const localMatches = CRYPTO_DIRECTORY.filter(
      (c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).map((c) => ({
      id: `crypto:${c.id}:INR`,
      symbol: c.symbol,
      name: c.name,
      category: 'crypto' as const,
    }));

    if (localMatches.length > 0) {
      return localMatches;
    }

    // Fallback to CoinGecko search API
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(q)}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const coins = data.coins || [];

      return coins.slice(0, 15).map((c: { id: string; name: string; symbol: string }) => ({
        id: `crypto:${c.id}:INR`,
        symbol: c.symbol?.toUpperCase() || c.id.toUpperCase(),
        name: c.name || c.id,
        category: 'crypto' as const,
      }));
    } catch (error) {
      console.warn('Error searching crypto:', error);
      return [];
    }
  }
}

export const cryptoApi = new CryptoApiService();
