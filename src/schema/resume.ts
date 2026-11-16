import { z } from 'zod';

import { TEXT_DIRECTIONS } from '@/config/fonts';
import {
  type ContactIconKind,
  DIGIT_SYSTEMS,
  HORIZONTAL_ALIGNS,
  LIMITS,
  PAGE_BREAK_MODES,
  PHOTO_SHAPES,
} from '@/config/layout';
import { ORIENTATIONS, PAGE_SIZE_IDS } from '@/config/page-sizes';
import { SECTION_KINDS } from '@/config/sections';

/**
 * The resume document schema: the single source of truth for the editor,
 * storage, import and every export format.
 *
 * Every value that ends up in CSS (colours, font names) or identifies data
 * (ids, photos) is constrained here, so nothing user-supplied can break out of
 * its context. Rich text is sanitised when rendered.
 *
 * Typed text such as email addresses and links is only length-limited here:
 * a half-typed address must never stop the rest of the resume from saving.
 * Those fields are checked in the editor (src/lib/field-validation.ts), and
 * only safe http, https, mailto and tel URLs are ever turned into links
 * when the resume is drawn.
 *
 * Changing the shape of stored data means bumping RESUME_SCHEMA_VERSION and
 * adding a migration in src/lib/migrations.ts.
 */
export const RESUME_SCHEMA_VERSION = 2;

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

/** Typed link text. Checked in the editor; only safe URLs become links when rendered. */
const urlTextSchema = z.string().max(2048);

const htmlSchema = z.string().max(LIMITS.htmlLength);

const range = (limits: { readonly min: number; readonly max: number }) =>
  z.number().min(limits.min).max(limits.max);

export const textStyleSchema = z.object({
  color: hexColorSchema.optional(),
  fontFamily: fontFamilySchema.optional(),
  fontSizePt: range(LIMITS.styleFontSizePt).optional(),
});

export const iconRefSchema = z.object({
  /** Icon set: a react-icons pack such as "lu" (Lucide), "fa6" or "si". See src/config/icon-sets.ts. */
  set: z.string().regex(/^[a-z0-9-]{1,32}$/, 'Invalid icon set'),
  name: z.string().regex(/^[A-Za-z0-9-]{1,80}$/, 'Invalid icon name'),
  /** This icon's colour. Optional; absent means the resume's icon colour. */
  color: hexColorSchema.optional(),
});

export const resumeItemSchema = z.object({
  id: idSchema,
  visible: z.boolean(),
  title: text(300),
  subtitle: text(300),
  dateRange: text(100),
  location: text(120),
  url: urlTextSchema,
  descriptionHtml: htmlSchema,
  /** Start this entry on a new page. Optional, so older resumes need no upgrade. */
  breakBefore: z.boolean().optional(),
  icon: iconRefSchema.optional(),
  titleStyle: textStyleSchema.optional(),
  descriptionStyle: textStyleSchema.optional(),
});

export const resumeSectionSchema = z.object({
  id: idSchema,
  kind: z.enum(SECTION_KINDS),
  title: text(120),
  visible: z.boolean(),
  /** Start this section on a new page (honoured in both page-break modes). */
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
  /** Empty while being filled in; links without a URL are not shown. */
  url: urlTextSchema,
  icon: iconRefSchema.optional(),
});

export const profileSchema = z.object({
  fullName: text(120),
  headline: text(200),
  email: text(254),
  phone: text(40),
  location: text(120),
  website: urlTextSchema,
  links: z.array(profileLinkSchema).max(LIMITS.links),
  summaryHtml: htmlSchema,
  nameStyle: textStyleSchema.optional(),
  headlineStyle: textStyleSchema.optional(),
});

const imageDataUrlSchema = z
  .string()
  .max(LIMITS.photoDataUrlLength)
  .regex(
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
    'Photo must be a PNG, JPEG or WebP image',
  );

/** A crop of the source picture, in source pixels after rotation. */
export const photoCropSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
});

export const photoSchema = z.object({
  /** The cropped photo as drawn on the page. Kept in the browser only, never uploaded. */
  dataUrl: imageDataUrlSchema,
  align: z.enum(HORIZONTAL_ALIGNS),
  shape: z.enum(PHOTO_SHAPES),
  widthMm: range(LIMITS.photoWidthMm),
  /**
   * The picture as chosen (shrunk, metadata removed) and the crop applied to
   * it, so the photo can be cropped again without losing quality. Optional:
   * older resumes and imported ones may not have it.
   */
  source: z
    .object({
      dataUrl: imageDataUrlSchema,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      crop: photoCropSchema,
    })
    .optional(),
});

/** A page header or footer: plain text with {page} and {pages} placeholders. */
export const pageBandSchema = z.object({
  enabled: z.boolean(),
  text: text(LIMITS.pageBandText),
  align: z.enum(HORIZONTAL_ALIGNS),
  /** Also draw it on the first page. */
  firstPage: z.boolean(),
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
  /** Indent step in character widths; 4 means "four spaces". */
  indentCh: range(LIMITS.indentCh),
  /** Deepest list or indent level allowed; null means unlimited. */
  maxDepth: z.number().int().min(LIMITS.maxDepth.min).max(LIMITS.maxDepth.max).nullable(),
  /** Show small icons before the email, phone, location and links. Optional; off when absent. */
  showContactIcons: z.boolean().optional(),
  /** Digits the resume is drawn with; absent means "as typed". Links, email and phone are never changed. */
  digits: z.enum(DIGIT_SYSTEMS).optional(),
  /** Optional header and footer drawn inside the top and bottom margins. Absent means none. */
  header: pageBandSchema.optional(),
  footer: pageBandSchema.optional(),
  /** Colour of every icon (section, entry, contact and link). Optional; absent means black. */
  iconColor: hexColorSchema.optional(),
  /** Colours of single contact icons, overriding iconColor. Optional. */
  contactIconColors: z
    .object({
      email: hexColorSchema.optional(),
      phone: hexColorSchema.optional(),
      location: hexColorSchema.optional(),
      website: hexColorSchema.optional(),
    } satisfies Record<ContactIconKind, z.ZodOptional<typeof hexColorSchema>>)
    .optional(),
  /** Colour of section titles. Optional; absent means the accent colour. */
  sectionTitleColor: hexColorSchema.optional(),
  /** Colour of the line under section titles. Optional; absent means the accent colour. */
  sectionRuleColor: hexColorSchema.optional(),
  /** Draw the line under section titles. Optional; absent means shown. */
  sectionRule: z.boolean().optional(),
  /**
   * Soft length limits in characters, for the summary and each item
   * description. Optional: absent means the default (see src/config/layout.ts),
   * null means unlimited. Text over the limit is kept and flagged, never cut.
   */
  summaryLimit: range(LIMITS.textLimit).int().nullable().optional(),
  descriptionLimit: range(LIMITS.textLimit).int().nullable().optional(),
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
    /** May be empty while being renamed; the app shows "Untitled resume" then. */
    name: text(120),
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
export type PhotoCrop = z.infer<typeof photoCropSchema>;
export type PageBand = z.infer<typeof pageBandSchema>;
export type ResumeLayout = z.infer<typeof layoutSchema>;
export type ResumeDocument = z.infer<typeof resumeSchema>;
