import * as SecureStore from 'expo-secure-store';

const SOUND_KEY = 'spinema_sound';

/** Machine sound effects: on by default (PLAN.md §10), remembered on the phone. */
export async function loadSound(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(SOUND_KEY)) !== 'off';
  } catch {
    return true;
  }
}

export async function saveSound(on: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    // Not critical: the setting simply won't survive a restart.
  }
}
