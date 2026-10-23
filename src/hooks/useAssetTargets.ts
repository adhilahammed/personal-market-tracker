import { useState, useEffect, useCallback } from 'react';
import { TargetEntry, AssetTargetsState, TargetLevelKey, TargetLevelData } from '../types/targets';
import {
  getAssetTargetsState,
  saveAssetTargetsState,
  getAssetTargets,
  saveAssetTargets,
  getDefaultAssetTargets,
} from '../utils/targetStorage';

export function useAssetTargets(assetId: string) {
  const [state, setState] = useState<AssetTargetsState>(() => getAssetTargetsState(assetId));

  // Sync state if assetId changes
  useEffect(() => {
    setState(getAssetTargetsState(assetId));
  }, [assetId]);

  // Listen to cross-window and custom events
  useEffect(() => {
    const handleUpdate = () => {
      setState(getAssetTargetsState(assetId));
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('market_targets_updated', handleUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('market_targets_updated', handleUpdate as EventListener);
    };
  }, [assetId]);

  const addEntry = useCallback(
    (newEntryData: Omit<TargetEntry, 'id' | 'createdAt'>) => {
      const entry: TargetEntry = {
        ...newEntryData,
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => {
        const next: AssetTargetsState = {
          activeEntryId: entry.id,
          // Insert at top, sort by date descending
          entries: [entry, ...prev.entries].sort((a, b) => b.date.localeCompare(a.date)),
        };
        saveAssetTargetsState(assetId, next);
        return next;
      });
      return entry;
    },
    [assetId]
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<Omit<TargetEntry, 'id' | 'createdAt'>>) => {
      setState((prev) => {
        const nextEntries = prev.entries
          .map((item) => (item.id === id ? { ...item, ...updates } : item))
          .sort((a, b) => b.date.localeCompare(a.date));

        const next: AssetTargetsState = {
          ...prev,
          entries: nextEntries,
        };
        saveAssetTargetsState(assetId, next);
        return next;
      });
    },
    [assetId]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setState((prev) => {
        const nextEntries = prev.entries.filter((item) => item.id !== id);
        let nextActiveId = prev.activeEntryId;
        if (nextActiveId === id) {
          nextActiveId = nextEntries.length > 0 ? nextEntries[0].id : null;
        }

        const next: AssetTargetsState = {
          activeEntryId: nextActiveId,
          entries: nextEntries,
        };
        saveAssetTargetsState(assetId, next);
        return next;
      });
    },
    [assetId]
  );

  const setActiveEntry = useCallback(
    (id: string | null) => {
      setState((prev) => {
        const next: AssetTargetsState = {
          ...prev,
          activeEntryId: id,
        };
        saveAssetTargetsState(assetId, next);
        return next;
      });
    },
    [assetId]
  );

  const clearAllEntries = useCallback(() => {
    const emptyState: AssetTargetsState = {
      activeEntryId: null,
      entries: [],
    };
    setState(emptyState);
    saveAssetTargetsState(assetId, emptyState);
  }, [assetId]);

  // Determine active entry
  const activeEntry: TargetEntry | null =
    state.entries.find((e) => e.id === state.activeEntryId) ||
    (state.entries.length > 0 ? state.entries[0] : null);

  // Legacy compatibility helpers
  const legacyTargets = getAssetTargets(assetId);
  const updateLevel = (key: TargetLevelKey, partial: Partial<TargetLevelData>) => {
    const current = { ...legacyTargets, [key]: { ...legacyTargets[key], ...partial } };
    saveAssetTargets(assetId, current);
  };
  const resetToDefaults = () => {
    saveAssetTargets(assetId, getDefaultAssetTargets());
  };
  const clearPrices = clearAllEntries;

  return {
    state,
    entries: state.entries,
    activeEntryId: state.activeEntryId,
    activeEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    setActiveEntry,
    clearAllEntries,
    // Legacy support
    targets: legacyTargets,
    updateLevel,
    resetToDefaults,
    clearPrices,
  };
}
