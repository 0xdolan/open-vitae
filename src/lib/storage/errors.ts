export class ResumeValidationError extends Error {
  override readonly name = 'ResumeValidationError';
}

/** A message a person can act on, for any storage failure. */
export function describeStorageError(error: unknown): string {
  if (error instanceof ResumeValidationError) {
    return `Not saved: ${error.message}`;
  }
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return 'Browser storage is full. Delete old resumes or large photos, then try again.';
    }
    if (error.name === 'InvalidStateError' || error.name === 'SecurityError') {
      return 'This browser is blocking local storage (private browsing can do this). Your changes are kept only until you close the tab.';
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong while saving.';
}
