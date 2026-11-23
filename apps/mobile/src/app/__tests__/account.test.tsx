import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authClient } from '../../lib/auth';
import { saveSound } from '../../lib/settings';
import ResetPassword from '../reinitialiser';
import Me from '../moi';

jest.mock('../../lib/auth', () => ({
  scheme: 'spinema-test',
  authClient: {
    resetPassword: jest.fn(),
    signOut: jest.fn(),
    deleteUser: jest.fn(),
    useSession: jest.fn(() => ({
      data: { user: { email: 'lou@example.fr', username: 'lou_42', displayUsername: 'Lou_42' } },
    })),
  },
}));
jest.mock('../../lib/settings', () => ({
  loadSound: jest.fn(async () => false),
  saveSound: jest.fn(async () => undefined),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

const auth = authClient as unknown as {
  resetPassword: jest.Mock;
  signOut: jest.Mock;
  deleteUser: jest.Mock;
};
const params = useLocalSearchParams as jest.Mock;
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);
const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
  params.mockReturnValue({});
});

describe('Nouveau mot de passe', () => {
  it('needs a token from the e-mail', async () => {
    await render(<ResetPassword />);
    expect(screen.getByText('Ce lien a expiré ou a déjà servi. Redemande un e-mail.')).toBeTruthy();
    await press('Aller à la connexion');
    expect(router.replace).toHaveBeenCalledWith('/connexion');
  });

  it('checks both passwords, then saves the new one', async () => {
    params.mockReturnValue({ token: 'tok' });
    auth.resetPassword.mockResolvedValue({ data: { status: true }, error: null });
    await render(<ResetPassword />);
    await type('Nouveau mot de passe', 'court');
    await press('Enregistrer');
    expect(screen.getByText('Au moins 12 caractères.')).toBeTruthy();
    await type('Nouveau mot de passe', 'une phrase assez longue');
    await type('Encore une fois', 'une autre phrase longue');
    await press('Enregistrer');
    expect(screen.getByText('Les deux mots de passe ne sont pas identiques.')).toBeTruthy();
    await type('Encore une fois', 'une phrase assez longue');
    await press('Enregistrer');
    expect(auth.resetPassword).toHaveBeenCalledWith({
      newPassword: 'une phrase assez longue',
      token: 'tok',
    });
    expect(await screen.findByText(/tes autres appareils ont été déconnectés/)).toBeTruthy();
  });

  it('explains an expired link', async () => {
    params.mockReturnValue({ token: 'tok' });
    auth.resetPassword.mockResolvedValue({ error: { code: 'INVALID_TOKEN', status: 400 } });
    await render(<ResetPassword />);
    await type('Nouveau mot de passe', 'une phrase assez longue');
    await type('Encore une fois', 'une phrase assez longue');
    await press('Enregistrer');
    expect(await screen.findByText(/Ce lien a expiré/)).toBeTruthy();
  });
});

describe('Moi', () => {
  it('shows the member and remembers the sound setting', async () => {
    await render(<Me />);
    expect(screen.getByText('Lou_42')).toBeTruthy();
    expect(screen.getByText('lou@example.fr')).toBeTruthy();
    const toggle = await screen.findByRole('switch', { name: 'Effets sonores' });
    expect(screen.getByText('coupés')).toBeTruthy();
    await fireEvent.press(toggle);
    expect(saveSound).toHaveBeenCalledWith(true);
    expect(screen.getByText('activés')).toBeTruthy();
  });

  it('signs out', async () => {
    auth.signOut.mockResolvedValue({ data: { success: true }, error: null });
    await render(<Me />);
    await press('Se déconnecter');
    expect(auth.signOut).toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('link', { name: 'Retour à la machine' }));
    expect(router.back).toHaveBeenCalled();
  });

  it('deletes the account only after confirming with the password', async () => {
    auth.deleteUser.mockResolvedValueOnce({ error: { code: 'INVALID_PASSWORD', status: 400 } });
    auth.deleteUser.mockResolvedValueOnce({ data: { success: true }, error: null });
    await render(<Me />);
    await press('Supprimer mon compte');
    expect(screen.getByText(/les salons dont tu es propriétaire/)).toBeTruthy();
    await press('Supprimer définitivement');
    expect(screen.getByText('Tape ton mot de passe pour confirmer.')).toBeTruthy();
    expect(auth.deleteUser).not.toHaveBeenCalled();
    await type('Ton mot de passe, pour confirmer', 'mauvais');
    await press('Supprimer définitivement');
    expect(await screen.findByText('E-mail ou mot de passe incorrect.')).toBeTruthy();
    await type('Ton mot de passe, pour confirmer', 'une phrase assez longue');
    await press('Supprimer définitivement');
    expect(auth.deleteUser).toHaveBeenLastCalledWith({ password: 'une phrase assez longue' });
  });

  it('can cancel the deletion', async () => {
    await render(<Me />);
    await press('Supprimer mon compte');
    await fireEvent.press(screen.getByRole('link', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeTruthy();
  });
});
