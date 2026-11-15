import { z } from 'zod';

import { TEXT_DIRECTIONS } from '@/config/fonts';
import { HORIZONTAL_ALIGNS, LIMITS, PAGE_BREAK_MODES, PHOTO_SHAPES } from '@/config/layout';
import { ORIENTATIONS, PAGE_SIZE_IDS } from '@/config/page-sizes';
import { SECTION_KINDS } from '@/config/sections';
import { isSafeUrl } from '@/lib/url';

/**
 * The resume document schema: the single source of truth for the editor,
 * storage, import and every export format.
 *
 * Every value that ends up in CSS (colours, font names) or in an attribute
 * (URLs, ids) is constrained here, so nothing user-supplied can break out of
 * its context. Rich text is additionally sanitised when rendered.
 *
 * Changing the shape of stored data means bumping RESUME_SCHEMA_VERSION and
 * adding a migration in src/lib/migrations.ts.
 */
export const RESUME_SCHEMA_VERSION = 1;

const SAFE_URL_MESSAGE = 'Only http, https, mailto and tel links are allowed';

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id');

const text = (max: number) => z.string().max(max);

const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, 'Use a hex colour such as #14532d');

const fontFamilySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\p{L}\p{N} ._-]+$/u, 'Font name contains unsupported characters');

const safeUrlSchema = z.string().max(2048).refine(isSafeUrl, SAFE_URL_MESSAGE);

const optionalUrlSchema = z
  .string()
  .max(2048)
  .refine((value) => value === '' || isSafeUrl(value), SAFE_URL_MESSAGE);

const htmlSchema = z.string().max(LIMITS.htmlLength);

const range = (limits: { readonly min: number; readonly max: number }) =>
  z.number().min(limits.min).max(limits.max);

export const textStyleSchema = z.object({
  color: hexColorSchema.optional(),
  fontFamily: fontFamilySchema.optional(),
  fontSizePt: range(LIMITS.styleFontSizePt).optional(),
});

export const iconRefSchema = z.object({
  /** Icon set: "lucide" or a react-icons pack such as "fa6". */
  set: z.string().regex(/^[a-z0-9-]{1,32}$/, 'Invalid icon set'),
  name: z.string().regex(/^[A-Za-z0-9-]{1,80}$/, 'Invalid icon name'),
});

export const resumeItemSchema = z.object({
  id: idSchema,
  visible: z.boolean(),
  title: text(300),
  subtitle: text(300),
  dateRange: text(100),
  location: text(120),
  url: optionalUrlSchema,
  descriptionHtml: htmlSchema,
  icon: iconRefSchema.optional(),
  titleStyle: textStyleSchema.optional(),
  descriptionStyle: textStyleSchema.optional(),
});

export const resumeSectionSchema = z.object({
  id: idSchema,
  kind: z.enum(SECTION_KINDS),
  title: text(120),
  visible: z.boolean(),
  /** Start this section on a new page (used when page breaks are manual). */
  breakBefore: z.boolean(),
  icon: iconRefSchema.optional(),
  titleStyle: textStyleSchema.optional(),
  /** Default style for item descriptions in this section. */
  descriptionStyle: textStyleSchema.optional(),
  items: z.array(resumeItemSchema).max(LIMITS.itemsPerSection),
});

export const profileLinkSchema = z.object({
  id: idSchema,
  label: text(80),
  url: safeUrlSchema,
  icon: iconRefSchema.optional(),
});

export const profileSchema = z.object({
  fullName: text(120),
  headline: text(200),
  email: z
    .string()
    .max(254)
    .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'),
  phone: text(40),
  location: text(120),
  website: optionalUrlSchema,
  links: z.array(profileLinkSchema).max(LIMITS.links),
  summaryHtml: htmlSchema,
  nameStyle: textStyleSchema.optional(),
  headlineStyle: textStyleSchema.optional(),
});

export const photoSchema = z.object({
  /** Kept in the browser only, never uploaded. */
  dataUrl: z
    .string()
    .max(LIMITS.photoDataUrlLength)
    .regex(
      /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
      'Photo must be a PNG, JPEG or WebP image',
    ),
  align: z.enum(HORIZONTAL_ALIGNS),
  shape: z.enum(PHOTO_SHAPES),
  widthMm: range(LIMITS.photoWidthMm),
});

export const layoutSchema = z.object({
  pageSize: z.enum(PAGE_SIZE_IDS),
  orientation: z.enum(ORIENTATIONS),
  marginMm: range(LIMITS.marginMm),
  pageBreaks: z.enum(PAGE_BREAK_MODES),
  direction: z.enum(TEXT_DIRECTIONS),
  fontFamily: fontFamilySchema,
  baseFontSizePt: range(LIMITS.baseFontSizePt),
  lineHeight: range(LIMITS.lineHeight),
  accentColor: hexColorSchema,
});

/** Collect every id in a document so duplicates can be rejected. */
function collectIds(doc: {
  id: string;
  profile: { links: readonly { id: string }[] };
  sections: readonly { id: string; items: readonly { id: string }[] }[];
}): string[] {
  const ids = [doc.id, ...doc.profile.links.map((link) => link.id)];
  for (const section of doc.sections) {
    ids.push(section.id, ...section.items.map((item) => item.id));
  }
  return ids;
}

export const resumeSchema = z
  .object({
    schemaVersion: z.literal(RESUME_SCHEMA_VERSION),
    id: idSchema,
    name: z.string().min(1, 'Give the resume a name').max(120),
    /** BCP 47 language tag of the resume content, e.g. "en", "fa", "ckb". */
    language: z.string().regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/, 'Invalid language tag'),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    layout: layoutSchema,
    profile: profileSchema,
    photo: photoSchema.optional(),
    /** Array order is the order shown on the page. */
    sections: z.array(resumeSectionSchema).max(LIMITS.sections),
  })
  .refine((doc) => {
    const ids = collectIds(doc);
    return new Set(ids).size === ids.length;
  }, 'The resume contains duplicate ids');

export type TextStyle = z.infer<typeof textStyleSchema>;
export type IconRef = z.infer<typeof iconRefSchema>;
export type ResumeItem = z.infer<typeof resumeItemSchema>;
export type ResumeSection = z.infer<typeof resumeSectionSchema>;
export type ProfileLink = z.infer<typeof profileLinkSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ResumePhoto = z.infer<typeof photoSchema>;
export type ResumeLayout = z.infer<typeof layoutSchema>;
export type ResumeDocument = z.infer<typeof resumeSchema>;
