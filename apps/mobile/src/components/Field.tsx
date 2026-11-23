import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { theme } from '@spinema/shared';

/**
 * Labelled input written on a memo. The label is a sentence (no small capitals, see the charte),
 * the error sits right under the field.
 */
export function Field({
  label,
  error,
  secret = false,
  containerStyle,
  ...input
}: {
  label: string;
  error?: string;
  secret?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
} & Omit<TextInputProps, 'secureTextEntry'>) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          placeholderTextColor="#8A8174"
          autoCorrect={false}
          {...input}
          secureTextEntry={secret && hidden}
          style={[styles.input, error ? styles.inputError : null, input.style]}
        />
        {secret && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            onPress={() => setHidden((h) => !h)}
            style={styles.eye}
          >
            <Text style={styles.eyeText}>{hidden ? 'voir' : 'cacher'}</Text>
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontFamily: theme.fonts.main, fontSize: 20, color: c.feutre },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    minHeight: theme.touche.zoneMin,
    borderWidth: 2,
    borderColor: c.feutre,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontFamily: theme.fonts.texte,
    fontSize: 16,
    color: c.feutre,
  },
  inputError: { borderColor: '#9B2C22' },
  eye: {
    minHeight: theme.touche.zoneMin,
    minWidth: theme.touche.zoneMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: { fontFamily: theme.fonts.main, fontSize: 18, color: '#7A4A00' },
  error: { fontFamily: theme.fonts.texteFort, fontSize: 14, color: '#9B2C22' },
});
