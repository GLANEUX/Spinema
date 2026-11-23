import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@spinema/shared';

/** Switch line of the « Réglages » memo (mockup `.tog`): label, state, and the switch. */
export function Toggle({
  label,
  value,
  onChange,
  onText,
  offText,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  onText: string;
  offText: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.state}>{value ? onText : offText}</Text>
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  texts: { flexShrink: 1 },
  label: { fontFamily: theme.fonts.texteFort, fontSize: 16, color: c.feutre },
  state: { fontFamily: theme.fonts.texte, fontSize: 13, color: '#5F564C' },
  track: { width: 52, height: 30, borderRadius: 15, backgroundColor: '#C9BFAE', padding: 3 },
  trackOn: { backgroundColor: c.bleuVert },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  knobOn: { transform: [{ translateX: 22 }] },
});
