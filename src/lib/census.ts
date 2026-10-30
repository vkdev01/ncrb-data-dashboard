/**
 * Census analytics — derived metrics, bands and cross-metric helpers.
 *
 * The data layer (`lib/data/census.ts`) holds only what the census published.
 * Everything a page needs *about* those figures — shares, gaps, bands, regional
 * aggregates, correlations — is computed here, so no page invents a number and
 * every derived figure can be traced back to two published ones.
 */
import { censusStates, india, type CensusState, type Region } from './data/census';

/* ------------------------------------------------------------------ metrics */

export interface CensusMetric {
  id: string;
  /** Full label, for headings and map legends. */
  label: string;
  /** Two-or-three word label, for chips and table headers. */
  short: string;
  unit: string;
  group: string;
  /** Ramp endpoints for the choropleth. */
  from: string;
  to: string;
  get: (s: CensusState) => number | null;
  format: (v: number) => string;
  /** true when a higher value is generally the better outcome, false when lower is. */
  higherIsBetter: boolean | null;
  blurb: string;
}

const int = (v: number) => new Intl.NumberFormat('en-IN').format(Math.round(v));
const one = (v: number) => v.toFixed(1);
const zero = (v: number) => v.toFixed(0);

/** Share of India's population, in percent. */
export const popShare = (s: CensusState) => (s.pop2011 / india.pop2011) * 100;

/** Urban population, derived from the published share. */
export const urbanPop = (s: CensusState) => (s.urbanPct == null ? null : (s.pop2011 * s.urbanPct) / 100);

/** Rural population, derived. */
export const ruralPop = (s: CensusState) => (s.urbanPct == null ? null : s.pop2011 - (s.pop2011 * s.urbanPct) / 100);

/** Female–male literacy gap in percentage points. */
export const literacyGap = (s: CensusState) =>
  s.literacyMale == null || s.literacyFemale == null ? null : s.literacyMale - s.literacyFemale;

/** Change in overall sex ratio, 2001 → 2011. */
export const sexRatioChange = (s: CensusState) =>
  s.sexRatio == null || s.sexRatio2001 == null ? null : s.sexRatio - s.sexRatio2001;

/** Change in child sex ratio, 2001 → 2011. */
export const childSexRatioChange = (s: CensusState) =>
  s.childSexRatio == null || s.childSexRatio2001 == null ? null : s.childSexRatio - s.childSexRatio2001;

/** Females per 1,000 males, computed from the population split (a cross-check on the published ratio). */
export const sexRatioComputed = (s: CensusState) =>
  s.males == null || s.females == null || !s.males ? null : (s.females / s.males) * 1000;

export const METRICS: CensusMetric[] = [
  {
    id: 'pop2011',
    label: 'Population (2011)',
    short: 'Population',
    unit: 'persons',
    group: 'Size',
    from: '#eef2f7',
    to: '#334155',
    get: (s) => s.pop2011,
    format: int,
    higherIsBetter: null,
    blurb: 'Raw counts track population, not development. Useful for scale, not for comparison.',
  },
  {
    id: 'popShare',
    label: "Share of India's population",
    short: 'Share of India',
    unit: '%',
    group: 'Size',
    from: '#eef2f7',
    to: '#475569',
    get: (s) => popShare(s),
    format: (v) => `${one(v)}%`,
    higherIsBetter: null,
    blurb: 'Each state as a fraction of the national total. Ten states hold most of the country.',
  },
  {
    id: 'density',
    label: 'Population density (per km²)',
    short: 'Density',
    unit: 'per km²',
    group: 'Size',
    from: '#eaf1f7',
    to: '#0c4a6e',
    get: (s) => s.density,
    format: zero,
    higherIsBetter: null,
    blurb: 'Persons per square kilometre. Driven by geography as much as by population.',
  },
  {
    id: 'growth',
    label: 'Decadal growth, 2001 → 2011',
    short: 'Growth',
    unit: '%',
    group: 'Change',
    from: '#eaf5ee',
    to: '#166534',
    get: (s) => s.growth,
    format: (v) => `${one(v)}%`,
    higherIsBetter: null,
    blurb: 'Population change over the decade. High growth is not inherently bad — it reflects momentum.',
  },
  {
    id: 'sexRatio',
    label: 'Sex ratio (females per 1,000 males)',
    short: 'Sex ratio',
    unit: 'per 1,000 males',
    group: 'Gender',
    from: '#fdeef4',
    to: '#9d174d',
    get: (s) => s.sexRatio,
    format: zero,
    higherIsBetter: true,
    blurb: 'Women per 1,000 men. A low ratio signals son preference and the cumulative effect of missing girls.',
  },
  {
    id: 'childSexRatio',
    label: 'Child sex ratio (girls per 1,000 boys, 0–6)',
    short: 'Child sex ratio',
    unit: 'per 1,000 boys',
    group: 'Gender',
    from: '#fdeef4',
    to: '#831843',
    get: (s) => s.childSexRatio,
    format: zero,
    higherIsBetter: true,
    blurb:
      'The sharpest available signal on sex-selective practice, because it is not diluted by a lifetime of migration or mortality.',
  },
  {
    id: 'sexRatioChange',
    label: 'Sex-ratio change, 2001 → 2011',
    short: 'SR change',
    unit: 'points',
    group: 'Gender',
    from: '#fbe0e0',
    to: '#15803d',
    get: (s) => sexRatioChange(s),
    format: (v) => `${v >= 0 ? '+' : ''}${zero(v)}`,
    higherIsBetter: true,
    blurb: 'Direction of travel. A negative value means the state lost women per 1,000 men over the decade.',
  },
  {
    id: 'literacy',
    label: 'Literacy rate',
    short: 'Literacy',
    unit: '%',
    group: 'Education',
    from: '#eef4fb',
    to: '#1e40af',
    get: (s) => s.literacy,
    format: (v) => `${one(v)}%`,
    higherIsBetter: true,
    blurb: 'Population aged 7+ who can read and write. The single most-referenced human-development figure in the census.',
  },
  {
    id: 'literacyFemale',
    label: 'Female literacy rate',
    short: 'Female literacy',
    unit: '%',
    group: 'Education',
    from: '#f5eefb',
    to: '#6b21a8',
    get: (s) => s.literacyFemale,
    format: (v) => `${one(v)}%`,
    higherIsBetter: true,
    blurb: 'Female literacy moves fertility, child health and workforce participation more than the male rate does.',
  },
  {
    id: 'literacyGap',
    label: 'Literacy gender gap (male − female)',
    short: 'Literacy gap',
    unit: 'points',
    group: 'Education',
    from: '#fdf1e7',
    to: '#b45309',
    get: (s) => literacyGap(s),
    format: (v) => `${one(v)} pts`,
    higherIsBetter: false,
    blurb: 'Percentage points between male and female literacy. A small gap means the two sexes were educated together.',
  },
  {
    id: 'urbanPct',
    label: 'Urban share of population',
    short: 'Urban %',
    unit: '%',
    group: 'Settlement',
    from: '#f0f0ee',
    to: '#57534e',
    get: (s) => s.urbanPct,
    format: (v) => `${one(v)}%`,
    higherIsBetter: null,
    blurb: 'Share living in towns and cities. India urbanised slowly — but its urban population is enormous in absolute terms.',
  },
  {
    id: 'urbanPop',
    label: 'Urban population (persons)',
    short: 'Urban persons',
    unit: 'persons',
    group: 'Settlement',
    from: '#f0f0ee',
    to: '#44403c',
    get: (s) => urbanPop(s),
    format: int,
    higherIsBetter: null,
    blurb: 'Derived from the published urban share. A high percentage and a high count are different stories.',
  },
];

export const metricById = new Map(METRICS.map((m) => [m.id, m]));

/** All states with a non-null value for a metric, descending. */
export function ranked(metricId: string): { state: CensusState; value: number }[] {
  const m = metricById.get(metricId);
  if (!m) return [];
  return censusStates
    .map((s) => ({ state: s, value: m.get(s) }))
    .filter((r): r is { state: CensusState; value: number } => typeof r.value === 'number' && Number.isFinite(r.value))
    .sort((a, b) => b.value - a.value);
}

/** 1-based rank of a state on a metric (descending). 0 when it has no value. */
export function rankOf(name: string, metricId: string): number {
  const rows = ranked(metricId);
  const i = rows.findIndex((r) => r.state.name === name);
  return i === -1 ? 0 : i + 1;
}

/* -------------------------------------------------------------------- bands */

export type Band = { id: string; label: string; test: (v: number) => boolean; color: string };

export const literacyBands: Band[] = [
  { id: 'low', label: 'Below 65%', test: (v) => v < 65, color: 'var(--c2)' },
  { id: 'mid', label: '65–75%', test: (v) => v >= 65 && v < 75, color: 'var(--c3)' },
  { id: 'high', label: '75–85%', test: (v) => v >= 75 && v < 85, color: 'var(--c4)' },
  { id: 'vhigh', label: '85% and above', test: (v) => v >= 85, color: 'var(--c5)' },
];

export const growthBands: Band[] = [
  { id: 'slow', label: 'Under 10%', test: (v) => v < 10, color: 'var(--c5)' },
  { id: 'moderate', label: '10–20%', test: (v) => v >= 10 && v < 20, color: 'var(--c4)' },
  { id: 'high', label: '20–30%', test: (v) => v >= 20 && v < 30, color: 'var(--c3)' },
  { id: 'vhigh', label: '30% and above', test: (v) => v >= 30, color: 'var(--c2)' },
];

export const urbanBands: Band[] = [
  { id: 'rural', label: 'Under 25% urban', test: (v) => v < 25, color: 'var(--c5)' },
  { id: 'mixed', label: '25–50% urban', test: (v) => v >= 25 && v < 50, color: 'var(--c4)' },
  { id: 'urbanising', label: '50–75% urban', test: (v) => v >= 50 && v < 75, color: 'var(--c3)' },
  { id: 'urban', label: '75% and above urban', test: (v) => v >= 75, color: 'var(--c2)' },
];

export const densityBands: Band[] = [
  { id: 'sparse', label: 'Under 150 /km²', test: (v) => v < 150, color: 'var(--c5)' },
  { id: 'moderate', label: '150–400 /km²', test: (v) => v >= 150 && v < 400, color: 'var(--c4)' },
  { id: 'dense', label: '400–1,000 /km²', test: (v) => v >= 400 && v < 1000, color: 'var(--c3)' },
  { id: 'vdense', label: '1,000+ /km²', test: (v) => v >= 1000, color: 'var(--c2)' },
];

/** Group states into bands for one metric. */
export function banded(
  metricId: string,
  bands: Band[],
): { band: Band; states: CensusState[] }[] {
  const m = metricById.get(metricId);
  if (!m) return [];
  const out = bands.map((b) => ({ band: b, states: [] as CensusState[] }));
  for (const s of censusStates) {
    const v = m.get(s);
    if (typeof v !== 'number') continue;
    const hit = out.find((o) => o.band.test(v));
    hit?.states.push(s);
  }
  return out.filter((o) => o.states.length > 0);
}

/* ------------------------------------------------------------------ regions */

export const REGIONS: Region[] = ['North', 'Central', 'West', 'East', 'North East', 'South'];

export interface RegionSummary {
  region: Region;
  states: CensusState[];
  population: number;
  /** Share of India's population, %. */
  share: number;
  /** Population-weighted literacy. */
  literacy: number | null;
  /** Population-weighted urban share. */
  urbanPct: number | null;
  /** Aggregate sex ratio, computed from summed males and females. */
  sexRatio: number | null;
  /** Unweighted mean decadal growth. */
  growth: number;
}

export function regionSummaries(): RegionSummary[] {
  return REGIONS.map((region) => {
    const states = censusStates.filter((s) => s.region === region);
    const population = states.reduce((t, s) => t + s.pop2011, 0);

    const litKnown = states.filter((s) => s.literacy != null);
    const litPop = litKnown.reduce((t, s) => t + s.pop2011, 0);
    const literacy = litPop
      ? litKnown.reduce((t, s) => t + (s.literacy as number) * s.pop2011, 0) / litPop
      : null;

    const urbKnown = states.filter((s) => s.urbanPct != null);
    const urbPop = urbKnown.reduce((t, s) => t + s.pop2011, 0);
    const urbanPct = urbPop
      ? urbKnown.reduce((t, s) => t + (s.urbanPct as number) * s.pop2011, 0) / urbPop
      : null;

    const males = states.reduce((t, s) => t + (s.males ?? 0), 0);
    const females = states.reduce((t, s) => t + (s.females ?? 0), 0);
    const sexRatio = males ? (females / males) * 1000 : null;

    return {
      region,
      states,
      population,
      share: (population / india.pop2011) * 100,
      literacy,
      urbanPct,
      sexRatio,
      growth: states.reduce((t, s) => t + s.growth, 0) / (states.length || 1),
    };
  }).sort((a, b) => b.population - a.population);
}

/* ------------------------------------------------------------ correlations */

/** Pearson correlation over matched pairs. Returns null when there is no variation. */
export function pearson(pairs: [number, number][]): number | null {
  const n = pairs.length;
  if (n < 3) return null;
  const mx = pairs.reduce((t, p) => t + p[0], 0) / n;
  const my = pairs.reduce((t, p) => t + p[1], 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/** Matched pairs for two metrics across all states. */
export function pairsFor(a: string, b: string): [number, number][] {
  const ma = metricById.get(a);
  const mb = metricById.get(b);
  if (!ma || !mb) return [];
  const out: [number, number][] = [];
  for (const s of censusStates) {
    const va = ma.get(s);
    const vb = mb.get(s);
    if (typeof va === 'number' && typeof vb === 'number' && Number.isFinite(va) && Number.isFinite(vb)) {
      out.push([va, vb]);
    }
  }
  return out;
}

/** Median of a numeric list. */
export function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* --------------------------------------------------------------- text bits */

/** "A, B and C" from a list. */
export function listNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
