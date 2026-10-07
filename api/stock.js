export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = (req.query.symbol || '').toUpperCase().replace(/\.(NS|BO)$/i, '');
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol query parameter' });
  }

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

        return res.status(200).json({
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
          source: 'live',
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

        return res.status(200).json({
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

    return res.status(404).json({ error: `Could not fetch quote for ${symbol}` });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
