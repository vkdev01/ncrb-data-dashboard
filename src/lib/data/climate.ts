/**
 * Climate — Open-Meteo historical archive (ERA5 reanalysis), 1950 → today.
 * Keyless and CORS-enabled, so this runs entirely in the browser.
 */

export interface City {
  name: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { name: 'Delhi', lat: 28.61, lon: 77.21 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Chennai', lat: 13.08, lon: 80.27 },
  { name: 'Kolkata', lat: 22.57, lon: 88.36 },
  { name: 'Bengaluru', lat: 12.97, lon: 77.59 },
  { name: 'Hyderabad', lat: 17.38, lon: 78.48 },
  { name: 'Pune', lat: 18.52, lon: 73.86 },
  { name: 'Ahmedabad', lat: 23.02, lon: 72.57 },
  { name: 'Jaipur', lat: 26.91, lon: 75.79 },
  { name: 'Lucknow', lat: 26.85, lon: 80.95 },
  { name: 'Bhopal', lat: 23.26, lon: 77.41 },
  { name: 'Guwahati', lat: 26.14, lon: 91.74 },
  { name: 'Kochi', lat: 9.93, lon: 76.27 },
  { name: 'Srinagar', lat: 34.08, lon: 74.8 },
  { name: 'Patna', lat: 25.59, lon: 85.14 },
];

export interface YearMean {
  year: number;
  mean: number;
}

const cache = new Map<string, YearMean[]>();

/** Yearly mean temperature for a city, aggregated from daily data. */
export async function fetchCityClimate(city: City): Promise<YearMean[]> {
  const hit = cache.get(city.name);
  if (hit) return hit;

  const end = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${city.lat}&longitude=${city.lon}` +
    `&start_date=1950-01-01&end_date=${end}&daily=temperature_2m_mean&timezone=Asia%2FKolkata`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const json = await res.json();
  const times: string[] = json?.daily?.time ?? [];
  const temps: (number | null)[] = json?.daily?.temperature_2m_mean ?? [];

  const acc = new Map<number, { sum: number; n: number }>();
  times.forEach((t, i) => {
    const v = temps[i];
    if (v == null) return;
    const y = Number(t.slice(0, 4));
    const a = acc.get(y) ?? { sum: 0, n: 0 };
    a.sum += v;
    a.n += 1;
    acc.set(y, a);
  });

  const out = [...acc.entries()]
    .map(([year, a]) => ({ year, mean: a.sum / a.n }))
    .sort((x, y) => x.year - y.year);

  cache.set(city.name, out);
  return out;
}

/** Baseline mean over a year window (e.g. 1951–1980). */
export function baseline(series: YearMean[], from: number, to: number): number | null {
  const inRange = series.filter((d) => d.year >= from && d.year <= to);
  if (!inRange.length) return null;
  return inRange.reduce((s, d) => s + d.mean, 0) / inRange.length;
}

/** Simple least-squares slope per decade, in °C. */
export function slopePerDecade(series: YearMean[]): number {
  const n = series.length;
  if (n < 2) return 0;
  const mx = series.reduce((s, d) => s + d.year, 0) / n;
  const my = series.reduce((s, d) => s + d.mean, 0) / n;
  let num = 0;
  let den = 0;
  for (const d of series) {
    num += (d.year - mx) * (d.mean - my);
    den += (d.year - mx) ** 2;
  }
  return den === 0 ? 0 : (num / den) * 10;
}
