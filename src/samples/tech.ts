import { bullets, paragraph, type SampleDefinition } from './types';

export const techSample: SampleDefinition = {
  id: 'tech',
  label: 'Technology',
  role: 'Senior frontend engineer',
  description: 'Product engineering, performance work and mentoring, eight years in.',
  input: {
    name: 'Senior frontend engineer',
    layout: { accentColor: '#1d4ed8' },
    profile: {
      fullName: 'Maya Okafor',
      headline: 'Senior Frontend Engineer · React, TypeScript, web performance',
      email: 'maya.okafor@example.com',
      phone: '+49 30 5550 1234',
      location: 'Berlin, Germany',
      website: 'https://maya.example.com',
      links: [
        { label: 'GitHub', url: 'https://example.com/maya-okafor/code' },
        { label: 'LinkedIn', url: 'https://example.com/maya-okafor/profile' },
      ],
      summaryHtml: paragraph(
        'Frontend engineer with eight years of experience building fast, accessible web products used by millions. I like turning slow, fragile codebases into ones teams enjoy working in, and I care about the people who use what we ship.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'Senior Frontend Engineer',
            subtitle: 'Larkspur Labs',
            location: 'Berlin',
            dateRange: '2022 – Present',
            descriptionHtml: bullets(
              'Led the move of a 300,000-line analytics dashboard from webpack to Vite, cutting cold builds from 4 minutes to 40 seconds.',
              'Designed a typed component library now used by six product teams, with automated accessibility checks in CI.',
              'Mentored four engineers and ran the frontend interview loop.',
            ),
          },
          {
            title: 'Frontend Engineer',
            subtitle: 'Brightwater Mobility',
            location: 'Lisbon',
            dateRange: '2019 – 2022',
            descriptionHtml: bullets(
              'Built the rider booking flow in React and TypeScript for 1.2 million monthly users.',
              'Reduced Largest Contentful Paint by 38% through code splitting and a new image pipeline.',
              'Added right-to-left support for the Arabic and Hebrew market launches.',
            ),
          },
          {
            title: 'Software Developer',
            subtitle: 'Tidewell Studio',
            location: 'Lagos',
            dateRange: '2017 – 2019',
            descriptionHtml: bullets(
              'Shipped web apps for retail and logistics clients.',
              'Introduced end-to-end tests that caught regressions before each release.',
            ),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'BSc Computer Science',
            subtitle: 'University of Lagos',
            dateRange: '2013 – 2017',
          },
        ],
      },
      {
        kind: 'skills',
        items: [
          { title: 'Languages', descriptionHtml: paragraph('TypeScript, JavaScript, Go, SQL') },
          {
            title: 'Frontend',
            descriptionHtml: paragraph('React, Vite, Tailwind CSS, Web Components, accessibility'),
          },
          {
            title: 'Tooling',
            descriptionHtml: paragraph('Playwright, Vitest, GitHub Actions, Docker'),
          },
        ],
      },
      {
        kind: 'projects',
        items: [
          {
            title: 'Openshelf',
            subtitle: 'Open-source, offline-first reading list app',
            url: 'https://example.com/openshelf',
            descriptionHtml: paragraph(
              'Progressive web app with sync-free local storage and 2,000 GitHub stars.',
            ),
          },
        ],
      },
      {
        kind: 'languages',
        items: [
          { title: 'English', descriptionHtml: paragraph('Native') },
          { title: 'German', descriptionHtml: paragraph('Professional (B2)') },
          { title: 'Portuguese', descriptionHtml: paragraph('Intermediate (B1)') },
        ],
      },
    ],
  },
};
