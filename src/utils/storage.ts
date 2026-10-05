import { FavoriteItem, MarketAsset } from '../types/market';

const FAVORITES_KEY = 'my_markets_favorites_v1';
const CACHE_KEY = 'my_markets_asset_cache_v1';
const LAST_UPDATE_KEY = 'my_markets_last_update_v1';
const THEME_KEY = 'my_markets_theme_v1';

// Initial default favorites with unique IDs
export const DEFAULT_FAVORITES: FavoriteItem[] = [
  { id: 'commodity:GOLD_8G_22K:INR', category: 'commodity', symbol: 'GOLD 8G', name: 'Gold 22K (8g / 1 Pavan)', addedAt: 1 },
  { id: 'commodity:USD:INR', category: 'commodity', symbol: 'USD', name: 'US Dollar (USD)', addedAt: 2 },
  { id: 'stock:RELIANCE:NSE', category: 'stock', symbol: 'RELIANCE', name: 'Reliance Industries', addedAt: 3 },
  { id: 'stock:TCS:NSE', category: 'stock', symbol: 'TCS', name: 'Tata Consultancy Services', addedAt: 4 },
  { id: 'crypto:bitcoin:USD', category: 'crypto', symbol: 'BTC', name: 'Bitcoin', addedAt: 5 },
  { id: 'crypto:ethereum:USD', category: 'crypto', symbol: 'ETH', name: 'Ethereum', addedAt: 6 },
  { id: 'commodity:GOLD_10G:INR', category: 'commodity', symbol: 'GOLD 10G', name: 'Gold 24K (10g)', addedAt: 7 },
];

export function getStoredFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(DEFAULT_FAVORITES));
      return DEFAULT_FAVORITES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Auto-migrate crypto :INR IDs to :USD
      const migrated = parsed.map((item: FavoriteItem) => {
        if (item.category === 'crypto' && item.id.endsWith(':INR')) {
          return { ...item, id: item.id.replace(/:INR$/, ':USD') };
        }
        return item;
      });
      return migrated;
    }
    return DEFAULT_FAVORITES;
  } catch (e) {
    console.error('Error reading favorites from localStorage:', e);
    return DEFAULT_FAVORITES;
  }
}

export function saveStoredFavorites(favorites: FavoriteItem[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Error saving favorites to localStorage:', e);
  }
}

export function getCachedMarketData(): Record<string, MarketAsset> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveCachedMarketData(assets: Record<string, MarketAsset>): void {
  try {
    const current = getCachedMarketData();
    const updated = { ...current, ...assets };
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
  } catch (e) {
    console.error('Error saving cached data to localStorage:', e);
  }
}

export function getLastUpdateTime(): string | null {
  try {
    return localStorage.getItem(LAST_UPDATE_KEY);
  } catch {
    return null;
  }
}

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // System preference fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}
