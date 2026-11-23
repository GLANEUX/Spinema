import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Key } from '../../components/Key';
import { Memo, Note } from '../../components/Memo';
import { TextLink } from '../../components/TextLink';
import { Wall } from '../../components/Wall';
import { authClient, scheme } from '../../lib/auth';
import { attempt } from '../../lib/authErrors';

/** After sign-up: the account opens once the e-mail address is confirmed. */
export default function CheckInbox() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function resend() {
    if (!email) return;
    const error = await attempt(() =>
      authClient.sendVerificationEmail({ email, callbackURL: `${scheme}://connexion?verifie=1` }),
    );
    setMessage(
      error
        ? { text: error, ok: false }
        : { text: 'C’est reparti, regarde ta boîte mail.', ok: true },
    );
  }

  return (
    <Wall>
      <Memo title="Vérifie ta boîte mail">
        <Note>
          Un e-mail vient de partir{email ? ` vers ${email}` : ''}. Ouvre le lien qu’il contient
          pour confirmer ton adresse, puis reviens te connecter.
        </Note>
        <Note>Rien reçu ? Regarde dans les indésirables.</Note>
        {message && <Note tone={message.ok ? 'ok' : 'error'}>{message.text}</Note>}
        {email && <TextLink label="Renvoyer l’e-mail" onPress={() => void resend()} />}
      </Memo>
      <Key label="Aller à la connexion" onPress={() => router.replace('/connexion')} />
    </Wall>
  );
}
