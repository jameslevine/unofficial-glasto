import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Poi, PoiCategory } from '@glasto/shared';

interface RawFeature {
  type: 'Feature';
  properties: {
    name: string;
    description: string | null;
    tags: string[];
    display_on_map?: boolean;
  };
  geometry: { type: 'Point'; coordinates: [number, number] };
}

interface RawFeatureCollection {
  type: 'FeatureCollection';
  features: RawFeature[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const buildPoisForYear = (year: number): Poi[] => {
  const dir = resolve(root, 'seed/pois', String(year));
  const files = readdirSync(dir).filter((f) => f.endsWith('.geojson'));
  const out: Poi[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const category = file.replace('.geojson', '') as PoiCategory;
    const raw = JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as RawFeatureCollection;

    raw.features.forEach((feat, i) => {
      if (feat.properties.display_on_map === false) return;
      if (feat.geometry?.type !== 'Point') return;
      const [lon, lat] = feat.geometry.coordinates;
      if (typeof lat !== 'number' || typeof lon !== 'number') return;

      const baseId = `${category.toLowerCase()}-${slugify(feat.properties.name) || 'item'}`;
      let id = baseId;
      let n = 0;
      while (seenIds.has(id)) {
        n += 1;
        id = `${baseId}-${n}`;
      }
      // Always disambiguate by index too — many features share names ("Public Toilet" x91).
      if (!seenIds.has(`${baseId}-i${i}`)) id = `${baseId}-i${i}`;
      seenIds.add(id);

      out.push({
        id,
        year,
        category,
        name: feat.properties.name,
        description: feat.properties.description ?? null,
        tags: feat.properties.tags ?? [],
        lat,
        lon,
      });
    });
  }

  return out;
};

const main = () => {
  const yearsArg = process.argv[2];
  const years = yearsArg ? yearsArg.split(',').map(Number) : [2025];
  for (const year of years) {
    const pois = buildPoisForYear(year);
    const out = resolve(root, 'seed/pois', `${year}.json`);
    writeFileSync(out, JSON.stringify(pois, null, 2));
    const counts = pois.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});
    console.info(`${year}: ${pois.length} pois -> ${out}`);
    console.info('  by category:', counts);
  }
};

main();
