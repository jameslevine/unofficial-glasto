import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLineupHtml } from '../src/parse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const years = [2022, 2023, 2024, 2025];

for (const year of years) {
  const html = readFileSync(resolve(root, 'tests/fixtures', `${year}-stages.html`), 'utf8');
  const perfs = parseLineupHtml({ html, year });
  const outPath = resolve(root, 'seed', `${year}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(perfs, null, 2)}\n`);
  console.info(
    `${year}: ${perfs.length} performances, ${new Set(perfs.map((p) => p.stage)).size} stages, ` +
      `${new Set(perfs.map((p) => p.area)).size} areas`,
  );
}
