'use client';

/**
 * Urbanisation — the share, the absolute numbers, and the difference between
 * "highly urban" and "holds a lot of urban people". They are not the same list.
 */
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DonutChart } from '@/components/charts/DonutChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { censusMeta, censusStates, india, type CensusState } from '@/lib/data/census';
import { banded, ranked, ruralPop, urbanBands, urbanPop } from '@/lib/census';
import { compactIN, nf, pct } from '@/lib/format';

export default function UrbanisationPage() {
  const byPct = ranked('urbanPct');
  const byCount = ranked('urbanPop');
  const bands = banded('urbanPct', urbanBands);

  const totalUrban = (india.pop2011 * india.urbanPct) / 100;
  const top10Urban = byCount.slice(0, 10).reduce((t, r) => t + r.value, 0);

  const columns: Column<CensusState>[] = [
    { key: 'name', header: 'State / UT', render: (r) => r.name, sortValue: (r) => r.name },
    { key: 'pct', header: 'Urban %', align: 'right', render: (r) => (r.urbanPct == null ? '—' : pct(r.urbanPct)), sortValue: (r) => r.urbanPct ?? 0 },
    { key: 'urban', header: 'Urban persons', align: 'right', render: (r) => { const u = urbanPop(r); return u == null ? '—' : nf(u); }, sortValue: (r) => urbanPop(r) ?? 0 },
    { key: 'rural', header: 'Rural persons', align: 'right', render: (r) => { const u = ruralPop(r); return u == null ? '—' : nf(u); }, sortValue: (r) => ruralPop(r) ?? 0 },
    { key: 'pop', header: 'Total', align: 'right', render: (r) => nf(r.pop2011), sortValue: (r) => r.pop2011 },
  ];

  return (
    <>
      <PageHeader
        title="Urbanisation"
        description="Just under a third of Indians lived in towns and cities in 2011 — 377 million people, more than the entire population of the United States at the time. India urbanises slowly as a share and enormously as a number."
        source={censusMeta.source}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Urban share" value={pct(india.urbanPct)} note={`rural ${pct(india.ruralPct)}`} tone="accent" />
          <StatCard label="Urban population" value={compactIN(totalUrban)} note={nf(totalUrban)} />
          <StatCard label="Most urbanised" value={byPct[0]?.state.name ?? '—'} note={pct(byPct[0]?.value ?? 0)} />
          <StatCard label="Least urbanised" value={byPct[byPct.length - 1]?.state.name ?? '—'} note={pct(byPct[byPct.length - 1]?.value ?? 0)} tone="warn" />
          <StatCard label="Largest urban population" value={byCount[0]?.state.name ?? '—'} note={compactIN(byCount[0]?.value ?? 0)} />
          <StatCard label="Top 10 hold" value={pct((top10Urban / totalUrban) * 100)} note="of India's urban population" />
        </CardGrid>

        <div className="callout">
          <strong>Percentage and headcount give different rankings.</strong> Tamil Nadu is more urbanised than
          Maharashtra as a share of its population, but Maharashtra holds far more urban residents in absolute terms.
          Both facts matter: the share determines how much of a state&apos;s policy is municipal, the headcount
          determines how many people that policy has to reach.
        </div>

        <div className="grid-2">
          <Card title="India, urban and rural" caption="Share of the 1.21 billion.">
            <DonutChart
              slices={[
                { name: 'Rural', value: totalUrban === 0 ? 1 : india.pop2011 - totalUrban, color: 'var(--c4)' },
                { name: 'Urban', value: totalUrban, color: 'var(--c2)' },
              ]}
              valueFormat={(v) => compactIN(v)}
            />
          </Card>
          <Card title="Urbanisation bands" caption="How the 36 units distribute. Most of India is in the two lowest bands.">
            <DonutChart
              slices={bands.map((b, i) => ({ name: b.band.label, value: b.states.length, color: ['var(--c5)', 'var(--c4)', 'var(--c3)', 'var(--c2)'][i] ?? 'var(--c1)' }))}
              valueFormat={(v) => `${v.toFixed(0)} units`}
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Most urbanised" caption="Share of population in urban areas.">
            <HorizontalBars items={byPct.slice(0, 12).map((r) => ({ label: r.state.name, value: r.value }))} valueFormat={(v) => `${v.toFixed(1)}%`} />
          </Card>
          <Card title="Least urbanised" caption="Himachal Pradesh and the north-east — hill and tribal geographies where settlement is dispersed by terrain.">
            <HorizontalBars
              items={byPct.slice(-12).reverse().map((r) => ({ label: r.state.name, value: r.value }))}
              valueFormat={(v) => `${v.toFixed(1)}%`}
              sort={false}
              color="var(--c5)"
              highlightColor="var(--c5)"
            />
          </Card>
        </div>

        <Card title="Largest urban populations" caption="Absolute urban residents, not shares. This is the list that decides where India's cities actually are.">
          <HorizontalBars items={byCount.slice(0, 12).map((r) => ({ label: r.state.name, value: r.value }))} valueFormat={(v) => compactIN(v)} />
        </Card>

        <Card title="Every state and UT" caption="Urban and rural population, both derived from the published urban share.">
          <DataTable
            rows={censusStates}
            columns={columns}
            initialSort="pct"
            exportName="census-urbanisation"
            csvRow={(r) => ({
              state: r.name,
              region: r.region,
              urban_pct: r.urbanPct,
              urban_population: urbanPop(r) == null ? null : Math.round(urbanPop(r) as number),
              rural_population: ruralPop(r) == null ? null : Math.round(ruralPop(r) as number),
              total_population: r.pop2011,
            })}
          />
        </Card>

        <div className="callout warn">
          <strong>&ldquo;Urban&rdquo; is a definition, not a fact.</strong> The census counts statutory towns plus
          &ldquo;census towns&rdquo; — places that cross 5,000 people, 75% male non-agricultural employment and a
          density threshold. A large village with a commuting workforce can be classified urban without any municipal
          government at all. The 2011 census added a large number of census towns, which is part of why the urban share
          rose faster than the number of statutory municipalities did.
        </div>

        <div className="callout">
          <strong>Where this is heading.</strong> At 31% urban in 2011 and roughly 2.5% of the population added to towns
          each decade, India is on course to be about half urban by the middle of this century — later and slower than
          China, and at a far lower income per head. The states lowest on this page are the ones that will urbanise
          fastest next, and they are also, in several cases, the ones with the weakest municipal capacity.
        </div>
      </div>
    </>
  );
}
