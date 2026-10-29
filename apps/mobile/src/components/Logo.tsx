import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@spinema/shared';

const STRIPES = [
  theme.colors.rouge,
  theme.colors.orange,
  theme.colors.moutarde,
  theme.colors.bleuVert,
];

/** Striped block + SPINEMA wordmark (design/charte-graphique.html, « Logo »). */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Spinema">
      <View
        style={[
          styles.stripes,
          { width: size * 1.02, height: size * 0.7, marginRight: size * 0.26 },
        ]}
      >
        {STRIPES.map((c) => (
          <View key={c} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      <Text style={[styles.word, { fontSize: size }]}>SPINEMA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  stripes: { transform: [{ skewX: '-14deg' }] },
  word: { fontFamily: theme.fonts.imprime, color: theme.colors.etiquette, letterSpacing: -0.3 },
});
