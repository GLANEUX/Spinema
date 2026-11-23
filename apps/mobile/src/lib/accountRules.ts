/**
 * Account rules checked in the app before calling the API (docs/comptes.md, PLAN.md §8).
 * The API checks them again: these only give a quick, friendly answer.
 */
export const MIN_AGE = 15;
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
const USERNAME = /^[A-Za-z0-9_.-]{3,20}$/;
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

/** Age in full years on `today` for a "YYYY-MM-DD" birth date. */
export function ageOn(isoBirthDate: string, today: Date): number {
  const [y, m, d] = isoBirthDate.split('-').map(Number) as [number, number, number];
  let age = today.getFullYear() - y;
  const month = today.getMonth() + 1;
  if (month < m || (month === m && today.getDate() < d)) age -= 1;
  return age;
}

export function isOldEnough(isoBirthDate: string, today: Date = new Date()): boolean {
  return ageOn(isoBirthDate, today) >= MIN_AGE;
}

export function checkPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Au moins ${PASSWORD_MIN} caractères.`;
  if (password.length > PASSWORD_MAX) return `Au plus ${PASSWORD_MAX} caractères.`;
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
  if (!USERNAME.test(input.username.trim())) {
    errors.username = 'Ton pseudo : 3 à 20 caractères, lettres, chiffres, « _ », « . » ou « - ».';
  }
  const passwordError = checkPassword(input.password);
  if (passwordError) errors.password = passwordError;
  const iso = toIsoDate(input.birth);
  const age = iso ? ageOn(iso, today) : -1;
  if (!iso || age < 0 || age > 120) {
    errors.birth = 'Cette date de naissance ne semble pas valide.';
  } else if (age < MIN_AGE) {
    errors.birth = 'Il faut avoir au moins 15 ans pour créer un compte.';
  }
  return errors;
}
