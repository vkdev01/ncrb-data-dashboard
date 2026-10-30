'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { fetchAir, pm25Band, type AirMetric, type AirRow } from '@/lib/data/air';
import { usePublishPageData } from '@/components/insights/PageDataContext';
import type { PageContext } from '@/lib/insights/engine';

const METRICS: { id: AirMetric; label: string; unit: string }[] = [
  { id: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { id: 'pm10', label: 'PM10', unit: 'µg/m³' },
  { id: 'aqi', label: 'US AQI', unit: 'index' },
];

export default function AirPage() {
  const [rows, setRows] = useState<AirRow[] | null>(null);
  const [metric, setMetric] = useState<AirMetric>('pm25');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    fetchAir()
      .then(setRows)
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows]
      .filter((r) => r[metric] != null)
      .sort((a, b) => (b[metric] as number) - (a[metric] as number));
  }, [rows, metric]);

  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const active = METRICS.find((m) => m.id === metric)!;

  // Publish the live reading on screen, so the panel answers about today's
  // numbers for these cities rather than a generic context.
  const pageData = useMemo<PageContext | null>(() => {
    if (!rows || !sorted.length) return null;
    return {
      route: '/air',
      title: `Air quality — ${active.label}`,
      blurb: `Live ${active.label} (${active.unit}) for ${sorted.length} cities, fetched when this page loaded. Lower is better.`,
      series: [
        {
          id: 'air',
          label: `${active.label} by city, live`,
          short: active.label,
          unit: active.unit,
          format: (v) => v.toFixed(1),
          higherIsBetter: false,
          note: 'A single grid point per city, refreshed on page load. Bands follow the US EPA scale.',
          points: sorted.map((r) => ({ name: r.name, value: r[metric] as number })),
        },
      ],
      caveats: [
        'Live readings from Open-Meteo, one grid point per city — not a monitoring station average.',
        'PM2.5 bands follow the US EPA scale; India\u2019s CPCB scale sets a lower threshold for “poor”.',
        'A single reading is a snapshot, not an annual average; day-to-day variation is large.',
      ],
      source: 'Open-Meteo air quality API',
      prompts: ['Which city has the worst air?', 'Which city is cleanest?', 'Summarise this page'],
    };
  }, [rows, sorted, metric, active.label, active.unit]);

  usePublishPageData(pageData);

  return (
    <>
      <PageHeader
        title="Air quality, live"
        description="Current PM2.5, PM10 and US AQI for major Indian cities, straight from Open-Meteo. Refreshes when you reload."
        live={!error && !loading}
        status={loading ? 'loading' : 'ready'}
        source="Open-Meteo air-quality API"
      />

      <div className="stack">
        <div className="chip-row">
          {METRICS.map((m) => (
            <button key={m.id} className={`chip${metric === m.id ? ' active' : ''}`} onClick={() => setMetric(m.id)}>
              {m.label}
            </button>
          ))}
          <button className="btn-ghost" onClick={load} style={{ marginLeft: 'auto' }}>↻ Refresh</button>
        </div>

        {error ? (
          <div className="callout warn">Could not load live air quality: {error}. Try refreshing.</div>
        ) : loading ? (
          <div className="chart-empty">Fetching live readings…</div>
        ) : (
          <>
            {worst && best ? (
              <div className="callout">
                <strong>{worst.name} is the worst right now</strong> at {worst[metric]} {active.unit} ({pm25Band(worst.pm25).label}),
                against {best.name} at {best[metric]} {active.unit}. Readings are hourly and can swing a lot with the
                weather — treat them as a snapshot, not a yearly average.
              </div>
            ) : null}

            <Card title={`Cities ranked by ${active.label}`} caption="Highest first. Hover a bar for the reading.">
              <HorizontalBars
                items={sorted.map((r) => ({
                  label: r.name,
                  value: r[metric] as number,
                  note: metric === 'aqi' ? pm25Band(r.pm25).label : pm25Band(r.pm25).label,
                }))}
                valueFormat={(v) => `${Math.round(v)}`}
                color="var(--c4)"
                highlightColor="var(--c4)"
              />
            </Card>

            <Card title="Category bands" caption="US EPA PM2.5 breakpoints, for reading the numbers.">
              <ul className="about-list">
                <li><strong>Good</strong> — up to 12 µg/m³</li>
                <li><strong>Moderate</strong> — 12.1 to 35.4</li>
                <li><strong>Unhealthy for sensitive groups</strong> — 35.5 to 55.4</li>
                <li><strong>Unhealthy</strong> — 55.5 to 150.4</li>
                <li><strong>Very unhealthy</strong> — 150.5 to 250.4</li>
                <li><strong>Hazardous</strong> — above 250.4</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
