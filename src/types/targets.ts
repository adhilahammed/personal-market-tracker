export interface CustomTargetField {
  id: string;
  label: string;
  value: number | null;
  color?: string;
}

export interface TargetEntry {
  id: string;
  date: string; // YYYY-MM-DD
  priceAtSet: number | null; // Share price at the time when target was set
  strongDip?: number | null;
  entry?: number | null;
  target?: number | null;
  profitExit?: number | null;
  fields?: CustomTargetField[];
  notes?: string;
  createdAt: string; // ISO string
}

export interface AssetTargetsState {
  activeEntryId: string | null;
  entries: TargetEntry[];
}

export interface StoredAssetTargetEntries {
  [assetId: string]: AssetTargetsState;
}

// Legacy types preserved for backward compatibility
export type TargetLevelKey = 'buyHeavily' | 'buy' | 'sell' | 'sellHeavily';

export interface TargetLevelConfig {
  key: TargetLevelKey;
  defaultLabel: string;
  actionTag: string;
  type: 'buy' | 'sell';
  description: string;
  colorName: 'emerald' | 'cyan' | 'amber' | 'rose';
}

export interface TargetLevelData {
  customLabel?: string;
  targetPrice: string;
  notes?: string;
}

export type AssetTargetsData = Record<TargetLevelKey, TargetLevelData>;

export interface StoredAssetTargets {
  [assetId: string]: AssetTargetsData;
}
