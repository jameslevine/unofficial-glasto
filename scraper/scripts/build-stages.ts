import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Performance, Stage } from '@glasto/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

// Hand-mapped coordinates for the main stages (Worthy Farm, Pilton, Somerset).
// Sourced from public site maps; remaining stages get null and can be filled in
// during the map work in Phase 5.
const KNOWN_COORDS: Record<string, { lat: number; lon: number }> = {
  'pyramid-stage': { lat: 51.1539, lon: -2.5871 },
  'other-stage': { lat: 51.1545, lon: -2.5917 },
  'west-holts-stage': { lat: 51.1517, lon: -2.5918 },
  woodsies: { lat: 51.1571, lon: -2.5904 },
  'the-park-stage': { lat: 51.1614, lon: -2.5847 },
  'acoustic-stage': { lat: 51.1532, lon: -2.5832 },
  'avalon-stage': { lat: 51.1524, lon: -2.5779 },
  'left-field': { lat: 51.1528, lon: -2.5961 },
  arcadia: { lat: 51.1494, lon: -2.5959 },
};

const stages = new Map<string, Stage>();

for (const year of [2022, 2023, 2024, 2025]) {
  const seed = JSON.parse(
    readFileSync(resolve(root, 'seed', `${year}.json`), 'utf8'),
  ) as Performance[];
  for (const p of seed) {
    const slug = slugify(p.stage);
    if (stages.has(slug)) continue;
    const coords = KNOWN_COORDS[slug];
    stages.set(slug, {
      slug,
      name: p.stage,
      area: p.area,
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
    });
  }
}

const sorted = [...stages.values()].sort((a, b) => a.slug.localeCompare(b.slug));
const outPath = resolve(root, 'seed', 'stages.json');
writeFileSync(outPath, `${JSON.stringify(sorted, null, 2)}\n`);
console.info(
  `stages: ${sorted.length} (${sorted.filter((s) => s.lat !== null).length} with coords)`,
);
