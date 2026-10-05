export type AssetCategory = 'stock' | 'crypto' | 'commodity';

export type MarketCapCategory = 'large' | 'mid' | 'small';

export type TimePeriod = '1W' | '1M' | '6M' | '1Y';

export interface HistoricalPrice {
  timestamp: number;
  date: string;
  price: number;
}

export interface BaseAsset {
  id: string; // e.g. "stock:RELIANCE:NSE", "crypto:bitcoin:USD", "commodity:GOLD_10G:INR"
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  lastUpdated: string;
  isOfflineCached?: boolean;
}

export interface StockAsset extends BaseAsset {
  category: 'stock';
  exchange: 'NSE' | 'BSE';
  capCategory?: MarketCapCategory;
  open: number | null;
  high24h: number | null;
  low24h: number | null;
  previousClose: number | null;
  volume: number | null;
  trades?: number | null;
}

export interface CryptoAsset extends BaseAsset {
  category: 'crypto';
  high24h: number | null;
  low24h: number | null;
  marketCap: number | null;
  volume: number | null;
  marketCapRank?: number;
}

export interface CommodityAsset extends BaseAsset {
  category: 'commodity';
  unit: string;
  high24h?: number | null;
  low24h?: number | null;
  previousClose?: number | null;
  volume?: number | null;
}

export type MarketAsset = StockAsset | CryptoAsset | CommodityAsset;

export interface FavoriteItem {
  id: string;
  category: AssetCategory;
  symbol: string;
  name: string;
  addedAt: number;
}

export interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  exchange?: string;
  capCategory?: MarketCapCategory;
}
