import { useState, useEffect, useCallback } from 'react';
import { AssetTargetsData, TargetLevelData, TargetLevelKey } from '../types/targets';
import { getAssetTargets, saveAssetTargets, getDefaultAssetTargets } from '../utils/targetStorage';

export function useAssetTargets(assetId: string) {
  const [targets, setTargets] = useState<AssetTargetsData>(() => getAssetTargets(assetId));
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Sync state if assetId changes
  useEffect(() => {
    setTargets(getAssetTargets(assetId));
    setIsSaved(true);
  }, [assetId]);

  // Listen to cross-window and custom events
  useEffect(() => {
    const handleUpdate = () => {
      setTargets(getAssetTargets(assetId));
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('market_targets_updated', handleUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('market_targets_updated', handleUpdate as EventListener);
    };
  }, [assetId]);

  const updateLevel = useCallback(
    (key: TargetLevelKey, partial: Partial<TargetLevelData>) => {
      setTargets((prev) => {
        const updated: AssetTargetsData = {
          ...prev,
          [key]: {
            ...prev[key],
            ...partial,
          },
        };
        saveAssetTargets(assetId, updated);
        setIsSaved(true);
        return updated;
      });
    },
    [assetId]
  );

  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultAssetTargets();
    setTargets(defaults);
    saveAssetTargets(assetId, defaults);
    setIsSaved(true);
  }, [assetId]);

  const clearPrices = useCallback(() => {
    setTargets((prev) => {
      const cleared: AssetTargetsData = {
        buyHeavily: { ...prev.buyHeavily, targetPrice: '' },
        buy: { ...prev.buy, targetPrice: '' },
        sell: { ...prev.sell, targetPrice: '' },
        sellHeavily: { ...prev.sellHeavily, targetPrice: '' },
      };
      saveAssetTargets(assetId, cleared);
      setIsSaved(true);
      return cleared;
    });
  }, [assetId]);

  return {
    targets,
    updateLevel,
    resetToDefaults,
    clearPrices,
    isSaved,
  };
}
