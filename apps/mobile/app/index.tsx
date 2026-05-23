import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../src/lib/theme';
import { useCognitoAuth } from '../src/hooks/useCognitoAuth';
import { useFavouritesSync } from '../src/hooks/useFavouritesSync';
import { usePinsSync } from '../src/hooks/usePinsSync';
import { isAuthConfigured } from '../src/lib/auth';

const YEARS = [2025, 2024, 2023, 2022] as const;

export default function HomeScreen() {
  const auth = useCognitoAuth();
  useFavouritesSync(auth.signedIn);
  usePinsSync(auth.signedIn);
  const showAuth = isAuthConfigured();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {showAuth && (
        <Pressable
          style={styles.authBtn}
          onPress={auth.signedIn ? auth.signOut : auth.signIn}
          disabled={auth.loading}
        >
          <Text style={styles.authLabel}>
            {auth.loading ? '…' : auth.signedIn ? 'Sign out' : 'Sign in'}
          </Text>
        </Pressable>
      )}
      <Text style={styles.heading}>Pick a year</Text>
      <View style={styles.grid}>
        {YEARS.map((y) => (
          <Link key={y} href={`/lineup/${y}`} asChild>
            <Pressable style={styles.tile}>
              <Text style={styles.tileNumber}>{y}</Text>
              <Text style={styles.tileLabel}>Glastonbury</Text>
            </Pressable>
          </Link>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Link href="/map" asChild>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionLabel}>Map</Text>
          </Pressable>
        </Link>
        <Link href="/favourites" asChild>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionLabel}>★ Favourites</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.footer}>
        Unofficial — fan-made. Lineup data from glastonburyfestivals.co.uk. Not affiliated with
        Glastonbury Festival.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  heading: { color: colors.fg, fontSize: 22, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  tileNumber: { color: colors.brand, fontSize: 32, fontWeight: '700' },
  tileLabel: { color: colors.muted, fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  actionLabel: { color: colors.fg, fontSize: 15, fontWeight: '600' },
  footer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.lg },
  authBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  authLabel: { color: colors.fg, fontSize: 13, fontWeight: '600' },
});
