/** Error returned by the Better Auth client. */
export type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

const WRONG_CREDENTIALS = 'E-mail ou mot de passe incorrect.';
const NETWORK = 'Pas de connexion au serveur.';

const MESSAGES: Record<string, string> = {
  // Sign-in: the same answer whatever went wrong, so nobody can test which accounts exist.
  INVALID_EMAIL_OR_PASSWORD: WRONG_CREDENTIALS,
  INVALID_USERNAME_OR_PASSWORD: WRONG_CREDENTIALS,
  INVALID_PASSWORD: WRONG_CREDENTIALS,
  EMAIL_NOT_VERIFIED: "Confirme d'abord ton adresse e-mail : le lien est dans ta boîte mail.",
  AGE_TOO_YOUNG: 'Il faut avoir au moins 15 ans pour créer un compte.',
  PASSWORD_COMPROMISED: 'Ce mot de passe a déjà fuité sur internet : choisis-en un autre.',
  PASSWORD_TOO_SHORT: 'Ton mot de passe doit faire au moins 12 caractères.',
  PASSWORD_TOO_LONG: 'Ton mot de passe doit faire au plus 128 caractères.',
  USER_ALREADY_EXISTS: 'Impossible de créer un compte avec cette adresse e-mail.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Impossible de créer un compte avec cette adresse e-mail.',
  USERNAME_IS_ALREADY_TAKEN: 'Ce pseudo est déjà pris : choisis-en un autre.',
  USERNAME_TOO_SHORT: 'Ton pseudo doit faire au moins 3 caractères.',
  USERNAME_TOO_LONG: 'Ton pseudo doit faire au plus 20 caractères.',
  INVALID_USERNAME: 'Ton pseudo : lettres, chiffres, « _ », « . » ou « - » seulement.',
  INVALID_EMAIL: 'Cette adresse e-mail ne semble pas valide.',
  INVALID_TOKEN: 'Ce lien a expiré ou a déjà servi. Redemande un e-mail.',
};

/** French message for an authentication error (docs/comptes.md). */
export function authErrorMessage(error: AuthError): string {
  if (!error) return 'Une erreur est survenue.';
  if (error.status === 429) return 'Trop d’essais, réessaie dans un moment.';
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code] as string;
  if (!error.status) return NETWORK;
  return 'Une erreur est survenue. Réessaie dans un moment.';
}

/** Runs an auth call and turns its error, or a network failure, into a message (null if fine). */
export async function attempt(
  call: () => Promise<{ error?: AuthError } | null | undefined>,
): Promise<string | null> {
  try {
    const result = await call();
    return result?.error ? authErrorMessage(result.error) : null;
  } catch {
    return NETWORK;
  }
}
