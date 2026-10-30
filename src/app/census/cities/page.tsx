'use client';

/**
 * Cities — the largest municipal populations, and how fast each grew in the
 * decade to 2011. City boundaries, not urban agglomerations: the metros look
 * smaller here than their UAs because suburbs sit outside the corporation.
 */
import { useState } from 'react';
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { censusCities, cityGrowth, type CensusCity } from '@/lib/data/cities';
import { median, pearson } from '@/lib/census';
import { compactIN, nf } from '@/lib/format';

type Mode = 'largest' | 'fastest';

export default function CitiesPage() {
  const [mode, setMode] = useState<Mode>('largest');

  const byPop = [...censusCities].sort((a, b) => b.pop2011 - a.pop2011);
  const byGrowth = [...censusCities].sort((a, b) => cityGrowth(b) - cityGrowth(a));

  const big = byPop.filter((c) => c.pop2011 >= 1_000_000);
  const totalInBig = big.reduce((t, c) => t + c.pop2011, 0);
  const fastest = byGrowth.filter((c) => c.pop2011 > 200_000);

  const scatter = censusCities.filter((c) => c.pop2011 > 100_000);
  const r = pearson(scatter.map((c) => [Math.log10(c.pop2011), cityGrowth(c)]));

  const columns: Column<CensusCity>[] = [
    { key: 'n', header: 'City', render: (c) => c.n, sortValue: (c) => c.n },
    { key: 's', header: 'State / UT', render: (c) => <span className="muted">{c.s}</span>, sortValue: (c) => c.s },
    { key: 'p11', header: 'Population 2011', align: 'right', render: (c) => nf(c.pop2011), sortValue: (c) => c.pop2011 },
    { key: 'p01', header: 'Population 2001', align: 'right', render: (c) => nf(c.pop2001), sortValue: (c) => c.pop2001 },
    {
      key: 'g',
      header: 'Growth',
      align: 'right',
      render: (c) => {
        const g = cityGrowth(c);
        return <span style={{ color: g > 30 ? 'var(--accent-2)' : g < 10 ? 'var(--good)' : undefined }}>{g.toFixed(1)}%</span>;
      },
      sortValue: (c) => cityGrowth(c),
    },
    { key: 'added', header: 'People added', align: 'right', render: (c) => nf(c.pop2011 - c.pop2001), sortValue: (c) => c.pop2011 - c.pop2001 },
  ];

  return (
    <>
      <PageHeader
        title="Cities"
        description={`The ${censusCities.length} largest cities in India, with their 2001 and 2011 populations. Growth is the interesting column: several of the fastest-growing cities are not the biggest ones, and a few large cities barely grew at all.`}
        source="Census of India 2011 — city populations, 2001 and 2011"
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Largest city" value={byPop[0]?.n ?? '—'} note={nf(byPop[0]?.pop2011 ?? 0)} tone="accent" />
          <StatCard label="Cities over 1 million" value={big.length} note={`${compactIN(totalInBig)} people between them`} />
          <StatCard label="Fastest growing" value={fastest[0]?.n ?? '—'} note={`${cityGrowth(fastest[0]).toFixed(1)}% in a decade`} />
          <StatCard label="Slowest growing" value={byGrowth[byGrowth.length - 1]?.n ?? '—'} note={`${cityGrowth(byGrowth[byGrowth.length - 1]).toFixed(1)}%`} />
          <StatCard label="Median city growth" value={`${median(censusCities.map(cityGrowth)).toFixed(1)}%`} note="2001 → 2011" />
          <StatCard label="Cities listed" value={censusCities.length} note="municipal populations" />
        </CardGrid>

        <Card
          title={mode === 'largest' ? 'Largest cities' : 'Fastest-growing cities'}
          caption={
            mode === 'largest'
              ? 'Municipal population, 2011.'
              : 'Percent growth 2001 → 2011, among cities already above 200,000 — small towns grow fast from a tiny base, which tells you nothing.'
          }
          action={
            <div className="seg">
              <button className={mode === 'largest' ? 'on' : ''} onClick={() => setMode('largest')}>Largest</button>
              <button className={mode === 'fastest' ? 'on' : ''} onClick={() => setMode('fastest')}>Fastest</button>
            </div>
          }
        >
          <HorizontalBars
            items={(mode === 'largest' ? byPop.slice(0, 20) : fastest.slice(0, 20)).map((c) => ({
              label: c.n,
              value: mode === 'largest' ? c.pop2011 : cityGrowth(c),
              note: mode === 'largest' ? `${cityGrowth(c).toFixed(1)}%` : compactIN(c.pop2011),
            }))}
            valueFormat={(v) => (mode === 'largest' ? compactIN(v) : `${v.toFixed(0)}%`)}
          />
        </Card>

        <Card
          title="Size against growth"
          caption={`Each dot is a city above 100,000 people. r = ${r == null ? '—' : r.toFixed(2)} against log population — almost none. Being big does not make a city fast-growing or slow-growing.`}
        >
          <ScatterPlot
            points={scatter.map((c) => ({
              label: c.n,
              x: c.pop2011,
              y: cityGrowth(c),
              always: c.pop2011 > 8_000_000 || cityGrowth(c) > 60,
            }))}
            xLabel="Population 2011"
            yLabel="Growth 2001→2011 %"
            xFormat={(v) => compactIN(v)}
            yFormat={(v) => `${v.toFixed(0)}%`}
            medianX={median(scatter.map((c) => c.pop2011))}
            medianY={median(scatter.map(cityGrowth))}
            quadrantLabels={['small, slow', 'large, slow', 'small, fast', 'large, fast']}
            height={340}
          />
        </Card>

        <Card title="Every city in this table" caption="Sort by growth to find the outliers. CSV export follows the sort.">
          <DataTable
            rows={censusCities}
            columns={columns}
            initialSort="p11"
            exportName="census-cities"
            csvRow={(c) => ({
              city: c.n,
              state: c.s,
              population_2011: c.pop2011,
              population_2001: c.pop2001,
              growth_pct: +cityGrowth(c).toFixed(2),
              people_added: c.pop2011 - c.pop2001,
            })}
          />
        </Card>

        <div className="callout warn">
          <strong>City, not urban agglomeration.</strong> These are municipal corporation populations. A city like
          Chennai or Mumbai has a large suburban population outside its corporation limits, counted in the urban
          agglomeration but not here. That is why some metros show modest growth: the people are still arriving, they
          are just landing outside the boundary that this table measures. Read the growth column as &ldquo;growth inside
          the old city limits&rdquo;, which is often a story about annexation and congestion rather than about
          population.
        </div>
      </div>
    </>
  );
}
