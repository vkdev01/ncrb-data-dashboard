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
const DISTRICT_FIELDS = {
  murder: 'totmdr24',
  womenChild: 'totoff24',
  rape: 'rape24',
  attemptRape: 'atcmrape24',
  assaultWomen: 'asltcfmod24',
  sexualHarassment: 'totsexhr24',
  stalking: 'stk78_24',
  insultModesty: 'inmodwom24',
  voyeurism: 'voyeur24',
  crueltyHusband: 'crlhus24',
  dowryDeath: 'dwydth24',
  kidnapWomenMarriage: 'kidabdmrg24',
  culpableHomicide: 'culhommdr24',
  deathByNegligence: 'cadthneg24',
  abetmentSuicide: 'abtsui24',
};

const DISTRICT_URL =
  'https://livingatlas.esri.in/server1/rest/services/NCRB/District_Wise_IPC_Crimes_2022/MapServer/0/query' +
  '?where=1%3D1&outFields=' +
  ['dist', 'state', ...Object.values(DISTRICT_FIELDS)].join(',') +
  '&returnGeometry=false&f=json&resultRecordCount=3000';

/**
 * State-level multi-year service — this is what makes a timeline possible.
 * Violent-crime counts run 2020–2024; rate and charge-sheeting rate 2022–2024.
 */
const STATE_TS_URL =
  'https://livingatlas.esri.in/server1/rest/services/NCRB/IN_ST_ViolentCrimes_2018_20/MapServer/0/query' +
  '?where=1%3D1&outFields=' +
  [
    'state',
    'violentcrime_2020',
    'violentcrime_2021',
    'violentcrime_2022',
    'violentcrime_2023',
    'violentcrime_2024',
    'rateviolentcrimes_2022',
    'rateviolentcrimes_2023',
    'rateviolentcrimes_2024',
    'chargesheetingrate_2022',
    'chargesheetingrate_2023',
    'chargesheetingrate_2024',
  ].join(',') +
  '&returnGeometry=false&f=json&resultRecordCount=100';

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
    const rows = (raw.features ?? [])
      .map((f) => {
        const a = f.attributes ?? {};
        const row = { d: a.dist, s: a.state };
        for (const [key, field] of Object.entries(DISTRICT_FIELDS)) row[key] = a[field] ?? null;
        return row;
      })
      .filter((r) => r.d && r.s);
    await writeFile(resolve(OUT, 'districts.json'), JSON.stringify(rows) + '\n', 'utf8');
    console.log(`✓ ${'districts'.padEnd(12)} ${rows.length} districts × ${Object.keys(DISTRICT_FIELDS).length} metrics`);

    // Report how well the district names match the boundary file, so the
    // coverage figure shown on the map can be checked.
    try {
      const geo = JSON.parse(await readFile(resolve(OUT, 'india-districts.geojson'), 'utf8'));
      const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      // keep in sync with src/lib/match.ts
      const ALIASES = {
        ahmednagar: 'ahilyanagar',
        osmanabad: 'dharashiv',
        anantapur: 'ananthapuramu',
        spsnellore: 'sripottisriramulunellore',
        nilgiris: 'thenilgiris',
        komarambheem: 'komarambheemasifabad',
      };
      const alias = (n) => ALIASES[n] ?? n;
      const byState = new Map();
      for (const r of rows) {
        const k = norm(r.s);
        if (!byState.has(k)) byState.set(k, []);
        byState.get(k).push({ n: norm(r.d), raw: r.d });
      }
      let matched = 0, total = 0, fuzzy = 0;
      const misses = [];
      const lev = (a, b) => {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
          const cur = [i];
          for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
          }
          prev = cur;
        }
        return prev[b.length];
      };
      for (const f of geo.features ?? []) {
        const d = f.properties?.d, s = f.properties?.s;
        if (!d) continue;
        total++;
        const list = byState.get(norm(s)) ?? [];
        const dn = alias(norm(d));
        if (list.some((x) => x.n === dn)) {
          matched++;
        } else if (list.some((x) => lev(dn, x.n) <= 2)) {
          fuzzy++;
        } else if (misses.length < 12) {
          misses.push(`${d} (${s})`);
        }
      }
      const covered = matched + fuzzy;
      await writeFile(
        resolve(OUT, 'district-match.json'),
        JSON.stringify(
          {
            rows: rows.length,
            boundaries: total,
            exact: matched,
            fuzzy,
            covered,
            uncovered: total - covered,
            coveragePct: Number(((covered / (total || 1)) * 100).toFixed(1)),
            sampleUncovered: misses,
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );
      console.log(
        `✓ ${'match'.padEnd(12)} ${covered}/${total} districts covered (${(((covered / (total || 1)) * 100)).toFixed(1)}%) — ${matched} exact, ${fuzzy} fuzzy`,
      );
    } catch (e) {
      console.warn(`! match report skipped: ${e.message}`);
    }
  } catch (err) {
    failures += 1;
    console.warn(`✗ ${'districts'.padEnd(12)} ${err.message}`);
  }

  // state-level multi-year series — powers the map timeline
  try {
    const raw = await fetchJson(STATE_TS_URL);
    const rows = (raw.features ?? [])
      .map((f) => {
        const a = f.attributes ?? {};
        return {
          state: a.state,
          violentCrimes: {
            2020: a.violentcrime_2020 ?? null,
            2021: a.violentcrime_2021 ?? null,
            2022: a.violentcrime_2022 ?? null,
            2023: a.violentcrime_2023 ?? null,
            2024: a.violentcrime_2024 ?? null,
          },
          rate: {
            2022: a.rateviolentcrimes_2022 ?? null,
            2023: a.rateviolentcrimes_2023 ?? null,
            2024: a.rateviolentcrimes_2024 ?? null,
          },
          chargesheetRate: {
            2022: a.chargesheetingrate_2022 ?? null,
            2023: a.chargesheetingrate_2023 ?? null,
            2024: a.chargesheetingrate_2024 ?? null,
          },
        };
      })
      .filter((r) => r.state);
    await writeFile(resolve(OUT, 'states-timeseries.json'), JSON.stringify(rows) + '\n', 'utf8');
    console.log(`✓ ${'timeseries'.padEnd(12)} ${rows.length} states × 2020–2024 (violent crimes)`);
  } catch (err) {
    failures += 1;
    console.warn(`✗ ${'timeseries'.padEnd(12)} ${err.message}`);
  }

  console.log(
    failures
      ? `\n${failures} dataset(s) failed. Existing files were left untouched.`
      : `\nDone. Wrote ${DATASETS.length + 1} file(s) to public/data/.`,
  );
  process.exit(0);
}

main();
