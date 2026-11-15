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
 * system; English and Persian cover the default LTR and RTL resumes until then.
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
};

export function defaultSectionTitle(kind: SectionKind, language: string): string {
  const base = language.split('-')[0]?.toLowerCase() ?? 'en';
  const titles = DEFAULT_TITLES[base] ?? DEFAULT_TITLES.en;
  return titles?.[kind] ?? kind;
}
