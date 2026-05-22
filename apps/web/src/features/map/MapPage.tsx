import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useStages } from '@glasto/shared';
import { api } from '../../lib/api';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
const SITE_CENTER: [number, number] = [-2.5871, 51.1539];
const SITE_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-2.62, 51.13],
  [-2.55, 51.18],
];

export const MapPage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { data: stages, isLoading } = useStages(api);

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

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

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
          setSelected(s.slug);
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

  if (!TOKEN) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        Mapbox token missing. Set <code>VITE_MAPBOX_TOKEN</code> in <code>.env.local</code>.
      </div>
    );
  }

  const selectedStage = stages?.find((s) => s.slug === selected);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold">Map</h1>
        <p className="text-xs text-muted">
          {isLoading
            ? 'Loading stages…'
            : `${stages?.filter((s) => s.lat != null).length ?? 0} stages plotted`}
        </p>
      </div>
      <div className="relative h-[70vh] overflow-hidden rounded-lg border border-border">
        <div ref={containerRef} className="h-full w-full" />
        {selectedStage && (
          <div className="absolute bottom-3 left-3 right-3 rounded-md border border-border bg-bg/95 px-3 py-2 backdrop-blur sm:right-auto sm:max-w-sm">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{selectedStage.name}</p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-muted hover:text-fg"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-xs uppercase tracking-wide text-muted">{selectedStage.area}</p>
          </div>
        )}
      </div>
    </div>
  );
};
