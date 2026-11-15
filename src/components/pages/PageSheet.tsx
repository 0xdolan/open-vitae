import { ResumeRenderer } from '@/components/resume/ResumeRenderer';
import { contentBoxMm, pageBoxMm } from '@/lib/page-geometry';
import type { PageSlice } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type { ResumeDocument } from '@/schema/resume';

interface PageSheetProps {
  readonly doc: ResumeDocument;
  readonly slice: PageSlice;
  readonly number: number;
  readonly total: number;
  readonly className?: string;
  readonly selectedSectionId?: string;
  readonly onSectionClick?: (id: string) => void;
}

/**
 * One sheet of paper at its true size, showing only the blocks pagination put
 * on it. Anything taller than the page is clipped, exactly as it would print.
 */
export function PageSheet({ doc, slice, number, total, className, selectedSectionId, onSectionClick }: PageSheetProps) {
  const { widthMm, heightMm } = pageBoxMm(doc.layout);
  const { marginMm } = contentBoxMm(doc.layout);

  return (
    <div
      role="group"
      aria-label={`Page ${number} of ${total}`}
      className={cn('ov-page overflow-hidden bg-white', className)}
      style={{ width: `${widthMm}mm`, height: `${heightMm}mm`, padding: `${marginMm}mm` }}
    >
      <ResumeRenderer
        doc={doc}
        pageBlocks={slice.keys}
        selectedSectionId={selectedSectionId}
        onSectionClick={onSectionClick}
      />
    </div>
  );
}
