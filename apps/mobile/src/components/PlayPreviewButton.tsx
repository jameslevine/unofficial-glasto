import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPreview } from '../lib/audio';
import { colors, radii } from '../lib/theme';

interface Props {
  id: string;
  previewUrl: string | null | undefined;
  size?: 'sm' | 'md';
}

export const PlayPreviewButton = ({ id, previewUrl, size = 'sm' }: Props) => {
  const currentId = useAudioPreview((s) => s.currentId);
  const isPlaying = useAudioPreview((s) => s.isPlaying);
  const positionMs = useAudioPreview((s) => s.positionMs);
  const durationMs = useAudioPreview((s) => s.durationMs);
  const play = useAudioPreview((s) => s.play);
  const stop = useAudioPreview((s) => s.stop);

  if (!previewUrl) return null;

  const isCurrent = currentId === id;
  const active = isCurrent && isPlaying;
  const progress = isCurrent && durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  const dim = size === 'md' ? 36 : 28;
  const fontSize = size === 'md' ? 14 : 11;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={active ? 'Pause preview' : 'Play preview'}
        accessibilityState={{ selected: active }}
        onPress={() => (active ? stop() : play(id, previewUrl))}
        style={[styles.btn, { width: dim, height: dim, borderRadius: dim / 2 }]}
        hitSlop={6}
      >
        <Text style={[styles.label, { fontSize }]}>{active ? '❚❚' : '▶'}</Text>
      </Pressable>
      {isCurrent && durationMs > 0 && (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.brandFg, fontWeight: '700' },
  barTrack: {
    width: 48,
    height: 3,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.brand },
});
