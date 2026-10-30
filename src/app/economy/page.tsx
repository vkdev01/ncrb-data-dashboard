'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineChart } from '@/components/charts/LineChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { WB_INDICATORS, fetchIndiaIndicator, type WbPoint } from '@/lib/data/worldbank';
import { usePublishPageData } from '@/components/insights/PageDataContext';
import type { PageContext } from '@/lib/insights/engine';

interface Row {
  year: number;
  value: number;
}

export default function EconomyPage() {
  const [indicatorId, setIndicatorId] = useState(WB_INDICATORS[0].id);
  const [points, setPoints] = useState<WbPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchIndiaIndicator(indicatorId)
      .then((d) => alive && setPoints(d))
      .catch((e) => alive && setError(String(e.message ?? e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [indicatorId]);

  const ind = WB_INDICATORS.find((i) => i.id === indicatorId)!;

  // Publish the selected indicator, so the panel answers about the series the
  // reader is actually looking at rather than the default one.
  const pageData = useMemo<PageContext | null>(() => {
    if (!points || points.length < 2) return null;
    const first = points[0];
    const last = points[points.length - 1];
    return {
      route: '/economy',
      title: `India — ${ind.label}`,
      blurb:
        `World Bank series for India: ${ind.label} (${ind.unit}), ${first.year} to ${last.year}. ` +
        `Latest value ${ind.fmt(last.value)}.`,
      series: [
        {
          id: 'wb',
          label: ind.label,
          short: ind.label,
          unit: ind.unit,
          format: ind.fmt,
          higherIsBetter: null,
          note: 'Annual World Bank figure for India. Years with no value are omitted, so gaps are missing data rather than zero.',
          points: points.map((p) => ({ name: String(p.year), value: p.value })),
        },
      ],
      caveats: [
        'World Bank data lags one to two years; the latest year is often provisional and gets revised.',
        'A single indicator says little on its own — level and rate of change are different questions.',
      ],
      source: 'World Bank Open Data',
      prompts: ['Which year had the highest value?', 'Which year was lowest?', 'Summarise this page'],
    };
  }, [points, ind]);

  usePublishPageData(pageData);

  const stats = useMemo(() => {
    if (!points || points.length < 2) return null;
    const first = points[0];
    const last = points[points.length - 1];
    return {
      first,
      last,
      change: first.value !== 0 ? ((last.value - first.value) / first.value) * 100 : null,
      span: last.year - first.year,
    };
  }, [points]);

  const columns: Column<Row>[] = [
    { key: 'year', header: 'Year', render: (r) => r.year, sortValue: (r) => r.year },
    { key: 'value', header: ind.label, align: 'right', render: (r) => ind.fmt(r.value), sortValue: (r) => r.value },
  ];

  return (
    <>
      <PageHeader
        title="India's economy and development"
        description="Sixty years of World Bank indicators — income, population, health, education and access. Pick a measure to plot it."
        live={!error && !loading}
        status={loading ? 'loading' : 'ready'}
        source="World Bank Open Data"
      />

      <div className="stack">
        <div className="chip-row">
          {WB_INDICATORS.map((i) => (
            <button key={i.id} className={`chip${indicatorId === i.id ? ' active' : ''}`} onClick={() => setIndicatorId(i.id)}>
              {i.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="callout warn">Could not load World Bank data: {error}</div>
        ) : loading || !points ? (
          <div className="chart-empty">Loading {ind.label.toLowerCase()}…</div>
        ) : points.length === 0 ? (
          <div className="callout warn">No published values for {ind.label}.</div>
        ) : (
          <>
            <div className="card-grid" style={{ ['--min' as string]: '210px' }}>
              <StatCard label={`${ind.label}, ${stats?.last.year ?? ''}`} value={stats ? ind.fmt(stats.last.value) : '—'} tone="accent" />
              <StatCard label={`${ind.label}, ${stats?.first.year ?? ''}`} value={stats ? ind.fmt(stats.first.value) : '—'} note="earliest year available" />
              <StatCard
                label="Change over the series"
                value={stats?.change != null ? `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(0)}%` : '—'}
                note={stats ? `${stats.span} years` : undefined}
                tone="accent2"
              />
              <StatCard label="Data points" value={String(points.length)} note="annual observations" />
            </div>

            <Card title={`${ind.label} — India`} caption={`${ind.unit}. World Bank Open Data.`}>
              <LineChart
                height={320}
                series={[
                  {
                    name: ind.label,
                    color: 'var(--c1)',
                    points: points.map((p) => ({ x: String(p.year), y: p.value })),
                    area: true,
                  },
                ]}
                yFormat={(v) => ind.fmt(v)}
                xLabel={(x) => x}
              />
            </Card>

            <Card title="Every observation" caption="Click a column to sort.">
              <DataTable
                rows={points as Row[]}
                columns={columns}
                initialSort="year"
                initialDir="asc"
                exportName={`worldbank-india-${indicatorId}`}
                csvRow={(r) => ({ indicator: ind.label, year: r.year, value: r.value })}
              />
            </Card>

            <div className="callout">
              <strong>A trend, not a story.</strong> These are national aggregates. A rising GDP per capita says nothing
              about how the gains are shared, and a flat indicator can hide large regional differences. World Bank
              figures are also revised, so values can shift between releases.
            </div>
          </>
        )}
      </div>
    </>
  );
}
