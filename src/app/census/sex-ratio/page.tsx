'use client';

/**
 * Sex ratio — the headline ratio and the child ratio, which move for different
 * reasons and in 2011 moved in opposite directions.
 */
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { censusMeta, censusStates, india, type CensusState } from '@/lib/data/census';
import { childSexRatioChange, median, pearson, ranked, sexRatioChange } from '@/lib/census';
import { nf } from '@/lib/format';

export default function SexRatioPage() {
  const sr = ranked('sexRatio');
  const csr = ranked('childSexRatio');

  const changes = censusStates
    .map((s) => ({ s, v: sexRatioChange(s) }))
    .filter((r): r is { s: CensusState; v: number } => r.v != null)
    .sort((a, b) => b.v - a.v);

  const csrChanges = censusStates
    .map((s) => ({ s, v: childSexRatioChange(s) }))
    .filter((r): r is { s: CensusState; v: number } => r.v != null);

  const improvingCsr = csrChanges.filter((r) => r.v > 0).length;
  const worseningCsr = csrChanges.filter((r) => r.v < 0).length;

  const scatter = censusStates
    .map((s) => ({ s, x: s.literacy, y: s.childSexRatio }))
    .filter((p): p is { s: CensusState; x: number; y: number } => p.x != null && p.y != null);
  const r = pearson(scatter.map((p) => [p.x, p.y]));

  const columns: Column<CensusState>[] = [
    { key: 'name', header: 'State / UT', render: (r2) => r2.name, sortValue: (r2) => r2.name },
    { key: 'sr', header: 'Sex ratio', align: 'right', render: (r2) => (r2.sexRatio == null ? '—' : nf(r2.sexRatio)), sortValue: (r2) => r2.sexRatio ?? 0 },
    { key: 'sr01', header: '2001', align: 'right', render: (r2) => (r2.sexRatio2001 == null ? '—' : nf(r2.sexRatio2001)), sortValue: (r2) => r2.sexRatio2001 ?? 0 },
    { key: 'src', header: 'Change', align: 'right', render: (r2) => { const c = sexRatioChange(r2); return c == null ? '—' : `${c > 0 ? '+' : ''}${c.toFixed(0)}`; }, sortValue: (r2) => sexRatioChange(r2) ?? 0 },
    { key: 'csr', header: 'Child ratio', align: 'right', render: (r2) => (r2.childSexRatio == null ? '—' : nf(r2.childSexRatio)), sortValue: (r2) => r2.childSexRatio ?? 0 },
    { key: 'csr01', header: 'Child 2001', align: 'right', render: (r2) => (r2.childSexRatio2001 == null ? '—' : nf(r2.childSexRatio2001)), sortValue: (r2) => r2.childSexRatio2001 ?? 0 },
    { key: 'csrc', header: 'Child change', align: 'right', render: (r2) => { const c = childSexRatioChange(r2); return c == null ? '—' : `${c > 0 ? '+' : ''}${c.toFixed(0)}`; }, sortValue: (r2) => childSexRatioChange(r2) ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="Sex ratio and child sex ratio"
        description="Women per 1,000 men, and girls per 1,000 boys aged 0–6. The first is a stock accumulated over a lifetime; the second is a flow that shows what is happening right now. In 2011 they told different stories."
        source={censusMeta.source}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Sex ratio" value={india.sexRatio} note={`${india.sexRatio - india.sexRatio2001 > 0 ? '+' : ''}${india.sexRatio - india.sexRatio2001} vs 2001`} tone="good" />
          <StatCard label="Child sex ratio" value={india.childSexRatio} note={`${india.childSexRatio - india.childSexRatio2001} vs 2001`} tone="warn" />
          <StatCard label="Highest sex ratio" value={sr[0]?.state.name ?? '—'} note={nf(sr[0]?.value ?? 0)} />
          <StatCard label="Lowest sex ratio" value={sr[sr.length - 1]?.state.name ?? '—'} note={nf(sr[sr.length - 1]?.value ?? 0)} tone="warn" />
          <StatCard label="Lowest child ratio" value={csr[csr.length - 1]?.state.name ?? '—'} note={nf(csr[csr.length - 1]?.value ?? 0)} tone="warn" />
          <StatCard label="Child ratio fell in" value={`${worseningCsr} states`} note={`rose in ${improvingCsr}`} />
        </CardGrid>

        <div className="callout warn">
          <strong>The paradox at the centre of this page.</strong> Nationally the sex ratio rose from{' '}
          {india.sexRatio2001} to {india.sexRatio} while the child sex ratio fell from {india.childSexRatio2001} to{' '}
          {india.childSexRatio}. Both are true. The overall ratio improves as women live longer and maternal mortality
          falls; the child ratio falls where sex-selective abortion and neglect of girls persist. Because the child ratio
          only covers ages 0–6, it is the measure that isolates the practice — and it is the one that was getting worse
          even as the headline number improved.
        </div>

        <div className="grid-2">
          <Card title="Highest sex ratios" caption="Females per 1,000 males.">
            <HorizontalBars items={sr.slice(0, 12).map((r2) => ({ label: r2.state.name, value: r2.value }))} valueFormat={(v) => nf(v)} />
          </Card>
          <Card title="Lowest sex ratios" caption="The northern belt — Haryana, Punjab, Delhi and their neighbours.">
            <HorizontalBars
              items={sr.slice(-12).reverse().map((r2) => ({ label: r2.state.name, value: r2.value }))}
              valueFormat={(v) => nf(v)}
              sort={false}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Lowest child sex ratios" caption="Girls per 1,000 boys aged 0–6. These are the states where son preference is most visible in the data.">
            <HorizontalBars
              items={csr.slice(-12).reverse().map((r2) => ({ label: r2.state.name, value: r2.value }))}
              valueFormat={(v) => nf(v)}
              sort={false}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
          <Card title="Highest child sex ratios" caption="The north-east and the southern coast, plus tribal-majority states.">
            <HorizontalBars items={csr.slice(0, 12).map((r2) => ({ label: r2.state.name, value: r2.value }))} valueFormat={(v) => nf(v)} />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Sex ratio: who gained, who lost" caption="Change in females per 1,000 males, 2001 → 2011.">
            <HorizontalBars
              items={changes.map((c) => ({ label: c.s.name, value: c.v, note: c.v < 0 ? 'fell' : 'rose' }))}
              valueFormat={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}`}
            />
          </Card>

          <Card
            title="Child sex ratio against literacy"
            caption={`Each dot is a state with both figures. r = ${r == null ? '—' : r.toFixed(2)}.`}
          >
            <ScatterPlot
              points={scatter.map((p) => ({
                label: p.s.name,
                x: p.x,
                y: p.y,
                always: p.y < 890 || p.y > 975 || p.x > 90 || p.x < 64,
              }))}
              xLabel="Literacy %"
              yLabel="Child sex ratio"
              xFormat={(v) => `${v.toFixed(0)}%`}
              yFormat={(v) => v.toFixed(0)}
              medianX={median(scatter.map((p) => p.x))}
              medianY={median(scatter.map((p) => p.y))}
              quadrantLabels={['less literate, higher ratio', 'more literate, higher ratio', 'less literate, lower ratio', 'more literate, lower ratio']}
            />
          </Card>
        </div>

        <Card title="Every state and UT" caption="Both ratios, with the 2001 comparison. Blank cells were never tabulated at this geography.">
          <DataTable
            rows={censusStates}
            columns={columns}
            initialSort="csr"
            initialDir="asc"
            exportName="census-sex-ratio"
            csvRow={(r2) => ({
              state: r2.name,
              region: r2.region,
              sex_ratio_2011: r2.sexRatio,
              sex_ratio_2001: r2.sexRatio2001,
              child_sex_ratio_2011: r2.childSexRatio,
              child_sex_ratio_2001: r2.childSexRatio2001,
            })}
          />
        </Card>

        <div className="callout">
          <strong>Why literacy does not predict the child ratio.</strong> The scatter above is close to flat. Punjab and
          Haryana are among India&apos;s more literate states and have among its lowest child sex ratios; Kerala is the
          most literate state and has one of the highest. Prosperity and education raise the <em>means</em> to
          sex-select before they change the <em>preference</em> — which is why the child ratio fell fastest in some of
          the richest parts of the north. The pattern is cultural and regional, not a simple function of development.
        </div>

        <div className="callout warn">
          <strong>What this data cannot tell you.</strong> A ratio is an outcome of birth, survival and migration
          together. It does not distinguish sex-selective abortion from neglect, infanticide, or the migration of men
          for work (which raises the ratio in sending areas and lowers it in receiving ones). It is also fifteen years
          old — several of the states at the bottom have reported improvements in later sample surveys, which this
          census cannot show.
        </div>
      </div>
    </>
  );
}
