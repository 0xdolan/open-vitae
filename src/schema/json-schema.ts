import { z } from 'zod';

import { RESUME_SCHEMA_VERSION, resumeSchema } from './resume';

/** Where the published JSON Schema lives (also served by the app at schema/resume.schema.json). */
export const RESUME_JSON_SCHEMA_ID =
  'https://kanilabs.github.io/open-vitae/app/schema/resume.schema.json';

/**
 * The resume format as JSON Schema (draft 2020-12), generated from the Zod
 * schema so the two cannot drift apart. Other tools (and AI assistants) use it
 * to write resumes that Open Vitae imports. Rules JSON Schema cannot express,
 * such as unique ids, are checked again on import.
 */
export function resumeJsonSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(resumeSchema, {
    target: 'draft-2020-12',
    unrepresentable: 'any',
  }) as Record<string, unknown>;
  const { $schema, ...rest } = generated;
  return {
    $schema,
    $id: RESUME_JSON_SCHEMA_ID,
    title: `Open Vitae resume (schemaVersion ${RESUME_SCHEMA_VERSION})`,
    description:
      'A resume as stored, exported and imported by Open Vitae. Import also accepts this object wrapped in an export envelope ({ "format": "open-vitae", "resume": … }). Every id must be unique within the resume; rich text fields hold HTML that is sanitised on display.',
    ...rest,
  };
}
