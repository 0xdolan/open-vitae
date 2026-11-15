import { SECTION_KINDS, SECTION_TITLES, type SectionKind } from '@/config/sections';

/** Common English headings that are not the default titles. */
const ALIASES: Readonly<Record<string, SectionKind>> = {
  'work experience': 'experience',
  'professional experience': 'experience',
  employment: 'experience',
  'employment history': 'experience',
  'work history': 'experience',
  'career history': 'experience',
  career: 'experience',
  jobs: 'experience',
  'education and training': 'education',
  qualifications: 'education',
  'academic background': 'education',
  'technical skills': 'skills',
  'core skills': 'skills',
  competencies: 'skills',
  'core competencies': 'skills',
  expertise: 'skills',
  'selected projects': 'projects',
  portfolio: 'projects',
  certificates: 'certifications',
  licenses: 'certifications',
  'licenses and certifications': 'certifications',
  'certifications and licenses': 'certifications',
  honors: 'awards',
  honours: 'awards',
  'awards and honors': 'awards',
  achievements: 'awards',
  papers: 'publications',
  research: 'publications',
  volunteer: 'volunteering',
  'volunteer experience': 'volunteering',
  'volunteer work': 'volunteering',
  referees: 'references',
  hobbies: 'interests',
  'hobbies and interests': 'interests',
};

const normalise = (title: string) =>
  title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[&+]/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Guess what kind of section a heading is, from the default titles in every
 * supported language and common English variants. Unknown headings are
 * "custom", which keeps their text as it is.
 */
export function guessSectionKind(title: string): SectionKind {
  const key = normalise(title);
  if (key === '') return 'custom';
  if ((SECTION_KINDS as readonly string[]).includes(key)) return key as SectionKind;
  for (const titles of Object.values(SECTION_TITLES)) {
    for (const kind of SECTION_KINDS) {
      if (normalise(titles[kind]) === key) return kind;
    }
  }
  return ALIASES[key] ?? 'custom';
}

/** A section kind from a value someone typed in a spreadsheet: a kind id or a heading. */
export function parseSectionKind(value: string, fallbackTitle: string): SectionKind {
  const key = normalise(value);
  if ((SECTION_KINDS as readonly string[]).includes(key)) return key as SectionKind;
  return guessSectionKind(value || fallbackTitle);
}
