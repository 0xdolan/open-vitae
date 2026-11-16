import { ResumeRenderer } from '@/components/resume/ResumeRenderer';
import { THUMBNAIL_WIDTH_PX } from '@/config/ui';
import { contentBoxMm, pageBoxMm, pageWidthPx } from '@/lib/page-geometry';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';

interface ResumeThumbnailProps {
  readonly doc: ResumeDocument;
  readonly className?: string;
}

/**
 * The first page of a resume, scaled down. Purely decorative: it is hidden from
 * screen readers and inert, since the card around it carries the name and link.
 */
export function ResumeThumbnail({ doc, className }: ResumeThumbnailProps) {
  const { widthMm, heightMm } = pageBoxMm(doc.layout);
  const { marginMm } = contentBoxMm(doc.layout);
  const scale = THUMBNAIL_WIDTH_PX / pageWidthPx(doc.layout);
  return (
    <div
      aria-hidden="true"
      inert
      dir="ltr"
      className={cn(
        'ov-thumb pointer-events-none relative overflow-hidden bg-white select-none',
        className,
      )}
      style={{ width: THUMBNAIL_WIDTH_PX, aspectRatio: `${widthMm} / ${heightMm}` }}
    >
      <div
        className="absolute start-0 top-0 origin-top-left"
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          padding: `${marginMm}mm`,
          transform: `scale(${scale})`,
        }}
      >
        <ResumeRenderer doc={doc} />
      </div>
    </div>
  );
}
