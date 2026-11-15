import { RESUME_SCHEMA_VERSION } from '@/schema/resume';

export class MigrationError extends Error {
  override readonly name = 'MigrationError';
}

type RawDocument = Record<string, unknown>;

/** A migration takes a document at version N and returns it at version N + 1. */
type Migration = (doc: RawDocument) => RawDocument;

/**
 * Keyed by the version a migration upgrades FROM.
 * Example for a future v2: { 1: (doc) => ({ ...doc, newField: 'default' }) }
 */
const MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {};

function isRecord(value: unknown): value is RawDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Bring a stored or imported document up to the current schema version.
 * The result still has to be validated with the schema.
 */
export function migrateResume(
  raw: unknown,
  migrations: Readonly<Partial<Record<number, Migration>>> = MIGRATIONS,
  currentVersion: number = RESUME_SCHEMA_VERSION,
): unknown {
  if (!isRecord(raw)) {
    throw new MigrationError('This is not an Open Vitae resume.');
  }

  let version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new MigrationError('The resume has no valid format version.');
  }
  if (version > currentVersion) {
    throw new MigrationError(
      `This resume was made by a newer version of Open Vitae (format ${version}). Update the app to open it.`,
    );
  }

  let doc = raw;
  while (version < currentVersion) {
    const migrate = migrations[version];
    if (!migrate) {
      throw new MigrationError(`No upgrade path from format ${version}.`);
    }
    version += 1;
    doc = { ...migrate(doc), schemaVersion: version };
  }
  return doc;
}
