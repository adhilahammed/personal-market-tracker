import {
  TargetEntry,
  AssetTargetsState,
  StoredAssetTargetEntries,
  AssetTargetsData,
  StoredAssetTargets,
} from '../types/targets';

const TARGET_ENTRIES_STORAGE_KEY = 'my_markets_target_entries_v2';
const LEGACY_TARGETS_STORAGE_KEY = 'my_markets_custom_targets_v1';

export function getAllStoredTargetEntries(): StoredAssetTargetEntries {
  try {
    const raw = localStorage.getItem(TARGET_ENTRIES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Error reading target entries from localStorage:', e);
    return {};
  }
}

export function getAssetTargetsState(assetId: string): AssetTargetsState {
  const all = getAllStoredTargetEntries();
  const existing = all[assetId];

  if (existing && Array.isArray(existing.entries)) {
    return existing;
  }

  // Check if legacy data exists in v1 to migrate
  try {
    const legacyRaw = localStorage.getItem(LEGACY_TARGETS_STORAGE_KEY);
    if (legacyRaw) {
      const legacyAll = JSON.parse(legacyRaw);
      const legacy = legacyAll?.[assetId];
      if (
        legacy &&
        (legacy.buyHeavily?.targetPrice ||
          legacy.buy?.targetPrice ||
          legacy.sell?.targetPrice ||
          legacy.sellHeavily?.targetPrice)
      ) {
        const parseNum = (val: any) => {
          if (!val) return null;
          const cleaned = String(val).replace(/[^0-9.-]+/g, '');
          const n = parseFloat(cleaned);
          return isNaN(n) ? null : n;
        };

        const migratedEntry: TargetEntry = {
          id: `migrated-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          priceAtSet: null,
          strongDip: parseNum(legacy.buyHeavily?.targetPrice),
          entry: parseNum(legacy.buy?.targetPrice),
          target: parseNum(legacy.sell?.targetPrice),
          profitExit: parseNum(legacy.sellHeavily?.targetPrice),
          notes: legacy.buyHeavily?.notes || legacy.buy?.notes || legacy.sell?.notes || '',
          createdAt: new Date().toISOString(),
        };

        const migratedState: AssetTargetsState = {
          activeEntryId: migratedEntry.id,
          entries: [migratedEntry],
        };

        saveAssetTargetsState(assetId, migratedState);
        return migratedState;
      }
    }
  } catch (e) {
    console.warn('Legacy target migration skipped:', e);
  }

  return {
    activeEntryId: null,
    entries: [],
  };
}

export function saveAssetTargetsState(assetId: string, state: AssetTargetsState): void {
  try {
    const all = getAllStoredTargetEntries();
    all[assetId] = state;
    localStorage.setItem(TARGET_ENTRIES_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('market_targets_updated', { detail: { assetId } }));
  } catch (e) {
    console.error('Error saving target entries to localStorage:', e);
  }
}

// Legacy helper functions kept for compatibility
export function getDefaultAssetTargets(): AssetTargetsData {
  return {
    buyHeavily: {
      customLabel: 'Strong Dip',
      targetPrice: '',
      notes: '',
    },
    buy: {
      customLabel: 'Entry',
      targetPrice: '',
      notes: '',
    },
    sell: {
      customLabel: 'Target',
      targetPrice: '',
      notes: '',
    },
    sellHeavily: {
      customLabel: 'Profit Exit',
      targetPrice: '',
      notes: '',
    },
  };
}

export function getAllStoredTargets(): StoredAssetTargets {
  try {
    const raw = localStorage.getItem(LEGACY_TARGETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function getAssetTargets(assetId: string): AssetTargetsData {
  const state = getAssetTargetsState(assetId);
  const active = state.entries.find((e) => e.id === state.activeEntryId) || state.entries[0];
  const defaults = getDefaultAssetTargets();

  if (!active) return defaults;

  return {
    buyHeavily: {
      customLabel: 'Strong Dip',
      targetPrice: active.strongDip !== null ? String(active.strongDip) : '',
      notes: active.notes || '',
    },
    buy: {
      customLabel: 'Entry',
      targetPrice: active.entry !== null ? String(active.entry) : '',
      notes: active.notes || '',
    },
    sell: {
      customLabel: 'Target',
      targetPrice: active.target !== null ? String(active.target) : '',
      notes: active.notes || '',
    },
    sellHeavily: {
      customLabel: 'Profit Exit',
      targetPrice: active.profitExit !== null ? String(active.profitExit) : '',
      notes: active.notes || '',
    },
  };
}

export function saveAssetTargets(assetId: string, targets: AssetTargetsData): void {
  // Legacy bridge: updates or creates active entry in v2
  const parseNum = (val: string) => {
    if (!val) return null;
    const cleaned = String(val).replace(/[^0-9.-]+/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };

  const state = getAssetTargetsState(assetId);
  const newEntry: TargetEntry = {
    id: `entry-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    priceAtSet: null,
    strongDip: parseNum(targets.buyHeavily.targetPrice),
    entry: parseNum(targets.buy.targetPrice),
    target: parseNum(targets.sell.targetPrice),
    profitExit: parseNum(targets.sellHeavily.targetPrice),
    notes: targets.buyHeavily.notes || targets.buy.notes || targets.sell.notes || '',
    createdAt: new Date().toISOString(),
  };

  saveAssetTargetsState(assetId, {
    activeEntryId: newEntry.id,
    entries: [newEntry, ...state.entries],
  });
}
