import React, { useState, useEffect } from 'react';
import {
  Layers,
  Calendar,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Eye,
  Info,
} from 'lucide-react';
import { TargetEntry, CustomTargetField } from '../types/targets';
import { useAssetTargets } from '../hooks/useAssetTargets';
import { formatCurrency, getLocalDateString } from '../utils/formatters';

interface FormFieldItem {
  id: string;
  label: string;
  value: string;
}

const DEFAULT_FORM_FIELDS: FormFieldItem[] = [
  { id: 'f-entry', label: 'Entry', value: '' },
  { id: 'f-target', label: 'Target', value: '' },
];

function getEntryFields(entry: TargetEntry): CustomTargetField[] {
  if (entry.fields && Array.isArray(entry.fields) && entry.fields.length > 0) {
    return entry.fields.filter((f) => f.value !== null && f.value !== undefined);
  }
  const result: CustomTargetField[] = [];
  if (entry.strongDip !== null && entry.strongDip !== undefined) {
    result.push({ id: 'strongDip', label: 'Strong Dip', value: entry.strongDip });
  }
  if (entry.entry !== null && entry.entry !== undefined) {
    result.push({ id: 'entry', label: 'Entry', value: entry.entry });
  }
  if (entry.target !== null && entry.target !== undefined) {
    result.push({ id: 'target', label: 'Target', value: entry.target });
  }
  if (entry.profitExit !== null && entry.profitExit !== undefined) {
    result.push({ id: 'profitExit', label: 'Profit Exit', value: entry.profitExit });
  }
  return result;
}

function getFieldColorClass(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('strong dip') || l.includes('dip') || l.includes('accumul')) {
    return 'text-cyan-600 dark:text-cyan-400';
  }
  if (l.includes('entry') || l.includes('buy')) {
    return 'text-emerald-600 dark:text-emerald-400';
  }
  if (l.includes('profit') || l.includes('exit')) {
    return 'text-purple-600 dark:text-purple-400';
  }
  if (l.includes('target') || l.includes('goal')) {
    return 'text-amber-600 dark:text-amber-400';
  }
  if (l.includes('stop') || l.includes('sl') || l.includes('loss') || l.includes('risk')) {
    return 'text-rose-600 dark:text-rose-400';
  }
  return 'text-blue-600 dark:text-blue-400';
}

interface AssetTargetsSectionProps {
  assetId: string;
  currencySymbol: string;
  assetName?: string;
  currentPrice?: number | null;
}

export const AssetTargetsSection: React.FC<AssetTargetsSectionProps> = ({
  assetId,
  currencySymbol,
  currentPrice = null,
}) => {
  const {
    entries,
    activeEntryId,
    addEntry,
    updateEntry,
    deleteEntry,
    setActiveEntry,
    clearAllEntries,
  } = useAssetTargets(assetId);

  // Guarantee that crypto is always in USD ($)
  const isCryptoAsset =
    currencySymbol === '$' ||
    assetId.toLowerCase().startsWith('crypto') ||
    assetId.toLowerCase().includes(':crypto');
  const effectiveCurrencySymbol = isCryptoAsset ? '$' : currencySymbol;

  // Form State for creating / editing entries
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(() => getLocalDateString());
  const [formPriceAtSet, setFormPriceAtSet] = useState<string>(() =>
    currentPrice !== null && currentPrice !== undefined ? String(currentPrice) : ''
  );
  const [formFields, setFormFields] = useState<FormFieldItem[]>(DEFAULT_FORM_FIELDS);
  const [formNotes, setFormNotes] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // When currentPrice becomes available and formPriceAtSet is empty, prefill it
  useEffect(() => {
    if (currentPrice !== null && currentPrice !== undefined && !formPriceAtSet && !editingId) {
      setFormPriceAtSet(String(currentPrice));
    }
  }, [currentPrice, formPriceAtSet, editingId]);

  // Parse helper for numbers
  const parseInput = (val: string): number | null => {
    if (!val || !val.trim()) return null;
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const handleAddField = (presetLabel = 'Target') => {
    setFormFields((prev: FormFieldItem[]) => [
      ...prev,
      {
        id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        label: presetLabel,
        value: '',
      },
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFormFields((prev: FormFieldItem[]) => (prev.length > 1 ? prev.filter((f: FormFieldItem) => f.id !== id) : prev));
  };

  const handleFieldLabelChange = (id: string, label: string) => {
    setFormFields((prev: FormFieldItem[]) =>
      prev.map((f: FormFieldItem) => (f.id === id ? { ...f, label } : f))
    );
  };

  const handleFieldValueChange = (id: string, value: string) => {
    setFormFields((prev: FormFieldItem[]) =>
      prev.map((f: FormFieldItem) => (f.id === id ? { ...f, value } : f))
    );
  };

  // Load an existing entry into the form for editing
  const handleEditClick = (entry: TargetEntry) => {
    setEditingId(entry.id);
    setFormDate(entry.date);
    setFormPriceAtSet(entry.priceAtSet !== null ? String(entry.priceAtSet) : '');
    const fields = getEntryFields(entry);
    if (fields.length > 0) {
      setFormFields(
        fields.map((f: CustomTargetField, i: number) => ({
          id: f.id || `f-${i}-${Date.now()}`,
          label: f.label,
          value: f.value !== null && f.value !== undefined ? String(f.value) : '',
        }))
      );
    } else {
      setFormFields(DEFAULT_FORM_FIELDS);
    }
    setFormNotes(entry.notes || '');

    // Scroll smoothly to form
    const formElement = document.getElementById('target-entry-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Reset form to clean state
  const handleResetForm = () => {
    setEditingId(null);
    setFormDate(getLocalDateString());
    setFormPriceAtSet(currentPrice !== null && currentPrice !== undefined ? String(currentPrice) : '');
    setFormFields([
      { id: 'f-entry', label: 'Entry', value: '' },
      { id: 'f-target', label: 'Target', value: '' },
    ]);
    setFormNotes('');
  };

  // Submit form (Add new or Update existing)
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const priceAtSet = editingId
      ? parseInput(formPriceAtSet)
      : (currentPrice ?? parseInput(formPriceAtSet));
    const date = editingId ? (formDate || getLocalDateString()) : getLocalDateString();

    const parsedFields: CustomTargetField[] = formFields
      .map((f: FormFieldItem) => ({
        id: f.id,
        label: f.label.trim() || 'Target',
        value: parseInput(f.value),
      }))
      .filter((f): f is CustomTargetField => f.value !== null);

    if (parsedFields.length === 0) {
      showToast('Please enter at least one target level');
      return;
    }

    // Legacy fallback mapping
    const findLegacy = (keywords: string[]) => {
      const match = parsedFields.find((f: CustomTargetField) =>
        keywords.some((k) => f.label.toLowerCase().includes(k))
      );
      return match ? match.value : null;
    };

    const entryPayload = {
      date,
      priceAtSet,
      fields: parsedFields,
      strongDip: findLegacy(['strong dip', 'dip', 'accumul']),
      entry: findLegacy(['entry', 'buy']),
      target: findLegacy(['target', 'goal']),
      profitExit: findLegacy(['profit exit', 'exit']),
      notes: formNotes.trim(),
    };

    if (editingId) {
      updateEntry(editingId, entryPayload);
      showToast('Target entry updated successfully');
      setEditingId(null);
      handleResetForm();
    } else {
      addEntry(entryPayload);
      showToast('New target setup saved to history');
      handleResetForm();
    }
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setDeleteConfirmId(null);
    showToast('Target entry deleted');
    if (editingId === id) {
      handleResetForm();
    }
  };

  // Helper to format date display in local timezone
  function formatDatePretty(dateString: string, createdAt?: string) {
    if (!dateString && !createdAt) return 'N/A';
    try {
      if (createdAt) {
        const d = new Date(createdAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        }
      }
      const [year, month, day] = dateString.split('-');
      if (!year || !month || !day) return dateString;
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2 animate-fadeIn shadow-sm">
          <Sparkles size={15} />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. INPUT FIELDS TO CREATE / EDIT ENTRIES */}
      {/* ========================================================================= */}
      <div
        id="target-entry-form"
        className="p-5 sm:p-6 rounded-3xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm transition-all"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingId ? 'Edit Target Setup Entry' : 'Create New Target Entry'}
          </h3>

          {editingId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw size={12} />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveEntry} className="space-y-4">
          {/* Dynamic Target Levels */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Target Levels ({formFields.length})
              </span>
              <button
                type="button"
                onClick={() => handleAddField('Target')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                <Plus size={13} className="stroke-[2.5]" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formFields.map((field: FormFieldItem) => (
                <div
                  key={field.id}
                  className="p-3 rounded-2xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-blue-500 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleFieldLabelChange(field.id, e.target.value)}
                      placeholder="Field Name"
                      className={`w-full text-[11px] font-bold uppercase tracking-wider bg-transparent focus:outline-none ${getFieldColorClass(field.label)}`}
                    />
                    {formFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remove field"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-800/80 focus-within:border-blue-500">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                      {effectiveCurrencySymbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="Price"
                      value={field.value}
                      onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1">
            <label
              htmlFor="input-target-notes"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Strategy / Setup Notes (Optional)
            </label>
            <input
              id="input-target-notes"
              type="text"
              placeholder="e.g. Post-earnings accumulation, buying near 200 EMA support"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Clear Form
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>{editingId ? 'Update Target Entry' : 'Save Target Setup'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 3. TARGET HISTORY & STRATEGY LOG (Cards View + Table View) */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Target History &amp; Strategy Log
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all target history for this asset?')) {
                  clearAllEntries();
                  handleResetForm();
                  showToast('Target history cleared');
                }
              }}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 px-2 py-1 rounded transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-border-light dark:border-border-dark bg-card-light/50 dark:bg-card-dark/50 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center mb-3">
              <Layers size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              No target setups recorded yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Use the form above to record your target levels for different market dates. Each setup will be tracked and compared with live price.
            </p>
          </div>
        ) : (
          /* ========================================================================= */
          /* CARDS VIEW: 2-Column Key/Value Cards for each Target Entry */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
            {entries.map((item) => {
              const isActive = item.id === activeEntryId || (!activeEntryId && entries[0]?.id === item.id);
              const isBeingEdited = item.id === editingId;

              // % Gain/Loss since target was set
              let gainLossPct: number | null = null;
              if (currentPrice !== null && currentPrice !== undefined && item.priceAtSet && item.priceAtSet > 0) {
                gainLossPct = ((currentPrice - item.priceAtSet) / item.priceAtSet) * 100;
              }

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border overflow-hidden transition-all duration-200 bg-card-light dark:bg-card-dark shadow-sm ${
                    isActive
                      ? 'border-blue-500/60 shadow-md ring-1 ring-blue-500/25'
                      : 'border-border-light dark:border-border-dark hover:border-slate-300 dark:hover:border-slate-700'
                  } ${isBeingEdited ? 'ring-2 ring-blue-500/40' : ''}`}
                >
                  {/* Card Header Bar: Setup Date, Active Status, and Actions */}
                  <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{formatDatePretty(item.date, item.createdAt)}</span>
                      </div>

                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          <Check size={10} className="stroke-[3]" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEntry(item.id);
                          if (editingId) handleResetForm();
                          showToast(`Loaded ${formatDatePretty(item.date, item.createdAt)} into active card`);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:text-blue-500 hover:bg-blue-500/10'
                        }`}
                        title={isActive ? 'Active in card' : 'View in card'}
                      >
                        <Eye size={13} />
                        <span>{isActive ? 'Active' : 'View'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                        title="Edit entry"
                      >
                        <Edit3 size={13} />
                      </button>

                      {deleteConfirmId === item.id ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold"
                          title="Confirm delete"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Key / Value Table matching the exact Table View design */}
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-border-light dark:divide-border-dark font-medium">
                      {/* Date Set */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          Date Set
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center justify-end gap-1.5">
                            {isActive && (
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                                title="Active setup in card"
                              />
                            )}
                            <span>{formatDatePretty(item.date, item.createdAt)}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Price at Set */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          Price at Set ({effectiveCurrencySymbol})
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                          {item.priceAtSet !== null
                            ? formatCurrency(item.priceAtSet, effectiveCurrencySymbol)
                            : '—'}
                        </td>
                      </tr>

                      {/* Dynamic Target Fields */}
                      {getEntryFields(item).map((field: CustomTargetField) => (
                        <tr
                          key={field.id || field.label}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className={`px-4 py-2.5 font-semibold ${getFieldColorClass(field.label)}`}>
                            {field.label}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono font-bold ${getFieldColorClass(field.label)}`}>
                            {field.value !== null ? formatCurrency(field.value, effectiveCurrencySymbol) : '—'}
                          </td>
                        </tr>
                      ))}

                      {/* Status / P&L */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          Status / P&amp;L
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {gainLossPct !== null ? (
                            <span
                              className={`inline-flex items-center gap-1 font-bold font-mono text-[11px] px-2 py-0.5 rounded-full ${
                                gainLossPct >= 0
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {gainLossPct >= 0 ? '+' : ''}
                              {gainLossPct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Static</span>
                          )}
                        </td>
                      </tr>

                      {/* Notes (if any) */}
                      {item.notes && (
                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 align-top">
                            Notes
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300 text-xs italic break-words">
                            {item.notes}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Target Strategy Helper Info */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Record targets for different market dates to track your conviction levels over time. As market conditions evolve, save new setups with the prevailing price at that date to monitor how your profit and dip thresholds adapt.
        </p>
      </div>
    </div>
  );
};
