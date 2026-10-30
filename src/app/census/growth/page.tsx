'use client';

/**
 * Decadal growth — who grew, by how much, and what that predicts.
 */
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DonutChart } from '@/components/charts/DonutChart';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { colorAt } from '@/config/palette';
import { censusMeta, censusStates, india } from '@/lib/data/census';
import { growthBands, banded, median, pairsFor, pearson, ranked } from '@/lib/census';
import { compactIN, pct } from '@/lib/format';

export default function CensusGrowthPage() {
  const rows = ranked('growth');
  const bands = banded('growth', growthBands);

  const negative = rows.filter((r) => r.value < 0);
  const over25 = rows.filter((r) => r.value >= 25);
  const slow = rows.filter((r) => r.value < 10);

  const pairs = pairsFor('growth', 'literacy');
  const r = pearson(pairs);
  const medGrowth = median(pairs.map((p) => p[0]));
  const medLit = median(pairs.map((p) => p[1]));

  // Plot the states directly rather than re-deriving labels from the pairs.
  const scatterPoints = censusStates
    .map((s) => ({ s, x: s.growth, y: s.literacy }))
    .filter((p): p is { s: (typeof censusStates)[number]; x: number; y: number } => p.y != null)
    .map((p) => ({
      label: p.s.name,
      x: p.x,
      y: p.y,
      always: p.x > 25 || p.x < 5 || p.y > 88 || p.y < 65,
    }));

  return (
    <>
      <PageHeader
        title="Decadal growth, 2001 → 2011"
        description="India added 182 million people in ten years — more than the population of Brazil. But growth is unevenly distributed, and the states still growing fastest are, with a few exceptions, the ones with the lowest literacy and the least urban settlement."
        source={censusMeta.source}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="National growth" value={`${india.growth}%`} note="2001 → 2011" tone="accent" />
          <StatCard label="People added" value={compactIN(india.pop2011 - india.pop2011 / 1.177)} note="approximately 182 million" />
          <StatCard label="Fastest" value={rows[0]?.state.name ?? '—'} note={`${rows[0]?.value.toFixed(1)}%`} />
          <StatCard label="Slowest" value={rows[rows.length - 1]?.state.name ?? '—'} note={`${rows[rows.length - 1]?.value.toFixed(1)}%`} />
          <StatCard label="Shrinking" value={negative.length} note={negative.length ? negative.map((n) => n.state.name).join(', ') : 'none'} tone="warn" />
          <StatCard label="Grew 25% or more" value={over25.length} note="states and UTs" />
        </CardGrid>

        <div className="grid-2">
          <Card title="Fastest-growing" caption="Percent change in population, 2001 to 2011.">
            <HorizontalBars
              items={rows.slice(0, 12).map((r2) => ({ label: r2.state.name, value: r2.value }))}
              valueFormat={(v) => `${v.toFixed(1)}%`}
            />
          </Card>
          <Card title="Slowest-growing" caption="Kerala and the southern states have essentially completed their demographic transition.">
            <HorizontalBars
              items={rows.slice(-12).reverse().map((r2) => ({ label: r2.state.name, value: r2.value }))}
              valueFormat={(v) => `${v.toFixed(1)}%`}
              sort={false}
              color="var(--c5)"
              highlightColor="var(--c5)"
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Growth bands" caption="How many states and UTs fall in each band.">
            <DonutChart
              slices={bands.map((b, i) => ({ name: b.band.label, value: b.states.length, color: colorAt(i + 1) }))}
              valueFormat={(v) => `${v.toFixed(0)} units`}
            />
          </Card>

          <Card
            title="Growth against literacy"
            caption="Each dot is a state. The dashed lines are the medians of the plotted states."
          >
            <ScatterPlot
              points={scatterPoints}
              xLabel="Decadal growth %"
              yLabel="Literacy %"
              xFormat={(v) => `${v.toFixed(0)}%`}
              yFormat={(v) => `${v.toFixed(0)}%`}
              medianX={medGrowth}
              medianY={medLit}
              quadrantLabels={['grew slowly, literate', 'grew fast, literate', 'grew slowly, less literate', 'grew fast, less literate']}
            />
          </Card>
        </div>

        {r != null ? (
          <div className="callout">
            <strong>The relationship is real but loose: r = {r.toFixed(2)}.</strong> Growth and literacy correlate
            negatively across the {pairs.length} states plotted — faster-growing states tend to be less literate, which
            is the classic signature of the demographic transition arriving later. But the correlation is far from
            deterministic: several high-growth states are above the median literacy, and Kerala is a low-growth,
            near-universal-literacy outlier at the far end. A correlation across 30-odd units is a description, not a
            mechanism.
          </div>
        ) : null}

        <Card title="Where the growth is" caption="Full ranking, with the population added over the decade.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th style={{ textAlign: 'right' }}>#</th>
                  <th>State / UT</th>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>Growth</th>
                  <th style={{ textAlign: 'right' }}>Population 2011</th>
                  <th style={{ textAlign: 'right' }}>Added since 2001</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const before = row.value > -100 ? row.state.pop2011 / (1 + row.value / 100) : row.state.pop2011;
                  return (
                    <tr key={row.state.id}>
                      <td className="num" style={{ textAlign: 'right' }}>{i + 1}</td>
                      <td>{row.state.name}</td>
                      <td className="muted">{row.state.region}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{pct(row.value)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{compactIN(row.state.pop2011)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{compactIN(row.state.pop2011 - before)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="callout warn">
          <strong>Growth is momentum, not failure.</strong> A state growing 25% a year-on-decade is not
          &ldquo;underperforming&rdquo; — it is earlier in its demographic transition, with a young age structure that
          guarantees further growth even if fertility falls immediately. The policy question is whether the state can
          build schools and jobs fast enough, not whether it can stop growing. Conversely, a state at 5% growth faces an
          ageing population and a shrinking labour-force base within a generation.
        </div>
      </div>
    </>
  );
}
