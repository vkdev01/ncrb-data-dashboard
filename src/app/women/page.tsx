'use client';

import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineChart } from '@/components/charts/LineChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDataset } from '@/lib/hooks/useDataset';
import { colorAt } from '@/config/palette';
import { compactIN, nf, pct, rate as rateFmt } from '@/lib/format';
import { first, last, topN } from '@/lib/analytics';
import type { StateRate } from '@/lib/data/types';

export default function WomenPage() {
  const { data, live, status } = useDataset('womenSafety');
  const start = first(data.nationalTrend);
  const end = last(data.nationalTrend);

  const columns: Column<StateRate>[] = [
    { key: 'name', header: 'State / UT', render: (r) => r.name, sortValue: (r) => r.name },
    { key: 'rate', header: 'Rate /100k women', align: 'right', render: (r) => rateFmt(r.rate), sortValue: (r) => r.rate },
    { key: 'total', header: 'Cases', align: 'right', render: (r) => (r.total != null ? nf(r.total) : '—'), sortValue: (r) => r.total ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="Crimes against women"
        description="Trend, offence composition and state-wise rates. Rate here is per 100,000 women, not of the whole population."
        live={live}
        status={status}
        source={data.source}
      />

      <div className="stack">
        <div className="card-grid" style={{ ['--min' as string]: '210px' }}>
          <StatCard label="Cases (latest)" value={compactIN(end?.total ?? 0)} note={`${nf(end?.total ?? 0)} recorded`} tone="accent2" />
          <StatCard label="Rate per 100k women" value={end ? rateFmt(end.rate) : '—'} note={end ? `in ${end.year}` : ''} />
          <StatCard
            label="Change since 2014"
            value={start && end ? `${(((end.total - start.total) / start.total) * 100).toFixed(1)}%` : '—'}
            note="recorded cases"
          />
          <StatCard
            label="Largest head"
            value={data.crimeTypes[0] ? pct(data.crimeTypes[0].pct) : '—'}
            note={data.crimeTypes[0]?.name}
          />
        </div>

        <div className="grid-2">
          <Card title="Recorded cases over time" caption="National total of crimes against women, 2014 onwards.">
            <LineChart
              height={280}
              series={[{ name: 'Cases', color: 'var(--c4)', points: data.nationalTrend.map((t) => ({ x: t.year, y: t.total })), area: true }]}
              valueFormat={(v) => `${compactIN(v)} (${nf(v)})`}
            />
          </Card>
          <Card title="Composition" caption="Share of the women's-safety total by offence head.">
            <DonutChart
              slices={data.crimeTypes.map((c, i) => ({ name: c.name, value: c.cases, color: colorAt(i) }))}
              valueFormat={(v) => compactIN(v, 1)}
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="By offence head" caption="Ranked by recorded cases.">
            <HorizontalBars
              items={data.crimeTypes.map((c) => ({ label: c.name, value: c.cases }))}
              valueFormat={(v) => compactIN(v, 1)}
              color="var(--c4)"
              highlightColor="var(--c4)"
            />
          </Card>
          <Card title="Highest state rates" caption="Top 12 by rate per 100,000 women.">
            <HorizontalBars
              items={topN(data.stateRates, (s) => s.rate, 12).map((s) => ({ label: s.name, value: s.rate }))}
              valueFormat={(v) => v.toFixed(0)}
            />
          </Card>
        </div>

        <Card title="All states & UTs" caption="Rate is per 100,000 women in that state.">
          <DataTable
            rows={data.stateRates}
            columns={columns}
            initialSort="rate"
            exportName="ncrb-women-state-rates"
            csvRow={(r) => ({ state: r.name, rate_per_100k_women: r.rate, cases: r.total ?? null })}
          />
        </Card>

        <div className="callout">
          <strong>Recorded ≠ prevalence.</strong> These are police-recorded offences. Surveys that ask women directly
          find substantially more violence than is ever reported, and the reporting gap differs by state and by
          offence. Treat a higher rate as more registration, not automatically more harm — and a lower rate as
          possible under-reporting.
        </div>
      </div>
    </>
  );
}
