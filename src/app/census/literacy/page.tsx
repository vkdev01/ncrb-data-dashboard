'use client';

/**
 * Literacy — the headline rate, the female rate, and the gap between the sexes.
 * The gap is often more informative than either rate on its own.
 */
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DonutChart } from '@/components/charts/DonutChart';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { colorAt } from '@/config/palette';
import { censusMeta, censusStates, india, type CensusState } from '@/lib/data/census';
import { banded, literacyBands, literacyGap, median, pearson, ranked } from '@/lib/census';
import { pct } from '@/lib/format';

export default function LiteracyPage() {
  const total = ranked('literacy');
  const female = ranked('literacyFemale');
  const gaps = ranked('literacyGap');
  const bands = banded('literacy', literacyBands);

  const scatter = censusStates
    .map((s) => ({ s, x: s.urbanPct, y: s.literacy }))
    .filter((p): p is { s: CensusState; x: number; y: number } => p.x != null && p.y != null);
  const r = pearson(scatter.map((p) => [p.x, p.y]));

  const columns: Column<CensusState>[] = [
    { key: 'name', header: 'State / UT', render: (r2) => r2.name, sortValue: (r2) => r2.name },
    { key: 'lit', header: 'Total', align: 'right', render: (r2) => (r2.literacy == null ? '—' : pct(r2.literacy)), sortValue: (r2) => r2.literacy ?? 0 },
    { key: 'm', header: 'Male', align: 'right', render: (r2) => (r2.literacyMale == null ? '—' : pct(r2.literacyMale)), sortValue: (r2) => r2.literacyMale ?? 0 },
    { key: 'f', header: 'Female', align: 'right', render: (r2) => (r2.literacyFemale == null ? '—' : pct(r2.literacyFemale)), sortValue: (r2) => r2.literacyFemale ?? 0 },
    {
      key: 'gap',
      header: 'Gap (pts)',
      align: 'right',
      render: (r2) => {
        const g = literacyGap(r2);
        return g == null ? '—' : <span style={{ color: g > 20 ? 'var(--accent-2)' : undefined }}>{g.toFixed(1)}</span>;
      },
      sortValue: (r2) => literacyGap(r2) ?? 0,
    },
  ];

  return (
    <>
      <PageHeader
        title="Literacy"
        description="Three quarters of Indians aged seven and above could read and write in 2011. The national figure hides a 17-point gap between men and women, and a 32-point gap between the best and worst states."
        source={censusMeta.source}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Literacy rate" value={pct(india.literacy)} note="age 7 and above" tone="accent" />
          <StatCard label="Male" value={pct(india.literacyMale)} note="82 in every 100 men" />
          <StatCard label="Female" value={pct(india.literacyFemale)} note="65 in every 100 women" />
          <StatCard label="Gender gap" value={`${(india.literacyMale - india.literacyFemale).toFixed(1)} pts`} note="male minus female" tone="warn" />
          <StatCard label="Most literate" value={total[0]?.state.name ?? '—'} note={pct(total[0]?.value ?? 0)} tone="good" />
          <StatCard label="Least literate" value={total[total.length - 1]?.state.name ?? '—'} note={pct(total[total.length - 1]?.value ?? 0)} tone="warn" />
        </CardGrid>

        <div className="grid-2">
          <Card title="Highest literacy" caption="Percent of population aged 7+ who can read and write.">
            <HorizontalBars items={total.slice(0, 12).map((r2) => ({ label: r2.state.name, value: r2.value }))} valueFormat={(v) => `${v.toFixed(1)}%`} />
          </Card>
          <Card title="Lowest literacy" caption="The Hindi belt plus a few others — the states where the demographic transition is also latest.">
            <HorizontalBars
              items={total.slice(-12).reverse().map((r2) => ({ label: r2.state.name, value: r2.value }))}
              valueFormat={(v) => `${v.toFixed(1)}%`}
              sort={false}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Female literacy" caption="The rate that moves fertility, child health and workforce participation furthest.">
            <HorizontalBars
              items={female.slice(0, 12).map((r2) => ({ label: r2.state.name, value: r2.value }))}
              valueFormat={(v) => `${v.toFixed(1)}%`}
              color="var(--c5)"
              highlightColor="var(--c5)"
            />
          </Card>
          <Card title="Widest gender gaps" caption="Percentage points between male and female literacy. Rajasthan and its neighbours top this list even where the overall rate is decent.">
            <HorizontalBars
              items={gaps.slice(0, 12).map((r2) => ({ label: r2.state.name, value: r2.value }))}
              valueFormat={(v) => `${v.toFixed(1)} pts`}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Literacy bands" caption="States and UTs by literacy rate.">
            <DonutChart
              slices={bands.map((b, i) => ({ name: b.band.label, value: b.states.length, color: colorAt(i + 1) }))}
              valueFormat={(v) => `${v.toFixed(0)} units`}
            />
          </Card>

          <Card title="Literacy against urbanisation" caption={`Each dot is a state. r = ${r == null ? '—' : r.toFixed(2)} — the strongest relationship in this section.`}>
            <ScatterPlot
              points={scatter.map((p) => ({
                label: p.s.name,
                x: p.x,
                y: p.y,
                always: p.y > 88 || p.y < 66 || p.x > 60,
              }))}
              xLabel="Urban share %"
              yLabel="Literacy %"
              xFormat={(v) => `${v.toFixed(0)}%`}
              yFormat={(v) => `${v.toFixed(0)}%`}
              medianX={median(scatter.map((p) => p.x))}
              medianY={median(scatter.map((p) => p.y))}
              quadrantLabels={['rural, literate', 'urban, literate', 'rural, less literate', 'urban, less literate']}
            />
          </Card>
        </div>

        <Card title="Every state and UT" caption="Total, male and female literacy with the gender gap.">
          <DataTable
            rows={censusStates}
            columns={columns}
            initialSort="lit"
            exportName="census-literacy"
            csvRow={(r2) => ({
              state: r2.name,
              region: r2.region,
              literacy_total: r2.literacy,
              literacy_male: r2.literacyMale,
              literacy_female: r2.literacyFemale,
              gender_gap_points: literacyGap(r2) == null ? null : +(literacyGap(r2) as number).toFixed(2),
            })}
          />
        </Card>

        <div className="callout">
          <strong>The gap is the story, not the average.</strong> Kerala&apos;s male and female rates differ by five
          points; Rajasthan&apos;s by twenty-seven. A state can sit comfortably above the national average on the
          headline figure and still be educating its boys and girls in two different systems. Any comparison of states
          that uses only the combined rate will miss this entirely.
        </div>

        <div className="callout warn">
          <strong>&ldquo;Literate&rdquo; is a low bar.</strong> The census definition is being able to read and write
          with understanding, self-reported, for anyone aged seven or above. It says nothing about years of schooling,
          numeracy or whether the skill survived into adulthood. A state at 90% literacy is not necessarily a state
          where 90% of adults read regularly — and a state at 62% may have improved its school enrolment far faster than
          the census can show.
        </div>
      </div>
    </>
  );
}
