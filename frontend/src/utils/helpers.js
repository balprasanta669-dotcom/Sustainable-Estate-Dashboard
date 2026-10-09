/**
 * Shared utility helpers for the FacilityIQ dashboard.
 */

/** Format a number with thousand separators */
export const fmtNumber = (n, decimals = 1) =>
  n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals });

/** Map severity string to CSS badge class */
export const severityClass = (s) => {
  const map = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', ok: 'badge-ok' };
  return map[(s || '').toLowerCase()] || 'badge-low';
};

/** Map alert severity to dot color */
export const severityColor = (s) => {
  const map = { critical: '#ef4444', high: '#f59e0b', medium: '#60a5fa', low: '#8b5cf6' };
  return map[(s || '').toLowerCase()] || '#8b5cf6';
};

/** Short relative timestamp */
export const relativeTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/** AQI category info */
export const aqiInfo = (aqi) => {
  if (aqi <= 50)  return { label: 'Good',       color: '#00c896' };
  if (aqi <= 100) return { label: 'Satisfactory', color: '#a3e635' };
  if (aqi <= 200) return { label: 'Moderate',   color: '#f59e0b' };
  if (aqi <= 300) return { label: 'Poor',        color: '#ef4444' };
  if (aqi <= 400) return { label: 'Very Poor',   color: '#a855f7' };
  return           { label: 'Severe',            color: '#7e0023' };
};

/** Fill level color */
export const fillColor = (pct) => {
  if (pct >= 90) return '#ef4444';
  if (pct >= 75) return '#f59e0b';
  return '#00c896';
};

/** Truncate long text */
export const truncate = (str, n = 60) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;
