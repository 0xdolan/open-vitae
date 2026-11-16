import { fontStack } from '@/config/fonts';
import { PAGE_BAND_FONT_SCALE } from '@/config/layout';
import { formatPageBand, pageBandFor, type PageBandKind } from '@/lib/page-bands';
import { cn } from '@/lib/utils';
import type { ResumeLayout } from '@/schema/resume';

interface PageBandProps {
  readonly layout: ResumeLayout;
  readonly kind: PageBandKind;
  readonly page: number;
  readonly pages: number;
  /** The page margin; the band is centred inside it so it never moves the content. */
  readonly marginMm: number;
}

const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end' } as const;

/** The page header or footer, drawn as plain text inside the top or bottom margin. */
export function PageBand({ layout, kind, page, pages, marginMm }: PageBandProps) {
  const band = pageBandFor(layout, kind, page);
  if (!band || marginMm <= 0) return null;

  return (
    <div
      dir={layout.direction}
      data-page-band={kind}
      className={cn(
        'pointer-events-none absolute inset-x-0 flex items-center overflow-hidden whitespace-pre text-stone-600',
        kind === 'header' ? 'top-0' : 'bottom-0',
        JUSTIFY[band.align],
      )}
      style={{
        height: `${marginMm}mm`,
        paddingInline: `${marginMm}mm`,
        fontFamily: fontStack(layout.fontFamily),
        fontSize: `${layout.baseFontSizePt * PAGE_BAND_FONT_SCALE}pt`,
        lineHeight: 1.2,
      }}
    >
      {formatPageBand(band.text, page, pages, layout.digits)}
    </div>
  );
}
