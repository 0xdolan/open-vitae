import { bullets, paragraph, type SampleDefinition } from './types';

export const cloudSample: SampleDefinition = {
  id: 'cloud',
  label: 'Cloud',
  role: 'Lead cloud engineer',
  description: 'AWS platforms, Kubernetes, reliability and cost reduction.',
  input: {
    name: 'Lead cloud engineer',
    layout: { accentColor: '#0f766e' },
    profile: {
      fullName: 'Arjun Mehta',
      headline: 'Lead Cloud Engineer · AWS, Kubernetes, Terraform',
      email: 'arjun.mehta@example.com',
      phone: '+65 5550 1820',
      location: 'Singapore',
      links: [
        { label: 'GitHub', url: 'https://example.com/arjun-mehta/code' },
        { label: 'LinkedIn', url: 'https://example.com/arjun-mehta/profile' },
      ],
      summaryHtml: paragraph(
        'Platform engineer who builds cloud foundations that let product teams ship safely without waiting on infrastructure. Nine years from bare-metal operations to multi-account AWS and Kubernetes at scale.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'Lead Cloud Engineer',
            subtitle: 'Skyharbor Retail',
            location: 'Singapore',
            dateRange: '2022 – Present',
            descriptionHtml: bullets(
              'Designed a multi-account AWS landing zone in Terraform now used by 40 teams.',
              'Moved 120 services to Kubernetes (EKS) with no customer-facing downtime.',
              'Cut cloud spend by 31% through rightsizing, Savings Plans and spot capacity.',
            ),
          },
          {
            title: 'Site Reliability Engineer',
            subtitle: 'Fernleaf Payments',
            location: 'Bengaluru',
            dateRange: '2019 – 2022',
            descriptionHtml: bullets(
              'Kept a platform processing eight million transactions a day at 99.99% availability.',
              'Introduced service level objectives with Prometheus and Grafana dashboards for every team.',
              'Wrote the incident playbooks and ran blameless post-incident reviews.',
            ),
          },
          {
            title: 'Systems Engineer',
            subtitle: 'Quillstone IT Services',
            location: 'Pune',
            dateRange: '2016 – 2019',
            descriptionHtml: bullets(
              'Automated server provisioning with Ansible, taking new environments from days to an hour.',
            ),
          },
        ],
      },
      {
        kind: 'certifications',
        items: [
          {
            title: 'AWS Certified Solutions Architect – Professional',
            subtitle: 'Amazon Web Services',
            dateRange: '2023',
          },
          {
            title: 'Certified Kubernetes Administrator (CKA)',
            subtitle: 'CNCF',
            dateRange: '2021',
          },
          { title: 'Terraform Associate', subtitle: 'HashiCorp', dateRange: '2020' },
        ],
      },
      {
        kind: 'skills',
        items: [
          { title: 'Cloud', descriptionHtml: paragraph('AWS, Google Cloud, Azure fundamentals') },
          {
            title: 'Platform',
            descriptionHtml: paragraph('Kubernetes, Helm, Argo CD, Terraform, GitHub Actions'),
          },
          {
            title: 'Observability',
            descriptionHtml: paragraph('Prometheus, Grafana, OpenTelemetry'),
          },
          { title: 'Languages', descriptionHtml: paragraph('Go, Python, Bash') },
        ],
      },
      {
        kind: 'projects',
        items: [
          {
            title: 'kube-cost-report',
            subtitle: 'Open-source Kubernetes cost reporting',
            url: 'https://example.com/kube-cost-report',
            descriptionHtml: paragraph('Per-namespace cost breakdowns from cloud billing data.'),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'BTech Information Technology',
            subtitle: 'Deccan Institute of Engineering',
            dateRange: '2012 – 2016',
          },
        ],
      },
    ],
  },
};
