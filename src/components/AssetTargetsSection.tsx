import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TARGET_LEVELS_CONFIG, TargetLevelKey } from '../types/targets';
import { useAssetTargets } from '../hooks/useAssetTargets';

interface AssetTargetsSectionProps {
  assetId: string;
  currencySymbol: string;
  assetName: string;
}

export const AssetTargetsSection: React.FC<AssetTargetsSectionProps> = ({
  assetId,
  currencySymbol,
  assetName,
}) => {
  const { targets, updateLevel, resetToDefaults, clearPrices } = useAssetTargets(assetId);
  const [editingLabelKey, setEditingLabelKey] = useState<TargetLevelKey | null>(null);
  const [labelDraft, setLabelDraft] = useState<string>('');
  const [showNotesMap, setShowNotesMap] = useState<Record<string, boolean>>({});
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  const startEditLabel = (key: TargetLevelKey, currentLabel: string) => {
    setEditingLabelKey(key);
    setLabelDraft(currentLabel);
  };

  const saveEditLabel = (key: TargetLevelKey) => {
    const trimmed = labelDraft.trim();
    if (trimmed) {
      updateLevel(key, { customLabel: trimmed });
    }
    setEditingLabelKey(null);
  };

  const handlePriceChange = (key: TargetLevelKey, val: string) => {
    // Allow digits, decimals, and commas
    const sanitized = val.replace(/[^0-9.,]/g, '');
    updateLevel(key, { targetPrice: sanitized });
  };

  const handleNotesChange = (key: TargetLevelKey, val: string) => {
    updateLevel(key, { notes: val });
  };

  const toggleNotes = (key: string) => {
    setShowNotesMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    resetToDefaults();
    setShowConfirmation('Reset all targets to default labels');
    setTimeout(() => setShowConfirmation(null), 2500);
  };

  const handleClear = () => {
    clearPrices();
    setShowConfirmation('Cleared all target values');
    setTimeout(() => setShowConfirmation(null), 2500);
  };

  // Count how many targets are set
  const setTargetsCount = Object.values(targets).filter((t) => t.targetPrice.trim() !== '').length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Layers size={18} className="stroke-[2.5]" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Target Levels
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {setTargetsCount}/4 configured
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set custom buy and sell targets for {assetName}. All fields are fully editable and saved automatically.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClear}
            title="Clear all price values"
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            Clear Prices
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset labels to defaults"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset Labels</span>
          </button>
        </div>
      </div>

      {/* Confirmation Toast */}
      {showConfirmation && (
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 animate-fadeIn">
          <Sparkles size={14} />
          <span>{showConfirmation}</span>
        </div>
      )}

      {/* 4 Editable Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {TARGET_LEVELS_CONFIG.map((config) => {
          const data = targets[config.key];
          const isBuy = config.type === 'buy';
          const currentLabel = data?.customLabel || config.defaultLabel;
          const isEditing = editingLabelKey === config.key;
          const hasNotes = !!(data?.notes && data.notes.trim());
          const isNotesOpen = showNotesMap[config.key] ?? hasNotes;

          // Theme styling based on level
          const colorStyles = getColorStyles(config.colorName);

          return (
            <div
              key={config.key}
              className={`p-4 rounded-2xl border transition-all duration-200 bg-card-light dark:bg-card-dark ${colorStyles.cardBorder} hover:shadow-md`}
            >
              {/* Card Top Row: Label, Action Tag, and Edit Icon */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <input
                        type="text"
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditLabel(config.key);
                          if (e.key === 'Escape') setEditingLabelKey(null);
                        }}
                        autoFocus
                        className="w-full text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-blue-500 focus:outline-none"
                        placeholder={config.defaultLabel}
                      />
                      <button
                        type="button"
                        onClick={() => saveEditLabel(config.key)}
                        className="p-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                        title="Save label"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <h3
                        className="text-sm font-bold text-slate-900 dark:text-white truncate"
                        title={currentLabel}
                      >
                        {currentLabel}
                      </h3>
                      <button
                        type="button"
                        onClick={() => startEditLabel(config.key, currentLabel)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity"
                        title="Edit title"
                        aria-label="Edit title"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {config.description}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colorStyles.badge}`}
                  >
                    {isBuy ? (
                      <TrendingDown size={12} className="stroke-[2.5]" />
                    ) : (
                      <TrendingUp size={12} className="stroke-[2.5]" />
                    )}
                    <span>{config.actionTag}</span>
                  </span>
                </div>
              </div>

              {/* Price Input Field */}
              <div className="space-y-1 mb-2">
                <label
                  htmlFor={`target-input-${config.key}`}
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Target Price
                </label>
                <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 dark:text-slate-400 select-none">
                    {currencySymbol}
                  </span>
                  <input
                    id={`target-input-${config.key}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={data?.targetPrice || ''}
                    onChange={(e) => handlePriceChange(config.key, e.target.value)}
                    className="w-full pl-8 pr-16 py-2.5 text-base font-extrabold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                  />
                  {data?.targetPrice && (
                    <button
                      type="button"
                      onClick={() => handlePriceChange(config.key, '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Strategy Notes / Quantity Field */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleNotes(config.key)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors pt-1"
                >
                  <span>{isNotesOpen ? 'Hide strategy note' : '+ Add strategy note'}</span>
                  {isNotesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {isNotesOpen && (
                  <div className="mt-1.5 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="e.g. Accumulate 20 units or Trigger alert"
                      value={data?.notes || ''}
                      onChange={(e) => handleNotesChange(config.key, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Strategy Helper Info */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          These target levels serve as your personal price execution plan (
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">Buy Heavily</strong>,{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">Buy</strong>,{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">Sell</strong>, and{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">Sell Heavily</strong>).
          Values are persisted in your local browser storage.
        </p>
      </div>
    </div>
  );
};

function getColorStyles(color: 'emerald' | 'cyan' | 'amber' | 'rose') {
  switch (color) {
    case 'emerald':
      return {
        cardBorder: 'border-emerald-500/20 hover:border-emerald-500/40',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      };
    case 'cyan':
      return {
        cardBorder: 'border-cyan-500/20 hover:border-cyan-500/40',
        badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
      };
    case 'amber':
      return {
        cardBorder: 'border-amber-500/20 hover:border-amber-500/40',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      };
    case 'rose':
      return {
        cardBorder: 'border-rose-500/20 hover:border-rose-500/40',
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
      };
  }
}
