import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { FavoritesPage } from './pages/Favorites';
import { StocksPage } from './pages/Stocks';
import { CryptoPage } from './pages/Crypto';
import { CommoditiesPage } from './pages/Commodities';
import { AssetDetailsPage } from './pages/AssetDetails';
import { useTheme } from './hooks/useTheme';
import { getLastUpdateTime } from './utils/storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

const AppContent: React.FC = () => {
  const queryClientInstance = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => getLastUpdateTime());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClientInstance.invalidateQueries();
      const now = new Date().toISOString();
      setLastUpdated(now);
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        title="My Markets"
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOffline={isOffline}
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-28">
        <Routes>
          <Route path="/" element={<FavoritesPage />} />
          <Route path="/stocks" element={<StocksPage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/commodities" element={<CommoditiesPage />} />
          <Route path="/asset/:assetId" element={<AssetDetailsPage />} />
        </Routes>
      </main>

      <BottomNavigation />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;
