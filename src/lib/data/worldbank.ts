/**
 * Economy — World Bank Open Data for India. Keyless and CORS-enabled.
 * The API returns [metadata, rows]; rows with a null value are dropped.
 */

export interface WbIndicator {
  id: string;
  label: string;
  unit: string;
  fmt: (v: number) => string;
}

const usd = (v: number) => `$${Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v)}`;

export const WB_INDICATORS: WbIndicator[] = [
  { id: 'NY.GDP.PCAP.CD', label: 'GDP per capita', unit: 'US$', fmt: usd },
  { id: 'NY.GDP.MKTP.CD', label: 'GDP', unit: 'US$', fmt: (v) => `$${(v / 1e12).toFixed(2)} T` },
  { id: 'SP.POP.TOTL', label: 'Population', unit: 'people', fmt: (v) => `${(v / 1e7).toFixed(1)} Cr` },
  { id: 'SP.DYN.LE00.IN', label: 'Life expectancy', unit: 'years', fmt: (v) => `${v.toFixed(1)} yrs` },
  { id: 'SE.ADT.LITR.ZS', label: 'Literacy rate', unit: '%', fmt: (v) => `${v.toFixed(1)}%` },
  { id: 'EG.ELC.ACCS.ZS', label: 'Access to electricity', unit: '%', fmt: (v) => `${v.toFixed(1)}%` },
  { id: 'IT.NET.USER.ZS', label: 'Internet users', unit: '% of population', fmt: (v) => `${v.toFixed(1)}%` },
  { id: 'SL.TLF.CACT.FE.ZS', label: 'Female labour-force participation', unit: '%', fmt: (v) => `${v.toFixed(1)}%` },
];

export interface WbPoint {
  year: number;
  value: number;
}

const cache = new Map<string, WbPoint[]>();

export async function fetchIndiaIndicator(indicatorId: string): Promise<WbPoint[]> {
  const hit = cache.get(indicatorId);
  if (hit) return hit;

  const url = `https://api.worldbank.org/v2/country/IND/indicator/${indicatorId}?format=json&per_page=200`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`);
  const json = await res.json();
  const rows: any[] = Array.isArray(json) && Array.isArray(json[1]) ? json[1] : [];

  const out = rows
    .filter((r) => r.value != null)
    .map((r) => ({ year: Number(r.date), value: Number(r.value) }))
    .sort((a, b) => a.year - b.year);

  cache.set(indicatorId, out);
  return out;
}
