export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      return res.status(200).end();
    }
    res.statusCode = 200;
    return res.end();
  }

  const sendJson = (status, data) => {
    if (typeof res.status === 'function') {
      return res.status(status).json(data);
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(data));
  };

  // Support both Vercel req.query and Node req.url parsing
  let query = req.query;
  if (!query && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      query = Object.fromEntries(parsedUrl.searchParams.entries());
    } catch {
      query = {};
    }
  }
  query = query || {};

  let symbol = (query.symbol || '').toUpperCase().replace(/\.(NS|BO)$/i, '');
  if (symbol === 'INDIAGRID') symbol = 'INDIGRID';

  if (!symbol) {
    return sendJson(400, { error: 'Missing symbol query parameter' });
  }

  // Handle Historical Data requests
  if (query.history === 'true' || query.history === '1' || query.period) {
    const period = query.period || '1M';
    let range = '1mo';
    let interval = '1d';

    switch (period) {
      case '1W':
        range = '5d';
        interval = '1d';
        break;
      case '1M':
        range = '1mo';
        interval = '1d';
        break;
      case '6M':
        range = '6mo';
        interval = '1d';
        break;
      case '1Y':
        range = '1y';
        interval = '1d';
        break;
    }

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?interval=${interval}&range=${range}`;
      const yahooRes = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'application/json',
        },
      });

      if (yahooRes.ok) {
        const yahooData = await yahooRes.json();
        const res0 = yahooData?.chart?.result?.[0];
        const timestamps = res0?.timestamp || [];
        const closes = res0?.indicators?.quote?.[0]?.close || [];
        const points = [];

        for (let i = 0; i < timestamps.length; i++) {
          const p = closes[i];
          if (p !== null && p !== undefined && !Number.isNaN(p)) {
            const ts = timestamps[i] * 1000;
            points.push({
              timestamp: ts,
              date: new Date(ts).toISOString().split('T')[0],
              price: Number(Number(p).toFixed(2)),
            });
          }
        }

        return sendJson(200, points);
      }
    } catch (err) {
      console.warn(`History fetch error for ${symbol}:`, err);
    }
  }

  // Handle Live Quote requests
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
        const dayChangePerc = data.dayChangePerc ?? (prevClose > 0 ? (dayChange / prevClose) * 100 : 0);

        return sendJson(200, {
          symbol,
          price: ltp,
          prevClose,
          change: Number(Number(dayChange).toFixed(2)),
          changePercent: Number(Number(dayChangePerc).toFixed(2)),
          open: data.open ?? null,
          high: data.high ?? null,
          low: data.low ?? null,
          volume: data.volume ?? null,
          timestamp: data.tsInMillis ?? Date.now(),
          source: 'groww',
        });
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

        return sendJson(200, {
          symbol,
          price,
          prevClose,
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          open: meta.regularMarketOpen ?? null,
          high: meta.regularMarketDayHigh ?? null,
          low: meta.regularMarketDayLow ?? null,
          volume: meta.regularMarketVolume ?? null,
          timestamp: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
          source: 'yahoo',
        });
      }
    }

    return sendJson(404, { error: `Could not fetch quote for ${symbol}` });
  } catch (err) {
    return sendJson(500, { error: err.message || 'Server error' });
  }
}
