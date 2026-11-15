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
const DEFAULT_TITLES: Readonly<Record<string, Readonly<Record<SectionKind, string>>>> = {
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
  const titles = DEFAULT_TITLES[base] ?? DEFAULT_TITLES.en;
  return titles?.[kind] ?? kind;
}

export interface ItemFieldLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly dateRange: string;
  readonly location: string;
  readonly url: string;
  readonly description: string;
}

const GENERIC: ItemFieldLabels = {
  title: 'Title',
  subtitle: 'Subtitle',
  dateRange: 'Dates',
  location: 'Location',
  url: 'Link',
  description: 'Description',
};

/** Field labels that match what each kind of section holds. */
const ITEM_LABELS: Partial<Record<SectionKind, Partial<ItemFieldLabels>>> = {
  experience: { title: 'Job title', subtitle: 'Company or organisation' },
  education: { title: 'Degree or qualification', subtitle: 'School or university' },
  skills: { title: 'Skill group', description: 'Skills' },
  projects: { title: 'Project name', subtitle: 'Short summary' },
  certifications: { title: 'Certification', subtitle: 'Issued by', dateRange: 'Date' },
  languages: { title: 'Language', description: 'Level' },
  awards: { title: 'Award', subtitle: 'Awarded by', dateRange: 'Date' },
  publications: { title: 'Title', subtitle: 'Publisher or journal', dateRange: 'Date' },
  volunteering: { title: 'Role', subtitle: 'Organisation' },
  references: { title: 'Name', subtitle: 'Role and company', description: 'Contact details' },
  interests: { title: 'Interest' },
};

export function itemFieldLabels(kind: SectionKind): ItemFieldLabels {
  return { ...GENERIC, ...ITEM_LABELS[kind] };
}
