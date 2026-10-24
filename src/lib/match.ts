/**
 * Name matching for the choropleth.
 *
 * The boundary file and the NCRB district tables come from different sources,
 * so their district spellings disagree in small ways ("Sahibganj" vs
 * "Sahebganj", "East Singhbhum" vs "East Singhbum", hyphens vs spaces). A naive
 * exact match leaves most of the map grey, so we normalise, then fall back to a
 * fuzzy match *within the same state*.
 */

/** Lowercase and drop everything that isn't a letter or digit. */
export function normName(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Classic edit distance, capped for speed. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

export interface DistrictDatum {
  d: string;
  s: string;
  v: number;
}

export interface MatchResult {
  value: number;
  /** how the match was made — useful for reporting quality */
  how: 'exact' | 'fuzzy';
  matchedName: string;
}

export interface DistrictIndex {
  /** Look up a value for a boundary feature. */
  get(state: string, district: string): MatchResult | undefined;
  /** How many boundary districts resolved, out of the total attempted. */
  stats: { exact: number; fuzzy: number; miss: number };
}

/** Build a lookup from the NCRB rows, keyed by normalised state → districts. */
export function buildDistrictIndex(rows: DistrictDatum[]): DistrictIndex {
  const byState = new Map<string, { n: string; raw: string; v: number }[]>();
  for (const r of rows) {
    const key = normName(r.s);
    const list = byState.get(key) ?? [];
    list.push({ n: normName(r.d), raw: r.d, v: r.v });
    byState.set(key, list);
  }

  const stats = { exact: 0, fuzzy: 0, miss: 0 };

  function get(state: string, district: string): MatchResult | undefined {
    const dn = normName(district);
    if (!dn) return undefined;
    const list = byState.get(normName(state));
    if (!list) {
      stats.miss++;
      return undefined;
    }
    // 1. exact on the normalised name
    const exact = list.find((x) => x.n === dn);
    if (exact) {
      stats.exact++;
      return { value: exact.v, how: 'exact', matchedName: exact.raw };
    }
    // 2. fuzzy within the same state
    let best: { x: (typeof list)[number]; dist: number } | null = null;
    for (const x of list) {
      const dist = levenshtein(dn, x.n);
      if (!best || dist < best.dist) best = { x, dist };
    }
    if (best && best.dist <= 2) {
      stats.fuzzy++;
      return { value: best.x.v, how: 'fuzzy', matchedName: best.x.raw };
    }
    stats.miss++;
    return undefined;
  }

  return { get, stats };
}
