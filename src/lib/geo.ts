/**
 * Geo helpers — load the bundled India district boundaries and turn them into
 * SVG path strings. Deliberately dependency-free: a small Mercator projection
 * is all we need for a country-sized choropleth.
 */

export interface GeoFeature {
  properties: { d: string; s: string; sc?: string; dc?: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
}
export interface GeoCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface PathFeature {
  /** SVG path data */
  d: string;
  /** district name */
  district: string;
  /** state name */
  state: string;
}

export interface ProjectedGeo {
  features: PathFeature[];
  width: number;
  height: number;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export async function loadGeo(): Promise<GeoCollection> {
  const res = await fetch(`${BASE}/data/india-districts.geojson`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Spherical Mercator, then scaled to a viewBox.
 *  Note: x must be in radians too, or the map squashes — degrees and Mercator
 *  y-units are not the same scale. */
export function project(geo: GeoCollection, width = 620): ProjectedGeo {
  const toXY = (lon: number, lat: number): [number, number] => [
    (lon * Math.PI) / 180,
    Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
  ];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const rings: { ring: number[][]; props: GeoFeature['properties'] }[] = [];

  for (const f of geo.features) {
    const polys =
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates as number[][][]]
        : (f.geometry.coordinates as number[][][][]);
    for (const poly of polys) {
      for (const ring of poly) {
        const projected = ring.map(([lon, lat]) => toXY(lon, lat));
        rings.push({ ring: projected, props: f.properties });
        for (const [x, y] of projected) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const pad = 6;
  const scale = (width - pad * 2) / (maxX - minX || 1);
  const height = Math.round((maxY - minY) * scale + pad * 2);
  const sx = (x: number) => (x - minX) * scale + pad;
  const sy = (y: number) => height - ((y - minY) * scale + pad);

  const features: PathFeature[] = rings.map(({ ring, props }) => {
    let d = '';
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = ring[i];
      d += `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
    }
    return { d: d + 'Z', district: props.d, state: props.s };
  });

  return { features, width, height };
}

/* ---------------------------------------------------------------- colour scale */

function hex2rgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Sequential ramp from `from` to `to`. Returns a function value→colour. */
export function sequentialScale(min: number, max: number, from = '#dbeafe', to = '#0f766e') {
  const a = hex2rgb(from);
  const b = hex2rgb(to);
  return (v: number) => {
    if (!Number.isFinite(v)) return 'var(--surface-3)';
    const t = max === min ? 0.5 : Math.max(0, Math.min(1, (v - min) / (max - min)));
    return mix(a, b, t);
  };
}

export const NO_DATA = 'var(--surface-3)';
