import { z } from 'zod';

/** Minimum age to create an account (PLAN.md §1 Âge, RGPD in France). */
export const MINIMUM_AGE = 15;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `YYYY-MM-DD` into its parts, or undefined when it is not a real calendar date. */
function parseDate(value: string): { year: number; month: number; day: number } | undefined {
  const match = DATE.exec(value);
  if (!match) return undefined;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return { year, month, day };
}

/** Age in full years on `now` (UTC) of someone born on `birthDate` (`YYYY-MM-DD`). */
export function ageOn(birthDate: string, now: Date): number {
  const birth = parseDate(birthDate);
  if (!birth) throw new Error(`Invalid birth date: ${birthDate}`);
  const months = now.getUTCMonth() + 1 - birth.month;
  const beforeBirthday = months < 0 || (months === 0 && now.getUTCDate() < birth.day);
  return now.getUTCFullYear() - birth.year - (beforeBirthday ? 1 : 0);
}

/** True when someone born on `birthDate` is at least `minAge` on `now`. */
export function isOldEnough(birthDate: string, now: Date, minAge = MINIMUM_AGE): boolean {
  return ageOn(birthDate, now) >= minAge;
}

/** Pseudo: 3 to 20 letters, digits, `_`, `.` or `-`. */
export const usernameSchema = z
  .string()
  .regex(/^[A-Za-z0-9_.-]{3,20}$/, 'Le pseudo fait 3 à 20 caractères : lettres, chiffres, _ . ou -.');

/** Birth date `YYYY-MM-DD`: a real date, not in the future. */
export const birthDateSchema = z
  .string()
  .refine((value) => parseDate(value) !== undefined, 'Date de naissance invalide.')
  .refine(
    (value) => parseDate(value) === undefined || ageOn(value, new Date()) >= 0,
    'La date de naissance est dans le futur.',
  );
