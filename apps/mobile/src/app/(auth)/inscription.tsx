import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@spinema/shared';
import { Key } from '../../components/Key';
import { Field } from '../../components/Field';
import { Memo, Note } from '../../components/Memo';
import { TextLink } from '../../components/TextLink';
import { Wall } from '../../components/Wall';
import { authClient, scheme } from '../../lib/auth';
import { attempt } from '../../lib/authErrors';
import { checkSignUp, toIsoDate, type SignUpErrors } from '../../lib/accountRules';

/** Sign-up: e-mail, pseudo, birth date (15 years minimum), password of 12 characters or more. */
export default function SignUp() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const birth = { day: day.trim(), month: month.trim(), year: year.trim() };
    const found = checkSignUp({ email, username, password, birth });
    setErrors(found);
    setError(null);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    let signedIn = false;
    const message = await attempt(async () => {
      const result = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: username.trim(),
        username: username.trim(),
        birthDate: toIsoDate(birth) as string,
        callbackURL: `${scheme}://connexion?verifie=1`,
      });
      signedIn = Boolean(result?.data && 'token' in result.data && result.data.token);
      return result;
    });
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    // Without e-mail verification (staging), the session is already open: the guard takes over.
    if (!signedIn) {
      router.replace({ pathname: '/verifie-ta-boite', params: { email: email.trim() } });
    }
  }

  return (
    <Wall>
      <Memo title="Carte de membre">
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label="Pseudo"
          value={username}
          onChangeText={setUsername}
          error={errors.username}
          autoCapitalize="none"
          autoComplete="username-new"
          textContentType="username"
        />
        <View style={styles.birth} accessible={false}>
          <Text style={styles.birthLabel}>Date de naissance</Text>
          <View style={styles.birthRow}>
            <Field
              label="Jour"
              value={day}
              onChangeText={setDay}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="JJ"
              containerStyle={styles.part}
              autoComplete="birthdate-day"
            />
            <Field
              label="Mois"
              value={month}
              onChangeText={setMonth}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              containerStyle={styles.part}
              autoComplete="birthdate-month"
            />
            <Field
              label="Année"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="AAAA"
              containerStyle={styles.year}
              autoComplete="birthdate-year"
            />
          </View>
          {errors.birth && <Note tone="error">{errors.birth}</Note>}
          <Note>Elle reste privée : personne d'autre ne la voit.</Note>
        </View>
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secret
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Note>
          12 caractères minimum. Une phrase facile à retenir fait un très bon mot de passe.
        </Note>
        {error && <Note tone="error">{error}</Note>}
      </Memo>
      <Key label="Créer mon compte" onPress={() => void submit()} busy={busy} />
      <TextLink label="J'ai déjà un compte" light onPress={() => router.replace('/connexion')} />
    </Wall>
  );
}

const styles = StyleSheet.create({
  birth: { gap: 4 },
  birthLabel: { fontFamily: theme.fonts.main, fontSize: 20, color: theme.colors.feutre },
  birthRow: { flexDirection: 'row', gap: 8 },
  part: { flex: 1 },
  year: { flex: 1.6 },
});
