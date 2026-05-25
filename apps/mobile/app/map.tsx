import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { usePins } from '../src/store/pins';

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

const PIN_EMOJI_OPTIONS = ['📍', '⛺', '🚗', '👯', '🍻', '🚐', '🎪', '⭐'];

interface SelectedFeature {
  kind: 'stage' | 'poi' | 'pin';
  id: string;
  name: string;
  subtitle: string;
}

interface PendingPin {
  lat: number;
  lon: number;
  existingId?: string;
  initialLabel: string;
  initialEmoji: string;
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
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const pinRecords = usePins((s) => s.records);
  const upsertPin = usePins((s) => s.upsert);
  const removePin = usePins((s) => s.remove);
  const activePins = useMemo(
    () => Object.values(pinRecords).filter((p) => !p.deleted),
    [pinRecords],
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
      <MapView
        style={styles.map}
        styleURL={STYLE_URL}
        logoEnabled
        onLongPress={(feature) => {
          const coords = feature.geometry?.type === 'Point' ? feature.geometry.coordinates : null;
          if (!coords || coords.length < 2) return;
          const lon = coords[0];
          const lat = coords[1];
          if (typeof lon !== 'number' || typeof lat !== 'number') return;
          setPendingPin({ lat, lon, initialLabel: '', initialEmoji: '📍' });
        }}
      >
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

        {activePins.map((p) => (
          <MarkerView key={`pin-${p.id}`} coordinate={[p.lon, p.lat]} anchor={{ x: 0.5, y: 1 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`My pin: ${p.label}`}
              onPress={() =>
                setSelected({ kind: 'pin', id: p.id, name: p.label, subtitle: 'My pin' })
              }
              style={styles.userPin}
            >
              <Text style={styles.userPinEmoji}>{p.emoji ?? '📍'}</Text>
              <View style={styles.userPinLabelWrap}>
                <Text style={styles.userPinLabel} numberOfLines={1}>
                  {p.label}
                </Text>
              </View>
            </Pressable>
          </MarkerView>
        ))}
      </MapView>

      <View style={styles.hintBadge} pointerEvents="none">
        <Text style={styles.hintText}>Long-press to drop a pin</Text>
      </View>

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
          {selected.kind === 'pin' && (
            <View style={styles.calloutActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const rec = pinRecords[selected.id];
                  if (!rec) return;
                  setPendingPin({
                    lat: rec.lat,
                    lon: rec.lon,
                    existingId: rec.id,
                    initialLabel: rec.label,
                    initialEmoji: rec.emoji ?? '📍',
                  });
                  setSelected(null);
                }}
                style={styles.calloutBtn}
              >
                <Text style={styles.calloutBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  removePin(selected.id);
                  setSelected(null);
                }}
                style={[styles.calloutBtn, styles.calloutBtnDanger]}
              >
                <Text style={[styles.calloutBtnText, styles.calloutBtnTextDanger]}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <PinFormModal
        pending={pendingPin}
        onCancel={() => setPendingPin(null)}
        onSave={({ label, emoji }) => {
          if (!pendingPin) return;
          upsertPin({
            id: pendingPin.existingId,
            label,
            emoji,
            lat: pendingPin.lat,
            lon: pendingPin.lon,
          });
          setPendingPin(null);
        }}
      />
    </View>
  );
}

interface PinFormModalProps {
  pending: PendingPin | null;
  onCancel: () => void;
  onSave: (input: { label: string; emoji: string }) => void;
}

function PinFormModal({ pending, onCancel, onSave }: PinFormModalProps) {
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('📍');

  useEffect(() => {
    if (pending) {
      setLabel(pending.initialLabel);
      setEmoji(pending.initialEmoji);
    }
  }, [pending]);

  if (!pending) return null;

  const trimmed = label.trim();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityLabel={pending.existingId ? 'Edit pin' : 'New pin'}
    >
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <Text style={styles.modalTitle}>{pending.existingId ? 'Edit pin' : 'New pin'}</Text>
          <Text style={styles.modalCoords}>
            {pending.lat.toFixed(5)}, {pending.lon.toFixed(5)}
          </Text>
          <Text style={styles.modalLabel}>Label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Tent, meet-up, car…"
            placeholderTextColor={colors.muted}
            maxLength={80}
            autoFocus
            style={styles.modalInput}
          />
          <Text style={styles.modalLabel}>Icon</Text>
          <View style={styles.modalEmojiRow}>
            {PIN_EMOJI_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                accessibilityRole="button"
                accessibilityState={{ selected: emoji === opt }}
                onPress={() => setEmoji(opt)}
                style={[styles.modalEmojiBtn, emoji === opt && styles.modalEmojiBtnActive]}
              >
                <Text style={styles.modalEmojiText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!trimmed}
              onPress={() => onSave({ label: trimmed, emoji })}
              style={[styles.modalBtn, styles.modalBtnPrimary, !trimmed && styles.modalBtnDisabled]}
            >
              <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>
                {pending.existingId ? 'Save' : 'Drop pin'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  hintBadge: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    opacity: 0.85,
  },
  hintText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
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
  calloutActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  calloutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  calloutBtnDanger: { borderColor: colors.accent },
  calloutBtnText: { color: colors.fg, fontSize: 12, fontWeight: '600' },
  calloutBtnTextDanger: { color: colors.accent },
  userPin: { alignItems: 'center' },
  userPinEmoji: { fontSize: 22, lineHeight: 24 },
  userPinLabelWrap: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    maxWidth: 140,
  },
  userPinLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: { color: colors.fg, fontSize: 16, fontWeight: '700' },
  modalCoords: { color: colors.muted, fontSize: 12 },
  modalLabel: { color: colors.fg, fontSize: 12, fontWeight: '600', marginTop: spacing.xs },
  modalInput: {
    color: colors.fg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalEmojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  modalEmojiBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalEmojiBtnActive: { borderColor: colors.brand },
  modalEmojiText: { fontSize: 18 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalBtnPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { color: colors.fg, fontSize: 13, fontWeight: '600' },
  modalBtnTextPrimary: { color: colors.brandFg },
});
