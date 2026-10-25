'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDataset } from '@/lib/hooks/useDataset';
import { compactIN, nf, rate as rateFmt } from '@/lib/format';
import { mean, rankBy, sumBy, topN } from '@/lib/analytics';
import type { StateRate } from '@/lib/data/types';

export default function StatesPage() {
  const { data, live, status } = useDataset('overview');
  const [q, setQ] = useState('');

  const rows = useMemo(
    () => data.stateRates.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase())),
    [data.stateRates, q],
  );

  const avg = mean(data.stateRates.map((s) => s.rate));
  const total = sumBy(data.stateRates, (s) => s.total ?? 0);
  const top = topN(data.stateRates, (s) => s.rate, 5);

  const columns: Column<StateRate>[] = [
    {
      key: 'rank',
      header: '#',
      align: 'right',
      render: (r) => rankBy(data.stateRates, (s) => s.rate, (s) => s.id === r.id),
      sortValue: (r) => rankBy(data.stateRates, (s) => s.rate, (s) => s.id === r.id),
    },
    { key: 'name', header: 'State / UT', render: (r) => r.name, sortValue: (r) => r.name },
    { key: 'rate', header: 'Rate /100k', align: 'right', render: (r) => rateFmt(r.rate), sortValue: (r) => r.rate },
    {
      key: 'total',
      header: 'Cases',
      align: 'right',
      render: (r) => (r.total != null ? nf(r.total) : '—'),
      sortValue: (r) => r.total ?? 0,
    },
    {
      key: 'vs',
      header: 'vs national avg',
      align: 'right',
      render: (r) => {
        const d = r.rate - avg;
        return <span style={{ color: d >= 0 ? 'var(--accent-2)' : 'var(--good)' }}>{d >= 0 ? '+' : ''}{d.toFixed(0)}</span>;
      },
      sortValue: (r) => r.rate - avg,
    },
  ];

  return (
    <>
      <PageHeader
        title="States & union territories"
        description="Crime rate per 100,000 population — the fairer basis for comparison than raw case counts."
        live={live}
        status={status}
        source={data.source}
      />

      <div className="stack">
        <div className="card-grid" style={{ ['--min' as string]: '230px' }}>
          <div className="stat">
            <div className="stat-k">States & UTs covered</div>
            <div className="stat-v">{data.stateRates.length}</div>
          </div>
          <div className="stat">
            <div className="stat-k">Mean rate</div>
            <div className="stat-v">{rateFmt(avg)}</div>
            <div className="stat-note">per 100,000</div>
          </div>
          <div className="stat">
            <div className="stat-k">Highest</div>
            <div className="stat-v tone-accent2">{rateFmt(top[0]?.rate ?? 0)}</div>
            <div className="stat-note">{top[0]?.name}</div>
          </div>
          <div className="stat">
            <div className="stat-k">Cases across listed states</div>
            <div className="stat-v">{compactIN(total)}</div>
            <div className="stat-note">{nf(total)} recorded</div>
          </div>
        </div>

        <div className="grid-2">
          <Card title="Ranked by crime rate" caption="Top 12 states/UTs. A high rate often reflects more registration, not necessarily more crime.">
            <HorizontalBars
              items={topN(data.stateRates, (s) => s.rate, 12).map((s) => ({ label: s.name, value: s.rate }))}
              valueFormat={(v) => v.toFixed(0)}
            />
          </Card>
          <Card title="Lowest rates" caption="The other end of the same ranking.">
            <HorizontalBars
              items={[...data.stateRates]
                .sort((a, b) => a.rate - b.rate)
                .slice(0, 12)
                .map((s) => ({ label: s.name, value: s.rate }))}
              valueFormat={(v) => v.toFixed(0)}
              color="var(--c5)"
              highlightColor="var(--c5)"
              sort={false}
            />
          </Card>
        </div>

        <Card
          title="All states & UTs"
          caption="Search or click a column to sort."
          action={
            <input
              className="filter"
              placeholder="Filter states…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Filter states"
            />
          }
        >
          <DataTable
            rows={rows}
            columns={columns}
            initialSort="rate"
            exportName="ncrb-states"
            csvRow={(r) => ({ state: r.name, rate_per_100k: r.rate, cases: r.total ?? null, vs_national_avg: +(r.rate - avg).toFixed(1) })}
          />
        </Card>

        <div className="callout warn">
          <strong>Why rate, not counts?</strong> Raw case counts mostly track population — Uttar Pradesh will almost
          always top a count table. Dividing by population removes that, but the result still mixes three different
          things: actual offending, the propensity to report, and how police register cases. Differences between
          states should never be read as differences in safety alone.
        </div>
      </div>
    </>
  );
}
