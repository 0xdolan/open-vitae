/**
 * Public types of the resume model. The definitions live in the Zod schema
 * (src/schema/resume.ts) so types and runtime validation can never drift.
 */
export { RESUME_SCHEMA_VERSION } from '@/schema/resume';
export type {
  IconRef,
  Profile,
  ProfileLink,
  ResumeDocument,
  ResumeItem,
  ResumeLayout,
  ResumePhoto,
  ResumeSection,
  TextStyle,
} from '@/schema/resume';
export type { HorizontalAlign, PageBreakMode, PhotoShape } from '@/config/layout';
export type { SectionKind } from '@/config/sections';
