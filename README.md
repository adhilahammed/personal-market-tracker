# My Markets — Personal Market Tracker (React Only)

A mobile-first personal market tracking web application built exclusively with **React, Vite, TypeScript, and Tailwind CSS**, tailored specifically for **iPhone 15 Safari** (393 × 852 px viewport).

---

## 📱 iPhone 15 & Safari Mobile-First Architecture

- **Designed for 393 × 852 px**: Tailored layout, cards, and charts that fit naturally without horizontal scrolling.
- **iPhone Safe Areas Supported**: Full integration with `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)`. The bottom navigation bar never covers the iOS home indicator, and pages feature generous bottom padding (`pb-28`) so content is never obscured.
- **Touch-Friendly Controls**: All interactive controls, navigation tabs, and favorite star buttons adhere to Apple HIG standards with minimum **44 × 44 px** touch targets.
- **Modern Viewport Handling**: Styled with `100dvh` and `-webkit-tap-highlight-color: transparent` for smooth native feel.
- **PWA Ready**: Web app manifest, standalone mode, and apple-touch-icon for "Add to Home Screen" on iOS Safari.

---

## ⚡ Technology Stack

- **Framework**: [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, zero `any`)
- **Routing**: [React Router v6](https://reactrouter.com/) (`/`, `/stocks`, `/crypto`, `/commodities`, `/asset/:assetId`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom financial dark/light themes and safe-area tokens
- **Data Fetching & Caching**: [@tanstack/react-query v5](https://tanstack.com/query/latest) with smart stale times, manual invalidation, and background synchronization
- **Persistence & Offline**: `LocalStorage` for user favorites, custom ordering, cached quotes, and last update timestamps
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📊 Live Open / Free Market Data

All market data is fetched from open, CORS-enabled APIs with **zero API keys and zero backend server dependencies**:

1. **📈 Indian Stocks (NSE)**:
   - Data Source: **Tej API** (`https://api.tejhq.dev/v1/ohlcv/nse/{SYMBOL}`)
   - Initial Stocks: `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, `ICICIBANK`
   - Real data: Latest price, daily change, percentage change, open, high, low, previous close, volume, and real historical OHLCV data.
   - Search: Instant local search directory across top Indian equities with direct ticker lookup.

2. **₿ Cryptocurrencies (INR)**:
   - Data Source: **CoinGecko API** (`https://api.coingecko.com/api/v3`)
   - Initial Cryptos: `Bitcoin`, `Ethereum`, `Solana`
   - Real data: Live INR prices, 24h change, 24h high/low, total volume, market cap, and historical chart data.
   - Search: Debounced search across coins.

3. **🥇 Commodities (Gold & Silver)**:
   - Data Source: CoinGecko live fine metal spot feeds (`pax-gold`, `kinesis-silver`)
   - Calculated Units: Gold (24K, 10g), Gold (24K, 1g), Silver (1kg), Silver (1g) in INR.
   - Real data: Current price, price change, percentage change, 24h high/low, previous close, and historical charts.

4. **⭐ Favorites**:
   - Persisted in `localStorage` under namespaced IDs (e.g. `stock:RELIANCE:NSE`, `crypto:bitcoin:INR`, `commodity:GOLD_10G:INR`).
   - Order is fully preserved.

---

## 🛠️ Development & Production Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Project Directory Structure

```text
personal-market-tracker-web/
├── public/
│   ├── assets/              # Icons and apple-touch-icon
│   ├── manifest.json        # PWA Web Manifest
│   └── sw.js                # Offline Service Worker
├── src/
│   ├── api/
│   │   ├── stockApi.ts      # Open Tej API client for NSE stocks
│   │   ├── cryptoApi.ts     # CoinGecko client for crypto in INR
│   │   └── commodityApi.ts  # Spot Gold/Silver calculation & history
│   ├── components/
│   │   ├── AssetCard.tsx    # Mobile-first asset card component
│   │   ├── BottomNavigation.tsx # Fixed 4-tab iOS bottom bar
│   │   ├── Header.tsx       # Compact header with refresh & theme toggle
│   │   ├── SearchBar.tsx    # Full-width debounced mobile search
│   │   ├── PriceChange.tsx  # Accessible +/- price change badges
│   │   └── MarketChart.tsx  # Responsive touch chart (1W, 1M, 6M, 1Y)
│   ├── hooks/
│   │   ├── useFavorites.ts  # Favorite state & localStorage sync
│   │   ├── useStocks.ts     # React Query hooks for Indian equities
│   │   ├── useCrypto.ts     # React Query hooks for Cryptocurrencies
│   │   ├── useCommodities.ts# React Query hooks for Precious metals
│   │   └── useTheme.ts      # Dark / light theme toggle
│   ├── pages/
│   │   ├── Favorites.tsx    # Default home screen
│   │   ├── Stocks.tsx       # Indian stocks list & search
│   │   ├── Crypto.tsx       # Crypto quotes & search
│   │   ├── Commodities.tsx  # Gold & Silver quotes
│   │   └── AssetDetails.tsx # Dedicated details page with interactive chart
│   ├── types/
│   │   └── market.ts        # Data contracts & interfaces
│   ├── utils/
│   │   ├── formatters.ts    # Indian currency (₹), numbers, timestamps
│   │   └── storage.ts       # LocalStorage helpers & offline fallbacks
│   ├── App.tsx              # Router, QueryClientProvider, and layout
│   ├── main.tsx             # React DOM root entry
│   └── index.css            # Tailwind directives & iOS styles
├── index.html               # Viewport-fit & Safari meta tags
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
