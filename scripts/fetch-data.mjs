#!/usr/bin/env node
/**
 * fetch-data.mjs — refresh the bundled data snapshot.
 *
 * Downloads each dataset's live JSON and writes it to `public/data/<id>.json`,
 * then prints a short summary. Use it to refresh the numbers you paste into
 * `src/lib/data/fallback.ts`, or to inspect the raw payloads.
 *
 *   node scripts/fetch-data.mjs
 *
 * Sources are the same ones the app uses at runtime (see src/lib/data/sources.ts).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'public/data');

const LIVE_BASE = 'https://indiandataproject.org/data/crime/2025-26';

const DATASETS = [
  { id: 'summary', file: 'summary.json' },
  { id: 'overview', file: 'overview.json' },
  { id: 'womenSafety', file: 'women-safety.json' },
  { id: 'cybercrime', file: 'cybercrime.json' },
];

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function summarise(id, data) {
  switch (id) {
    case 'summary':
      return `total=${data.totalCrimes?.toLocaleString('en-IN')} rate=${data.crimeRate} year=${data.dataYear}`;
    case 'overview':
      return `trend=${data.nationalTrend?.length} yrs · heads=${data.ipcComposition?.length} · states=${data.stateRates?.length}`;
    case 'womenSafety':
      return `trend=${data.nationalTrend?.length} yrs · heads=${data.crimeTypes?.length} · states=${data.stateRates?.length}`;
    case 'cybercrime':
      return `trend=${data.ncrbTrend?.length} yrs · heads=${data.crimeTypes?.length}`;
    default:
      return 'ok';
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let failures = 0;

  for (const { id, file } of DATASETS) {
    const url = `${LIVE_BASE}/${file}`;
    try {
      const data = await fetchJson(url);
      await writeFile(resolve(OUT, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`✓ ${id.padEnd(12)} ${summarise(id, data)}`);
    } catch (err) {
      failures += 1;
      console.warn(`✗ ${id.padEnd(12)} ${err.message}`);
    }
  }

  console.log(
    failures
      ? `\n${failures} dataset(s) failed. Existing files were left untouched.`
      : `\nDone. Wrote ${DATASETS.length} file(s) to public/data/.`,
  );
  process.exit(failures ? 1 : 0);
}

main();
