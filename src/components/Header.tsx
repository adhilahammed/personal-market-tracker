import React from 'react';
import { RotateCw, Sun, Moon } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';

interface HeaderProps {
  title?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isOffline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'My Markets',
  isRefreshing,
  onRefresh,
  lastUpdated,
  theme,
  onToggleTheme,
  isOffline = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background-light/85 dark:bg-background-dark/85 border-b border-border-light dark:border-border-dark pt-[max(0.75rem,env(safe-area-inset-top))] px-4 pb-3 transition-colors">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Brand & Last Updated */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{title}</span>
            {isOffline && (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                Offline
              </span>
            )}
          </h1>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {isRefreshing
              ? 'Updating market data...'
              : isOffline
              ? 'Showing cached data'
              : `Updated ${formatTimeAgo(lastUpdated)}`}
          </span>
        </div>

        {/* Action Buttons: Theme Toggle & Manual Refresh */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle (44x44 min touch target) */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex items-center justify-center w-11 h-11 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-transform"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="stroke-[2]" />
            ) : (
              <Moon size={20} className="stroke-[2]" />
            )}
          </button>

          {/* Refresh Button (44x44 min touch target) */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh market data"
            className="flex items-center justify-center w-11 h-11 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 active:scale-95 transition-all disabled:opacity-50"
            id="header-refresh-btn"
          >
            <RotateCw
              size={20}
              className={`stroke-[2.2] ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
