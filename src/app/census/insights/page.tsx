'use client';

/**
 * Cross-metric analysis — the page that answers "so what?".
 *
 * Everything here is computed from the published figures: correlations over the
 * matched pairs, quadrant membership, regional aggregates and the outliers that
 * break the general pattern.
 */
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { censusMeta, censusStates, india, type CensusState } from '@/lib/data/census';
import {
  childSexRatioChange,
  listNames,
  literacyGap,
  median,
  METRICS,
  metricById,
  pairsFor,
  pearson,
  ranked,
  regionSummaries,
} from '@/lib/census';
import { compactIN, pct } from '@/lib/format';

/** Metric pairs worth plotting, with a short reading of each. */
const PAIRS: { a: string; b: string; note: string }[] = [
  { a: 'urbanPct', b: 'literacy', note: 'The strongest relationship in the section: towns and schools arrive together.' },
  { a: 'literacy', b: 'childSexRatio', note: 'Almost no relationship — prosperity changes the means to sex-select before it changes the preference.' },
  { a: 'growth', b: 'literacy', note: 'Negative: the states still growing fastest are the ones the demographic transition reached last.' },
  { a: 'literacyFemale', b: 'sexRatio', note: 'Positive but noisy: female education and women surviving are linked, with a long tail of exceptions.' },
];

function points(a: string, b: string) {
  const ma = metricById.get(a);
  const mb = metricById.get(b);
  if (!ma || !mb) return [];
  return censusStates
    .map((s) => ({ s, x: ma.get(s), y: mb.get(s) }))
    .filter((p): p is { s: CensusState; x: number; y: number } => typeof p.x === 'number' && typeof p.y === 'number');
}

export default function CensusInsightsPage() {
  const regions = regionSummaries();

  const widestGap = ranked('literacyGap').slice(0, 5);
  const narrowestGap = ranked('literacyGap').slice(-5).reverse();
  const csrFallers = censusStates
    .map((s) => ({ s, v: childSexRatioChange(s) }))
    .filter((r): r is { s: CensusState; v: number } => r.v != null)
    .sort((a, b) => a.v - b.v)
    .slice(0, 5);

  const litRows = ranked('literacy');
  const spread = (litRows[0]?.value ?? 0) - (litRows[litRows.length - 1]?.value ?? 0);

  return (
    <>
      <PageHeader
        title="What the numbers say together"
        description="Single rankings are easy and often misleading. The useful questions are about pairs: does literacy travel with urbanisation? Does growth track education? Does money buy girls? Each panel below is computed from the published figures, with the strength of the relationship stated rather than implied."
        source={censusMeta.source}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="States plotted" value={censusStates.length} note="36 states and union territories" />
          <StatCard label="Literacy spread" value={`${spread.toFixed(1)} pts`} note={`${litRows[0]?.state.name} to ${litRows[litRows.length - 1]?.state.name}`} />
          <StatCard label="Median child ratio" value={median(censusStates.map((s) => s.childSexRatio).filter((v): v is number => v != null)).toFixed(0)} note="girls per 1,000 boys, 0–6" />
          <StatCard label="Units with falling child ratio" value={`${censusStates.filter((s) => (childSexRatioChange(s) ?? 0) < 0).length}`} note="2001 → 2011" tone="warn" />
        </CardGrid>

        <Card title="Correlations" caption="Pearson r across the states that have both figures. Read as a description of the spread, not as a mechanism — and remember n is about 33, so small differences in r mean little.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Measure A</th>
                  <th>Measure B</th>
                  <th style={{ textAlign: 'right' }}>r</th>
                  <th style={{ textAlign: 'right' }}>n</th>
                  <th>Reading</th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((p) => {
                  const r = pearson(pairsFor(p.a, p.b));
                  const n = pairsFor(p.a, p.b).length;
                  return (
                    <tr key={`${p.a}-${p.b}`}>
                      <td>{metricById.get(p.a)?.short}</td>
                      <td>{metricById.get(p.b)?.short}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{r == null ? '—' : r.toFixed(2)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{n}</td>
                      <td className="muted" style={{ fontSize: '0.82rem' }}>{p.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid-2">
          {PAIRS.slice(0, 2).map((p) => {
            const pts = points(p.a, p.b);
            return (
              <Card key={`${p.a}-${p.b}`} title={`${metricById.get(p.b)?.short} vs ${metricById.get(p.a)?.short}`} caption={p.note}>
                <ScatterPlot
                  points={pts.map((pt) => ({
                    label: pt.s.name,
                    x: pt.x,
                    y: pt.y,
                    always: false,
                  }))}
                  xLabel={metricById.get(p.a)?.label ?? p.a}
                  yLabel={metricById.get(p.b)?.label ?? p.b}
                  xFormat={(v) => v.toFixed(0)}
                  yFormat={(v) => v.toFixed(0)}
                  medianX={median(pts.map((pt) => pt.x))}
                  medianY={median(pts.map((pt) => pt.y))}
                  height={320}
                />
              </Card>
            );
          })}
        </div>

        <div className="grid-2">
          {PAIRS.slice(2).map((p) => {
            const pts = points(p.a, p.b);
            return (
              <Card key={`${p.a}-${p.b}`} title={`${metricById.get(p.b)?.short} vs ${metricById.get(p.a)?.short}`} caption={p.note}>
                <ScatterPlot
                  points={pts.map((pt) => ({
                    label: pt.s.name,
                    x: pt.x,
                    y: pt.y,
                    always: false,
                  }))}
                  xLabel={metricById.get(p.a)?.label ?? p.a}
                  yLabel={metricById.get(p.b)?.label ?? p.b}
                  xFormat={(v) => v.toFixed(0)}
                  yFormat={(v) => v.toFixed(0)}
                  medianX={median(pts.map((pt) => pt.x))}
                  medianY={median(pts.map((pt) => pt.y))}
                  height={320}
                />
              </Card>
            );
          })}
        </div>

        <div className="grid-2">
          <Card title="Widest gender gaps in literacy" caption="Percentage points between male and female literacy.">
            <HorizontalBars
              items={widestGap.map((r) => ({ label: r.state.name, value: r.value }))}
              valueFormat={(v) => `${v.toFixed(1)} pts`}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
          <Card title="Narrowest gender gaps" caption="Where the two sexes were educated most equally.">
            <HorizontalBars
              items={narrowestGap.map((r) => ({ label: r.state.name, value: r.value }))}
              valueFormat={(v) => `${v.toFixed(1)} pts`}
              sort={false}
              color="var(--c5)"
              highlightColor="var(--c5)"
            />
          </Card>
        </div>

        <Card title="Regional aggregates" caption="Population-weighted, so the large states dominate each region's average — which is the honest way to summarise a region.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>Units</th>
                  <th style={{ textAlign: 'right' }}>Population</th>
                  <th style={{ textAlign: 'right' }}>Share</th>
                  <th style={{ textAlign: 'right' }}>Growth (mean)</th>
                  <th style={{ textAlign: 'right' }}>Literacy</th>
                  <th style={{ textAlign: 'right' }}>Urban</th>
                  <th style={{ textAlign: 'right' }}>Sex ratio</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.region}>
                    <td>{r.region}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.states.length}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{compactIN(r.population)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{pct(r.share)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.growth.toFixed(1)}%</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.literacy == null ? '—' : pct(r.literacy)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.urbanPct == null ? '—' : pct(r.urbanPct)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.sexRatio == null ? '—' : r.sexRatio.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Findings worth stating plainly" caption="Each of these is a direct consequence of the figures in this section, not an opinion about them.">
          <div className="stack" style={{ gap: 12 }}>
            <div className="callout">
              <strong>Urbanisation and literacy are the same story told twice.</strong> Across the states, the urban
              share and the literacy rate move together more strongly than any other pair here. It is tempting to read
              that as &ldquo;cities create literacy&rdquo;. Both are downstream of the same thing: a diversified
              economy that needs schools and towns. The causal arrow runs in both directions.
            </div>

            <div className="callout warn">
              <strong>Literacy does not buy girls.</strong> The child sex ratio has essentially no relationship with the
              literacy rate. The five largest falls in the child ratio between 2001 and 2011 were in{' '}
              {listNames(csrFallers.map((c) => c.s.name))} — a set that mixes some of the country&apos;s least literate
              states with some of its most literate ones. If schooling drove the outcome, that list would be ordered. It
              is not: the practice responds to kinship and inheritance norms far more than to literacy.
            </div>

            <div className="callout">
              <strong>The gender gap is not a southern problem or a northern one — it is a specific list.</strong> The
              widest literacy gaps are {listNames(widestGap.map((w) => w.state.name))}. Several of those states are
              above the national literacy average. The gap and the level are separate measurements, and a state can
              improve one while leaving the other untouched.
            </div>

            <div className="callout">
              <strong>Half of India&apos;s demographic weight sits in one belt.</strong> Uttar Pradesh, Bihar, Madhya
              Pradesh and Rajasthan together hold{' '}
              {pct(((censusStates.find((s) => s.id === 'UP')?.pop2011 ?? 0) +
                (censusStates.find((s) => s.id === 'BR')?.pop2011 ?? 0) +
                (censusStates.find((s) => s.id === 'MP')?.pop2011 ?? 0) +
                (censusStates.find((s) => s.id === 'RJ')?.pop2011 ?? 0)) /
                india.pop2011 * 100)}{' '}
              of the population, and they combine high growth, low literacy and wide gender gaps. Any national average
              that does not decompose by state is mostly a statement about this belt.
            </div>
          </div>
        </Card>

        <div className="callout">
          <strong>What correlation cannot do here.</strong> Thirty-six units is a small sample, the measures are
          themselves correlated (urbanisation drives literacy drives income), and the whole dataset is a single 2011
          cross-section — there is no time dimension to exploit. Every r on this page is a description of one snapshot.
          The figures that survive scrutiny are the outliers and the specific rankings, not the coefficients.
        </div>

        <Card title="All measures in this section" caption="For reference — the full set the map and tables render.">
          <div className="chip-row">
            {METRICS.map((m) => (
              <span className="chip" key={m.id} title={m.blurb}>{m.short}</span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
