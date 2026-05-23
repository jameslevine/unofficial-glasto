import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ArtistSummary, Performance, Stage } from '@glasto/shared';
import {
  artistSummaryQueryKey,
  buildSchedule,
  lineupQueryKey,
  useStages,
  walkingMinutes,
} from '@glasto/shared';
import { ScheduleRow } from '../src/components/ScheduleRow';
import { api } from '../src/lib/api';
import { formatDay } from '../src/lib/format';
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

  const summaryQueries = useQueries({
    queries: YEARS.map((year) => ({
      queryKey: artistSummaryQueryKey(year),
      queryFn: () => api.getArtistSummary(year),
      staleTime: 1000 * 60 * 60 * 24,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const all = useMemo(() => queries.flatMap((q) => q.data ?? []), [queries]);
  const favourites = useMemo<Performance[]>(() => all.filter((p) => ids[p.id]), [all, ids]);
  const days = useMemo(() => buildSchedule(favourites, ids), [favourites, ids]);

  const slugPreview = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const q of summaryQueries) {
      const data = q.data as ArtistSummary[] | undefined;
      if (!data) continue;
      for (const a of data) map.set(a.slug, a.previewUrl);
    }
    return map;
  }, [summaryQueries]);

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
      {days.map(({ day, items }) => (
        <View key={day} style={styles.daySection}>
          <Text style={styles.dayHeading}>{formatDay(day)}</Text>
          <View style={styles.dayCard}>
            {items.map((item, i) => {
              const prev = items[i - 1];
              const gapMinutes = prev
                ? Math.max(0, Math.round((item.startMs - prev.endMs) / 60000))
                : null;
              const fromStage = prev ? findStage(prev.performance) : undefined;
              const toStage = findStage(item.performance);
              const walkMinutes =
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
                <ScheduleRow
                  key={item.performance.id}
                  item={item}
                  gapMinutes={gapMinutes}
                  walkMinutes={walkMinutes}
                  fromStage={prev?.performance.stage ?? null}
                  previewUrl={
                    item.performance.artistSlug
                      ? (slugPreview.get(item.performance.artistSlug) ?? null)
                      : null
                  }
                />
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
});
