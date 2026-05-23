import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Performance, ScheduleItem } from '@glasto/shared';
import { buildSchedule, getNowNext } from '@glasto/shared';
import { useFavourites } from '../store/favourites';
import { formatTime } from '../lib/format';
import { colors, radii, spacing } from '../lib/theme';

interface Props {
  performances: Performance[];
}

const TICK_MS = 60_000;

export const NowNextBanner = ({ performances }: Props) => {
  const ids = useFavourites((s) => s.ids);
  const primaryByGroup = useFavourites((s) => s.primaryByGroup);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const days = useMemo(() => buildSchedule(performances, ids), [performances, ids]);
  const { now, next } = useMemo(
    () => getNowNext(days, nowMs, primaryByGroup),
    [days, nowMs, primaryByGroup],
  );

  if (!now && !next) return null;

  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="summary" style={styles.container}>
      <Card label="Now" item={now} accent />
      <Card label="Up next" item={next} />
    </View>
  );
};

const Card = ({
  label,
  item,
  accent = false,
}: {
  label: string;
  item: ScheduleItem | null;
  accent?: boolean;
}) => {
  if (!item) {
    return (
      <View style={[styles.card, styles.cardEmpty]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.empty}>Nothing scheduled</Text>
      </View>
    );
  }
  const { performance } = item;
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      <Text style={styles.title} numberOfLines={1}>
        {performance.title}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {formatTime(performance.startsAt)}–{formatTime(performance.endsAt)} · {performance.stage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
  },
  card: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardEmpty: {
    borderStyle: 'dashed',
  },
  cardAccent: {
    borderColor: colors.brand,
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 2,
  },
  labelAccent: {
    color: colors.brand,
  },
  title: {
    color: colors.fg,
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
});
