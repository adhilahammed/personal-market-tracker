import { CommodityAsset, HistoricalPrice, TimePeriod } from '../types/market';

const TROY_OZ_TO_GRAMS = 31.1034768;
// Typical benchmark ratio of Kerala retail market 24K gold vs international spot gold
const DEFAULT_KERALA_SPOT_RATIO = 1.18;

export const INITIAL_COMMODITIES = [
  'commodity:KERALA_GOLD_8G_22K:INR',
  'commodity:KERALA_GOLD_1G_22K:INR',
  'commodity:KERALA_GOLD_8G_24K:INR',
  'commodity:GOLD_8G_22K:INR',
  'commodity:GOLD_10G:INR',
  'commodity:USD:INR',
  'commodity:SILVER_1KG:INR',
  'commodity:SILVER_1G:INR',
  'commodity:GOLD_1G_22K:INR',
  'commodity:GOLD_8G_24K:INR',
  'commodity:GOLD_1G:INR',
];

export interface KeralaGoldData {
  rate24kPerGram: number;
  rate22kPerGram: number;
  rate22k8g: number;
  rate24k8g: number;
  change24kPerGram: number | null;
  changePercent: number | null;
  lastUpdated: string;
}

class CommodityApiService {
  private coingeckoUrl = 'https://api.coingecko.com/api/v3';
  private keralaApiUrl = 'https://sibincbaby.github.io/gold-rate-tracker/api';
  private cachedKeralaRatio = DEFAULT_KERALA_SPOT_RATIO;

  private async fetchWithTimeout(url: string, timeoutMs = 6000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchKeralaGoldData(spotChangePct: number | null, spotGram24k: number): Promise<KeralaGoldData> {
    try {
      const [latestRes, statsRes] = await Promise.all([
        this.fetchWithTimeout(`${this.keralaApiUrl}/latest.json`).catch(() => null),
        this.fetchWithTimeout(`${this.keralaApiUrl}/stats.json`).catch(() => null),
      ]);

      if (latestRes && latestRes.ok) {
        const latest = await latestRes.json();
        const rate24k = typeof latest.rate === 'number' && latest.rate > 0 ? latest.rate : null;

        if (rate24k) {
          let change24k: number | null = null;
          let changePct: number | null = spotChangePct;

          if (statsRes && statsRes.ok) {
            try {
              const stats = await statsRes.json();
              const last24hChange = stats?.trends?.last_24h_change;
              if (typeof last24hChange === 'number') {
                change24k = last24hChange;
                if (change24k !== 0 && rate24k > change24k) {
                  changePct = Number(((change24k / (rate24k - change24k)) * 100).toFixed(2));
                }
              }
            } catch {
              // Ignore stats JSON parsing issues
            }
          }

          if (spotGram24k > 0) {
            this.cachedKeralaRatio = rate24k / spotGram24k;
          }

          const rate22kGram = Number((rate24k * (22 / 24)).toFixed(2));
          const rate22k8g = Number((rate22kGram * 8).toFixed(2));
          const rate24k8g = Number((rate24k * 8).toFixed(2));

          return {
            rate24kPerGram: rate24k,
            rate22kPerGram: rate22kGram,
            rate22k8g,
            rate24k8g,
            change24kPerGram: change24k,
            changePercent: changePct,
            lastUpdated: latest.data_scraped_at || latest.timestamp || new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('Could not fetch live Kerala gold rate, falling back to formula:', e);
    }

    // Graceful fallback: Calculate from spot price with retail benchmark ratio
    const rate24k = spotGram24k > 0 ? Number((spotGram24k * this.cachedKeralaRatio).toFixed(2)) : 15141;
    const rate22kGram = Number((rate24k * (22 / 24)).toFixed(2));
    const rate22k8g = Number((rate22kGram * 8).toFixed(2));
    const rate24k8g = Number((rate24k * 8).toFixed(2));

    return {
      rate24kPerGram: rate24k,
      rate22kPerGram: rate22kGram,
      rate22k8g,
      rate24k8g,
      change24kPerGram: null,
      changePercent: spotChangePct,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getAllCommodities(): Promise<Record<string, CommodityAsset>> {
    const url = `${this.coingeckoUrl}/coins/markets?vs_currency=inr&ids=pax-gold,kinesis-silver,tether&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await this.fetchWithTimeout(url, 10000);

    if (!response.ok) {
      throw new Error(`Commodity API error: ${response.status}`);
    }

    const data = await response.json();
    const paxGold = data.find((d: { id: string }) => d.id === 'pax-gold');
    const silver = data.find((d: { id: string }) => d.id === 'kinesis-silver');
    const tether = data.find((d: { id: string }) => d.id === 'tether');

    if (!paxGold && !silver && !tether) {
      throw new Error('Unable to retrieve commodity prices');
    }

    const results: Record<string, CommodityAsset> = {};

    // 1. Trading Spot Gold calculations (CoinGecko Pax Gold Bullion Spot)
    let spotGram24K = 0;
    let spotChangePct: number | null = null;

    if (paxGold && paxGold.current_price) {
      const goldPricePerOz = paxGold.current_price;
      spotGram24K = goldPricePerOz / TROY_OZ_TO_GRAMS;
      const goldPricePerGram24K = spotGram24K;
      const goldPricePerGram22K = goldPricePerGram24K * (22 / 24);

      const goldPricePer8g22K = goldPricePerGram22K * 8;
      const goldPricePer8g24K = goldPricePerGram24K * 8;
      const goldPricePer10g24K = goldPricePerGram24K * 10;

      spotChangePct = paxGold.price_change_percentage_24h ?? null;
      const changePct = spotChangePct;
      const change8g22K = changePct !== null ? (goldPricePer8g22K * changePct) / 100 : null;
      const change8g24K = changePct !== null ? (goldPricePer8g24K * changePct) / 100 : null;
      const change1g22K = changePct !== null ? (goldPricePerGram22K * changePct) / 100 : null;
      const change10g24K = changePct !== null ? (goldPricePer10g24K * changePct) / 100 : null;
      const change1g24K = changePct !== null ? (goldPricePerGram24K * changePct) / 100 : null;

      const highGram24K = paxGold.high_24h ? paxGold.high_24h / TROY_OZ_TO_GRAMS : null;
      const lowGram24K = paxGold.low_24h ? paxGold.low_24h / TROY_OZ_TO_GRAMS : null;

      const lastUpdated = paxGold.last_updated || new Date().toISOString();

      // Spot Trading: 8g 22K
      results['commodity:GOLD_8G_22K:INR'] = {
        id: 'commodity:GOLD_8G_22K:INR',
        symbol: 'GOLD 8G (Spot)',
        name: 'Gold Spot 22K (8g)',
        category: 'commodity',
        unit: '22K (Spot)',
        price: Number(goldPricePer8g22K.toFixed(2)),
        change: change8g22K !== null ? Number(change8g22K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * (22 / 24) * 8).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * (22 / 24) * 8).toFixed(2)) : null,
        previousClose: change8g22K !== null ? Number((goldPricePer8g22K - change8g22K).toFixed(2)) : null,
        lastUpdated,
      };

      // Spot Trading: 8g 24K
      results['commodity:GOLD_8G_24K:INR'] = {
        id: 'commodity:GOLD_8G_24K:INR',
        symbol: 'GOLD 8G (24K Spot)',
        name: 'Gold Spot 24K (8g)',
        category: 'commodity',
        unit: '24K (Spot)',
        price: Number(goldPricePer8g24K.toFixed(2)),
        change: change8g24K !== null ? Number(change8g24K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * 8).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * 8).toFixed(2)) : null,
        previousClose: change8g24K !== null ? Number((goldPricePer8g24K - change8g24K).toFixed(2)) : null,
        lastUpdated,
      };

      // Spot Trading: 1g 22K
      results['commodity:GOLD_1G_22K:INR'] = {
        id: 'commodity:GOLD_1G_22K:INR',
        symbol: 'GOLD 1G (22K Spot)',
        name: 'Gold Spot 22K (1g)',
        category: 'commodity',
        unit: '22K (Spot)',
        price: Number(goldPricePerGram22K.toFixed(2)),
        change: change1g22K !== null ? Number(change1g22K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * (22 / 24)).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * (22 / 24)).toFixed(2)) : null,
        previousClose: change1g22K !== null ? Number((goldPricePerGram22K - change1g22K).toFixed(2)) : null,
        lastUpdated,
      };

      // Spot Trading: 10g 24K
      results['commodity:GOLD_10G:INR'] = {
        id: 'commodity:GOLD_10G:INR',
        symbol: 'GOLD 10G (Spot)',
        name: 'Gold Spot 24K (10g)',
        category: 'commodity',
        unit: '24K (Spot)',
        price: Number(goldPricePer10g24K.toFixed(2)),
        change: change10g24K !== null ? Number(change10g24K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * 10).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * 10).toFixed(2)) : null,
        previousClose: change10g24K !== null ? Number((goldPricePer10g24K - change10g24K).toFixed(2)) : null,
        lastUpdated,
      };

      // Spot Trading: 1g 24K
      results['commodity:GOLD_1G:INR'] = {
        id: 'commodity:GOLD_1G:INR',
        symbol: 'GOLD 1G (24K Spot)',
        name: 'Gold Spot 24K (1g)',
        category: 'commodity',
        unit: '24K (Spot)',
        price: Number(goldPricePerGram24K.toFixed(2)),
        change: change1g24K !== null ? Number(change1g24K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number(highGram24K.toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number(lowGram24K.toFixed(2)) : null,
        previousClose: change1g24K !== null ? Number((goldPricePerGram24K - change1g24K).toFixed(2)) : null,
        lastUpdated,
      };
    }

    // 2. Kerala Gold Market Rates (Retail / 916 Jewellery Benchmark)
    const keralaData = await this.fetchKeralaGoldData(spotChangePct, spotGram24K);
    const changePct = keralaData.changePercent;

    const change22k8g = changePct !== null ? (keralaData.rate22k8g * changePct) / 100 : null;
    const change22k1g = changePct !== null ? (keralaData.rate22kPerGram * changePct) / 100 : null;
    const change24k8g = changePct !== null ? (keralaData.rate24k8g * changePct) / 100 : null;

    // Retail Gold Market Rates (22K / 916 Jewellery Benchmark)
    results['commodity:KERALA_GOLD_8G_22K:INR'] = {
      id: 'commodity:KERALA_GOLD_8G_22K:INR',
      symbol: 'GOLD 8G',
      name: 'Gold 22K (8g)',
      category: 'commodity',
      unit: '22K',
      price: keralaData.rate22k8g,
      change: change22k8g !== null ? Number(change22k8g.toFixed(2)) : null,
      changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
      high24h: change22k8g !== null && change22k8g > 0 ? Number((keralaData.rate22k8g).toFixed(2)) : null,
      low24h: change22k8g !== null && change22k8g < 0 ? Number((keralaData.rate22k8g).toFixed(2)) : null,
      previousClose: change22k8g !== null ? Number((keralaData.rate22k8g - change22k8g).toFixed(2)) : null,
      lastUpdated: keralaData.lastUpdated,
    };

    // Retail Gold 22K 1g
    results['commodity:KERALA_GOLD_1G_22K:INR'] = {
      id: 'commodity:KERALA_GOLD_1G_22K:INR',
      symbol: 'GOLD 1G',
      name: 'Gold 22K (1g)',
      category: 'commodity',
      unit: '22K',
      price: keralaData.rate22kPerGram,
      change: change22k1g !== null ? Number(change22k1g.toFixed(2)) : null,
      changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
      high24h: change22k1g !== null && change22k1g > 0 ? Number((keralaData.rate22kPerGram).toFixed(2)) : null,
      low24h: change22k1g !== null && change22k1g < 0 ? Number((keralaData.rate22kPerGram).toFixed(2)) : null,
      previousClose: change22k1g !== null ? Number((keralaData.rate22kPerGram - change22k1g).toFixed(2)) : null,
      lastUpdated: keralaData.lastUpdated,
    };

    // Retail Gold 24K 8g
    results['commodity:KERALA_GOLD_8G_24K:INR'] = {
      id: 'commodity:KERALA_GOLD_8G_24K:INR',
      symbol: 'GOLD 8G (24K)',
      name: 'Gold 24K (8g)',
      category: 'commodity',
      unit: '24K Pure',
      price: keralaData.rate24k8g,
      change: change24k8g !== null ? Number(change24k8g.toFixed(2)) : null,
      changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
      high24h: change24k8g !== null && change24k8g > 0 ? Number((keralaData.rate24k8g).toFixed(2)) : null,
      low24h: change24k8g !== null && change24k8g < 0 ? Number((keralaData.rate24k8g).toFixed(2)) : null,
      previousClose: change24k8g !== null ? Number((keralaData.rate24k8g - change24k8g).toFixed(2)) : null,
      lastUpdated: keralaData.lastUpdated,
    };

    // 3. US Dollar (USD / INR Forex Rate)
    if (tether && tether.current_price) {
      const usdPrice = tether.current_price;
      const changePctUsd = tether.price_change_percentage_24h ?? null;
      const changeAmount = tether.price_change_24h ?? null;
      const lastUpdated = tether.last_updated || new Date().toISOString();

      results['commodity:USD:INR'] = {
        id: 'commodity:USD:INR',
        symbol: 'USD',
        name: 'US Dollar (USD)',
        category: 'commodity',
        unit: '1 USD ($)',
        price: Number(usdPrice.toFixed(2)),
        change: changeAmount !== null ? Number(changeAmount.toFixed(2)) : null,
        changePercent: changePctUsd !== null ? Number(changePctUsd.toFixed(2)) : null,
        high24h: tether.high_24h ? Number(tether.high_24h.toFixed(2)) : null,
        low24h: tether.low_24h ? Number(tether.low_24h.toFixed(2)) : null,
        previousClose: changeAmount !== null ? Number((usdPrice - changeAmount).toFixed(2)) : null,
        lastUpdated,
      };
    }

    // 4. Silver calculations
    if (silver && silver.current_price) {
      const silverPricePerOz = silver.current_price;
      const silverPricePerGram = silverPricePerOz / TROY_OZ_TO_GRAMS;
      const silverPricePerKg = silverPricePerGram * 1000;

      const changePctSilver = silver.price_change_percentage_24h ?? null;
      const changeKg = changePctSilver !== null ? (silverPricePerKg * changePctSilver) / 100 : null;
      const change1g = changePctSilver !== null ? (silverPricePerGram * changePctSilver) / 100 : null;

      const silverHighKg = silver.high_24h ? (silver.high_24h / TROY_OZ_TO_GRAMS) * 1000 : null;
      const silverLowKg = silver.low_24h ? (silver.low_24h / TROY_OZ_TO_GRAMS) * 1000 : null;

      const lastUpdated = silver.last_updated || new Date().toISOString();

      results['commodity:SILVER_1KG:INR'] = {
        id: 'commodity:SILVER_1KG:INR',
        symbol: 'SILVER 1KG',
        name: 'Silver (1kg)',
        category: 'commodity',
        unit: '1 kg',
        price: Number(silverPricePerKg.toFixed(2)),
        change: changeKg !== null ? Number(changeKg.toFixed(2)) : null,
        changePercent: changePctSilver !== null ? Number(changePctSilver.toFixed(2)) : null,
        high24h: silverHighKg !== null ? Number(silverHighKg.toFixed(2)) : null,
        low24h: silverLowKg !== null ? Number(silverLowKg.toFixed(2)) : null,
        previousClose: changeKg !== null ? Number((silverPricePerKg - changeKg).toFixed(2)) : null,
        lastUpdated,
      };

      results['commodity:SILVER_1G:INR'] = {
        id: 'commodity:SILVER_1G:INR',
        symbol: 'SILVER 1G',
        name: 'Silver (1g)',
        category: 'commodity',
        unit: '1 gram',
        price: Number(silverPricePerGram.toFixed(2)),
        change: change1g !== null ? Number(change1g.toFixed(2)) : null,
        changePercent: changePctSilver !== null ? Number(changePctSilver.toFixed(2)) : null,
        high24h: silverHighKg !== null ? Number((silverHighKg / 1000).toFixed(2)) : null,
        low24h: silverLowKg !== null ? Number((silverLowKg / 1000).toFixed(2)) : null,
        previousClose: change1g !== null ? Number((silverPricePerGram - change1g).toFixed(2)) : null,
        lastUpdated,
      };
    }

    return results;
  }

  async getQuote(id: string): Promise<CommodityAsset> {
    const all = await this.getAllCommodities();
    const found = all[id];
    if (found) return found;

    // Fallbacks
    if (id.toLowerCase().includes('kerala')) {
      if (id.includes('1G_22K')) return all['commodity:KERALA_GOLD_1G_22K:INR'] || Object.values(all)[0];
      if (id.includes('8G_24K')) return all['commodity:KERALA_GOLD_8G_24K:INR'] || Object.values(all)[0];
      return all['commodity:KERALA_GOLD_8G_22K:INR'] || Object.values(all)[0];
    }
    if (id.toLowerCase().includes('usd')) {
      return all['commodity:USD:INR'] || Object.values(all)[0];
    }
    if (id.toLowerCase().includes('silver')) {
      return all['commodity:SILVER_1KG:INR'] || Object.values(all)[0];
    }
    return (
      all['commodity:KERALA_GOLD_8G_22K:INR'] ||
      all['commodity:GOLD_8G_22K:INR'] ||
      all['commodity:GOLD_10G:INR'] ||
      Object.values(all)[0]
    );
  }

  async getHistoricalData(id: string, period: TimePeriod): Promise<HistoricalPrice[]> {
    const isKerala = id.toLowerCase().includes('kerala');
    const isUsd = id.toLowerCase().includes('usd');
    const isSilver = id.toLowerCase().includes('silver');
    const coinId = isUsd ? 'tether' : isSilver ? 'kinesis-silver' : 'pax-gold';

    const keralaRatio = isKerala ? this.cachedKeralaRatio : 1;

    let multiplier = 1 / TROY_OZ_TO_GRAMS;
    if (isUsd) {
      multiplier = 1;
    } else if (id.includes('KERALA_GOLD_8G_22K')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * 8 * (22 / 24) * keralaRatio;
    } else if (id.includes('KERALA_GOLD_1G_22K')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * (22 / 24) * keralaRatio;
    } else if (id.includes('KERALA_GOLD_8G_24K')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * 8 * keralaRatio;
    } else if (id.includes('GOLD_8G_22K')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * 8 * (22 / 24);
    } else if (id.includes('GOLD_8G_24K') || id.includes('8G')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * 8;
    } else if (id.includes('GOLD_1G_22K')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * (22 / 24);
    } else if (id.includes('10G')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * 10;
    } else if (id.includes('1KG')) {
      multiplier = (1 / TROY_OZ_TO_GRAMS) * 1000;
    }

    let days = '7';
    switch (period) {
      case '1W':
        days = '7';
        break;
      case '1M':
        days = '30';
        break;
      case '6M':
        days = '180';
        break;
      case '1Y':
        days = '365';
        break;
    }

    const url = `${this.coingeckoUrl}/coins/${coinId}/market_chart?vs_currency=inr&days=${days}`;

    try {
      const response = await this.fetchWithTimeout(url, 10000);

      if (!response.ok) return [];

      const data = await response.json();
      const prices: [number, number][] = data.prices || [];

      return prices.map(([ts, price]) => ({
        timestamp: ts,
        date: new Date(ts).toISOString(),
        price: Number((price * multiplier).toFixed(2)),
      }));
    } catch (e) {
      console.warn('Failed to fetch commodity history:', e);
      return [];
    }
  }
}

export const commodityApi = new CommodityApiService();
