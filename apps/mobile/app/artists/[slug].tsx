import { Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { pickPreviewTrack, useArtist } from '@glasto/shared';
import { api } from '../../src/lib/api';
import { PlayPreviewButton } from '../../src/components/PlayPreviewButton';
import { colors, radii, spacing } from '../../src/lib/theme';

export default function ArtistScreen() {
  const { slug, name } = useLocalSearchParams<{ slug: string; name?: string }>();
  const { data, isLoading, error, refetch } = useArtist(api, slug, name);

  const fallbackName = name ?? humanize(slug ?? '');
  const headerTitle = data?.name ?? fallbackName;

  return (
    <>
      <Stack.Screen options={{ title: headerTitle }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brand} />
          </View>
        )}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Couldn&rsquo;t load artist.</Text>
            <Text style={styles.muted}>{(error as Error).message}</Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        )}
        {data && (
          <>
            <View style={styles.header}>
              {data.imageUrl ? (
                <Image source={{ uri: data.imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.imagePlaceholderText}>♪</Text>
                </View>
              )}
              <View style={styles.headerBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {data.name || fallbackName}
                </Text>
                {data.genres.length > 0 && (
                  <Text style={styles.genres} numberOfLines={2}>
                    {data.genres.slice(0, 3).join(' · ')}
                  </Text>
                )}
                {pickPreviewTrack(data)?.previewUrl && (
                  <View style={styles.previewRow}>
                    <PlayPreviewButton
                      id={`artist-${data.slug}`}
                      previewUrl={pickPreviewTrack(data)?.previewUrl ?? null}
                      size="md"
                    />
                    <Text style={styles.muted} numberOfLines={1}>
                      Preview &ldquo;{pickPreviewTrack(data)?.name ?? ''}&rdquo;
                    </Text>
                  </View>
                )}
                {data.spotifyId && (
                  <Pressable
                    onPress={() =>
                      Linking.openURL(
                        data.spotifyUrl ?? `https://open.spotify.com/artist/${data.spotifyId}`,
                      )
                    }
                    style={styles.spotifyBtn}
                  >
                    <Text style={styles.spotifyLabel}>Open in Spotify ↗</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {!data.spotifyId && (
              <View style={styles.notice}>
                <Text style={styles.muted}>No Spotify match found for this artist.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const humanize = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg },
  center: { padding: spacing.xl, alignItems: 'center' },
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  image: { width: 96, height: 96, borderRadius: radii.md, backgroundColor: colors.surface },
  imagePlaceholder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { color: colors.muted, fontSize: 32 },
  headerBody: { flex: 1, gap: spacing.xs },
  title: { color: colors.fg, fontSize: 22, fontWeight: '700' },
  genres: { color: colors.muted, fontSize: 13 },
  spotifyBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  spotifyLabel: { color: colors.brand, fontSize: 13, fontWeight: '600' },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  muted: { color: colors.muted, fontSize: 13 },
  errorBox: { padding: spacing.lg, gap: spacing.sm, alignItems: 'flex-start' },
  errorText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  retryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
  },
  retryLabel: { color: colors.fg, fontSize: 13 },
});
