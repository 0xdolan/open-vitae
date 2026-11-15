import { bullets, paragraph, type SampleDefinition } from './types';

export const cybersecuritySample: SampleDefinition = {
  id: 'cybersecurity',
  label: 'Cybersecurity',
  role: 'Senior security engineer',
  description: 'Detection engineering, incident response and compliance programmes.',
  input: {
    name: 'Senior security engineer',
    layout: { accentColor: '#9f1239' },
    profile: {
      fullName: 'Leyla Hassan',
      headline: 'Senior Security Engineer · Detection & Response, Cloud Security',
      email: 'leyla.hassan@example.com',
      phone: '+1 416 555 0193',
      location: 'Toronto, Canada',
      links: [
        { label: 'LinkedIn', url: 'https://example.com/leyla-hassan/profile' },
        { label: 'Blog', url: 'https://example.com/leyla-hassan/notes' },
      ],
      summaryHtml: paragraph(
        'Security engineer with nine years on both sides of the fence: penetration testing, a 24/7 SOC, and now building detection and response for a healthcare platform. I focus on controls that engineers actually adopt.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'Senior Security Engineer',
            subtitle: 'Arcfield Health',
            location: 'Toronto',
            dateRange: '2021 – Present',
            descriptionHtml: bullets(
              'Led the SOC 2 Type II and ISO 27001 programmes to certification in 11 months.',
              'Built detection rules mapped to MITRE ATT&amp;CK, cutting mean time to detect from six hours to 40 minutes.',
              'Run quarterly purple-team exercises with the platform and infrastructure teams.',
            ),
          },
          {
            title: 'Security Analyst',
            subtitle: 'Northpoint Telecom',
            location: 'Ottawa',
            dateRange: '2018 – 2021',
            descriptionHtml: bullets(
              'Triaged more than 300 alerts a week in a 24/7 security operations centre.',
              'Led the response to a credential-stuffing campaign that targeted 40,000 customer accounts.',
              'Automated phishing triage in Python, saving the team 15 hours a week.',
            ),
          },
          {
            title: 'Penetration Tester',
            subtitle: 'Redline Assurance',
            location: 'Ottawa',
            dateRange: '2016 – 2018',
            descriptionHtml: bullets(
              'Performed web application and network tests for more than 30 clients.',
              'Wrote remediation reports for developers and executives alike.',
            ),
          },
        ],
      },
      {
        kind: 'certifications',
        items: [
          { title: 'OSCP', subtitle: 'Offensive Security', dateRange: '2017' },
          { title: 'CISSP', subtitle: 'ISC2', dateRange: '2020' },
          { title: 'AWS Certified Security – Specialty', subtitle: 'Amazon Web Services', dateRange: '2022' },
        ],
      },
      {
        kind: 'skills',
        items: [
          {
            title: 'Detection and response',
            descriptionHtml: paragraph('Splunk, Elastic, EDR, MITRE ATT&amp;CK, incident handling'),
          },
          {
            title: 'Offensive',
            descriptionHtml: paragraph('Burp Suite, Metasploit, Nmap, OWASP Top 10'),
          },
          {
            title: 'Cloud and code',
            descriptionHtml: paragraph('AWS, Terraform, Python, threat modelling'),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'BEng Software Engineering',
            subtitle: 'Lakehead Institute of Technology',
            dateRange: '2012 – 2016',
          },
        ],
      },
      {
        kind: 'languages',
        items: [
          { title: 'English', descriptionHtml: paragraph('Native') },
          { title: 'Arabic', descriptionHtml: paragraph('Native') },
          { title: 'French', descriptionHtml: paragraph('Professional') },
        ],
      },
    ],
  },
};
