// Cloudflare Worker: Indian Stock Live Price Proxy (CORS-enabled)
// Deployed on Cloudflare Workers (Free tier: 100k requests/day)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname; // e.g. /stock/RELIANCE or /stock?symbol=RELIANCE

    // Extract symbol
    let symbol = url.searchParams.get('symbol');
    if (!symbol && pathname.startsWith('/stock/')) {
      symbol = pathname.replace('/stock/', '').trim();
    }

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Please provide a symbol, e.g. /stock/RELIANCE' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    symbol = symbol.toUpperCase().replace(/\.(NS|BO)$/i, '');

    try {
      // 1. Try Groww live price API
      const growwUrl = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_prices_ohlc/${encodeURIComponent(symbol)}`;
      const growwRes = await fetch(growwUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'application/json',
        },
      });

      if (growwRes.ok) {
        const data = await growwRes.json();
        if (data && (data.ltp !== undefined || data.close !== undefined)) {
          const ltp = data.ltp ?? data.close;
          const prevClose = data.close;
          const dayChange = data.dayChange ?? (ltp - prevClose);
          const dayChangePerc = data.dayChangePerc ?? ((dayChange / prevClose) * 100);

          return new Response(
            JSON.stringify({
              symbol,
              price: ltp,
              prevClose: prevClose,
              change: Number(Number(dayChange).toFixed(2)),
              changePercent: Number(Number(dayChangePerc).toFixed(2)),
              open: data.open ?? null,
              high: data.high ?? null,
              low: data.low ?? null,
              volume: data.volume ?? null,
              timestamp: data.tsInMillis ?? Date.now(),
              source: 'live',
            }),
            { headers: CORS_HEADERS }
          );
        }
      }

      // 2. Fallback to Yahoo Finance (~15-min delayed)
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?interval=5m&range=1d`;
      const yahooRes = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'application/json',
        },
      });

      if (yahooRes.ok) {
        const yahooData = await yahooRes.json();
        const meta = yahooData?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice !== undefined) {
          const price = meta.regularMarketPrice;
          const prevClose = meta.previousClose || meta.chartPreviousClose || price;
          const change = price - prevClose;
          const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

          return new Response(
            JSON.stringify({
              symbol,
              price,
              prevClose,
              change: Number(change.toFixed(2)),
              changePercent: Number(changePercent.toFixed(2)),
              open: meta.regularMarketOpen ?? null,
              high: meta.regularMarketDayHigh ?? null,
              low: meta.regularMarketDayLow ?? null,
              volume: meta.regularMarketVolume ?? null,
              timestamp: (meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()),
              source: 'yahoo',
            }),
            { headers: CORS_HEADERS }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: `Could not fetch quote for ${symbol}` }),
        { status: 404, headers: CORS_HEADERS }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || 'Worker proxy error' }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
  },
};
