import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  POI_CATEGORY_META,
  POI_CATEGORY_ORDER,
  type Poi,
  type PoiCategory,
  usePois,
  useStages,
} from '@glasto/shared';
import { api } from '../../lib/api';
import { usePins, type PinRecord } from '../../store/pins';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
const SITE_CENTER: [number, number] = [-2.5871, 51.1539];
const SITE_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-2.62, 51.13],
  [-2.55, 51.18],
];
const POI_YEAR = 2025;
const STORAGE_KEY = 'map.activePoiLayers';

const defaultActiveLayers = (): Set<PoiCategory> =>
  new Set(POI_CATEGORY_ORDER.filter((c) => POI_CATEGORY_META[c].defaultOn));

const loadActiveLayers = (): Set<PoiCategory> => {
  if (typeof window === 'undefined') return defaultActiveLayers();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultActiveLayers();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.filter((c): c is PoiCategory => c in POI_CATEGORY_META));
  } catch {
    return defaultActiveLayers();
  }
};

interface SelectedFeature {
  kind: 'stage' | 'poi' | 'pin';
  id: string;
  name: string;
  subtitle: string;
}

const PIN_EMOJI_OPTIONS = ['📍', '⛺', '🚗', '👯', '🍻', '🚐', '🎪', '⭐'];
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 6;

interface PendingPin {
  lat: number;
  lon: number;
  existingId?: string;
  initialLabel: string;
  initialEmoji: string;
}

export const MapPage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<PoiCategory>>(loadActiveLayers);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const { data: stages, isLoading: stagesLoading } = useStages(api);
  const { data: pois, isLoading: poisLoading } = usePois(api, POI_YEAR);
  const pinRecords = usePins((s) => s.records);
  const upsertPin = usePins((s) => s.upsert);
  const removePin = usePins((s) => s.remove);
  const activePins = useMemo<PinRecord[]>(
    () => Object.values(pinRecords).filter((p) => !p.deleted),
    [pinRecords],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...activeLayers]));
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
    if (!TOKEN) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: SITE_CENTER,
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      maxBounds: SITE_BOUNDS,
      attributionControl: true,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const map = mapRef.current;
    let pressTimer: number | null = null;
    let pressOrigin: { x: number; y: number } | null = null;
    let pressLngLat: mapboxgl.LngLat | null = null;

    const cancelPress = () => {
      if (pressTimer != null) {
        window.clearTimeout(pressTimer);
        pressTimer = null;
      }
      pressOrigin = null;
      pressLngLat = null;
    };

    const onDown = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
      cancelPress();
      pressOrigin = { x: e.point.x, y: e.point.y };
      pressLngLat = e.lngLat;
      pressTimer = window.setTimeout(() => {
        if (!pressLngLat) return;
        setPendingPin({
          lat: pressLngLat.lat,
          lon: pressLngLat.lng,
          initialLabel: '',
          initialEmoji: '📍',
        });
        cancelPress();
      }, LONG_PRESS_MS);
    };

    const onMove = (e: mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent) => {
      if (!pressOrigin) return;
      const dx = e.point.x - pressOrigin.x;
      const dy = e.point.y - pressOrigin.y;
      if (dx * dx + dy * dy > LONG_PRESS_MOVE_TOLERANCE * LONG_PRESS_MOVE_TOLERANCE) {
        cancelPress();
      }
    };

    map.on('mousedown', onDown);
    map.on('mousemove', onMove);
    map.on('mouseup', cancelPress);
    map.on('touchstart', onDown);
    map.on('touchmove', onMove);
    map.on('touchend', cancelPress);
    map.on('dragstart', cancelPress);

    return () => {
      cancelPress();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Stage markers — unchanged behaviour
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !stages) return;

    const placePins = () => {
      const pinned = stages.filter((s) => s.lat != null && s.lon != null);
      const markers: mapboxgl.Marker[] = [];
      pinned.forEach((s) => {
        const el = document.createElement('button');
        el.className =
          'flex h-7 items-center gap-1 whitespace-nowrap rounded-full border-2 border-brand bg-bg px-2 text-[11px] font-bold uppercase tracking-wide text-brand shadow-lg hover:bg-brand hover:text-bg transition';
        el.type = 'button';
        el.innerText = s.name;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelected({ kind: 'stage', id: s.slug, name: s.name, subtitle: s.area });
          map.flyTo({ center: [s.lon as number, s.lat as number], zoom: 16 });
        });
        const m = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([s.lon as number, s.lat as number])
          .addTo(map);
        markers.push(m);
      });
      return markers;
    };

    const markers = map.isStyleLoaded() ? placePins() : [];
    if (!map.isStyleLoaded()) {
      map.once('load', () => {
        const m = placePins();
        markers.push(...m);
      });
    }
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [stages]);

  // POI markers — re-rendered when activeLayers change
  const visiblePois = useMemo<Poi[]>(
    () => (pois ?? []).filter((p) => activeLayers.has(p.category)),
    [pois, activeLayers],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const placePois = () => {
      const markers: mapboxgl.Marker[] = [];
      visiblePois.forEach((p) => {
        const meta = POI_CATEGORY_META[p.category];
        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', `${meta.label}: ${p.name}`);
        el.style.cssText = `
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: ${meta.color};
          color: #fff;
          font-size: 14px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          cursor: pointer;
        `;
        el.textContent = meta.icon;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelected({ kind: 'poi', id: p.id, name: p.name, subtitle: meta.label });
          map.flyTo({ center: [p.lon, p.lat], zoom: 17 });
        });
        const m = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([p.lon, p.lat])
          .addTo(map);
        markers.push(m);
      });
      return markers;
    };

    const markers = map.isStyleLoaded() ? placePois() : [];
    if (!map.isStyleLoaded()) {
      map.once('load', () => {
        const m = placePois();
        markers.push(...m);
      });
    }
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [visiblePois]);

  // User pin markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const placePins = () => {
      const markers: mapboxgl.Marker[] = [];
      activePins.forEach((p) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', `My pin: ${p.label}`);
        el.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          background: transparent;
          border: 0;
          cursor: pointer;
          transform: translateY(-12px);
        `;
        el.innerHTML = `
          <span style="
            font-size: 22px;
            line-height: 1;
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
          ">${p.emoji ?? '📍'}</span>
          <span style="
            margin-top: 2px;
            padding: 1px 6px;
            border-radius: 999px;
            background: #ec4899;
            color: white;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
            max-width: 140px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${p.label.replace(/[<&>]/g, '')}</span>
        `;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelected({ kind: 'pin', id: p.id, name: p.label, subtitle: 'My pin' });
          map.flyTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 16) });
        });
        const m = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.lon, p.lat])
          .addTo(map);
        markers.push(m);
      });
      return markers;
    };

    const markers = map.isStyleLoaded() ? placePins() : [];
    if (!map.isStyleLoaded()) {
      map.once('load', () => {
        const m = placePins();
        markers.push(...m);
      });
    }
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [activePins]);

  if (!TOKEN) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        Mapbox token missing. Set <code>VITE_MAPBOX_TOKEN</code> in <code>.env.local</code>.
      </div>
    );
  }

  const counts = useMemo<Partial<Record<PoiCategory, number>>>(() => {
    const out: Partial<Record<PoiCategory, number>> = {};
    (pois ?? []).forEach((p) => {
      out[p.category] = (out[p.category] ?? 0) + 1;
    });
    return out;
  }, [pois]);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold">Map</h1>
        <p className="text-xs text-muted">
          {stagesLoading
            ? 'Loading stages…'
            : `${stages?.filter((s) => s.lat != null).length ?? 0} stages`}
          {' · '}
          {poisLoading ? 'Loading POIs…' : `${visiblePois.length}/${pois?.length ?? 0} POIs`}
        </p>
      </div>

      <div
        className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-thin"
        role="group"
        aria-label="Map layers"
      >
        {POI_CATEGORY_ORDER.map((cat) => {
          const meta = POI_CATEGORY_META[cat];
          const active = activeLayers.has(cat);
          const count = counts[cat] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleLayer(cat)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? 'border-brand bg-brand text-bg'
                  : 'border-border bg-surface text-fg hover:border-brand'
              }`}
            >
              <span aria-hidden="true">{meta.icon}</span>
              <span>{meta.label}</span>
              <span className={active ? 'opacity-80' : 'text-muted'}>{count}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        Tip: long-press the map to drop your own pin (tent, meet-up, car…).
      </p>

      <div className="relative h-[70vh] overflow-hidden rounded-lg border border-border">
        <div ref={containerRef} className="h-full w-full" />
        {selected && (
          <div className="absolute bottom-3 left-3 right-3 rounded-md border border-border bg-bg/95 px-3 py-2 backdrop-blur sm:right-auto sm:max-w-sm">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{selected.name}</p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-muted hover:text-fg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-xs uppercase tracking-wide text-muted">{selected.subtitle}</p>
            {selected.kind === 'pin' && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
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
                  className="rounded-full border border-border px-3 py-1 text-xs hover:border-brand"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removePin(selected.id);
                    setSelected(null);
                  }}
                  className="rounded-full border border-border px-3 py-1 text-xs text-accent hover:border-accent"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {pendingPin && (
          <PinForm
            pending={pendingPin}
            onCancel={() => setPendingPin(null)}
            onSave={({ label, emoji }) => {
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
        )}
      </div>
    </div>
  );
};

interface PinFormProps {
  pending: PendingPin;
  onCancel: () => void;
  onSave: (input: { label: string; emoji: string }) => void;
}

const PinForm = ({ pending, onCancel, onSave }: PinFormProps) => {
  const [label, setLabel] = useState(pending.initialLabel);
  const [emoji, setEmoji] = useState(pending.initialEmoji);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-label={pending.existingId ? 'Edit pin' : 'New pin'}
      className="absolute inset-0 flex items-center justify-center bg-bg/40 px-4"
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          onSave({ label: label.trim(), emoji });
        }}
        className="w-full max-w-sm space-y-3 rounded-lg border border-border bg-bg p-4 shadow-xl"
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold">{pending.existingId ? 'Edit pin' : 'New pin'}</p>
          <p className="text-xs text-muted">
            {pending.lat.toFixed(5)}, {pending.lon.toFixed(5)}
          </p>
        </div>
        <label className="block text-xs font-medium" htmlFor="pin-label">
          Label
        </label>
        <input
          ref={inputRef}
          id="pin-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={80}
          placeholder="Tent, meet-up, car…"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-brand"
        />
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium">Icon</legend>
          <div className="flex flex-wrap gap-1.5">
            {PIN_EMOJI_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setEmoji(opt)}
                aria-pressed={emoji === opt}
                className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                  emoji === opt ? 'border-brand bg-surface' : 'border-border bg-surface'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1 text-xs hover:border-brand"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!label.trim()}
            className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-bg disabled:opacity-50"
          >
            {pending.existingId ? 'Save' : 'Drop pin'}
          </button>
        </div>
      </form>
    </div>
  );
};
