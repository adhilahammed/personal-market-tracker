import { AssetTargetsData, StoredAssetTargets, TARGET_LEVELS_CONFIG } from '../types/targets';

const TARGETS_STORAGE_KEY = 'my_markets_custom_targets_v1';

export function getDefaultAssetTargets(): AssetTargetsData {
  return {
    buyHeavily: {
      customLabel: TARGET_LEVELS_CONFIG.find((c) => c.key === 'buyHeavily')?.defaultLabel || 'Support 2 (Strong Dip)',
      targetPrice: '',
      notes: '',
    },
    buy: {
      customLabel: TARGET_LEVELS_CONFIG.find((c) => c.key === 'buy')?.defaultLabel || 'Support 1 (Entry)',
      targetPrice: '',
      notes: '',
    },
    sell: {
      customLabel: TARGET_LEVELS_CONFIG.find((c) => c.key === 'sell')?.defaultLabel || 'Resistance 1 (Target)',
      targetPrice: '',
      notes: '',
    },
    sellHeavily: {
      customLabel: TARGET_LEVELS_CONFIG.find((c) => c.key === 'sellHeavily')?.defaultLabel || 'Resistance 2 (Profit Exit)',
      targetPrice: '',
      notes: '',
    },
  };
}

export function getAllStoredTargets(): StoredAssetTargets {
  try {
    const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Error reading custom targets from localStorage:', e);
    return {};
  }
}

export function getAssetTargets(assetId: string): AssetTargetsData {
  const all = getAllStoredTargets();
  const existing = all[assetId];
  const defaults = getDefaultAssetTargets();

  if (!existing) return defaults;

  // Merge with defaults to ensure all keys exist
  return {
    buyHeavily: { ...defaults.buyHeavily, ...(existing.buyHeavily || {}) },
    buy: { ...defaults.buy, ...(existing.buy || {}) },
    sell: { ...defaults.sell, ...(existing.sell || {}) },
    sellHeavily: { ...defaults.sellHeavily, ...(existing.sellHeavily || {}) },
  };
}

export function saveAssetTargets(assetId: string, targets: AssetTargetsData): void {
  try {
    const all = getAllStoredTargets();
    all[assetId] = targets;
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(all));
    // Trigger custom event for same-window components
    window.dispatchEvent(new CustomEvent('market_targets_updated', { detail: { assetId } }));
  } catch (e) {
    console.error('Error saving custom targets to localStorage:', e);
  }
}

export function removeAssetTargets(assetId: string): void {
  try {
    const all = getAllStoredTargets();
    delete all[assetId];
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('market_targets_updated', { detail: { assetId } }));
  } catch (e) {
    console.error('Error removing custom targets from localStorage:', e);
  }
}
