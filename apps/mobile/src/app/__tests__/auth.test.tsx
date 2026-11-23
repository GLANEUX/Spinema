import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authClient } from '../../lib/auth';
import SignIn from '../(auth)/connexion';
import SignUp from '../(auth)/inscription';
import CheckInbox from '../(auth)/verifie-ta-boite';
import ForgotPassword from '../(auth)/mot-de-passe-oublie';

jest.mock('../../lib/auth', () => ({
  scheme: 'spinema-test',
  authClient: {
    signIn: { email: jest.fn(), username: jest.fn() },
    signUp: { email: jest.fn() },
    sendVerificationEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
  },
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

const auth = authClient as unknown as {
  signIn: { email: jest.Mock; username: jest.Mock };
  signUp: { email: jest.Mock };
  sendVerificationEmail: jest.Mock;
  requestPasswordReset: jest.Mock;
};
const params = useLocalSearchParams as jest.Mock;
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);
const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
  params.mockReturnValue({});
});

describe('Connexion', () => {
  it('signs in with an e-mail, or with a pseudo', async () => {
    auth.signIn.email.mockResolvedValue({ data: {}, error: null });
    auth.signIn.username.mockResolvedValue({ data: {}, error: null });
    await render(<SignIn />);
    await type('E-mail ou pseudo', ' lou@example.fr ');
    await type('Mot de passe', 'une phrase assez longue');
    await press('Entrer');
    expect(auth.signIn.email).toHaveBeenCalledWith({
      email: 'lou@example.fr',
      password: 'une phrase assez longue',
    });
    await type('E-mail ou pseudo', 'Lou_42');
    await press('Entrer');
    expect(auth.signIn.username).toHaveBeenCalledWith({
      username: 'Lou_42',
      password: 'une phrase assez longue',
    });
  });

  it('gives one message for any wrong sign-in, and asks for both fields', async () => {
    auth.signIn.email.mockResolvedValue({
      error: { code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 },
    });
    await render(<SignIn />);
    await press('Entrer');
    expect(
      screen.getByText('Remplis ton e-mail (ou ton pseudo) et ton mot de passe.'),
    ).toBeTruthy();
    await type('E-mail ou pseudo', 'lou@example.fr');
    await type('Mot de passe', 'mauvais mot de passe');
    await press('Entrer');
    expect(await screen.findByText('E-mail ou mot de passe incorrect.')).toBeTruthy();
  });

  it('confirms a verified e-mail and links to the other screens', async () => {
    params.mockReturnValue({ verifie: '1' });
    await render(<SignIn />);
    expect(screen.getByText('Ton e-mail est confirmé, tu peux te connecter.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: 'Mot de passe oublié ?' }));
    expect(router.push).toHaveBeenCalledWith('/mot-de-passe-oublie');
    await fireEvent.press(screen.getByRole('link', { name: 'Créer un compte' }));
    expect(router.push).toHaveBeenCalledWith('/inscription');
  });

  it('shows the password on demand', async () => {
    await render(<SignIn />);
    await fireEvent.press(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(screen.getByRole('button', { name: 'Masquer le mot de passe' })).toBeTruthy();
  });
});

describe('Inscription', () => {
  async function fill(day: string) {
    await type('E-mail', 'lou@example.fr');
    await type('Pseudo', 'Lou_42');
    await type('Jour', day);
    await type('Mois', '3');
    await type('Année', '2000');
    await type('Mot de passe', 'une phrase assez longue');
  }

  it('checks the form before calling the API', async () => {
    await render(<SignUp />);
    await type('E-mail', 'nope');
    await type('Pseudo', 'a');
    await type('Jour', '1');
    await type('Mois', '1');
    await type('Année', String(new Date().getFullYear() - 10));
    await type('Mot de passe', 'court');
    await press('Créer mon compte');
    expect(screen.getByText('Cette adresse e-mail ne semble pas valide.')).toBeTruthy();
    expect(screen.getByText(/3 à 20 caractères/)).toBeTruthy();
    expect(screen.getByText('Au moins 12 caractères.')).toBeTruthy();
    expect(screen.getByText('Il faut avoir au moins 15 ans pour créer un compte.')).toBeTruthy();
    expect(auth.signUp.email).not.toHaveBeenCalled();
  });

  it('creates the account, then asks to check the inbox', async () => {
    auth.signUp.email.mockResolvedValue({ data: { token: null, user: {} }, error: null });
    await render(<SignUp />);
    await fill('5');
    await press('Créer mon compte');
    expect(auth.signUp.email).toHaveBeenCalledWith({
      email: 'lou@example.fr',
      password: 'une phrase assez longue',
      name: 'Lou_42',
      username: 'Lou_42',
      birthDate: '2000-03-05',
      callbackURL: 'spinema-test://connexion?verifie=1',
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/verifie-ta-boite',
      params: { email: 'lou@example.fr' },
    });
  });

  it('lets the route guard take over when the session is already open', async () => {
    auth.signUp.email.mockResolvedValue({ data: { token: 'abc', user: {} }, error: null });
    await render(<SignUp />);
    await fill('5');
    await press('Créer mon compte');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows the API answer (leaked password)', async () => {
    auth.signUp.email.mockResolvedValue({ error: { code: 'PASSWORD_COMPROMISED', status: 400 } });
    await render(<SignUp />);
    await fill('5');
    await press('Créer mon compte');
    expect(await screen.findByText(/a déjà fuité sur internet/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: "J'ai déjà un compte" }));
    expect(router.replace).toHaveBeenCalledWith('/connexion');
  });
});

describe('Vérifie ta boîte mail', () => {
  it('can send the e-mail again', async () => {
    params.mockReturnValue({ email: 'lou@example.fr' });
    auth.sendVerificationEmail.mockResolvedValue({ error: null });
    await render(<CheckInbox />);
    expect(screen.getByText(/vers lou@example.fr/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', { name: 'Renvoyer l’e-mail' }));
    expect(auth.sendVerificationEmail).toHaveBeenCalledWith({
      email: 'lou@example.fr',
      callbackURL: 'spinema-test://connexion?verifie=1',
    });
    expect(await screen.findByText('C’est reparti, regarde ta boîte mail.')).toBeTruthy();
    auth.sendVerificationEmail.mockResolvedValue({ error: { status: 429 } });
    await fireEvent.press(screen.getByRole('link', { name: 'Renvoyer l’e-mail' }));
    expect(await screen.findByText('Trop d’essais, réessaie dans un moment.')).toBeTruthy();
    await press('Aller à la connexion');
    expect(router.replace).toHaveBeenCalledWith('/connexion');
  });

  it('works without the address too', async () => {
    await render(<CheckInbox />);
    expect(screen.queryByRole('link', { name: 'Renvoyer l’e-mail' })).toBeNull();
  });
});

describe('Mot de passe oublié', () => {
  it('always gives the same answer once the link is requested', async () => {
    auth.requestPasswordReset.mockResolvedValue({ data: { status: true }, error: null });
    await render(<ForgotPassword />);
    await press('Envoyer le lien');
    expect(screen.getByText('Indique l’adresse e-mail de ton compte.')).toBeTruthy();
    await type('E-mail', 'lou@example.fr');
    await press('Envoyer le lien');
    expect(auth.requestPasswordReset).toHaveBeenCalledWith({
      email: 'lou@example.fr',
      redirectTo: 'spinema-test://reinitialiser',
    });
    expect(await screen.findByText(/Si un compte existe avec cette adresse/)).toBeTruthy();
  });

  it('reports a network failure', async () => {
    auth.requestPasswordReset.mockRejectedValue(new TypeError('Network request failed'));
    await render(<ForgotPassword />);
    await type('E-mail', 'lou@example.fr');
    await press('Envoyer le lien');
    expect(await screen.findByText('Pas de connexion au serveur.')).toBeTruthy();
  });
});
