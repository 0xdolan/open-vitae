import type { TextDirection } from '@/config/fonts';
import type { Orientation, PageSizeId } from '@/config/page-sizes';

/**
 * Core resume document model. This is the single source of truth for the
 * editor, storage, import and every export format. Phase 2 adds runtime
 * validation and migrations keyed on `schemaVersion`.
 */
export const RESUME_SCHEMA_VERSION = 1;

export type PageBreakMode = 'smart' | 'manual';

export type HorizontalAlign = 'start' | 'center' | 'end';

export interface IconRef {
  /** Icon set identifier, e.g. "lucide" or a react-icons pack such as "fa6". */
  readonly set: string;
  /** Icon name inside the set, e.g. "briefcase". */
  readonly name: string;
}

export interface TextStyle {
  readonly color?: string;
  readonly fontFamily?: string;
  readonly fontSizePt?: number;
}

export interface ResumeItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly dateRange?: string;
  readonly location?: string;
  /** Sanitised rich-text HTML produced by the editor. */
  readonly descriptionHtml: string;
  readonly icon?: IconRef;
  readonly titleStyle?: TextStyle;
  readonly descriptionStyle?: TextStyle;
}

export interface ResumeSection {
  readonly id: string;
  readonly title: string;
  readonly visible: boolean;
  /** Manual page break before this section (used when mode is "manual"). */
  readonly breakBefore: boolean;
  readonly icon?: IconRef;
  readonly titleStyle?: TextStyle;
  readonly items: readonly ResumeItem[];
}

export interface ResumePhoto {
  /** Data URL kept in the browser only. */
  readonly dataUrl: string;
  readonly align: HorizontalAlign;
  readonly widthMm: number;
}

export interface ResumeLayout {
  readonly pageSize: PageSizeId;
  readonly orientation: Orientation;
  readonly marginMm: number;
  readonly pageBreaks: PageBreakMode;
  readonly direction: TextDirection;
  readonly fontFamily: string;
}

export interface ResumeDocument {
  readonly schemaVersion: typeof RESUME_SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
  readonly layout: ResumeLayout;
  readonly photo?: ResumePhoto;
  /** Order of this array is the order shown on the page. */
  readonly sections: readonly ResumeSection[];
}
