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
import { mkdir, readFile, writeFile } from 'node:fs/promises';
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

/**
 * District-level layer, from Esri India's Living Atlas copy of the NCRB
 * district tables. Kept separate from the JSON feeds above because it is a
 * different provider and shape.
 */
const DISTRICT_URL =
  'https://livingatlas.esri.in/server1/rest/services/NCRB/District_Wise_IPC_Crimes_2022/MapServer/0/query' +
  '?where=1%3D1&outFields=dist,state,totmdr24,totoff24&returnGeometry=false&f=json&resultRecordCount=2000';

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

  // district layer (best-effort — a different provider)
  try {
    const raw = await fetchJson(DISTRICT_URL);
    const rows = (raw.features ?? []).map((f) => ({
      d: f.attributes?.dist,
      s: f.attributes?.state,
      murder: f.attributes?.totmdr24,
      womenChild: f.attributes?.totoff24,
    })).filter((r) => r.d && r.s);
    await writeFile(resolve(OUT, 'districts.json'), JSON.stringify(rows) + '\n', 'utf8');
    console.log(`✓ ${'districts'.padEnd(12)} ${rows.length} districts (NCRB 2024, via Esri Living Atlas)`);

    // Report how well the district names match the boundary file, so the
    // coverage figure shown on the map can be checked.
    try {
      const geo = JSON.parse(await readFile(resolve(OUT, 'india-districts.geojson'), 'utf8'));
      const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const byState = new Map();
      for (const r of rows) {
        const k = norm(r.s);
        if (!byState.has(k)) byState.set(k, []);
        byState.get(k).push({ n: norm(r.d), raw: r.d });
      }
      let matched = 0, total = 0;
      const misses = [];
      for (const f of geo.features ?? []) {
        const d = f.properties?.d, s = f.properties?.s;
        if (!d) continue;
        total++;
        const list = byState.get(norm(s)) ?? [];
        const dn = norm(d);
        const hit = list.find((x) => x.n === dn);
        if (hit) matched++;
        else if (misses.length < 12) misses.push(`${d} (${s})`);
      }
      await writeFile(
        resolve(OUT, 'district-match.json'),
        JSON.stringify({ rows: rows.length, boundaries: total, matched, unmatched: total - matched, sampleMisses: misses }, null, 2) + '\n',
        'utf8',
      );
      console.log(`✓ ${'match'.padEnd(12)} ${matched}/${total} boundary districts matched exactly (${(((matched / (total || 1)) * 100)).toFixed(1)}%)`);
    } catch (e) {
      console.warn(`! match report skipped: ${e.message}`);
    }
  } catch (err) {
    failures += 1;
    console.warn(`✗ ${'districts'.padEnd(12)} ${err.message}`);
  }

  console.log(
    failures
      ? `\n${failures} dataset(s) failed. Existing files were left untouched.`
      : `\nDone. Wrote ${DATASETS.length + 1} file(s) to public/data/.`,
  );
  process.exit(0);
}

main();
