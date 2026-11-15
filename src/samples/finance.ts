import { bullets, paragraph, type SampleDefinition } from './types';

export const financeSample: SampleDefinition = {
  id: 'finance',
  label: 'Finance',
  role: 'Senior financial analyst',
  description: 'Modelling, forecasting and M&A analysis. US Letter page size.',
  input: {
    name: 'Senior financial analyst',
    layout: { accentColor: '#1e3a5f', pageSize: 'letter', marginMm: 18 },
    profile: {
      fullName: 'Daniel Reyes',
      headline: 'Senior Financial Analyst · CFA Charterholder',
      email: 'daniel.reyes@example.com',
      phone: '+1 212 555 0147',
      location: 'New York, NY',
      links: [{ label: 'LinkedIn', url: 'https://example.com/daniel-reyes/profile' }],
      summaryHtml: paragraph(
        'Financial analyst with nine years across investment banking, commercial lending and private equity. Known for models that executives trust and for turning month-end reporting into something fast and repeatable.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'Senior Financial Analyst',
            subtitle: 'Halden Capital Partners',
            location: 'New York, NY',
            dateRange: '2021 – Present',
            descriptionHtml: bullets(
              'Built the three-statement model used to evaluate $1.4B of mid-market acquisitions.',
              'Cut the monthly close from nine days to five by automating variance analysis in Python and Power BI.',
              'Present quarterly forecasts and portfolio reviews to the investment committee.',
            ),
          },
          {
            title: 'Financial Analyst',
            subtitle: 'Meridian Bank',
            location: 'Chicago, IL',
            dateRange: '2018 – 2021',
            descriptionHtml: bullets(
              'Ran FP&A for a $220M commercial lending portfolio.',
              'Designed stress-testing scenarios adopted in the bank’s annual capital plan.',
              'Partnered with credit risk to reprice 140 loans, adding $3.1M in annual interest income.',
            ),
          },
          {
            title: 'Analyst',
            subtitle: 'Corwin & Pike Advisory',
            location: 'Chicago, IL',
            dateRange: '2016 – 2018',
            descriptionHtml: bullets(
              'Supported financial due diligence on 12 transactions from $20M to $300M.',
              'Prepared valuation materials using DCF and comparable-company analysis.',
            ),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'BS Economics, minor in Mathematics',
            subtitle: 'Northgate University',
            dateRange: '2012 – 2016',
            descriptionHtml: paragraph('Graduated magna cum laude.'),
          },
        ],
      },
      {
        kind: 'certifications',
        items: [
          { title: 'Chartered Financial Analyst (CFA)', subtitle: 'CFA Institute', dateRange: '2021' },
          {
            title: 'Financial Modeling & Valuation Analyst (FMVA)',
            subtitle: 'Corporate Finance Institute',
            dateRange: '2019',
          },
        ],
      },
      {
        kind: 'skills',
        items: [
          {
            title: 'Analysis',
            descriptionHtml: paragraph('DCF, LBO and merger models, scenario and sensitivity analysis'),
          },
          {
            title: 'Tools',
            descriptionHtml: paragraph('Excel and VBA, Python (pandas), SQL, Power BI, Bloomberg Terminal'),
          },
          {
            title: 'Reporting',
            descriptionHtml: paragraph('US GAAP, IFRS, budgeting and rolling forecasts'),
          },
        ],
      },
    ],
  },
};
