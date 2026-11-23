import { useState } from 'react';
import { router } from 'expo-router';
import { Key } from '../../components/Key';
import { Field } from '../../components/Field';
import { Memo, Note } from '../../components/Memo';
import { TextLink } from '../../components/TextLink';
import { Wall } from '../../components/Wall';
import { authClient, scheme } from '../../lib/auth';
import { attempt } from '../../lib/authErrors';

/**
 * Asks for a reset link. The answer is the same whether the address has an account or not,
 * so nobody can find out who is registered (PLAN.md §8).
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim().includes('@')) {
      setError('Indique l’adresse e-mail de ton compte.');
      return;
    }
    setBusy(true);
    const message = await attempt(() =>
      authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${scheme}://reinitialiser`,
      }),
    );
    setBusy(false);
    setError(message);
    setSent(!message);
  }

  return (
    <Wall>
      <Memo title="Mot de passe oublié">
        {sent ? (
          <Note tone="ok">
            Si un compte existe avec cette adresse, un e-mail vient de partir. Le lien est valable 1
            heure et ne sert qu’une fois.
          </Note>
        ) : (
          <>
            <Note>
              Indique ton e-mail : tu recevras un lien pour choisir un nouveau mot de passe.
            </Note>
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              onSubmitEditing={() => void submit()}
            />
          </>
        )}
        {error && <Note tone="error">{error}</Note>}
      </Memo>
      {!sent && <Key label="Envoyer le lien" onPress={() => void submit()} busy={busy} />}
      <TextLink label="Retour à la connexion" light onPress={() => router.replace('/connexion')} />
    </Wall>
  );
}
