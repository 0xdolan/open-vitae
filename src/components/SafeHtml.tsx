import { useMemo, type CSSProperties } from 'react';

import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

interface SafeHtmlProps {
  readonly html: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** Renders rich text after sanitising it. The single allowed raw-HTML sink in the app. */
export function SafeHtml({ html, className, style }: SafeHtmlProps) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  if (clean === '') return null;
  // eslint-disable-next-line no-restricted-syntax -- input is sanitised on the line above
  return <div className={cn('ov-rich', className)} style={style} dangerouslySetInnerHTML={{ __html: clean }} />;
}
