const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Human-readable size, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${UNITS[unit]}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
