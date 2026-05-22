import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Mapbox, { Camera, MapView, MarkerView } from '@rnmapbox/maps';
import { useStages } from '@glasto/shared';
import { api } from '../src/lib/api';
import { colors, radii, spacing } from '../src/lib/theme';

const TOKEN = (Constants.expoConfig?.extra?.mapboxToken as string | undefined) ?? '';
const SITE_CENTER: [number, number] = [-2.5871, 51.1539];

if (TOKEN) Mapbox.setAccessToken(TOKEN);

export default function MapScreen() {
  const { data: stages, isLoading } = useStages(api);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
  }, []);

  if (!TOKEN) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          Mapbox token missing. Set <Text style={styles.code}>extra.mapboxToken</Text> in app.json.
        </Text>
      </View>
    );
  }

  const pinned = (stages ?? []).filter((s) => s.lat != null && s.lon != null);
  const selectedStage = pinned.find((s) => s.slug === selected);

  return (
    <View style={styles.root}>
      <MapView style={styles.map} styleURL="mapbox://styles/mapbox/outdoors-v12" logoEnabled>
        <Camera defaultSettings={{ centerCoordinate: SITE_CENTER, zoomLevel: 13.5 }} />
        {pinned.map((s) => (
          <MarkerView
            key={s.slug}
            coordinate={[s.lon as number, s.lat as number]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Stage ${s.name}`}
              onPress={() => setSelected(s.slug)}
              style={styles.pin}
            >
              <Text style={styles.pinText}>{s.name}</Text>
            </Pressable>
          </MarkerView>
        ))}
      </MapView>

      {isLoading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}

      {selectedStage && (
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutTitle}>{selectedStage.name}</Text>
            <Text
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setSelected(null)}
              style={styles.calloutClose}
            >
              ✕
            </Text>
          </View>
          <Text style={styles.calloutMeta}>{selectedStage.area}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { color: colors.muted, textAlign: 'center' },
  code: { fontFamily: 'Courier', color: colors.fg },
  pin: {
    backgroundColor: colors.bg,
    borderColor: colors.brand,
    borderWidth: 2,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pinText: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    padding: spacing.sm,
  },
  callout: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  calloutTitle: { color: colors.fg, fontWeight: '600', flex: 1 },
  calloutClose: { color: colors.muted, fontSize: 16, paddingHorizontal: 4 },
  calloutMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
