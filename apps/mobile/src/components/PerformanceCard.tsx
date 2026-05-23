import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Performance } from '@glasto/shared';
import { colors, radii, spacing } from '../lib/theme';
import { formatTime } from '../lib/format';
import { useFavourites } from '../store/favourites';
import { PlayPreviewButton } from './PlayPreviewButton';

interface Props {
  performance: Performance;
  previewUrl?: string | null;
}

const PerformanceCardInner = ({ performance, previewUrl }: Props) => {
  const isFav = useFavourites((s) => Boolean(s.ids[performance.id]));
  const toggle = useFavourites((s) => s.toggle);
  const router = useRouter();

  const goToArtist = () => {
    if (!performance.artistSlug) return;
    router.push({
      pathname: '/artists/[slug]',
      params: { slug: performance.artistSlug, name: performance.title },
    });
  };

  const Body = (
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
  );

  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatTime(performance.startsAt)}</Text>
        <Text style={styles.timeMuted}>{formatTime(performance.endsAt)}</Text>
      </View>
      {performance.artistSlug ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open ${performance.title}`}
          onPress={goToArtist}
          style={({ pressed }) => [styles.bodyTouchable, pressed && styles.bodyTouchablePressed]}
        >
          {Body}
        </Pressable>
      ) : (
        Body
      )}
      <View style={styles.actionsCol}>
        <PlayPreviewButton id={performance.id} previewUrl={previewUrl} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFav ? 'Remove favourite' : 'Add favourite'}
          accessibilityState={{ selected: isFav }}
          onPress={() => toggle(performance.id)}
          hitSlop={8}
          style={styles.starBtn}
        >
          <Text style={[styles.star, isFav && styles.starOn]}>{isFav ? '★' : '☆'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const PerformanceCard = memo(
  PerformanceCardInner,
  (prev, next) =>
    prev.performance.id === next.performance.id && prev.previewUrl === next.previewUrl,
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  timeCol: { width: 56 },
  time: { color: colors.fg, fontVariant: ['tabular-nums'], fontWeight: '600' },
  timeMuted: { color: colors.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  body: { flex: 1 },
  bodyTouchable: { flex: 1 },
  bodyTouchablePressed: { opacity: 0.6 },
  title: { color: colors.fg, fontSize: 15, fontWeight: '600' },
  stage: { color: colors.muted, fontSize: 12, marginTop: 2 },
  dot: { color: colors.border },
  area: { color: colors.muted },
  actionsCol: { alignItems: 'flex-end', gap: spacing.xs },
  starBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: { color: colors.muted, fontSize: 22 },
  starOn: { color: colors.brand },
});
