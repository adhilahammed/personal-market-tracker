import React from 'react';
import { NavLink } from 'react-router-dom';
import { Star, TrendingUp, Coins, Award, LucideIcon } from 'lucide-react';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { to: '/', label: 'Favorites', icon: Star },
  { to: '/stocks', label: 'Stocks', icon: TrendingUp },
  { to: '/crypto', label: 'Crypto', icon: Coins },
  { to: '/commodities', label: 'Commodities', icon: Award },
];

export const BottomNavigation: React.FC = () => {
  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-background-light/90 dark:bg-background-dark/90 border-t border-border-light dark:border-border-dark pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }: { isActive: boolean }) =>
              `flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 px-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <div className="relative flex items-center justify-center w-7 h-7">
                  <Icon
                    size={22}
                    className={`transition-transform duration-200 ${
                      isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <span className="mt-1 text-[11px] leading-tight tracking-tight">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
