import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '@spinema/shared';

/** Handwritten link under a memo (« Mot de passe oublié ? », « Créer un compte »). */
export function TextLink({
  label,
  onPress,
  light = false,
}: {
  label: string;
  onPress: () => void;
  light?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.hit}
    >
      <Text style={[styles.text, light && styles.light]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: theme.touche.zoneMin, justifyContent: 'center', paddingHorizontal: 4 },
  text: {
    fontFamily: theme.fonts.main,
    fontSize: 21,
    color: '#7A4A00',
    textDecorationLine: 'underline',
  },
  light: { color: theme.colors.etiquette },
});
