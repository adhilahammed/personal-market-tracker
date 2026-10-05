import { useState, useEffect, useCallback } from 'react';
import { FavoriteItem, MarketAsset, SearchResult } from '../types/market';
import { getStoredFavorites, saveStoredFavorites } from '../utils/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => getStoredFavorites());

  // Listen for storage changes across tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'my_markets_favorites_v1') {
        setFavorites(getStoredFavorites());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isFavorite = useCallback(
    (id: string): boolean => {
      return favorites.some((f) => f.id === id);
    },
    [favorites]
  );

  const addFavorite = useCallback((item: { id: string; category: FavoriteItem['category']; symbol: string; name: string }) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id)) return prev;
      const updated = [
        ...prev,
        {
          id: item.id,
          category: item.category,
          symbol: item.symbol,
          name: item.name,
          addedAt: Date.now(),
        },
      ];
      saveStoredFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveStoredFavorites(updated);
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback(
    (asset: MarketAsset | SearchResult) => {
      if (isFavorite(asset.id)) {
        removeFavorite(asset.id);
      } else {
        addFavorite({
          id: asset.id,
          category: asset.category,
          symbol: asset.symbol,
          name: asset.name,
        });
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const reorderFavorites = useCallback((newOrder: FavoriteItem[]) => {
    setFavorites(newOrder);
    saveStoredFavorites(newOrder);
  }, []);

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    reorderFavorites,
  };
}
