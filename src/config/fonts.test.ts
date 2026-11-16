import { describe, expect, it } from 'vitest';

import { DEFAULT_FONT_BY_DIRECTION, fontStack } from './fonts';

describe('fontStack', () => {
  it('uses Manrope for LTR and Sahel for RTL by default', () => {
    expect(DEFAULT_FONT_BY_DIRECTION).toEqual({ ltr: 'Manrope', rtl: 'Sahel' });
  });

  it('adds Sahel after a Latin-only font so Arabic-script text renders in Sahel', () => {
    expect(fontStack('Manrope')).toBe('"Manrope", "Sahel", system-ui, sans-serif');
  });

  it('does not repeat Sahel when it is the primary font', () => {
    expect(fontStack('Sahel')).toBe('"Sahel", Tahoma, system-ui, sans-serif');
  });

  it('uses the open metric-compatible fallback for proprietary fonts', () => {
    expect(fontStack('Times New Roman')).toBe('"Times New Roman", Tinos, Times, serif');
  });

  it('strips quotes and backslashes from unknown names', () => {
    expect(fontStack('Bad"Font\\')).toBe('"BadFont", "Sahel", system-ui, sans-serif');
  });
});
