'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineChart } from '@/components/charts/LineChart';
import { Stripes } from '@/components/charts/Stripes';
import { CITIES, baseline, fetchCityClimate, slopePerDecade, type YearMean } from '@/lib/data/climate';

export default function ClimatePage() {
  const [city, setCity] = useState(CITIES[0].name);
  const [series, setSeries] = useState<YearMean[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const c = CITIES.find((x) => x.name === city)!;
    fetchCityClimate(c)
      .then((d) => alive && setSeries(d))
      .catch((e) => alive && setError(String(e.message ?? e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [city]);

  const stats = useMemo(() => {
    if (!series || series.length < 5) return null;
    const base = baseline(series, 1951, 1980);
    const latest = series[series.length - 1];
    const change = base != null ? latest.mean - base : null;
    const slope = slopePerDecade(series);
    const anomalies = series.map((d) => ({ year: d.year, anomaly: base != null ? d.mean - base : 0 }));
    return { base, latest, change, slope, anomalies };
  }, [series]);

  return (
    <>
      <PageHeader
        title="How much hotter is your city?"
        description="Yearly mean temperature since 1950 from the ERA5 reanalysis, compared with the 1951–1980 average. Each stripe is one year."
        live={!error && !loading}
        status={loading ? 'loading' : 'ready'}
        source="Open-Meteo historical archive (ERA5)"
      />

      <div className="stack">
        <div className="chip-row">
          {CITIES.map((c) => (
            <button key={c.name} className={`chip${city === c.name ? ' active' : ''}`} onClick={() => setCity(c.name)}>
              {c.name}
            </button>
          ))}
        </div>

        {error ? (
          <div className="callout warn">Could not load climate data for {city}: {error}</div>
        ) : loading || !stats ? (
          <div className="chart-empty">Loading {city}’s climate history…</div>
        ) : (
          <>
            <div className="card-grid" style={{ ['--min' as string]: '200px' }}>
              <StatCard label={`${city} — latest year`} value={`${stats.latest.mean.toFixed(1)}°C`} note={`mean of ${stats.latest.year}`} />
              <StatCard label="1951–80 baseline" value={stats.base != null ? `${stats.base.toFixed(1)}°C` : '—'} note="30-year average" />
              <StatCard
                label="Change since baseline"
                value={stats.change != null ? `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(2)}°C` : '—'}
                tone="accent2"
                note="latest year vs baseline"
              />
              <StatCard label="Trend" value={`${stats.slope > 0 ? '+' : ''}${stats.slope.toFixed(2)}°C`} note="per decade" tone="accent" />
            </div>

            <Card title={`${city} warming stripes`} caption="Blue is cooler than the 1951–80 average; red is hotter. Hover a stripe for its year.">
              <Stripes data={stats.anomalies} />
              <div className="stripes-legend">
                <span>{stats.anomalies[0].year}</span>
                <span className="stripes-ramp" style={{ background: 'linear-gradient(90deg,#2c7bb6,#f7f7f7,#d7191c)' }} />
                <span>{stats.anomalies[stats.anomalies.length - 1].year}</span>
              </div>
            </Card>

            <Card title="Yearly mean temperature" caption={`Annual mean for ${city}, with the long-run trend.`}>
              <LineChart
                height={300}
                series={[
                  {
                    name: 'Yearly mean',
                    color: 'var(--c1)',
                    points: series!.map((d) => ({ x: String(d.year), y: d.mean })),
                    area: true,
                  },
                ]}
                yFormat={(v) => `${v.toFixed(1)}°`}
                xLabel={(x) => x}
              />
            </Card>

            <div className="callout">
              <strong>What this does and doesn’t show.</strong> A single city’s year-to-year weather swings a lot; the
              signal is in the trend, not any one year. ERA5 is a reanalysis — a model fed by observations — so it is
              best read as a consistent long-run record rather than a station measurement.
            </div>
          </>
        )}
      </div>
    </>
  );
}
