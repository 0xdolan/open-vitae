// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { buildResume } from '@/lib/resume-factory';
import { createResumeFromSample } from '@/samples';

import { markdownToResume, resumeToMarkdown, splitDateRange } from './markdown-resume';

const HAND_WRITTEN = `# Sam Rivera

Data analyst · SQL and Python

sam@example.com · +1 555 010 2000 · Austin, TX · github.com/samr · samrivera.dev

I turn messy data into decisions.

## Work Experience

### Data Analyst — Northwind
*Austin · Jan 2021 - Present*

- Built the weekly revenue dashboard
- Cut report time by **60%**

### Intern at Contoso (2019 – 2020)

Cleaned survey data.

## Skills

- Languages: SQL, Python, R
- Tools: Tableau, dbt

## Education

- BSc Statistics, State University, 2019
`;

describe('splitDateRange', () => {
  it('finds date ranges in many forms', () => {
    expect(splitDateRange('Austin · Jan 2021 - Present')).toEqual({ dateRange: 'Jan 2021 - Present', rest: 'Austin' });
    expect(splitDateRange('Intern at Contoso (2019 – 2020)')).toEqual({ dateRange: '2019 – 2020', rest: 'Intern at Contoso' });
    expect(splitDateRange('BSc Statistics, State University, 2019')).toEqual({ dateRange: '2019', rest: 'BSc Statistics, State University' });
    expect(splitDateRange('بانکی ئاسۆی نوێ · ٢٠٢١ – ئێستا').dateRange).toBe('٢٠٢١ – ئێستا');
    expect(splitDateRange('No dates here')).toEqual({ dateRange: '', rest: 'No dates here' });
  });
});

describe('markdownToResume', () => {
  it('reads a hand-written Markdown resume', () => {
    const doc = buildResume(markdownToResume(HAND_WRITTEN, 'Fallback'));
    expect(doc.name).toBe('Sam Rivera');
    expect(doc.profile).toMatchObject({
      fullName: 'Sam Rivera',
      headline: 'Data analyst · SQL and Python',
      email: 'sam@example.com',
      phone: '+1 555 010 2000',
      location: 'Austin, TX',
      website: 'https://samrivera.dev',
      summaryHtml: '<p>I turn messy data into decisions.</p>',
    });
    expect(doc.profile.links.map((l) => [l.label, l.url])).toEqual([['GitHub', 'https://github.com/samr']]);

    expect(doc.sections.map((s) => [s.kind, s.title])).toEqual([
      ['experience', 'Work Experience'],
      ['skills', 'Skills'],
      ['education', 'Education'],
    ]);
    const [northwind, contoso] = doc.sections[0]?.items ?? [];
    expect(northwind).toMatchObject({ title: 'Data Analyst', subtitle: 'Northwind', location: 'Austin', dateRange: 'Jan 2021 - Present' });
    expect(northwind?.descriptionHtml).toBe('<ul><li>Built the weekly revenue dashboard</li><li>Cut report time by <strong>60%</strong></li></ul>');
    expect(contoso).toMatchObject({ title: 'Intern', subtitle: 'Contoso', dateRange: '2019 – 2020', descriptionHtml: '<p>Cleaned survey data.</p>' });
    expect(doc.sections[1]?.items.map((i) => [i.title, i.descriptionHtml])).toEqual([
      ['Languages', '<p>SQL, Python, R</p>'],
      ['Tools', '<p>Tableau, dbt</p>'],
    ]);
    expect(doc.sections[2]?.items[0]).toMatchObject({ title: 'BSc Statistics, State University', dateRange: '2019' });
  });

  it('round-trips a sample through Markdown', () => {
    const sample = createResumeFromSample('tech', 'Tech');
    const back = buildResume(markdownToResume(resumeToMarkdown(sample), 'x'));
    expect(back.profile).toMatchObject({
      fullName: sample.profile.fullName,
      headline: sample.profile.headline,
      email: sample.profile.email,
      phone: sample.profile.phone,
      location: sample.profile.location,
    });
    expect(back.sections.map((s) => s.title)).toEqual(sample.sections.map((s) => s.title));
    const first = sample.sections[0]?.items[0];
    expect(back.sections[0]?.items[0]).toMatchObject({
      title: first?.title,
      subtitle: first?.subtitle,
      location: first?.location,
      dateRange: first?.dateRange,
    });
  });

  it('round-trips a Kurdish sample', () => {
    const sample = createResumeFromSample('kurdish', 'ku');
    const back = buildResume(markdownToResume(resumeToMarkdown(sample), 'x'));
    expect(back.profile.fullName).toBe('ئاوات کەریم');
    expect(back.sections[0]?.kind).toBe('experience');
    expect(back.sections[0]?.items[0]).toMatchObject({ title: 'ئەندازیاری باڵای ئاسایشی سایبەری', dateRange: '٢٠٢١ – ئێستا' });
  });
});
