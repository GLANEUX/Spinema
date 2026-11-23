/**
 * Account rules checked in the app before calling the API (docs/comptes.md, PLAN.md §8).
 * The API checks them again: these only give a quick, friendly answer.
 */
import {
  ageOn,
  MINIMUM_AGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  usernameSchema,
} from '@spinema/shared';

// Same rules as the API: they come from @spinema/shared.
export { ageOn, isOldEnough } from '@spinema/shared';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type BirthDate = { day: string; month: string; year: string };

/** "YYYY-MM-DD" when the three fields form a real date, otherwise null. */
export function toIsoDate({ day, month, year }: BirthDate): string | null {
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function checkPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Au plus ${PASSWORD_MAX_LENGTH} caractères.`;
  return null;
}

export type SignUpInput = {
  email: string;
  username: string;
  password: string;
  birth: BirthDate;
};

export type SignUpErrors = Partial<Record<'email' | 'username' | 'password' | 'birth', string>>;

/** French message per field; an empty object means everything is valid. */
export function checkSignUp(input: SignUpInput, today: Date = new Date()): SignUpErrors {
  const errors: SignUpErrors = {};
  if (!EMAIL.test(input.email.trim())) errors.email = 'Cette adresse e-mail ne semble pas valide.';
  if (!usernameSchema.safeParse(input.username.trim()).success) {
    errors.username = 'Ton pseudo : 3 à 20 caractères, lettres, chiffres, « _ », « . » ou « - ».';
  }
  const passwordError = checkPassword(input.password);
  if (passwordError) errors.password = passwordError;
  const iso = toIsoDate(input.birth);
  const age = iso ? ageOn(iso, today) : -1;
  if (!iso || age < 0 || age > 120) {
    errors.birth = 'Cette date de naissance ne semble pas valide.';
  } else if (age < MINIMUM_AGE) {
    errors.birth = `Il faut avoir au moins ${MINIMUM_AGE} ans pour créer un compte.`;
  }
  return errors;
}
