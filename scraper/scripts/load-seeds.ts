import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Performance, Stage } from '@glasto/shared';
import { upsertPerformances, upsertStages } from '../src/upsert.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const yearsArg = process.argv[2];
const years = yearsArg ? yearsArg.split(',').map(Number) : [2022, 2023, 2024, 2025];

const main = async () => {
  if (!process.env.TABLE_NAME) {
    throw new Error('TABLE_NAME env var is required');
  }

  const stages = JSON.parse(readFileSync(resolve(root, 'seed/stages.json'), 'utf8')) as Stage[];
  const stagesWritten = await upsertStages(stages);
  console.info(`stages: wrote ${stagesWritten}`);

  for (const year of years) {
    const perfs = JSON.parse(
      readFileSync(resolve(root, 'seed', `${year}.json`), 'utf8'),
    ) as Performance[];
    const written = await upsertPerformances(perfs);
    console.info(`${year}: wrote ${written}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
