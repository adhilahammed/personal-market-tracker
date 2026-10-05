import { CommodityAsset, HistoricalPrice, TimePeriod } from '../types/market';

const TROY_OZ_TO_GRAMS = 31.1034768;

export const INITIAL_COMMODITIES = [
  'commodity:GOLD_8G_22K:INR',
  'commodity:GOLD_8G_24K:INR',
  'commodity:GOLD_1G_22K:INR',
  'commodity:GOLD_10G:INR',
  'commodity:GOLD_1G:INR',
  'commodity:SILVER_1KG:INR',
  'commodity:SILVER_1G:INR',
];

class CommodityApiService {
  private coingeckoUrl = 'https://api.coingecko.com/api/v3';

  async getAllCommodities(): Promise<Record<string, CommodityAsset>> {
    const url = `${this.coingeckoUrl}/coins/markets?vs_currency=inr&ids=pax-gold,kinesis-silver&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Commodity API error: ${response.status}`);
    }

    const data = await response.json();
    const paxGold = data.find((d: { id: string }) => d.id === 'pax-gold');
    const silver = data.find((d: { id: string }) => d.id === 'kinesis-silver');

    if (!paxGold && !silver) {
      throw new Error('Unable to retrieve gold and silver prices');
    }

    const results: Record<string, CommodityAsset> = {};

    // 1. Gold calculations (24K pure & 22K standard jewellery rate)
    if (paxGold && paxGold.current_price) {
      const goldPricePerOz = paxGold.current_price;
      const goldPricePerGram24K = goldPricePerOz / TROY_OZ_TO_GRAMS;
      const goldPricePerGram22K = goldPricePerGram24K * (22 / 24);

      const goldPricePer8g22K = goldPricePerGram22K * 8;
      const goldPricePer8g24K = goldPricePerGram24K * 8;
      const goldPricePer10g24K = goldPricePerGram24K * 10;

      const changePct = paxGold.price_change_percentage_24h ?? null;
      const change8g22K = changePct !== null ? (goldPricePer8g22K * changePct) / 100 : null;
      const change8g24K = changePct !== null ? (goldPricePer8g24K * changePct) / 100 : null;
      const change1g22K = changePct !== null ? (goldPricePerGram22K * changePct) / 100 : null;
      const change10g24K = changePct !== null ? (goldPricePer10g24K * changePct) / 100 : null;
      const change1g24K = changePct !== null ? (goldPricePerGram24K * changePct) / 100 : null;

      const highGram24K = paxGold.high_24h ? paxGold.high_24h / TROY_OZ_TO_GRAMS : null;
      const lowGram24K = paxGold.low_24h ? paxGold.low_24h / TROY_OZ_TO_GRAMS : null;

      const lastUpdated = paxGold.last_updated || new Date().toISOString();

      // 8g 22K (1 Pavan / Sovereign) - Indian Retail Standard Benchmark
      results['commodity:GOLD_8G_22K:INR'] = {
        id: 'commodity:GOLD_8G_22K:INR',
        symbol: 'GOLD 8G (22K)',
        name: 'Gold 22K (8g / 1 Pavan)',
        category: 'commodity',
        unit: '8 grams · 1 Pavan (22K)',
        price: Number(goldPricePer8g22K.toFixed(2)),
        change: change8g22K !== null ? Number(change8g22K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * (22 / 24) * 8).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * (22 / 24) * 8).toFixed(2)) : null,
        previousClose: change8g22K !== null ? Number((goldPricePer8g22K - change8g22K).toFixed(2)) : null,
        lastUpdated,
      };

      // 8g 24K (Pure Gold 8 grams)
      results['commodity:GOLD_8G_24K:INR'] = {
        id: 'commodity:GOLD_8G_24K:INR',
        symbol: 'GOLD 8G (24K)',
        name: 'Gold 24K (8g)',
        category: 'commodity',
        unit: '8 grams (24K Pure)',
        price: Number(goldPricePer8g24K.toFixed(2)),
        change: change8g24K !== null ? Number(change8g24K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * 8).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * 8).toFixed(2)) : null,
        previousClose: change8g24K !== null ? Number((goldPricePer8g24K - change8g24K).toFixed(2)) : null,
        lastUpdated,
      };

      // 1g 22K
      results['commodity:GOLD_1G_22K:INR'] = {
        id: 'commodity:GOLD_1G_22K:INR',
        symbol: 'GOLD 1G (22K)',
        name: 'Gold 22K (1g)',
        category: 'commodity',
        unit: '1 gram (22K)',
        price: Number(goldPricePerGram22K.toFixed(2)),
        change: change1g22K !== null ? Number(change1g22K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * (22 / 24)).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * (22 / 24)).toFixed(2)) : null,
        previousClose: change1g22K !== null ? Number((goldPricePerGram22K - change1g22K).toFixed(2)) : null,
        lastUpdated,
      };

      // 10g 24K
      results['commodity:GOLD_10G:INR'] = {
        id: 'commodity:GOLD_10G:INR',
        symbol: 'GOLD 10G',
        name: 'Gold 24K (10g)',
        category: 'commodity',
        unit: '10 grams',
        price: Number(goldPricePer10g24K.toFixed(2)),
        change: change10g24K !== null ? Number(change10g24K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number((highGram24K * 10).toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number((lowGram24K * 10).toFixed(2)) : null,
        previousClose: change10g24K !== null ? Number((goldPricePer10g24K - change10g24K).toFixed(2)) : null,
        lastUpdated,
      };

      // 1g 24K
      results['commodity:GOLD_1G:INR'] = {
        id: 'commodity:GOLD_1G:INR',
        symbol: 'GOLD 1G',
        name: 'Gold 24K (1g)',
        category: 'commodity',
        unit: '1 gram',
        price: Number(goldPricePerGram24K.toFixed(2)),
        change: change1g24K !== null ? Number(change1g24K.toFixed(2)) : null,
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
        high24h: highGram24K !== null ? Number(highGram24K.toFixed(2)) : null,
        low24h: lowGram24K !== null ? Number(lowGram24K.toFixed(2)) : null,
        previousClose: change1g24K !== null ? Number((goldPricePerGram24K - change1g24K).toFixed(2)) : null,
        lastUpdated,
      };
    }

    // 2. Silver calculations
    if (silver && silver.current_price) {
      const silverPricePerOz = silver.current_price;
      const silverPricePerGram = silverPricePerOz / TROY_OZ_TO_GRAMS;
      const silverPricePerKg = silverPricePerGram * 1000;

      const changePct = silver.price_change_percentage_24h ?? null;
      const changeKg = changePct !== null ? (silverPricePerKg * changePct) / 100 : null;
      const change1g = changePct !== null ? (silverPricePerGram * changePct) / 100 : null;

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
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
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
        changePercent: changePct !== null ? Number(changePct.toFixed(2)) : null,
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
    if (id.toLowerCase().includes('silver')) {
      return all['commodity:SILVER_1KG:INR'] || Object.values(all)[0];
    }
    return (
      all['commodity:GOLD_8G_22K:INR'] ||
      all['commodity:GOLD_10G:INR'] ||
      Object.values(all)[0]
    );
  }

  async getHistoricalData(id: string, period: TimePeriod): Promise<HistoricalPrice[]> {
    const isSilver = id.toLowerCase().includes('silver');
    const coinId = isSilver ? 'kinesis-silver' : 'pax-gold';

    let multiplier = 1 / TROY_OZ_TO_GRAMS;
    if (id.includes('GOLD_8G_22K')) {
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
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

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
