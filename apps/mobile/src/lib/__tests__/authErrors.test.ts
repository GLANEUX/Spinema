import { attempt, authErrorMessage } from '../authErrors';

describe('authErrorMessage', () => {
  it('gives the same answer for every wrong sign-in', () => {
    for (const code of [
      'INVALID_EMAIL_OR_PASSWORD',
      'INVALID_USERNAME_OR_PASSWORD',
      'INVALID_PASSWORD',
    ]) {
      expect(authErrorMessage({ code, status: 401 })).toBe('E-mail ou mot de passe incorrect.');
    }
  });

  it('maps the account rules to French', () => {
    expect(authErrorMessage({ code: 'AGE_TOO_YOUNG', status: 400 })).toBe(
      'Il faut avoir au moins 15 ans pour créer un compte.',
    );
    expect(authErrorMessage({ code: 'PASSWORD_COMPROMISED', status: 400 })).toBe(
      'Ce mot de passe a déjà fuité sur internet : choisis-en un autre.',
    );
    expect(authErrorMessage({ code: 'USERNAME_IS_ALREADY_TAKEN', status: 400 })).toMatch(
      /déjà pris/,
    );
  });

  it('handles rate limits, network failures and unknown errors', () => {
    expect(authErrorMessage({ status: 429 })).toBe('Trop d’essais, réessaie dans un moment.');
    expect(authErrorMessage({ code: 'ANYTHING', status: 0 })).toBe('Pas de connexion au serveur.');
    expect(authErrorMessage({ code: 'ANYTHING', status: 500 })).toMatch(/Une erreur est survenue/);
    expect(authErrorMessage(null)).toBe('Une erreur est survenue.');
  });
});

describe('attempt', () => {
  it('returns null on success and a message on error', async () => {
    expect(await attempt(async () => ({ error: null }))).toBeNull();
    expect(await attempt(async () => null)).toBeNull();
    expect(await attempt(async () => ({ error: { status: 429 } }))).toMatch(/Trop d’essais/);
  });

  it('turns a thrown network error into a message', async () => {
    expect(
      await attempt(async () => {
        throw new TypeError('Network request failed');
      }),
    ).toBe('Pas de connexion au serveur.');
  });
});
