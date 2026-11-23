import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '@spinema/shared';

type Tone = 'big' | 'dark' | 'red' | 'green';

const TONES: Record<Tone, { face: string; edge: string; ink: string }> = {
  big: { face: theme.colors.moutarde, edge: theme.colors.moutardeOmbre, ink: theme.colors.feutre },
  dark: { face: '#34302D', edge: '#0E0C0B', ink: theme.colors.etiquette },
  red: { face: theme.colors.rouge, edge: '#6E2C25', ink: theme.colors.etiquette },
  green: { face: theme.colors.bleuVert, edge: '#3E6764', ink: theme.colors.etagere },
};

/** Physical key of the charte: a block with relief that sinks when pressed. */
export function Key({
  label,
  onPress,
  tone = 'big',
  disabled = false,
  busy = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  busy?: boolean;
  accessibilityHint?: string;
}) {
  const [down, setDown] = useState(false);
  const t = TONES[tone];
  const relief = down ? 2 : theme.touche.relief;
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[
        styles.key,
        {
          backgroundColor: t.face,
          borderBottomColor: t.edge,
          borderBottomWidth: relief,
          marginTop: theme.touche.relief - relief,
          opacity: off ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: t.ink }]}>{busy ? '…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: {
    minHeight: theme.touche.zoneMin,
    borderRadius: theme.touche.rayon,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  label: { fontFamily: theme.fonts.imprime, fontSize: 17, textAlign: 'center' },
});
