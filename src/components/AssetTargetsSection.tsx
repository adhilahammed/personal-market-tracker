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
import { TargetEntry } from '../types/targets';
import { useAssetTargets } from '../hooks/useAssetTargets';
import { formatCurrency } from '../utils/formatters';

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
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formPriceAtSet, setFormPriceAtSet] = useState<string>(() =>
    currentPrice !== null && currentPrice !== undefined ? String(currentPrice) : ''
  );
  const [formStrongDip, setFormStrongDip] = useState<string>('');
  const [formEntry, setFormEntry] = useState<string>('');
  const [formTarget, setFormTarget] = useState<string>('');
  const [formProfitExit, setFormProfitExit] = useState<string>('');
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

  // Load an existing entry into the form for editing
  const handleEditClick = (entry: TargetEntry) => {
    setEditingId(entry.id);
    setFormDate(entry.date);
    setFormPriceAtSet(entry.priceAtSet !== null ? String(entry.priceAtSet) : '');
    setFormStrongDip(entry.strongDip !== null ? String(entry.strongDip) : '');
    setFormEntry(entry.entry !== null ? String(entry.entry) : '');
    setFormTarget(entry.target !== null ? String(entry.target) : '');
    setFormProfitExit(entry.profitExit !== null ? String(entry.profitExit) : '');
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
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPriceAtSet(currentPrice !== null && currentPrice !== undefined ? String(currentPrice) : '');
    setFormStrongDip('');
    setFormEntry('');
    setFormTarget('');
    setFormProfitExit('');
    setFormNotes('');
  };

  // Submit form (Add new or Update existing)
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const priceAtSet = parseInput(formPriceAtSet);
    const strongDip = parseInput(formStrongDip);
    const entry = parseInput(formEntry);
    const target = parseInput(formTarget);
    const profitExit = parseInput(formProfitExit);

    if (
      strongDip === null &&
      entry === null &&
      target === null &&
      profitExit === null
    ) {
      showToast('Please enter at least one target level');
      return;
    }

    if (editingId) {
      updateEntry(editingId, {
        date: formDate,
        priceAtSet,
        strongDip,
        entry,
        target,
        profitExit,
        notes: formNotes.trim(),
      });
      showToast('Target entry updated successfully');
      setEditingId(null);
      handleResetForm();
    } else {
      addEntry({
        date: formDate,
        priceAtSet,
        strongDip,
        entry,
        target,
        profitExit,
        notes: formNotes.trim(),
      });
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

  // Helper to format date display
  function formatDatePretty(dateString: string) {
    if (!dateString) return 'N/A';
    try {
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
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
              {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Target Setup Entry' : 'Create New Target Entry'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set and record custom price targets and accumulation levels
              </p>
            </div>
          </div>

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
          {/* Row 1: Date & Share Price at Set Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label
                htmlFor="input-target-date"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Date When Target is Set
              </label>
              <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input
                  id="input-target-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="input-target-price-at-set"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {isCryptoAsset ? 'Price at Set Time (USD $)' : 'Share Price at Set Time'}
              </label>
              <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                  {effectiveCurrencySymbol}
                </span>
                <input
                  id="input-target-price-at-set"
                  type="number"
                  step="any"
                  placeholder={currentPrice ? String(currentPrice) : isCryptoAsset ? 'e.g. 64500.00' : 'e.g. 1025.50'}
                  value={formPriceAtSet}
                  onChange={(e) => setFormPriceAtSet(e.target.value)}
                  className="w-full pl-8 pr-16 py-2.5 text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
                {currentPrice !== null && currentPrice !== undefined && (
                  <button
                    type="button"
                    onClick={() => setFormPriceAtSet(String(currentPrice))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                    title="Use live market price"
                  >
                    Live Price
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Strong Dip, Entry, Target, Profit Exit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Strong Dip Input */}
            <div className="space-y-1">
              <label
                htmlFor="input-target-strong-dip"
                className="block text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"
              >
                Strong Dip
              </label>
              <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                  {effectiveCurrencySymbol}
                </span>
                <input
                  id="input-target-strong-dip"
                  type="number"
                  step="any"
                  placeholder={isCryptoAsset ? 'e.g. 58000' : 'e.g. 95000'}
                  value={formStrongDip}
                  onChange={(e) => setFormStrongDip(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Entry Input */}
            <div className="space-y-1">
              <label
                htmlFor="input-target-entry"
                className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"
              >
                Entry
              </label>
              <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                  {effectiveCurrencySymbol}
                </span>
                <input
                  id="input-target-entry"
                  type="number"
                  step="any"
                  placeholder={isCryptoAsset ? 'e.g. 62000' : 'e.g. 98000'}
                  value={formEntry}
                  onChange={(e) => setFormEntry(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Target Input */}
            <div className="space-y-1">
              <label
                htmlFor="input-target-goal"
                className="block text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"
              >
                Target
              </label>
              <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                  {effectiveCurrencySymbol}
                </span>
                <input
                  id="input-target-goal"
                  type="number"
                  step="any"
                  placeholder={isCryptoAsset ? 'e.g. 75000' : 'e.g. 105000'}
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Profit Exit Input */}
            <div className="space-y-1">
              <label
                htmlFor="input-target-profit-exit"
                className="block text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400"
              >
                Profit Exit
              </label>
              <div className="relative rounded-xl border border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-900/60 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                  {effectiveCurrencySymbol}
                </span>
                <input
                  id="input-target-profit-exit"
                  type="number"
                  step="any"
                  placeholder={isCryptoAsset ? 'e.g. 85000' : 'e.g. 112000'}
                  value={formProfitExit}
                  onChange={(e) => setFormProfitExit(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-bold font-mono text-slate-900 dark:text-white bg-transparent focus:outline-none"
                />
              </div>
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
                        <span>{formatDatePretty(item.date)}</span>
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
                          showToast(`Loaded ${formatDatePretty(item.date)} into active card`);
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
                            <span>{formatDatePretty(item.date)}</span>
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

                      {/* Strong Dip */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 text-cyan-600 dark:text-cyan-400 font-semibold">
                          Strong Dip
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {item.strongDip !== null
                            ? formatCurrency(item.strongDip, effectiveCurrencySymbol)
                            : '—'}
                        </td>
                      </tr>

                      {/* Entry */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Entry
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.entry !== null
                            ? formatCurrency(item.entry, effectiveCurrencySymbol)
                            : '—'}
                        </td>
                      </tr>

                      {/* Target */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400 font-semibold">
                          Target
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.target !== null
                            ? formatCurrency(item.target, effectiveCurrencySymbol)
                            : '—'}
                        </td>
                      </tr>

                      {/* Profit Exit */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 text-purple-600 dark:text-purple-400 font-semibold">
                          Profit Exit
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                          {item.profitExit !== null
                            ? formatCurrency(item.profitExit, effectiveCurrencySymbol)
                            : '—'}
                        </td>
                      </tr>

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
