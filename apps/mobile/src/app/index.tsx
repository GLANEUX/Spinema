import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@spinema/shared';
import { Logo } from '../components/Logo';
import { API_URL, fetchHealth } from '../lib/api';
import { variantLabel } from '../lib/variant';

type Status = 'loading' | 'up' | 'down';
const LCD: Record<Status, string> = { loading: '◀◀ REW', up: '▶ PLAY', down: '⏏ EJECT' };

/** Step 1 screen: proves the app runs, loads the fonts and reaches the API. */
export default function Home() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const ctrl = new AbortController();
    fetchHealth(ctrl.signal)
      .then((h) => setStatus(h.status === 'ok' ? 'up' : 'down'))
      .catch(() => setStatus('down'));
    return () => ctrl.abort();
  }, []);

  return (
    <SafeAreaView style={styles.wall}>
      <Logo />
      {variantLabel && <Text style={styles.tape}>{variantLabel}</Text>}
      <View style={styles.tv}>
        <View style={styles.screen}>
          <Text style={styles.scribble}>
            {status === 'down' ? 'La bande a sauté.' : 'Le magnéto est branché.'}
          </Text>
        </View>
      </View>
      <View style={styles.vcr}>
        <Text style={styles.lcd} accessibilityLabel={`API : ${status}`}>
          {LCD[status]}
        </Text>
      </View>
      <Text style={styles.hand}>{API_URL}</Text>
    </SafeAreaView>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  wall: {
    flex: 1,
    backgroundColor: c.mur,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 16,
  },
  tv: { width: 260, backgroundColor: c.plastiqueClair, borderRadius: 16, padding: 12 },
  screen: {
    aspectRatio: 4 / 3,
    borderRadius: 22,
    backgroundColor: c.etagere,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  scribble: {
    fontFamily: theme.fonts.feutre,
    fontSize: 22,
    color: c.etiquette,
    textAlign: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  vcr: {
    width: 240,
    backgroundColor: c.plastique,
    borderRadius: 4,
    padding: 8,
    alignItems: 'flex-end',
  },
  lcd: {
    fontFamily: theme.fonts.led,
    fontSize: 14,
    color: c.led,
    backgroundColor: c.ledFond,
    paddingHorizontal: 8,
    paddingVertical: 5,
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
  hand: { fontFamily: theme.fonts.main, fontSize: 18, color: c.poussiere },
});
