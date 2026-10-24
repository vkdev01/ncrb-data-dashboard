'use client';

import Link from 'next/link';
import { Card, CardGrid } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineChart } from '@/components/charts/LineChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { useDataset } from '@/lib/hooks/useDataset';
import { SOURCES } from '@/lib/data/sources';
import { nav } from '@/config/site';
import { colorAt } from '@/config/palette';
import { compactIN, nf, pct, rate, shortDate } from '@/lib/format';
import { cagr, first, last, topN } from '@/lib/analytics';

export default function OverviewPage() {
  const { data: summary, live, status } = useDataset('summary');
  const { data: overview } = useDataset('overview');

  const trend = overview.nationalTrend;
  const start = first(trend);
  const end = last(trend);
  const growth = start && end ? cagr(start.total, end.total, trend.length - 1) : 0;

  return (
    <>
      <PageHeader
        title="India's recorded crime, at a glance"
        description="Headline figures from NCRB's Crime in India, with the ten-year national trend. Use the tabs above to explore categories, states, women's safety and cybercrime."
        live={live}
        status={status}
        source={summary.source}
      >
        <span className="source-line">Data year {summary.dataYear} · updated {shortDate(summary.lastUpdated)}</span>
      </PageHeader>

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Total cognizable crimes" value={compactIN(summary.totalCrimes)} note={`${nf(summary.totalCrimes)} cases`} tone="accent" />
          <StatCard label="Crime rate" value={rate(summary.crimeRate)} note="per 100,000 population" />
          <StatCard label="Crimes against women" value={compactIN(summary.womenCrimes)} note={`${nf(summary.womenCrimes)} cases`} tone="accent2" />
          <StatCard label="Cybercrimes" value={compactIN(summary.cybercrimes)} note={`${nf(summary.cybercrimes)} cases`} tone="accent2" />
          <StatCard label="Chargesheeting rate" value={pct(summary.chargesheetRatePct)} note="cases sent for trial" />
          <StatCard label="Conviction rate" value={pct(summary.convictionRatePct)} note="of cases decided" />
        </CardGrid>

        <Card
          title="National trend: IPC vs SLL"
          caption="Total cognizable crimes split by the Indian Penal Code and Special & Local Laws, 2014 onwards."
        >
          <LineChart
            height={300}
            series={[
              { name: 'Total', color: 'var(--c1)', points: trend.map((t) => ({ x: t.year, y: t.total })), area: true },
              { name: 'IPC', color: 'var(--c3)', points: trend.map((t) => ({ x: t.year, y: t.ipc })) },
              { name: 'SLL', color: 'var(--c2)', points: trend.map((t) => ({ x: t.year, y: t.sll })) },
            ]}
            valueFormat={(v) => `${compactIN(v)} (${nf(v)})`}
          />
          {start && end ? (
            <p className="card-cap" style={{ marginTop: 12 }}>
              {start.year} → {end.year}: total recorded crimes moved from {compactIN(start.total)} to {compactIN(end.total)}
              {' '}({(growth >= 0 ? '+' : '') + growth.toFixed(1)}% a year on average). Note 2020–21 reflect pandemic-period
              reporting changes, not necessarily a change in underlying crime.
            </p>
          ) : null}
        </Card>

        <div className="grid-2">
          <Card title="IPC composition" caption="How the IPC total breaks down by offence head (latest year).">
            <DonutChart
              slices={overview.ipcComposition.map((c, i) => ({ name: c.name, value: c.cases, color: colorAt(i) }))}
              valueFormat={(v) => compactIN(v, 1)}
            />
          </Card>

          <Card title="Highest crime rates" caption="Top states/UTs by recorded crime rate per 100,000.">
            <HorizontalBars
              items={topN(overview.stateRates, (s) => s.rate, 10).map((s) => ({ label: s.name, value: s.rate }))}
              valueFormat={(v) => v.toFixed(0)}
            />
            <p className="card-cap" style={{ marginTop: 12 }}>
              Rate normalises for population, so it is fairer than raw counts — but it still reflects how much gets
              recorded, which varies by state. <Link href="/states">See all states →</Link>
            </p>
          </Card>
        </div>

        <Card title="Explore" caption="Each view is a separate page, so more can be added without touching the rest.">
          <div className="card-grid" style={{ ['--min' as string]: '230px' }}>
            {nav
              .filter((n) => n.blurb && n.href !== '/')
              .map((n) => (
                <Link key={n.href} href={n.href} className="nav-card">
                  <strong>{n.label}</strong>
                  <span>{n.blurb}</span>
                </Link>
              ))}
          </div>
        </Card>

        <p className="muted" style={{ fontSize: '0.8rem' }}>
          Live feed: {SOURCES.overview.origin}. Recorded offences are not a direct measure of underlying crime —
          see <Link href="/about">methodology</Link>.
        </p>
      </div>
    </>
  );
}
