import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@spinema/shared';
import { Key } from '../components/Key';
import { Field } from '../components/Field';
import { Memo, Note } from '../components/Memo';
import { TextLink } from '../components/TextLink';
import { Toggle } from '../components/Toggle';
import { Wall } from '../components/Wall';
import { authClient } from '../lib/auth';
import { attempt } from '../lib/authErrors';
import { loadSound, saveSound } from '../lib/settings';

/** « Moi » (mockup, profile): member card, settings memo, sign-out and account deletion. */
export default function Me() {
  const { data } = authClient.useSession();
  const user = data?.user as
    { email?: string; username?: string; displayUsername?: string } | undefined;
  const [sound, setSound] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadSound().then(setSound);
  }, []);

  function toggleSound(on: boolean) {
    setSound(on);
    void saveSound(on);
  }

  async function signOut() {
    setBusy(true);
    // The route guard sends back to the sign-in screen once the session is gone.
    setError(await attempt(() => authClient.signOut()));
    setBusy(false);
  }

  async function deleteAccount() {
    if (!password) return setError('Tape ton mot de passe pour confirmer.');
    setBusy(true);
    const message = await attempt(() => authClient.deleteUser({ password }));
    setBusy(false);
    setError(message);
  }

  return (
    <Wall>
      <View
        style={styles.card}
        accessible
        accessibilityLabel={`Carte de membre de ${user?.displayUsername ?? user?.username ?? ''}`}
      >
        <Text style={styles.name}>{user?.displayUsername ?? user?.username ?? '…'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Memo title="Réglages">
        <Toggle
          label="Effets sonores"
          value={sound}
          onChange={toggleSound}
          onText="activés"
          offText="coupés"
        />
      </Memo>

      {deleting ? (
        <Memo title="Supprimer mon compte" tilt={-0.6}>
          <Note>C’est définitif. Seront supprimés :</Note>
          <Note>· ton compte, ton étagère, tes collections et tes films vus ;</Note>
          <Note>· les films que tu as partagés et tes ajouts dans les salons ;</Note>
          <Note>· les salons dont tu es propriétaire, pour tous leurs membres.</Note>
          <Field
            label="Ton mot de passe, pour confirmer"
            value={password}
            onChangeText={setPassword}
            secret
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
          />
          {error && <Note tone="error">{error}</Note>}
          <Key
            label="Supprimer définitivement"
            tone="red"
            onPress={() => void deleteAccount()}
            busy={busy}
          />
          <TextLink
            label="Annuler"
            onPress={() => {
              setDeleting(false);
              setPassword('');
              setError(null);
            }}
          />
        </Memo>
      ) : (
        <View style={styles.account}>
          {error && <Note tone="error">{error}</Note>}
          <Key label="Se déconnecter" tone="dark" onPress={() => void signOut()} busy={busy} />
          <Key label="Supprimer mon compte" tone="red" onPress={() => setDeleting(true)} />
        </View>
      )}

      <TextLink label="Retour à la machine" light onPress={() => router.back()} />
    </Wall>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: c.polaroid,
    padding: 16,
    gap: 2,
    transform: [{ rotate: '-1deg' }],
    elevation: 4,
  },
  name: { fontFamily: theme.fonts.feutre, fontSize: 26, color: c.feutre },
  email: { fontFamily: theme.fonts.texte, fontSize: 15, color: '#4A443C' },
  account: { alignSelf: 'stretch', gap: 12 },
});
