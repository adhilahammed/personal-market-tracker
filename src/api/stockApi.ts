import { HistoricalPrice, StockAsset, TimePeriod, SearchResult } from '../types/market';

export interface TejOhlcvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  last: number;
  prev_close: number;
  volume: number;
  turnover?: number;
  trades?: number;
}

export interface TejResponse {
  data?: TejOhlcvRow[];
  meta?: {
    count: number;
    exchange: string;
    from: string;
    symbol: string;
    to: string;
  };
}

// Known company names for display
export const STOCK_DIRECTORY: { symbol: string; name: string; exchange: 'NSE' | 'BSE' }[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', exchange: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', exchange: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', exchange: 'NSE' },
  { symbol: 'ITC', name: 'ITC Limited', exchange: 'NSE' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', exchange: 'NSE' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', exchange: 'NSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', exchange: 'NSE' },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', exchange: 'NSE' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', exchange: 'NSE' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', exchange: 'NSE' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind.', exchange: 'NSE' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', exchange: 'NSE' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', exchange: 'NSE' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', exchange: 'NSE' },
  { symbol: 'WIPRO', name: 'Wipro Limited', exchange: 'NSE' },
  { symbol: 'NTPC', name: 'NTPC Limited', exchange: 'NSE' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', exchange: 'NSE' },
  { symbol: 'TITAN', name: 'Titan Company Limited', exchange: 'NSE' },
];

export const INITIAL_STOCKS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

class StockApiService {
  private baseUrl = 'https://api.tejhq.dev/v1';

  public getStockName(symbol: string): string {
    const found = STOCK_DIRECTORY.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    return found ? found.name : symbol.toUpperCase();
  }

  async getQuote(symbolInput: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<StockAsset> {
    const symbol = symbolInput.toUpperCase().replace(/\.(NS|BO)$/i, '');
    const ex = exchange.toLowerCase();

    const url = `${this.baseUrl}/ohlcv/${ex}/${encodeURIComponent(symbol)}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Stock API returned status ${response.status} for ${symbol}`);
    }

    const data = await response.json();
    const rows: TejOhlcvRow[] = Array.isArray(data) ? data : data?.data || [];

    if (!rows || rows.length === 0) {
      throw new Error(`No market data returned for ${symbol}`);
    }

    const latest = rows[rows.length - 1];
    const prevClose = latest.prev_close ?? (rows.length > 1 ? rows[rows.length - 2].close : null);
    const currentPrice = latest.last ?? latest.close ?? null;

    let change: number | null = null;
    let changePercent: number | null = null;

    if (currentPrice !== null && prevClose !== null && prevClose > 0) {
      change = Number((currentPrice - prevClose).toFixed(2));
      changePercent = Number(((change / prevClose) * 100).toFixed(2));
    }

    const id = `stock:${symbol}:${exchange}`;

    return {
      id,
      symbol,
      name: this.getStockName(symbol),
      category: 'stock',
      exchange,
      price: currentPrice,
      change,
      changePercent,
      open: latest.open ?? null,
      high24h: latest.high ?? null,
      low24h: latest.low ?? null,
      previousClose: prevClose,
      volume: latest.volume ?? null,
      trades: latest.trades ?? null,
      lastUpdated: latest.date ? `${latest.date}T15:30:00.000Z` : new Date().toISOString(),
    };
  }

  async getMultipleQuotes(symbols: string[]): Promise<Record<string, StockAsset>> {
    const results: Record<string, StockAsset> = {};

    const promises = symbols.map(async (sym) => {
      try {
        const quote = await this.getQuote(sym);
        results[quote.id] = quote;
        results[sym.toUpperCase()] = quote;
      } catch (err) {
        console.warn(`Failed to fetch stock quote for ${sym}:`, err);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  async getHistoricalData(
    symbolInput: string,
    period: TimePeriod,
    exchange: 'NSE' | 'BSE' = 'NSE'
  ): Promise<HistoricalPrice[]> {
    const symbol = symbolInput.toUpperCase().replace(/\.(NS|BO)$/i, '');
    const ex = exchange.toLowerCase();

    // Compute date range
    const toDate = new Date();
    const fromDate = new Date();

    switch (period) {
      case '1W':
        fromDate.setDate(toDate.getDate() - 7);
        break;
      case '1M':
        fromDate.setMonth(toDate.getMonth() - 1);
        break;
      case '6M':
        fromDate.setMonth(toDate.getMonth() - 6);
        break;
      case '1Y':
        fromDate.setFullYear(toDate.getFullYear() - 1);
        break;
    }

    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];

    const url = `${this.baseUrl}/ohlcv/${ex}/${encodeURIComponent(symbol)}?from=${fromStr}&to=${toStr}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const rows: TejOhlcvRow[] = Array.isArray(data) ? data : data?.data || [];

      return rows.map((r) => {
        const ts = new Date(`${r.date}T15:30:00Z`).getTime();
        return {
          timestamp: ts,
          date: r.date,
          price: Number((r.close ?? r.last).toFixed(2)),
        };
      });
    } catch (e) {
      console.warn(`Failed to fetch history for ${symbol}:`, e);
      return [];
    }
  }

  searchStocks(query: string): SearchResult[] {
    const q = query.trim().toUpperCase();
    if (!q) return [];

    return STOCK_DIRECTORY.filter(
      (s) => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
    ).map((s) => ({
      id: `stock:${s.symbol}:${s.exchange}`,
      symbol: s.symbol,
      name: s.name,
      category: 'stock',
      exchange: s.exchange,
    }));
  }
}

export const stockApi = new StockApiService();
