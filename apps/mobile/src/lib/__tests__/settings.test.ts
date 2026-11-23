import * as SecureStore from 'expo-secure-store';
import { loadSound, saveSound } from '../settings';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const store = SecureStore as jest.Mocked<typeof SecureStore>;

describe('sound setting', () => {
  it('is on by default and remembers when it is turned off', async () => {
    store.getItemAsync.mockResolvedValueOnce(null);
    expect(await loadSound()).toBe(true);
    store.getItemAsync.mockResolvedValueOnce('off');
    expect(await loadSound()).toBe(false);
    await saveSound(false);
    expect(store.setItemAsync).toHaveBeenCalledWith('spinema_sound', 'off');
  });

  it('falls back to on when the store fails, and ignores save errors', async () => {
    store.getItemAsync.mockRejectedValueOnce(new Error('keystore'));
    expect(await loadSound()).toBe(true);
    store.setItemAsync.mockRejectedValueOnce(new Error('keystore'));
    await expect(saveSound(true)).resolves.toBeUndefined();
  });
});
