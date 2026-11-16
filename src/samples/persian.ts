import { bullets, paragraph, type SampleDefinition } from './types';

/**
 * Right-to-left sample in Persian, with English product names inside the
 * text to show mixed-direction layout, Persian digits in dates, and Sahel.
 */
export const persianSample: SampleDefinition = {
  id: 'persian',
  label: 'Persian (RTL)',
  role: 'مهندس ارشد داده',
  description: 'A right-to-left resume in Persian with English terms mixed in.',
  input: {
    name: 'مهندس ارشد داده',
    language: 'fa',
    layout: {
      direction: 'rtl',
      fontFamily: 'Sahel',
      accentColor: '#0e7490',
      baseFontSizePt: 10.5,
      lineHeight: 1.6,
    },
    profile: {
      fullName: 'نگار رحیمی',
      headline: 'مهندس ارشد داده · Python، SQL و Apache Spark',
      email: 'negar.rahimi@example.com',
      phone: '+98 21 5550 1234',
      location: 'تهران، ایران',
      links: [
        { label: 'GitHub', url: 'https://example.com/negar-rahimi/code' },
        { label: 'LinkedIn', url: 'https://example.com/negar-rahimi/profile' },
      ],
      summaryHtml: paragraph(
        'مهندس داده با هفت سال تجربه در طراحی خطوط لوله‌ی داده و انبار داده برای شرکت‌های فین‌تک و تجارت الکترونیک. به ساخت زیرساخت‌های قابل‌اعتماد، کیفیت داده و مستندسازی شفاف علاقه دارم.',
      ),
    },
    sections: [
      {
        kind: 'experience',
        items: [
          {
            title: 'مهندس ارشد داده',
            subtitle: 'شرکت آسمان‌پرداز',
            location: 'تهران',
            dateRange: '۱۴۰۰ – اکنون',
            descriptionHtml: bullets(
              'طراحی و پیاده‌سازی خط لوله‌ی داده با Apache Spark و Airflow برای پردازش روزانه‌ی ۲۰ میلیون تراکنش.',
              'کاهش ۴۰ درصدی هزینه‌ی پردازش با بازطراحی جدول‌ها و پارتیشن‌بندی در BigQuery.',
              'راهبری تیم سه‌نفره‌ی مهندسی داده و برگزاری جلسه‌های بازبینی کد.',
            ),
          },
          {
            title: 'مهندس داده',
            subtitle: 'فروشگاه اینترنتی نارون',
            location: 'تهران',
            dateRange: '۱۳۹۷ – ۱۴۰۰',
            descriptionHtml: bullets(
              'ساخت انبار داده با PostgreSQL و dbt برای گزارش‌های فروش و موجودی.',
              'راه‌اندازی داشبوردهای مدیریتی در Metabase برای پنج واحد سازمانی.',
            ),
          },
          {
            title: 'تحلیلگر داده',
            subtitle: 'شرکت رایان‌آمار',
            location: 'اصفهان',
            dateRange: '۱۳۹۵ – ۱۳۹۷',
            descriptionHtml: bullets(
              'تحلیل رفتار مشتریان با Python و pandas و تهیه‌ی گزارش‌های ماهانه.',
            ),
          },
        ],
      },
      {
        kind: 'education',
        items: [
          {
            title: 'کارشناسی ارشد مهندسی نرم‌افزار',
            subtitle: 'دانشگاه صنعتی البرز',
            dateRange: '۱۳۹۳ – ۱۳۹۵',
          },
          {
            title: 'کارشناسی مهندسی کامپیوتر',
            subtitle: 'دانشگاه البرز',
            dateRange: '۱۳۸۹ – ۱۳۹۳',
          },
        ],
      },
      {
        kind: 'skills',
        items: [
          { title: 'زبان‌های برنامه‌نویسی', descriptionHtml: paragraph('Python، SQL، Scala') },
          {
            title: 'ابزارها',
            descriptionHtml: paragraph('Apache Spark، Airflow، dbt، Kafka، Docker'),
          },
          {
            title: 'پایگاه‌های داده',
            descriptionHtml: paragraph('PostgreSQL، BigQuery، ClickHouse'),
          },
        ],
      },
      {
        kind: 'certifications',
        items: [
          {
            title: 'Google Cloud Professional Data Engineer',
            subtitle: 'Google Cloud',
            dateRange: '۱۴۰۲',
          },
        ],
      },
      {
        kind: 'languages',
        items: [
          { title: 'فارسی', descriptionHtml: paragraph('زبان مادری') },
          { title: 'انگلیسی', descriptionHtml: paragraph('پیشرفته (C1)') },
        ],
      },
    ],
  },
};
