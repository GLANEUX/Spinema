import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@spinema/shared';
import { Logo } from './Logo';
import { variantLabel } from '../lib/variant';

/** The video club wall behind the forms: logo, préprod scotch, scrollable content. */
export function Wall({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.wall}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo />
          {variantLabel && <Text style={styles.tape}>{variantLabel}</Text>}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  wall: { flex: 1, backgroundColor: c.mur },
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 16,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  tape: {
    fontFamily: theme.fonts.feutre,
    fontSize: 15,
    color: c.feutre,
    backgroundColor: c.scotch,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '-2deg' }],
  },
});
