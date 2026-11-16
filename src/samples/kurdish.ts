import { bullets, paragraph, type SampleDefinition } from './types';

/**
 * Right-to-left sample in Central Kurdish (Sorani, ckb): a cybersecurity
 * engineer. Uses the Kurdish letters ڕ ڵ ێ ۆ ە, Arabic-Indic digits and
 * English tool names inside the text. Set in Estedad.
 */
export const kurdishSample: SampleDefinition = {
  id: 'kurdish',
  label: 'Kurdish – Sorani (RTL)',
  role: 'ئەندازیاری ئاسایشی سایبەری',
  description: 'A right-to-left resume in Central Kurdish (Sorani) with English terms mixed in.',
  input: {
    name: 'ئەندازیاری ئاسایشی سایبەری',
    language: 'ckb',
    layout: {
      direction: 'rtl',
      fontFamily: 'Estedad',
      accentColor: '#15803d',
      baseFontSizePt: 10.5,
      lineHeight: 1.65,
    },
    profile: {
      fullName: 'ئاوات کەریم',
      headline: 'ئەندازیاری ئاسایشی سایبەری · Cloud و DevSecOps',
      email: 'awat.karim@example.com',
      phone: '+964 750 555 0123',
      location: 'هەولێر',
      links: [
        { label: 'GitHub', url: 'https://example.com/awat-karim/code' },
        { label: 'LinkedIn', url: 'https://example.com/awat-karim/profile' },
      ],
      summaryHtml: paragraph(
        'ئەندازیاری ئاسایشی سایبەری بە شەش ساڵ ئەزموون لە پاراستنی ژێرخانی هەور و تۆڕەکانی بانک و کۆمپانیاکانی گەیاندن. شارەزام لە دۆزینەوەی هەڕەشەکان، وەڵامدانەوە بە ڕووداوەکان و ئۆتۆماتیککردنی پشکنینەکانی ئاسایش لە CI/CD.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'ئەندازیاری باڵای ئاسایشی سایبەری',
            subtitle: 'بانکی ئاسۆی نوێ',
            location: 'هەولێر',
            dateRange: '٢٠٢١ – ئێستا',
            descriptionHtml: bullets(
              'دامەزراندنی سیستەمی SIEM بە Wazuh و Elastic بۆ چاودێریکردنی زیاتر لە ٨٠٠ ڕاژەکار.',
              'کەمکردنەوەی کاتی وەڵامدانەوە بە ڕووداوەکان بە ڕێژەی ٦٠٪ بە ئۆتۆماتیککردن لە ڕێگەی Python.',
              'ڕێکخستنی پشکنینی لاوازییەکان بۆ ئەپی مۆبایلی بانک و چارەسەرکردنیان پێش بڵاوکردنەوە.',
            ),
          },
          {
            title: 'ئەندازیاری تۆڕ و ئاسایش',
            subtitle: 'کۆمپانیای گەیاندنی ئاسمان',
            location: 'سلێمانی',
            dateRange: '٢٠١٨ – ٢٠٢١',
            descriptionHtml: bullets(
              'دیزاینکردنی تۆڕی ناوخۆیی بە firewall و VPN بۆ ١٢ لق.',
              'ئامادەکردنی سیاسەتی ئاسایشی زانیاری بەپێی ستانداردی ISO/IEC 27001.',
            ),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'بەکالۆریۆس لە ئەندازیاری کۆمپیوتەر',
            subtitle: 'زانکۆی پۆلیتەکنیکی ئاسۆ',
            dateRange: '٢٠١٤ – ٢٠١٨',
          },
        ],
      },
      {
        kind: 'skills',
        items: [
          { title: 'ئاسایشی هەور', descriptionHtml: paragraph('AWS، Azure، Kubernetes') },
          { title: 'چاودێری و وەڵامدانەوە', descriptionHtml: paragraph('Wazuh، Elastic، Splunk') },
          { title: 'زمانەکانی پرۆگرامسازی', descriptionHtml: paragraph('Python، Bash، Go') },
        ],
      },
      {
        kind: 'certifications',
        items: [
          { title: 'CISSP', subtitle: 'ISC2', dateRange: '٢٠٢٣' },
          {
            title: 'AWS Certified Security – Specialty',
            subtitle: 'Amazon Web Services',
            dateRange: '٢٠٢٢',
          },
        ],
      },
      {
        kind: 'languages',
        items: [
          { title: 'کوردی', descriptionHtml: paragraph('زمانی دایک') },
          { title: 'عەرەبی', descriptionHtml: paragraph('باش') },
          { title: 'ئینگلیزی', descriptionHtml: paragraph('پێشکەوتوو (C1)') },
        ],
      },
    ],
  },
};
