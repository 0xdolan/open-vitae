/** How many versions to keep per resume. "all" never deletes anything. */
export type Retention = 'all' | 100 | 50 | 20;

export const RETENTION_OPTIONS: readonly { readonly value: Retention; readonly label: string }[] = [
  { value: 'all', label: 'Keep all versions (recommended)' },
  { value: 100, label: 'Keep the latest 100' },
  { value: 50, label: 'Keep the latest 50' },
  { value: 20, label: 'Keep the latest 20' },
];

export const DEFAULT_RETENTION: Retention = 'all';

export function isRetention(value: unknown): value is Retention {
  return RETENTION_OPTIONS.some((option) => option.value === value);
}

/** Parse the value of a <select> or a stored preference. */
export function parseRetention(raw: string | null): Retention {
  if (raw === null) return DEFAULT_RETENTION;
  const value = raw === 'all' ? 'all' : Number(raw);
  return isRetention(value) ? value : DEFAULT_RETENTION;
}
