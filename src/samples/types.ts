import type { ResumeInput } from '@/lib/resume-factory';

export const SAMPLE_IDS = ['tech', 'finance', 'cybersecurity', 'cloud', 'marketing', 'persian', 'arabic', 'kurdish'] as const;

export type SampleId = (typeof SAMPLE_IDS)[number];

export interface SampleDefinition {
  readonly id: SampleId;
  /** Short label for the gallery card. */
  readonly label: string;
  readonly role: string;
  readonly description: string;
  /** All people, companies, schools and contact details are fictional. */
  readonly input: ResumeInput;
}

/** Bullet list HTML from plain strings. Sample content is static and trusted. */
export function bullets(...lines: string[]): string {
  return `<ul>${lines.map((line) => `<li>${line}</li>`).join('')}</ul>`;
}

export function paragraph(text: string): string {
  return `<p>${text}</p>`;
}
