import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Key } from '../../components/Key';
import { Field } from '../../components/Field';
import { Memo, Note } from '../../components/Memo';
import { TextLink } from '../../components/TextLink';
import { Wall } from '../../components/Wall';
import { authClient } from '../../lib/auth';
import { attempt } from '../../lib/authErrors';

/** Sign-in with e-mail or pseudo (docs/comptes.md). The route guard opens the app once signed in. */
export default function SignIn() {
  const { verifie } = useLocalSearchParams<{ verifie?: string }>();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const id = identifier.trim();
    if (!id || !password) {
      setError('Remplis ton e-mail (ou ton pseudo) et ton mot de passe.');
      return;
    }
    setBusy(true);
    setError(
      await attempt(() =>
        id.includes('@')
          ? authClient.signIn.email({ email: id, password })
          : authClient.signIn.username({ username: id, password }),
      ),
    );
    setBusy(false);
  }

  return (
    <Wall>
      <Memo title="Bon retour">
        {verifie === '1' && <Note tone="ok">Ton e-mail est confirmé, tu peux te connecter.</Note>}
        <Field
          label="E-mail ou pseudo"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="username"
          textContentType="username"
        />
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secret
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => void submit()}
        />
        {error && <Note tone="error">{error}</Note>}
        <TextLink
          label="Mot de passe oublié ?"
          onPress={() => router.push('/mot-de-passe-oublie')}
        />
      </Memo>
      <Key label="Entrer" onPress={() => void submit()} busy={busy} />
      <TextLink label="Créer un compte" light onPress={() => router.push('/inscription')} />
    </Wall>
  );
}
