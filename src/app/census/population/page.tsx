'use client';

/**
 * Population and density — scale, and how tightly that scale is packed.
 */
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { censusMeta, censusStates, india, type CensusState } from '@/lib/data/census';
import { densityBands, popShare, ranked, urbanPop } from '@/lib/census';
import { compactIN, nf, pct } from '@/lib/format';

export default function CensusPopulationPage() {
  const byPop = ranked('pop2011');
  const byDensity = ranked('density');

  const million = byPop.filter((r) => r.value >= 100_000_000);
  const half = byPop.filter((r) => r.value >= 50_000_000 && r.value < 100_000_000);
  const tens = byPop.filter((r) => r.value >= 10_000_000 && r.value < 50_000_000);
  const small = byPop.filter((r) => r.value < 10_000_000);

  const top3Share = byPop.slice(0, 3).reduce((t, r) => t + popShare(r.state), 0);
  const top10Share = byPop.slice(0, 10).reduce((t, r) => t + popShare(r.state), 0);

  const bands = densityBands.map((b) => ({
    ...b,
    states: censusStates.filter((s) => b.test(s.density)),
  }));

  const columns: Column<CensusState>[] = [
    { key: 'name', header: 'State / UT', render: (r) => r.name, sortValue: (r) => r.name },
    { key: 'pop', header: 'Population', align: 'right', render: (r) => nf(r.pop2011), sortValue: (r) => r.pop2011 },
    { key: 'share', header: 'Share of India', align: 'right', render: (r) => pct(popShare(r), 2), sortValue: (r) => popShare(r) },
    { key: 'area', header: 'Area (km²)', align: 'right', render: (r) => nf(r.area), sortValue: (r) => r.area },
    { key: 'density', header: 'Density /km²', align: 'right', render: (r) => nf(r.density), sortValue: (r) => r.density },
    { key: 'urban', header: 'Urban pop.', align: 'right', render: (r) => { const u = urbanPop(r); return u == null ? '—' : compactIN(u); }, sortValue: (r) => urbanPop(r) ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="Population and density"
        description="India held 1.21 billion people in 2011 across 3.29 million km². Neither number is evenly spread: the population follows the Gangetic plain and the coasts, and density varies by more than a thousandfold between the densest and emptiest units."
        source={censusMeta.source}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Total population" value={compactIN(india.pop2011)} note={nf(india.pop2011)} tone="accent" />
          <StatCard label="Most populous" value={byPop[0]?.state.name ?? '—'} note={nf(byPop[0]?.value ?? 0)} />
          <StatCard label="Least populous" value={byPop[byPop.length - 1]?.state.name ?? '—'} note={nf(byPop[byPop.length - 1]?.value ?? 0)} />
          <StatCard label="National density" value={nf(india.density)} note="per km²" />
          <StatCard label="Densest" value={byDensity[0]?.state.name ?? '—'} note={`${nf(byDensity[0]?.value ?? 0)} per km²`} tone="warn" />
          <StatCard label="Emptiest" value={byDensity[byDensity.length - 1]?.state.name ?? '—'} note={`${(byDensity[byDensity.length - 1]?.value ?? 0).toFixed(1)} per km²`} />
        </CardGrid>

        <div className="callout">
          <strong>Three states hold {top3Share.toFixed(1)}% of the country.</strong> Uttar Pradesh, Maharashtra and
          Bihar together account for more people than the entire population of the European Union. The top ten states
          hold {top10Share.toFixed(1)}% — which is why national averages are, in practice, a handful of large-state
          averages.
        </div>

        <div className="grid-2">
          <Card title="Population by size class" caption="How the 36 states and UTs distribute across population bands.">
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Size class</th>
                    <th style={{ textAlign: 'right' }}>Units</th>
                    <th style={{ textAlign: 'right' }}>Population</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['100 million and above', million],
                    ['50–100 million', half],
                    ['10–50 million', tens],
                    ['Under 10 million', small],
                  ].map(([label, rows]) => {
                    const list = rows as { state: CensusState; value: number }[];
                    const total = list.reduce((t, r) => t + r.value, 0);
                    return (
                      <tr key={label as string}>
                        <td>{label as string}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{list.length}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{compactIN(total)}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{pct((total / india.pop2011) * 100)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Density bands" caption="Persons per km². Geography does most of the work here — desert, mountain and island units sit at the bottom by construction.">
            <HorizontalBars
              items={bands.map((b) => ({
                label: b.label,
                value: b.states.reduce((t, s) => t + s.pop2011, 0),
                note: `${b.states.length} units`,
              }))}
              valueFormat={(v) => compactIN(v)}
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Most densely settled" caption="Persons per km².">
            <HorizontalBars
              items={byDensity.slice(0, 12).map((r) => ({ label: r.state.name, value: r.value }))}
              valueFormat={(v) => nf(v)}
            />
          </Card>
          <Card title="Least densely settled" caption="The other end — union territories and Himalayan states.">
            <HorizontalBars
              items={byDensity.slice(-12).reverse().map((r) => ({ label: r.state.name, value: r.value }))}
              valueFormat={(v) => nf(v)}
              sort={false}
              color="var(--c5)"
              highlightColor="var(--c5)"
            />
          </Card>
        </div>

        <Card title="Every state and UT" caption="Click a column to sort. Shares are of India's 1.21 billion.">
          <DataTable
            rows={censusStates}
            columns={columns}
            initialSort="pop"
            exportName="census-population"
            csvRow={(r) => ({
              state: r.name,
              region: r.region,
              population_2011: r.pop2011,
              share_of_india_pct: +popShare(r).toFixed(3),
              area_km2: r.area,
              density_per_km2: r.density,
              urban_population: urbanPop(r) == null ? null : Math.round(urbanPop(r) as number),
            })}
          />
        </Card>

        <div className="callout warn">
          <strong>Density is not crowding.</strong> A high persons-per-km² figure can mean dense cities, or it can mean
          fertile farmland with no cities at all — Bihar&apos;s {nf(1102)} and West Bengal&apos;s {nf(1029)} describe the
          same Gangetic plain, while Kerala&apos;s {nf(859)} describes a coastal state with no very large cities. And the
          extremes are dominated by union territories: Delhi&apos;s {nf(11297)} per km² describes a
          city, Ladakh&apos;s {nf(3)} describes a mountain desert, and comparing the two is meaningless.
        </div>
      </div>
    </>
  );
}
