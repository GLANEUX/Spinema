import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@spinema/shared';

/** Paper note pinned to the wall (mockup « Moi »): the support of every form. */
export function Memo({
  title,
  children,
  tilt = 0.8,
}: {
  title?: string;
  children: ReactNode;
  tilt?: number;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pin} />
      <View style={[styles.memo, { transform: [{ rotate: `${tilt}deg` }] }]}>
        {title && (
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        )}
        {children}
      </View>
    </View>
  );
}

/** Short handwritten-looking sentence on a memo, or an error/success line. */
export function Note({
  children,
  tone = 'plain',
}: {
  children: ReactNode;
  tone?: 'plain' | 'error' | 'ok';
}) {
  return (
    <Text
      style={[styles.note, tone === 'error' && styles.error, tone === 'ok' && styles.ok]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion={tone === 'plain' ? 'none' : 'polite'}
    >
      {children}
    </Text>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center' },
  pin: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: c.bleuVert,
    marginBottom: -7,
    zIndex: 1,
    elevation: 3,
  },
  memo: {
    alignSelf: 'stretch',
    backgroundColor: c.papier,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
  },
  title: { fontFamily: theme.fonts.feutre, fontSize: 24, color: c.feutre },
  note: { fontFamily: theme.fonts.texte, fontSize: 15, lineHeight: 21, color: '#4A443C' },
  error: { color: '#9B2C22', fontFamily: theme.fonts.texteFort },
  ok: { color: '#2F5F5C', fontFamily: theme.fonts.texteFort },
});
