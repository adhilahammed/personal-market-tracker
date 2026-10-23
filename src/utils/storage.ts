import { FavoriteItem, MarketAsset } from '../types/market';

const FAVORITES_KEY = 'my_markets_favorites_v1';
const CACHE_KEY = 'my_markets_asset_cache_v1';
const LAST_UPDATE_KEY = 'my_markets_last_update_v1';
const THEME_KEY = 'my_markets_theme_v1';
const INSTALL_KEY = 'my_markets_installed_at_v1';

function getOrSetInstallTime(): number {
  try {
    const raw = localStorage.getItem(INSTALL_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const now = Date.now();
    localStorage.setItem(INSTALL_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

// Initial default favorites with dynamic creation timestamp
export const DEFAULT_FAVORITES: FavoriteItem[] = [
  { id: 'commodity:KERALA_GOLD_8G_22K:INR', category: 'commodity', symbol: 'GOLD 8G', name: 'Gold 22K (8g)', addedAt: Date.now() },
  { id: 'commodity:GOLD_8G_22K:INR', category: 'commodity', symbol: 'GOLD 8G', name: 'Gold Spot 22K (8g)', addedAt: Date.now() },
  { id: 'commodity:USD:INR', category: 'commodity', symbol: 'USD', name: 'US Dollar (USD)', addedAt: Date.now() },
  { id: 'stock:RELIANCE:NSE', category: 'stock', symbol: 'RELIANCE', name: 'Reliance Industries', addedAt: Date.now() },
  { id: 'stock:TCS:NSE', category: 'stock', symbol: 'TCS', name: 'Tata Consultancy Services', addedAt: Date.now() },
  { id: 'crypto:bitcoin:USD', category: 'crypto', symbol: 'BTC', name: 'Bitcoin', addedAt: Date.now() },
  { id: 'crypto:ethereum:USD', category: 'crypto', symbol: 'ETH', name: 'Ethereum', addedAt: Date.now() },
  { id: 'commodity:GOLD_10G:INR', category: 'commodity', symbol: 'GOLD 10G', name: 'Gold Spot 24K (10g)', addedAt: Date.now() },
];

export function getStoredFavorites(): FavoriteItem[] {
  try {
    const installTime = getOrSetInstallTime();
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      const initial = DEFAULT_FAVORITES.map((item) => ({
        ...item,
        addedAt: installTime,
      }));
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let needsSave = false;

      // Auto-migrate crypto :INR IDs to :USD, update gold labels, and ensure valid addedAt timestamp
      const migrated = parsed.map((item: FavoriteItem) => {
        let updatedItem = item;
        if (item.category === 'crypto' && item.id.endsWith(':INR')) {
          updatedItem = { ...updatedItem, id: item.id.replace(/:INR$/, ':USD') };
          needsSave = true;
        }
        if (item.id === 'commodity:GOLD_8G_22K:INR' && item.name.includes('Pavan')) {
          updatedItem = { ...updatedItem, name: 'Gold Spot 22K (8g)' };
          needsSave = true;
        }
        if (item.id === 'commodity:KERALA_GOLD_8G_22K:INR' && (item.name.includes('Kerala') || item.name.includes('Pavan'))) {
          updatedItem = { ...updatedItem, symbol: 'GOLD 8G', name: 'Gold 22K (8g)' };
          needsSave = true;
        }
        // If an item has old placeholder addedAt (<= 100) or missing, migrate to installTime for proper 30-day tracking
        if (!item.addedAt || item.addedAt < 1000000000000) {
          updatedItem = { ...updatedItem, addedAt: installTime };
          needsSave = true;
        }
        return updatedItem;
      });

      // If user had existing favorites without retail Gold, add Gold 22K 8g
      const hasRetailGold = migrated.some((item: FavoriteItem) => item.id.includes('KERALA_GOLD'));
      if (!hasRetailGold) {
        migrated.unshift({
          id: 'commodity:KERALA_GOLD_8G_22K:INR',
          category: 'commodity',
          symbol: 'GOLD 8G',
          name: 'Gold 22K (8g)',
          addedAt: installTime,
        });
        needsSave = true;
      }

      if (needsSave) {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(migrated));
      }

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
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e);
  }
}
