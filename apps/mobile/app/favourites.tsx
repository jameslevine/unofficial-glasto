import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Performance } from '@glasto/shared';
import { lineupQueryKey } from '@glasto/shared';
import { PerformanceCard } from '../src/components/PerformanceCard';
import { api } from '../src/lib/api';
import { formatDay, groupByDay } from '../src/lib/format';
import { useFavourites } from '../src/store/favourites';
import { colors, radii, spacing } from '../src/lib/theme';

const YEARS = [2025, 2024, 2023, 2022] as const;

export default function FavouritesScreen() {
  const ids = useFavourites((s) => s.ids);

  const queries = useQueries({
    queries: YEARS.map((year) => ({
      queryKey: lineupQueryKey(year),
      queryFn: () => api.getLineup(year),
      staleTime: 1000 * 60 * 60,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const all = useMemo(() => queries.flatMap((q) => q.data ?? []), [queries]);
  const favourites = useMemo<Performance[]>(() => all.filter((p) => ids[p.id]), [all, ids]);
  const grouped = useMemo(() => groupByDay(favourites), [favourites]);

  if (Object.keys(ids).length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>No favourites yet</Text>
        <Text style={styles.muted}>Tap the ☆ on any act to save it here.</Text>
      </View>
    );
  }

  if (isLoading && favourites.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {grouped.map(([d, items]) => (
        <View key={d} style={styles.daySection}>
          <Text style={styles.dayHeading}>{formatDay(d)}</Text>
          <View style={styles.dayCard}>
            {items.map((p) => (
              <PerformanceCard key={p.id} performance={p} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: spacing.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  heading: { color: colors.fg, fontSize: 18, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  daySection: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.sm },
  dayHeading: { color: colors.fg, fontSize: 18, fontWeight: '600' },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
