import { useMemo, type CSSProperties } from 'react';

import { highlightCodeBlocks } from '@/lib/highlight';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

interface SafeHtmlProps {
  readonly html: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * Renders rich text after sanitising it. The single allowed raw-HTML sink in the app.
 * Code blocks are highlighted between two sanitiser passes, so the highlighter
 * only ever sees clean input and its output is cleaned again.
 */
export function SafeHtml({ html, className, style }: SafeHtmlProps) {
  const clean = useMemo(() => sanitizeHtml(highlightCodeBlocks(sanitizeHtml(html))), [html]);
  if (clean === '') return null;
  // eslint-disable-next-line no-restricted-syntax -- input is sanitised on the line above
  return <div className={cn('ov-rich', className)} style={style} dangerouslySetInnerHTML={{ __html: clean }} />;
}
