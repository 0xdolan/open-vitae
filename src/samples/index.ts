import { buildResume } from '@/lib/resume-factory';
import type { ResumeDocument } from '@/schema/resume';

import { cloudSample } from './cloud';
import { cybersecuritySample } from './cybersecurity';
import { financeSample } from './finance';
import { marketingSample } from './marketing';
import { persianSample } from './persian';
import { techSample } from './tech';
import { SAMPLE_IDS, type SampleDefinition, type SampleId } from './types';

export { SAMPLE_IDS, type SampleDefinition, type SampleId };

/** Read-only templates. Using one creates an editable copy. */
export const SAMPLES: readonly SampleDefinition[] = [
  techSample,
  financeSample,
  cybersecuritySample,
  cloudSample,
  marketingSample,
  persianSample,
];

export function isSampleId(value: string): value is SampleId {
  return (SAMPLE_IDS as readonly string[]).includes(value);
}

export function getSample(id: SampleId): SampleDefinition {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) {
    throw new Error(`Unknown sample: ${id}`);
  }
  return sample;
}

/** A fresh, validated, editable resume built from a sample. */
export function createResumeFromSample(
  id: SampleId,
  name?: string,
  now: Date = new Date(),
): ResumeDocument {
  const { input } = getSample(id);
  return buildResume({ ...input, name: name ?? input.name }, now);
}
