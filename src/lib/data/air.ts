/**
 * Air quality — Open-Meteo air-quality API. Keyless, CORS-enabled, live.
 * Multiple coordinates come back as an array in the same order they were sent.
 */
import { CITIES } from './climate';

export interface AirRow {
  name: string;
  pm25: number | null;
  pm10: number | null;
  aqi: number | null;
  time: string | null;
}

export type AirMetric = 'pm25' | 'pm10' | 'aqi';

export async function fetchAir(): Promise<AirRow[]> {
  const lat = CITIES.map((c) => c.lat).join(',');
  const lon = CITIES.map((c) => c.lon).join(',');
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
    `&current=pm2_5,pm10,us_aqi&timezone=Asia%2FKolkata`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const json = await res.json();
  const arr: any[] = Array.isArray(json) ? json : [json];

  return CITIES.map((c, i) => ({
    name: c.name,
    pm25: arr[i]?.current?.pm2_5 ?? null,
    pm10: arr[i]?.current?.pm10 ?? null,
    aqi: arr[i]?.current?.us_aqi ?? null,
    time: arr[i]?.current?.time ?? null,
  }));
}

/** US EPA PM2.5 breakpoints → band label + colour. */
export function pm25Band(v: number | null): { label: string; color: string } {
  if (v == null) return { label: 'no data', color: 'var(--surface-3)' };
  if (v <= 12) return { label: 'Good', color: '#3fae6e' };
  if (v <= 35.4) return { label: 'Moderate', color: '#e9c46a' };
  if (v <= 55.4) return { label: 'Unhealthy (sensitive)', color: '#f0904a' };
  if (v <= 150.4) return { label: 'Unhealthy', color: '#e06b6b' };
  if (v <= 250.4) return { label: 'Very unhealthy', color: '#a66bb0' };
  return { label: 'Hazardous', color: '#8c3b57' };
}
