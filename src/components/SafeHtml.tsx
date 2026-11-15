import { useMemo, type CSSProperties } from 'react';

import { highlightCodeBlocks } from '@/lib/highlight';
import { joinRichPieces, splitRichHtml } from '@/lib/rich-blocks';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

interface SafeHtmlProps {
  readonly html: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  /**
   * Mark each paragraph, table and list item as a page block with this key
   * prefix, so pagination can measure it and place it on a page.
   */
  readonly blockPrefix?: string;
  /** Render only these blocks (one page of a paginated resume). */
  readonly include?: ReadonlySet<string>;
}

/**
 * Renders rich text after sanitising it. The single allowed raw-HTML sink in the app.
 * Code blocks are highlighted between two sanitiser passes, so the highlighter
 * only ever sees clean input and its output is cleaned again. Splitting into
 * page blocks happens after that and adds only our own data-ov-b markers.
 */
export function SafeHtml({ html, className, style, blockPrefix, include }: SafeHtmlProps) {
  const clean = useMemo(() => sanitizeHtml(highlightCodeBlocks(sanitizeHtml(html))), [html]);
  const pieces = useMemo(
    () => (blockPrefix && clean !== '' ? splitRichHtml(clean, blockPrefix) : null),
    [clean, blockPrefix],
  );
  const output = useMemo(() => {
    if (!pieces) return clean;
    return joinRichPieces(include ? pieces.filter((piece) => include.has(piece.key)) : pieces);
  }, [clean, pieces, include]);

  if (output === '') return null;
  // eslint-disable-next-line no-restricted-syntax -- sanitised above; only our own markers are added
  return (
    <div
      className={cn('ov-rich', className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: output }}
    />
  );
}
