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

// Known company directory categorized by Market Cap & Asset Subtype
export interface StockDirectoryItem {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  capCategory: 'large' | 'mid' | 'small';
  subType?: 'stock' | 'reit' | 'invit';
  dividendFrequency?: 'Quarterly' | 'Semi-Annual' | 'Annual';
}

export const STOCK_DIRECTORY: StockDirectoryItem[] = [
  // REITs & InvITs (SEBI Mandated Quarterly Distributions)
  { symbol: 'EMBASSY', name: 'Embassy Office Parks REIT', exchange: 'NSE', capCategory: 'mid', subType: 'reit', dividendFrequency: 'Quarterly' },
  { symbol: 'MINDSPACE', name: 'Mindspace Business Parks REIT', exchange: 'NSE', capCategory: 'mid', subType: 'reit', dividendFrequency: 'Quarterly' },
  { symbol: 'BIRET', name: 'Brookfield India Real Estate Trust', exchange: 'NSE', capCategory: 'small', subType: 'reit', dividendFrequency: 'Quarterly' },
  { symbol: 'NXST', name: 'Nexus Select Trust REIT', exchange: 'NSE', capCategory: 'mid', subType: 'reit', dividendFrequency: 'Quarterly' },
  { symbol: 'PGINVIT', name: 'Powergrid Infrastructure InvIT', exchange: 'NSE', capCategory: 'small', subType: 'invit', dividendFrequency: 'Quarterly' },
  { symbol: 'INDIGRID', name: 'India Grid Trust InvIT', exchange: 'NSE', capCategory: 'small', subType: 'invit', dividendFrequency: 'Quarterly' },
  { symbol: 'IRBINVIT', name: 'IRB InvIT Fund', exchange: 'NSE', capCategory: 'small', subType: 'invit', dividendFrequency: 'Quarterly' },

  // Large Cap (Nifty 50 Giants)
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'ITC', name: 'ITC Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind.', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'WIPRO', name: 'Wipro Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'NTPC', name: 'NTPC Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'TITAN', name: 'Titan Company Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },
  { symbol: 'COALINDIA', name: 'Coal India Limited', exchange: 'NSE', capCategory: 'large', subType: 'stock' },

  // Mid Cap (High Growth / Nifty Midcap Leaders)
  { symbol: 'ZOMATO', name: 'Zomato Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd.', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'TRENT', name: 'Trent Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd.', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd.', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'DIXON', name: 'Dixon Technologies Ltd.', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'SUZLON', name: 'Suzlon Energy Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd.', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'BHEL', name: 'Bharat Heavy Electricals', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'COFORGE', name: 'Coforge Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'TATAELXSI', name: 'Tata Elxsi Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'KPITTECH', name: 'KPIT Technologies Ltd.', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'ASHOKLEY', name: 'Ashok Leyland Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'MOTHERSON', name: 'Samvardhana Motherson', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'BDL', name: 'Bharat Dynamics Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'TATACOMM', name: 'Tata Communications Ltd.', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },
  { symbol: 'YESBANK', name: 'Yes Bank Limited', exchange: 'NSE', capCategory: 'mid', subType: 'stock' },

  // Small Cap (High Momentum & Popular Retail Stocks)
  { symbol: 'IRFC', name: 'Indian Railway Finance Corp', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'RVNL', name: 'Rail Vikas Nigam Limited', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'CDSL', name: 'Central Depository Services', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'BSE', name: 'BSE Limited', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'ANGELONE', name: 'Angel One Limited', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'HUDCO', name: 'Housing & Urban Development', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'IREDA', name: 'Indian Renewable Energy Dev.', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'OLECTRA', name: 'Olectra Greentech Ltd.', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'KAYNES', name: 'Kaynes Technology India', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'MAPMYINDIA', name: 'CE Info Systems (MapmyIndia)', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'CYIENT', name: 'Cyient Limited', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'NBCC', name: 'NBCC (India) Limited', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
  { symbol: 'RITES', name: 'RITES Limited', exchange: 'NSE', capCategory: 'small', subType: 'stock' },
];

export const REIT_INVIT_STOCKS = [
  'EMBASSY',
  'MINDSPACE',
  'BIRET',
  'NXST',
  'PGINVIT',
  'INDIGRID',
  'IRBINVIT',
];

export const LARGE_CAP_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'BHARTIARTL', 'SBIN', 'INFY', 'ITC', 'LT', 'TATAMOTORS'];
export const MID_CAP_STOCKS = ['ZOMATO', 'BEL', 'TRENT', 'POLYCAB', 'PERSISTENT', 'DIXON', 'SUZLON', 'HAL', 'FEDERALBNK', 'BHEL'];
export const SMALL_CAP_STOCKS = ['IRFC', 'RVNL', 'MAZDOCK', 'CDSL', 'BSE', 'ANGELONE', 'HUDCO', 'IREDA', 'OLECTRA', 'KAYNES'];

export const INITIAL_STOCKS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'ZOMATO',
  'BEL',
  'TRENT',
  'IRFC',
  'RVNL',
  'CDSL',
];

class StockApiService {
  private baseUrl = 'https://api.tejhq.dev/v1';

  public getStockName(symbol: string): string {
    const found = STOCK_DIRECTORY.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    return found ? found.name : symbol.toUpperCase();
  }

  public getStockCapCategory(symbol: string): 'large' | 'mid' | 'small' | undefined {
    const found = STOCK_DIRECTORY.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    return found?.capCategory;
  }

  public getStockSubType(symbol: string): 'stock' | 'reit' | 'invit' | undefined {
    const found = STOCK_DIRECTORY.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    return found?.subType;
  }

  public getStockDividendFrequency(symbol: string): 'Quarterly' | 'Semi-Annual' | 'Annual' | undefined {
    const found = STOCK_DIRECTORY.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    return found?.dividendFrequency;
  }

  async getQuote(symbolInput: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<StockAsset> {
    const symbol = symbolInput.toUpperCase().replace(/\.(NS|BO)$/i, '');
    const ex = exchange.toLowerCase();

    // 1. Try Vercel serverless live price endpoint
    const proxyEndpoint = `/api/stock?symbol=${encodeURIComponent(symbol)}`;

    try {
      const proxyRes = await fetch(proxyEndpoint);
      if (proxyRes.ok) {
        const liveData = await proxyRes.json();
        if (liveData && liveData.price !== undefined && !liveData.error) {
          return {
            id: `stock:${symbol}:${exchange}`,
            symbol,
            name: this.getStockName(symbol),
            category: 'stock',
            exchange,
            capCategory: this.getStockCapCategory(symbol),
            subType: this.getStockSubType(symbol),
            dividendFrequency: this.getStockDividendFrequency(symbol),
            price: liveData.price,
            change: liveData.change,
            changePercent: liveData.changePercent,
            open: liveData.open,
            high24h: liveData.high,
            low24h: liveData.low,
            previousClose: liveData.prevClose,
            volume: liveData.volume,
            trades: null,
            lastUpdated: new Date(liveData.timestamp || Date.now()).toISOString(),
          };
        }
      }
    } catch {
      // Ignore and fallback gracefully to TejHQ daily candle
    }

    // 2. Default fallback: fetch from TejHQ daily OHLCV
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
      capCategory: this.getStockCapCategory(symbol),
      subType: this.getStockSubType(symbol),
      dividendFrequency: this.getStockDividendFrequency(symbol),
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

    // 1. Try serverless proxy history first (supports REITs, InvITs, and equities)
    try {
      const proxyUrl = `/api/stock?symbol=${encodeURIComponent(symbol)}&history=true&period=${encodeURIComponent(period)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const contentType = proxyRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const proxyData = await proxyRes.json();
          if (Array.isArray(proxyData) && proxyData.length > 0) {
            return proxyData;
          }
        }
      }
    } catch {
      // Fallback to TejHQ
    }

    // 2. Fallback to TejHQ OHLCV
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

    const matches: SearchResult[] = STOCK_DIRECTORY.filter(
      (s) => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
    ).map((s) => ({
      id: `stock:${s.symbol}:${s.exchange}`,
      symbol: s.symbol,
      name: s.name,
      category: 'stock' as const,
      exchange: s.exchange,
      capCategory: s.capCategory,
      subType: s.subType,
      dividendFrequency: s.dividendFrequency,
    }));

    // Universal direct symbol lookup: if user typed a valid ticker not already in results
    const hasExact = matches.some((m) => m.symbol.toUpperCase() === q);
    if (!hasExact && /^[A-Z0-9-]{2,14}$/.test(q)) {
      matches.unshift({
        id: `stock:${q}:NSE`,
        symbol: q,
        name: `${q} · Direct NSE Lookup`,
        category: 'stock' as const,
        exchange: 'NSE',
        subType: this.getStockSubType(q),
        dividendFrequency: this.getStockDividendFrequency(q),
      });
    }

    return matches;
  }
}

export const stockApi = new StockApiService();
