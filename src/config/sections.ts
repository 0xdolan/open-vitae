import type { MessageKey } from '@/i18n/messages/en';

export const SECTION_KINDS = [
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'awards',
  'publications',
  'volunteering',
  'references',
  'interests',
  'custom',
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

/**
 * Default section titles. Phase 9 moves these into the full translation
 * system; English, Persian, Arabic and Central Kurdish (Sorani) are covered until then.
 */
export const SECTION_TITLES: Readonly<Record<string, Readonly<Record<SectionKind, string>>>> = {
  en: {
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
    awards: 'Awards',
    publications: 'Publications',
    volunteering: 'Volunteering',
    references: 'References',
    interests: 'Interests',
    custom: 'Custom section',
  },
  fa: {
    experience: 'سوابق کاری',
    education: 'تحصیلات',
    skills: 'مهارت‌ها',
    projects: 'پروژه‌ها',
    certifications: 'گواهینامه‌ها',
    languages: 'زبان‌ها',
    awards: 'جوایز',
    publications: 'انتشارات',
    volunteering: 'فعالیت‌های داوطلبانه',
    references: 'معرفان',
    interests: 'علایق',
    custom: 'بخش سفارشی',
  },
  ar: {
    experience: 'الخبرة العملية',
    education: 'التعليم',
    skills: 'المهارات',
    projects: 'المشاريع',
    certifications: 'الشهادات',
    languages: 'اللغات',
    awards: 'الجوائز',
    publications: 'المنشورات',
    volunteering: 'العمل التطوعي',
    references: 'المراجع',
    interests: 'الاهتمامات',
    custom: 'قسم مخصص',
  },
  ckb: {
    experience: 'ئەزموونی کار',
    education: 'خوێندن',
    skills: 'لێهاتووییەکان',
    projects: 'پڕۆژەکان',
    certifications: 'بڕوانامەکان',
    languages: 'زمانەکان',
    awards: 'خەڵاتەکان',
    publications: 'بڵاوکراوەکان',
    volunteering: 'کاری خۆبەخشی',
    references: 'ناسێنەرەکان',
    interests: 'خولیاکان',
    custom: 'بەشی تایبەت',
  },
};

export function defaultSectionTitle(kind: SectionKind, language: string): string {
  const base = language.split('-')[0]?.toLowerCase() ?? 'en';
  const titles = SECTION_TITLES[base] ?? SECTION_TITLES.en;
  return titles?.[kind] ?? kind;
}

/** Field labels for an entry, as interface text keys (translated in the editor). */
export interface ItemFieldLabels {
  readonly title: MessageKey;
  readonly subtitle: MessageKey;
  readonly dateRange: MessageKey;
  readonly location: MessageKey;
  readonly url: MessageKey;
  readonly description: MessageKey;
}

const GENERIC: ItemFieldLabels = {
  title: 'field.title',
  subtitle: 'field.subtitle',
  dateRange: 'field.dates',
  location: 'field.location',
  url: 'field.link',
  description: 'field.description',
};

/** Field labels that match what each kind of section holds. */
const ITEM_LABELS: Partial<Record<SectionKind, Partial<ItemFieldLabels>>> = {
  experience: { title: 'field.jobTitle', subtitle: 'field.company' },
  education: { title: 'field.degree', subtitle: 'field.school' },
  skills: { title: 'field.skillGroup', description: 'field.skills' },
  projects: { title: 'field.projectName', subtitle: 'field.shortSummary' },
  certifications: {
    title: 'field.certification',
    subtitle: 'field.issuedBy',
    dateRange: 'field.date',
  },
  languages: { title: 'field.language', description: 'field.level' },
  awards: { title: 'field.award', subtitle: 'field.awardedBy', dateRange: 'field.date' },
  publications: { title: 'field.title', subtitle: 'field.publisher', dateRange: 'field.date' },
  volunteering: { title: 'field.role', subtitle: 'field.organisation' },
  references: { title: 'field.name', subtitle: 'field.roleCompany', description: 'field.contact' },
  interests: { title: 'field.interest' },
};

export function itemFieldLabels(kind: SectionKind): ItemFieldLabels {
  return { ...GENERIC, ...ITEM_LABELS[kind] };
}
