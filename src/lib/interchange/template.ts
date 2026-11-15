import { buildResume } from '@/lib/resume-factory';
import type { ResumeDocument } from '@/schema/resume';

/**
 * A blank template with one example of everything, for people who prefer to
 * fill in a spreadsheet or a Markdown file and import it.
 */
export function createTemplateResume(now: Date = new Date()): ResumeDocument {
  return buildResume(
    {
      name: 'Resume template',
      profile: {
        fullName: 'Your Name',
        headline: 'Job title · two or three strengths',
        email: 'you@example.com',
        phone: '+1 555 0100',
        location: 'City, Country',
        website: 'https://example.com',
        summaryHtml: '<p>Two or three sentences about what you do, what you are good at and what you are looking for.</p>',
        links: [{ label: 'LinkedIn', url: 'https://example.com/your-profile' }],
      },
      sections: [
        {
          kind: 'experience',
          items: [
            {
              title: 'Job title',
              subtitle: 'Company',
              location: 'City',
              dateRange: '2022 – Present',
              descriptionHtml:
                '<ul><li>A result you achieved, with a number if you can</li><li>Something you built, led or improved</li></ul>',
            },
          ],
        },
        {
          kind: 'education',
          items: [{ title: 'Degree or course', subtitle: 'School or university', dateRange: '2018 – 2022' }],
        },
        {
          kind: 'skills',
          items: [{ title: 'Skill group', descriptionHtml: '<p>Skill, skill, skill</p>' }],
        },
        {
          kind: 'languages',
          items: [{ title: 'Language', descriptionHtml: '<p>Level</p>' }],
        },
      ],
    },
    now,
  );
}
