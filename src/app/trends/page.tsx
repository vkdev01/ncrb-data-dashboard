'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineChart } from '@/components/charts/LineChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDataset } from '@/lib/hooks/useDataset';
import { compactIN, nf, rate as rateFmt } from '@/lib/format';
import { cagr, deltaPct, first, last } from '@/lib/analytics';
import type { NationalTrendPoint } from '@/lib/data/types';

type View = 'counts' | 'rate';

export default function TrendsPage() {
  const { data, live, status } = useDataset('overview');
  const [view, setView] = useState<View>('counts');
  const trend = data.nationalTrend;
  const start = first(trend);
  const end = last(trend);

  const columns: Column<NationalTrendPoint>[] = [
    { key: 'year', header: 'Year', render: (r) => r.year, sortValue: (r) => Number(r.year) },
    { key: 'total', header: 'Total', align: 'right', render: (r) => nf(r.total), sortValue: (r) => r.total },
    { key: 'ipc', header: 'IPC', align: 'right', render: (r) => nf(r.ipc), sortValue: (r) => r.ipc },
    { key: 'sll', header: 'SLL', align: 'right', render: (r) => nf(r.sll), sortValue: (r) => r.sll },
    { key: 'rate', header: 'Rate /100k', align: 'right', render: (r) => rateFmt(r.rate), sortValue: (r) => r.rate },
  ];

  return (
    <>
      <PageHeader
        title="Trends over time"
        description="Year-wise national totals, the IPC/SLL split, and the population-normalised crime rate."
        live={live}
        status={status}
        source={data.source}
      />

      <div className="stack">
        <div className="card-grid" style={{ ['--min' as string]: '210px' }}>
          <StatCard
            label="Change since 2014"
            value={start && end ? `${deltaPct(start.total, end.total) >= 0 ? '+' : ''}${deltaPct(start.total, end.total).toFixed(1)}%` : '—'}
            note="total recorded crimes"
            tone="accent"
          />
          <StatCard
            label="Avg. yearly growth"
            value={start && end ? `${cagr(start.total, end.total, trend.length - 1).toFixed(1)}%` : '—'}
            note="compound, 2014→latest"
          />
          <StatCard
            label="Crime rate now"
            value={end ? rateFmt(end.rate) : '—'}
            note={end ? `per 100,000 in ${end.year}` : ''}
          />
          <StatCard
            label="IPC share"
            value={end ? `${((end.ipc / end.total) * 100).toFixed(1)}%` : '—'}
            note="of all cognizable crimes"
            tone="accent2"
          />
        </div>

        <Card
          title="National trend"
          caption="Switch between raw counts and the rate per 100,000 population."
          action={
            <div className="seg">
              <button className={view === 'counts' ? 'on' : ''} onClick={() => setView('counts')}>
                Counts
              </button>
              <button className={view === 'rate' ? 'on' : ''} onClick={() => setView('rate')}>
                Rate
              </button>
            </div>
          }
        >
          {view === 'counts' ? (
            <LineChart
              height={320}
              series={[
                { name: 'Total', color: 'var(--c1)', points: trend.map((t) => ({ x: t.year, y: t.total })), area: true },
                { name: 'IPC', color: 'var(--c3)', points: trend.map((t) => ({ x: t.year, y: t.ipc })) },
                { name: 'SLL', color: 'var(--c2)', points: trend.map((t) => ({ x: t.year, y: t.sll })) },
              ]}
              valueFormat={(v) => `${compactIN(v)} (${nf(v)})`}
            />
          ) : (
            <LineChart
              height={320}
              series={[{ name: 'Crime rate', color: 'var(--c4)', points: trend.map((t) => ({ x: t.year, y: t.rate })), area: true }]}
              valueFormat={(v) => `${v.toFixed(1)} per 100k`}
            />
          )}
        </Card>

        <Card title="Year-by-year table" caption="Click a column header to sort.">
          <DataTable rows={trend} columns={columns} initialSort="year" initialDir="asc" />
        </Card>
      </div>
    </>
  );
}
