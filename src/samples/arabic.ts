import { bullets, paragraph, type SampleDefinition } from './types';

/**
 * Right-to-left sample in Arabic: a digital marketing manager, with English
 * product names inside the text, Arabic-Indic digits and the Arabic comma.
 */
export const arabicSample: SampleDefinition = {
  id: 'arabic',
  label: 'Arabic (RTL)',
  role: 'مديرة التسويق الرقمي',
  description: 'A right-to-left resume in Arabic with English terms mixed in.',
  input: {
    name: 'مديرة التسويق الرقمي',
    language: 'ar',
    layout: {
      direction: 'rtl',
      fontFamily: 'Sahel',
      accentColor: '#9f1239',
      baseFontSizePt: 10.5,
      lineHeight: 1.6,
    },
    profile: {
      fullName: 'ليلى حداد',
      headline: 'مديرة التسويق الرقمي · SEO وGoogle Ads',
      email: 'layla.haddad@example.com',
      phone: '+962 6 555 0123',
      location: 'عمّان، الأردن',
      links: [
        { label: 'LinkedIn', url: 'https://example.com/layla-haddad/profile' },
        { label: 'Portfolio', url: 'https://example.com/layla-haddad/work' },
      ],
      summaryHtml: paragraph(
        'مسوّقة رقمية بخبرة تسع سنوات في بناء العلامات التجارية وإدارة الحملات الإعلانية في قطاعي التجزئة والسياحة. أركّز على القرارات المبنية على البيانات وتحسين معدلات التحويل وبناء فرق تسويق متكاملة.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'مديرة التسويق الرقمي',
            subtitle: 'مجموعة الواحة للتجزئة',
            location: 'عمّان',
            dateRange: '٢٠٢٠ – حتى الآن',
            descriptionHtml: bullets(
              'قيادة فريق من ثمانية أشخاص وإدارة ميزانية إعلانية سنوية قدرها ١٫٢ مليون دولار.',
              'رفع المبيعات عبر الإنترنت بنسبة ٧٥٪ خلال عامين من خلال حملات Google Ads وMeta.',
              'إطلاق برنامج ولاء رقمي تجاوز عدد أعضائه ١٢٠ ألف عضو في السنة الأولى.',
            ),
          },
          {
            title: 'أخصائية تسويق رقمي',
            subtitle: 'شركة رحلات المشرق',
            location: 'بيروت',
            dateRange: '٢٠١٦ – ٢٠٢٠',
            descriptionHtml: bullets(
              'تحسين ظهور الموقع في محركات البحث (SEO) ومضاعفة الزيارات العضوية خلال ثمانية عشر شهرًا.',
              'إدارة المحتوى على منصات التواصل الاجتماعي باللغتين العربية والإنجليزية.',
            ),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'ماجستير في التسويق',
            subtitle: 'الجامعة العربية للعلوم الإدارية',
            dateRange: '٢٠١٤ – ٢٠١٦',
          },
          {
            title: 'بكالوريوس في إدارة الأعمال',
            subtitle: 'جامعة الشرق',
            dateRange: '٢٠١٠ – ٢٠١٤',
          },
        ],
      },
      {
        kind: 'skills',
        items: [
          {
            title: 'التسويق الرقمي',
            descriptionHtml: paragraph('SEO، SEM، التسويق بالمحتوى، التسويق عبر البريد الإلكتروني'),
          },
          {
            title: 'الأدوات',
            descriptionHtml: paragraph(
              'Google Analytics 4، HubSpot، Meta Ads Manager، Looker Studio',
            ),
          },
        ],
      },
      {
        kind: 'certifications',
        items: [
          { title: 'Google Ads Search Certification', subtitle: 'Google', dateRange: '٢٠٢٤' },
        ],
      },
      {
        kind: 'languages',
        items: [
          { title: 'العربية', descriptionHtml: paragraph('اللغة الأم') },
          { title: 'الإنجليزية', descriptionHtml: paragraph('متقدمة (C1)') },
          { title: 'الفرنسية', descriptionHtml: paragraph('متوسطة (B1)') },
        ],
      },
    ],
  },
};
