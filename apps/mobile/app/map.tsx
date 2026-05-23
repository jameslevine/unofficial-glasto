import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import Mapbox, { Camera, MapView, MarkerView } from '@rnmapbox/maps';
import {
  POI_CATEGORY_META,
  POI_CATEGORY_ORDER,
  type PoiCategory,
  usePois,
  useStages,
} from '@glasto/shared';
import { api } from '../src/lib/api';
import { colors, radii, spacing } from '../src/lib/theme';

const TOKEN = (Constants.expoConfig?.extra?.mapboxToken as string | undefined) ?? '';
const SITE_CENTER: [number, number] = [-2.5871, 51.1539];
const STYLE_URL = 'mapbox://styles/mapbox/outdoors-v12';
const PACK_NAME = 'worthy-farm';
const WORTHY_FARM_BOUNDS: [[number, number], [number, number]] = [
  [-2.55, 51.18],
  [-2.62, 51.13],
];
const POI_YEAR = 2025;
const STORAGE_KEY = 'map.activePoiLayers';

if (TOKEN) Mapbox.setAccessToken(TOKEN);

type PackStatus = 'idle' | 'checking' | 'downloading' | 'done' | 'error';

interface SelectedFeature {
  kind: 'stage' | 'poi';
  id: string;
  name: string;
  subtitle: string;
}

const defaultActiveLayers = (): PoiCategory[] =>
  POI_CATEGORY_ORDER.filter((c) => POI_CATEGORY_META[c].defaultOn);

export default function MapScreen() {
  const { data: stages, isLoading } = useStages(api);
  const { data: pois } = usePois(api, POI_YEAR);
  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [packStatus, setPackStatus] = useState<PackStatus>('idle');
  const [packProgress, setPackProgress] = useState(0);
  const [packError, setPackError] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<PoiCategory>>(
    () => new Set(defaultActiveLayers()),
  );

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as string[];
        setActiveLayers(new Set(parsed.filter((c): c is PoiCategory => c in POI_CATEGORY_META)));
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...activeLayers]));
  }, [activeLayers]);

  const toggleLayer = (cat: PoiCategory) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPackStatus('checking');
        const existing = await Mapbox.offlineManager.getPack(PACK_NAME);
        if (cancelled) return;
        if (existing) {
          setPackStatus('done');
          setPackProgress(100);
        } else {
          setPackStatus('idle');
        }
      } catch {
        if (!cancelled) setPackStatus('idle');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const downloadPack = async () => {
    setPackStatus('downloading');
    setPackError(null);
    setPackProgress(0);
    try {
      await Mapbox.offlineManager.createPack(
        {
          name: PACK_NAME,
          styleURL: STYLE_URL,
          minZoom: 13,
          maxZoom: 18,
          bounds: WORTHY_FARM_BOUNDS,
        },
        (_region, status) => {
          setPackProgress(Math.round(status.percentage ?? 0));
          if (status.percentage >= 100) setPackStatus('done');
        },
        (_region, err) => {
          setPackError(err?.message ?? 'Offline download failed');
          setPackStatus('error');
        },
      );
    } catch (err) {
      setPackError(err instanceof Error ? err.message : 'Offline download failed');
      setPackStatus('error');
    }
  };

  const deletePack = async () => {
    try {
      await Mapbox.offlineManager.deletePack(PACK_NAME);
      setPackStatus('idle');
      setPackProgress(0);
      setPackError(null);
    } catch (err) {
      setPackError(err instanceof Error ? err.message : 'Failed to delete pack');
      setPackStatus('error');
    }
  };

  const counts = useMemo<Partial<Record<PoiCategory, number>>>(() => {
    const out: Partial<Record<PoiCategory, number>> = {};
    (pois ?? []).forEach((p) => {
      out[p.category] = (out[p.category] ?? 0) + 1;
    });
    return out;
  }, [pois]);

  const visiblePois = useMemo(
    () => (pois ?? []).filter((p) => activeLayers.has(p.category)),
    [pois, activeLayers],
  );

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

  return (
    <View style={styles.root}>
      <MapView style={styles.map} styleURL={STYLE_URL} logoEnabled>
        <Camera defaultSettings={{ centerCoordinate: SITE_CENTER, zoomLevel: 13.5 }} />

        {pinned.map((s) => (
          <MarkerView
            key={`stage-${s.slug}`}
            coordinate={[s.lon as number, s.lat as number]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Stage ${s.name}`}
              onPress={() =>
                setSelected({ kind: 'stage', id: s.slug, name: s.name, subtitle: s.area })
              }
              style={styles.pin}
            >
              <Text style={styles.pinText}>{s.name}</Text>
            </Pressable>
          </MarkerView>
        ))}

        {visiblePois.map((p) => {
          const meta = POI_CATEGORY_META[p.category];
          return (
            <MarkerView key={`poi-${p.id}`} coordinate={[p.lon, p.lat]} anchor={{ x: 0.5, y: 0.5 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${meta.label}: ${p.name}`}
                onPress={() =>
                  setSelected({ kind: 'poi', id: p.id, name: p.name, subtitle: meta.label })
                }
                style={[styles.poiPin, { backgroundColor: meta.color }]}
              >
                <Text style={styles.poiPinText}>{meta.icon}</Text>
              </Pressable>
            </MarkerView>
          );
        })}
      </MapView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.layerRow}
        contentContainerStyle={styles.layerRowContent}
        accessibilityLabel="Map layers"
      >
        {POI_CATEGORY_ORDER.map((cat) => {
          const meta = POI_CATEGORY_META[cat];
          const active = activeLayers.has(cat);
          const count = counts[cat] ?? 0;
          if (count === 0) return null;
          return (
            <Pressable
              key={cat}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => toggleLayer(cat)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {meta.icon} {meta.label} {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}

      <View style={styles.offlineBadge}>
        {packStatus === 'done' ? (
          <Pressable accessibilityRole="button" onPress={deletePack}>
            <Text style={styles.offlineDoneText}>✓ Offline ready</Text>
          </Pressable>
        ) : packStatus === 'downloading' ? (
          <Text style={styles.offlineText}>Downloading… {packProgress}%</Text>
        ) : packStatus === 'error' ? (
          <Pressable accessibilityRole="button" onPress={downloadPack}>
            <Text style={styles.offlineErrorText}>Retry download</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={downloadPack}>
            <Text style={styles.offlineText}>Download for offline</Text>
          </Pressable>
        )}
      </View>

      {packError && packStatus === 'error' && (
        <View style={styles.errorBadge}>
          <Text style={styles.errorText}>{packError}</Text>
        </View>
      )}

      {selected && (
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutTitle}>{selected.name}</Text>
            <Text
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setSelected(null)}
              style={styles.calloutClose}
            >
              ✕
            </Text>
          </View>
          <Text style={styles.calloutMeta}>{selected.subtitle}</Text>
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
  poiPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiPinText: {
    fontSize: 14,
    color: '#fff',
  },
  layerRow: {
    position: 'absolute',
    bottom: spacing.md + 60,
    left: 0,
    right: 0,
    maxHeight: 36,
  },
  layerRowContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    color: colors.fg,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.bg,
  },
  loadingBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    padding: spacing.sm,
  },
  offlineBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  offlineText: { color: colors.fg, fontSize: 12, fontWeight: '600' },
  offlineDoneText: { color: colors.brand, fontSize: 12, fontWeight: '700' },
  offlineErrorText: { color: colors.brand, fontSize: 12, fontWeight: '700' },
  errorBadge: {
    position: 'absolute',
    top: spacing.md + 40,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  errorText: { color: colors.muted, fontSize: 12 },
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
