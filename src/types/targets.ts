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

export const TARGET_LEVELS_CONFIG: TargetLevelConfig[] = [
  {
    key: 'buyHeavily',
    defaultLabel: 'Support 2 (Strong Dip)',
    actionTag: 'Buy Heavily',
    type: 'buy',
    description: 'High-conviction value dip / heavy accumulation target',
    colorName: 'emerald',
  },
  {
    key: 'buy',
    defaultLabel: 'Support 1 (Entry)',
    actionTag: 'Buy',
    type: 'buy',
    description: 'Initial support level / primary entry target',
    colorName: 'cyan',
  },
  {
    key: 'sell',
    defaultLabel: 'Resistance 1 (Target)',
    actionTag: 'Sell',
    type: 'sell',
    description: 'Initial resistance / partial profit target',
    colorName: 'amber',
  },
  {
    key: 'sellHeavily',
    defaultLabel: 'Resistance 2 (Profit Exit)',
    actionTag: 'Sell Heavily',
    type: 'sell',
    description: 'Maximum profit target / strong exit zone',
    colorName: 'rose',
  },
];
