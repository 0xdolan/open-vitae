import { bullets, paragraph, type SampleDefinition } from './types';

export const marketingSample: SampleDefinition = {
  id: 'marketing',
  label: 'Marketing',
  role: 'Growth marketing manager',
  description: 'Lifecycle, paid media and SEO for B2B and travel brands.',
  input: {
    name: 'Growth marketing manager',
    layout: { accentColor: '#6d28d9' },
    profile: {
      fullName: 'Sofia Lindqvist',
      headline: 'Growth Marketing Manager · Lifecycle, Paid Media, SEO',
      email: 'sofia.lindqvist@example.com',
      phone: '+46 8 555 012 34',
      location: 'Stockholm, Sweden',
      website: 'https://sofia.example.com',
      links: [{ label: 'LinkedIn', url: 'https://example.com/sofia-lindqvist/profile' }],
      summaryHtml: paragraph(
        'Growth marketer who pairs creative campaigns with careful measurement. Ten years across B2B software and travel, managing budgets up to €1.8M and teams of five.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'Growth Marketing Manager',
            subtitle: 'Nordbloom',
            location: 'Stockholm',
            dateRange: '2021 – Present',
            descriptionHtml: bullets(
              'Raised trial-to-paid conversion from 4.2% to 7.9% through lifecycle email and onboarding experiments.',
              'Manage a €1.8M annual paid media budget across Google, Meta and LinkedIn at 22% lower acquisition cost.',
              'Lead a team of five across content, SEO and paid channels.',
            ),
          },
          {
            title: 'Digital Marketing Specialist',
            subtitle: 'Fjordline Travel',
            location: 'Oslo',
            dateRange: '2018 – 2021',
            descriptionHtml: bullets(
              'Launched localised campaigns in nine European markets.',
              'Doubled organic traffic in 18 months with a technical SEO overhaul and a content programme.',
            ),
          },
          {
            title: 'Marketing Coordinator',
            subtitle: 'Alder & Co',
            location: 'Stockholm',
            dateRange: '2015 – 2018',
            descriptionHtml: bullets('Ran events, newsletters and social channels for a design agency.'),
          },
        ],
      },
      {
        kind: 'skills',
        items: [
          {
            title: 'Growth',
            descriptionHtml: paragraph('A/B testing, lifecycle marketing, conversion rate optimisation'),
          },
          {
            title: 'Channels',
            descriptionHtml: paragraph('SEO, Google Ads, Meta Ads, LinkedIn Ads, email'),
          },
          {
            title: 'Tools',
            descriptionHtml: paragraph('HubSpot, Google Analytics 4, Looker Studio, Figma'),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'MSc Marketing',
            subtitle: 'Uppvik School of Economics',
            dateRange: '2013 – 2015',
          },
          {
            title: 'BA Media and Communication',
            subtitle: 'Uppvik University',
            dateRange: '2010 – 2013',
          },
        ],
      },
      {
        kind: 'awards',
        items: [
          {
            title: 'Campaign of the Year',
            subtitle: 'Stockholm Growth Summit',
            dateRange: '2023',
          },
        ],
      },
      {
        kind: 'languages',
        items: [
          { title: 'Swedish', descriptionHtml: paragraph('Native') },
          { title: 'English', descriptionHtml: paragraph('Fluent (C2)') },
          { title: 'Norwegian', descriptionHtml: paragraph('Advanced (C1)') },
        ],
      },
    ],
  },
};
