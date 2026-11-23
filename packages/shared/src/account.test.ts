import { describe, expect, it } from 'vitest';
import { ageOn, birthDateSchema, isOldEnough, MINIMUM_AGE, usernameSchema } from './account';

const on = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe('ageOn', () => {
  it('counts full years, the birthday included', () => {
    expect(ageOn('2011-06-15', on('2026-06-14'))).toBe(14);
    expect(ageOn('2011-06-15', on('2026-06-15'))).toBe(15);
    expect(ageOn('2011-06-15', on('2026-05-30'))).toBe(14);
    expect(ageOn('2011-06-15', on('2026-07-01'))).toBe(15);
  });

  it('refuses a date that is not a real calendar date', () => {
    expect(() => ageOn('2011-02-30', on('2026-01-01'))).toThrow(/Invalid birth date/);
    expect(() => ageOn('15/06/2011', on('2026-01-01'))).toThrow(/Invalid birth date/);
  });
});

describe('isOldEnough', () => {
  it('requires 15 years by default', () => {
    expect(MINIMUM_AGE).toBe(15);
    expect(isOldEnough('2011-06-15', on('2026-06-15'))).toBe(true);
    expect(isOldEnough('2011-06-16', on('2026-06-15'))).toBe(false);
  });

  it('accepts another minimum age', () => {
    expect(isOldEnough('2008-06-15', on('2026-06-15'), 18)).toBe(true);
  });
});

describe('usernameSchema', () => {
  it('accepts 3 to 20 letters, digits, _ . -', () => {
    for (const ok of ['Lou', 'cine_pote', 'a.b-c', 'x'.repeat(20)]) {
      expect(usernameSchema.safeParse(ok).success).toBe(true);
    }
  });

  it('refuses spaces, accents, too short or too long', () => {
    for (const bad of ['Lo', 'x'.repeat(21), 'Lou Lou', 'Léa', '<b>']) {
      expect(usernameSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe('birthDateSchema', () => {
  it('accepts a real past date', () => {
    expect(birthDateSchema.safeParse('2000-02-29').success).toBe(true);
  });

  it('refuses impossible dates, other formats and the future', () => {
    for (const bad of ['2001-02-29', '2000-13-01', '01/01/2000', '2999-01-01']) {
      expect(birthDateSchema.safeParse(bad).success).toBe(false);
    }
  });
});
