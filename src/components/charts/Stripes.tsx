'use client';

/**
 * Stripes — "warming stripes": one vertical bar per year, coloured by how far
 * that year's mean sits from the baseline. Blue = cooler, red = hotter.
 */
function hex2rgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export interface StripePoint {
  year: number;
  anomaly: number;
}

export function Stripes({
  data,
  cool = '#2c7bb6',
  mid = '#f7f7f7',
  hot = '#d7191c',
}: {
  data: StripePoint[];
  cool?: string;
  mid?: string;
  hot?: string;
}) {
  if (!data.length) return null;
  const scale = Math.max(...data.map((d) => Math.abs(d.anomaly)), 0.6);
  const m = hex2rgb(mid);
  const c = hex2rgb(cool);
  const h = hex2rgb(hot);

  return (
    <div className="stripes" role="img" aria-label={`Warming stripes, ${data[0].year} to ${data[data.length - 1].year}`}>
      {data.map((d) => {
        const t = Math.max(-1, Math.min(1, d.anomaly / scale));
        const color = t < 0 ? mix(m, c, -t) : mix(m, h, t);
        return (
          <div
            key={d.year}
            className="s"
            style={{ background: color }}
            title={`${d.year}: ${d.anomaly > 0 ? '+' : ''}${d.anomaly.toFixed(2)}°C vs baseline`}
          />
        );
      })}
    </div>
  );
}
