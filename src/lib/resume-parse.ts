import type { z } from 'zod';

import { migrateResume } from '@/lib/migrations';
import { resumeSchema, type ResumeDocument } from '@/schema/resume';

export type ParseResult =
  | { readonly ok: true; readonly resume: ResumeDocument }
  | { readonly ok: false; readonly error: string };

/** Turn validation issues into one short readable message. */
export function formatIssues(issues: z.ZodError['issues'], max = 3): string {
  const lines = issues.slice(0, max).map((issue) => {
    const path = issue.path.map(String).join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  const more = issues.length > max ? ` (and ${issues.length - max} more)` : '';
  return lines.join('; ') + more;
}

/** Migrate and validate unknown data. Never throws. */
export function parseResume(raw: unknown): ParseResult {
  let migrated: unknown;
  try {
    migrated = migrateResume(raw);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  const result = resumeSchema.safeParse(migrated);
  return result.success
    ? { ok: true, resume: result.data }
    : { ok: false, error: formatIssues(result.error.issues) };
}
