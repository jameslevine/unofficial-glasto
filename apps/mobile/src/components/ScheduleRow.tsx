import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ScheduleItem } from '@glasto/shared';
import { colors, radii, spacing } from '../lib/theme';
import { formatTime } from '../lib/format';
import { useFavourites } from '../store/favourites';
import { sharePerformance } from '../lib/ics';
import { PlayPreviewButton } from './PlayPreviewButton';

interface Props {
  item: ScheduleItem;
  gapMinutes: number | null;
  walkMinutes: number | null;
  fromStage: string | null;
  previewUrl?: string | null;
}

const ScheduleRowInner = ({ item, gapMinutes, walkMinutes, fromStage, previewUrl }: Props) => {
  const { performance, conflictGroupId } = item;
  const router = useRouter();
  const toggle = useFavourites((s) => s.toggle);
  const setPrimary = useFavourites((s) => s.setPrimary);
  const primaryByGroup = useFavourites((s) => s.primaryByGroup);

  const inConflict = conflictGroupId !== null;
  const primaryId = inConflict ? primaryByGroup[conflictGroupId] : undefined;
  const isPrimary = inConflict && primaryId === performance.id;
  const isSecondary = inConflict && !!primaryId && primaryId !== performance.id;

  const goToArtist = () => {
    if (!performance.artistSlug) return;
    router.push({
      pathname: '/artists/[slug]',
      params: { slug: performance.artistSlug, name: performance.title },
    });
  };

  return (
    <View>
      {gapMinutes !== null && gapMinutes > 0 && (
        <Text style={styles.gapLine}>
          ↳ {gapMinutes} min gap
          {walkMinutes !== null && walkMinutes > 0 && fromStage
            ? ` · ~${walkMinutes} min walk from ${fromStage}`
            : ''}
        </Text>
      )}
      <View
        style={[styles.row, inConflict && styles.rowConflict, isSecondary && styles.rowSecondary]}
      >
        <View style={styles.timeCol}>
          <Text style={styles.time}>{formatTime(performance.startsAt)}</Text>
          <Text style={styles.timeMuted}>{formatTime(performance.endsAt)}</Text>
        </View>
        {performance.artistSlug ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${performance.title}`}
            onPress={goToArtist}
            style={({ pressed }) => [styles.body, pressed && styles.bodyPressed]}
          >
            <Text style={styles.title} numberOfLines={2}>
              {performance.title}
            </Text>
            <Text style={styles.stage} numberOfLines={1}>
              {performance.stage}
              <Text style={styles.dot}> · </Text>
              <Text style={styles.area}>{performance.area}</Text>
            </Text>
            {inConflict && (
              <View style={styles.pillRow}>
                {isPrimary ? (
                  <Text style={[styles.pill, styles.pillPrimary]}>Primary</Text>
                ) : isSecondary ? (
                  <Text style={[styles.pill, styles.pillSecondary]}>Secondary</Text>
                ) : null}
              </View>
            )}
          </Pressable>
        ) : (
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>
              {performance.title}
            </Text>
            <Text style={styles.stage} numberOfLines={1}>
              {performance.stage}
              <Text style={styles.dot}> · </Text>
              <Text style={styles.area}>{performance.area}</Text>
            </Text>
          </View>
        )}
        <View style={styles.actionsCol}>
          <PlayPreviewButton id={performance.id} previewUrl={previewUrl} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove favourite"
            accessibilityState={{ selected: true }}
            onPress={() => toggle(performance.id)}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Text style={[styles.star, styles.starOn]}>★</Text>
          </Pressable>
          {inConflict && !isPrimary && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Make primary"
              onPress={() => setPrimary(conflictGroupId, performance.id)}
              style={styles.makePrimaryBtn}
            >
              <Text style={styles.makePrimaryText}>Primary</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add to calendar"
            onPress={() => {
              void sharePerformance(performance);
            }}
            hitSlop={8}
            style={styles.calBtn}
          >
            <Text style={styles.calLabel}>📅</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export const ScheduleRow = memo(
  ScheduleRowInner,
  (prev, next) =>
    prev.item.performance.id === next.item.performance.id &&
    prev.item.conflictGroupId === next.item.conflictGroupId &&
    prev.gapMinutes === next.gapMinutes &&
    prev.walkMinutes === next.walkMinutes &&
    prev.previewUrl === next.previewUrl,
);

const styles = StyleSheet.create({
  gapLine: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  rowConflict: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  rowSecondary: { opacity: 0.65 },
  timeCol: { width: 56 },
  time: { color: colors.fg, fontVariant: ['tabular-nums'], fontWeight: '600' },
  timeMuted: { color: colors.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  body: { flex: 1 },
  bodyPressed: { opacity: 0.6 },
  title: { color: colors.fg, fontSize: 15, fontWeight: '600' },
  stage: { color: colors.muted, fontSize: 12, marginTop: 2 },
  dot: { color: colors.border },
  area: { color: colors.muted },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pill: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  pillPrimary: {
    backgroundColor: colors.accent,
    color: colors.brandFg,
  },
  pillSecondary: {
    backgroundColor: colors.surface2,
    color: colors.muted,
  },
  actionsCol: { alignItems: 'flex-end', gap: spacing.xs },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: { color: colors.muted, fontSize: 22 },
  starOn: { color: colors.brand },
  makePrimaryBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  makePrimaryText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  calBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calLabel: { fontSize: 16 },
});
