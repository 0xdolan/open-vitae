/** A run of text and its starting position in the document. */
export interface TextChunk {
  readonly text: string;
  readonly from: number;
}

export interface FindOptions {
  readonly caseSensitive?: boolean;
  readonly wholeWord?: boolean;
}

export interface Match {
  readonly from: number;
  readonly to: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find every occurrence of `query` in a list of text chunks (one per text
 * node of the editor document). Matches never cross chunk boundaries, which
 * keeps replacements inside a single formatting run.
 *
 * Whole-word matching uses Unicode letters and digits, so it works for
 * Persian, Arabic and Kurdish as well as English.
 */
export function findMatches(
  chunks: readonly TextChunk[],
  query: string,
  options: FindOptions = {},
): Match[] {
  if (query === '') return [];
  const flags = `gu${options.caseSensitive ? '' : 'i'}`;
  const body = escapeRegExp(query);
  const pattern = options.wholeWord
    ? new RegExp(`(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_])`, flags)
    : new RegExp(body, flags);

  const matches: Match[] = [];
  for (const chunk of chunks) {
    for (const found of chunk.text.matchAll(pattern)) {
      const start = chunk.from + (found.index ?? 0);
      matches.push({ from: start, to: start + found[0].length });
    }
  }
  return matches;
}

/** Index of the first match at or after `position`, wrapping to the start. */
export function nextMatchIndex(matches: readonly Match[], position: number): number {
  if (matches.length === 0) return -1;
  const index = matches.findIndex((m) => m.from >= position);
  return index === -1 ? 0 : index;
}
