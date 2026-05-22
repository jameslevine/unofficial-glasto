import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Performance, Stage } from '@glasto/shared';
import { lineupQueryKey, useStages, walkingMinutes } from '@glasto/shared';
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

  const { data: stages } = useStages(api);
  const stageBySlug = useMemo(() => {
    const map = new Map<string, Stage>();
    stages?.forEach((s) => {
      map.set(s.slug, s);
      map.set(s.name.toLowerCase().replace(/\s+/g, '-'), s);
    });
    return map;
  }, [stages]);
  const findStage = (perf: Performance): Stage | undefined =>
    stageBySlug.get(perf.stage.toLowerCase().replace(/\s+/g, '-'));

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
            {items.map((p, i) => {
              const prev = items[i - 1];
              const fromStage = prev ? findStage(prev) : undefined;
              const toStage = findStage(p);
              const minutes =
                prev &&
                fromStage?.lat != null &&
                fromStage?.lon != null &&
                toStage?.lat != null &&
                toStage?.lon != null
                  ? walkingMinutes(
                      { lat: fromStage.lat, lon: fromStage.lon },
                      { lat: toStage.lat, lon: toStage.lon },
                    )
                  : null;
              return (
                <View key={p.id}>
                  {minutes !== null && minutes > 0 && (
                    <Text style={styles.walkLine}>
                      ↳ ~{minutes} min walk from {prev?.stage}
                    </Text>
                  )}
                  <PerformanceCard performance={p} />
                </View>
              );
            })}
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
  walkLine: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
