/// <reference types="node" />
// Reads and (with UPDATE_SCHEMA=1) writes files, so it runs under Node types.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createResumeFromSample, SAMPLES } from '@/samples';

import { resumeJsonSchema } from './json-schema';

const FILE = join(process.cwd(), 'public', 'schema', 'resume.schema.json');

describe('published JSON Schema', () => {
  it('matches the Zod schema (run `npm run schema` after changing the format)', () => {
    const expected = `${JSON.stringify(resumeJsonSchema(), null, 2)}\n`;
    if (process.env.UPDATE_SCHEMA === '1') writeFileSync(FILE, expected);
    expect(readFileSync(FILE, 'utf8')).toBe(expected);
  });

  it('describes the parts other tools need', () => {
    const schema = resumeJsonSchema() as {
      required: string[];
      properties: Record<string, { const?: number }>;
    };
    for (const key of ['schemaVersion', 'id', 'layout', 'profile', 'sections'])
      expect(schema.required).toContain(key);
    expect(schema.properties.schemaVersion?.const).toBe(2);
    // Every sample is a valid example of the format.
    for (const sample of SAMPLES) expect(createResumeFromSample(sample.id).schemaVersion).toBe(2);
  });
});
