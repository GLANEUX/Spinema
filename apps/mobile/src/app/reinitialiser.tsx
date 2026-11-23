import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Key } from '../components/Key';
import { Field } from '../components/Field';
import { Memo, Note } from '../components/Memo';
import { Wall } from '../components/Wall';
import { authClient } from '../lib/auth';
import { attempt, authErrorMessage } from '../lib/authErrors';
import { checkPassword } from '../lib/accountRules';

/**
 * Opened from the reset e-mail (`<scheme>://reinitialiser?token=…`). Outside the sign-in guard:
 * the link must work whether or not a session is open on the phone.
 */
export default function ResetPassword() {
  const params = useLocalSearchParams<{ token?: string; error?: string }>();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState<string | null>(
    params.error || !params.token ? authErrorMessage({ code: 'INVALID_TOKEN', status: 400 }) : null,
  );
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const usable = Boolean(params.token) && !params.error;

  async function submit() {
    const invalid = checkPassword(password);
    if (invalid) return setError(invalid);
    if (password !== again) return setError('Les deux mots de passe ne sont pas identiques.');
    setBusy(true);
    const message = await attempt(() =>
      authClient.resetPassword({ newPassword: password, token: params.token as string }),
    );
    setBusy(false);
    setError(message);
    setDone(!message);
  }

  return (
    <Wall>
      <Memo title="Nouveau mot de passe">
        {done ? (
          <Note tone="ok">C’est fait. Par sécurité, tes autres appareils ont été déconnectés.</Note>
        ) : (
          usable && (
            <>
              <Field
                label="Nouveau mot de passe"
                value={password}
                onChangeText={setPassword}
                secret
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Field
                label="Encore une fois"
                value={again}
                onChangeText={setAgain}
                secret
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Note>12 caractères minimum.</Note>
            </>
          )
        )}
        {error && <Note tone="error">{error}</Note>}
      </Memo>
      {done || !usable ? (
        <Key label="Aller à la connexion" onPress={() => router.replace('/connexion')} />
      ) : (
        <Key label="Enregistrer" onPress={() => void submit()} busy={busy} />
      )}
    </Wall>
  );
}
