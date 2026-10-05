export function formatCurrency(
  value: number | null | undefined,
  currency = '₹',
  maxDecimals = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  // Handle tiny crypto fractions or standard prices
  const decimals = Math.abs(value) < 1 && value !== 0 ? 4 : maxDecimals;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return `${currency}${formatted}`;
}

export function formatNumber(
  value: number | null | undefined,
  maxDecimals = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChange(
  change: number | null | undefined,
  currency = '₹'
): string {
  if (change === null || change === undefined || isNaN(change)) {
    return 'N/A';
  }

  const sign = change > 0 ? '+' : change < 0 ? '-' : '';
  const absFormatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(change));

  return `${sign}${currency}${absFormatted}`;
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `${(value / 100000).toFixed(2)} L`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} K`;
  }
  return value.toLocaleString('en-IN');
}

export function formatTimeAgo(timestampStr: string | number | null | undefined): string {
  if (!timestampStr) return 'Never';

  const date = typeof timestampStr === 'number' ? new Date(timestampStr) : new Date(timestampStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return 'N/A';
  }
}
