import { fileTimestamp } from '@/lib/datetime';

/**
 * URL- and file-system-safe slug that keeps letters from every script, so a
 * Persian or Arabic name stays readable: "Maya Okafor" -> "maya-okafor".
 */
export function slugify(text: string, maxLength = 60): string {
  const slug = text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '');
  return slug || 'resume';
}

/**
 * "maya-okafor-v12-2026-11-14_19-05-23.json": the name, the version and the
 * local save time, so exported files sort by time and never overwrite each other.
 */
export function exportFileName(
  name: string,
  versionNumber: number | null,
  savedAt: Date,
  extension: string,
): string {
  const version = versionNumber === null ? '' : `-v${versionNumber}`;
  return `${slugify(name)}${version}-${fileTimestamp(savedAt)}.${extension.replace(/^\./, '')}`;
}
