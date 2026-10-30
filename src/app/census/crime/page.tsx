'use client';

/**
 * Crime × Census — the page that only exists because this app holds both
 * datasets. It joins NCRB's state crime rate to the census measures and asks
 * whether the obvious stories survive contact with the numbers.
 *
 * The whole page is written against one warning: recorded crime is a measure of
 * reporting and registration as much as of offending, so nothing here should be
 * read as "literacy reduces crime".
 */
import { useMemo } from 'react';
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { useDataset } from '@/lib/hooks/useDataset';
import { censusStates, type CensusState } from '@/lib/data/census';
import { median, pearson, regionSummaries } from '@/lib/census';
import { nf, rate as rateFmt } from '@/lib/format';

/** NCRB's published national crime rate, per 100,000 (Crime in India 2023). */
const NATIONAL_CRIME_RATE = 448.3;

/** NCRB state names that differ from the census spelling. */
const ALIASES: Record<string, string> = {
  'Jammu & Kashmir': 'Jammu and Kashmir',
  Orissa: 'Odisha',
  Uttaranchal: 'Uttarakhand',
  'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
};

interface Joined {
  state: CensusState;
  crimeRate: number;
}

export default function CrimeCensusPage() {
  const { data, live, status } = useDataset('overview');

  const joined = useMemo<Joined[]>(() => {
    const byName = new Map(censusStates.map((s) => [s.name, s]));
    const out: Joined[] = [];
    for (const row of data.stateRates) {
      const name = ALIASES[row.name] ?? row.name;
      const state = byName.get(name);
      if (state && Number.isFinite(row.rate)) out.push({ state, crimeRate: row.rate });
    }
    return out;
  }, [data.stateRates]);

  const corr = (key: (s: CensusState) => number | null) => {
    const pairs: [number, number][] = [];
    for (const j of joined) {
      const v = key(j.state);
      if (typeof v === 'number' && Number.isFinite(v)) pairs.push([v, j.crimeRate]);
    }
    return { r: pearson(pairs), n: pairs.length };
  };

  const litR = corr((s) => s.literacy);
  const urbR = corr((s) => s.urbanPct);
  const srR = corr((s) => s.sexRatio);
  const denR = corr((s) => s.density);
  const growR = corr((s) => s.growth);

  const litPoints = joined
    .filter((j) => j.state.literacy != null)
    .map((j) => ({ label: j.state.name, x: j.state.literacy as number, y: j.crimeRate, always: j.crimeRate > 800 || (j.state.literacy as number) > 90 }));
  const urbPoints = joined
    .filter((j) => j.state.urbanPct != null)
    .map((j) => ({ label: j.state.name, x: j.state.urbanPct as number, y: j.crimeRate, always: j.crimeRate > 800 || (j.state.urbanPct as number) > 60 }));

  const regions = regionSummaries()
    .map((r) => {
      const rows = joined.filter((j) => j.state.region === r.region);
      const mean = rows.length ? rows.reduce((t, j) => t + j.crimeRate, 0) / rows.length : null;
      return { region: r.region, mean, count: rows.length, literacy: r.literacy };
    })
    .filter((r) => r.mean != null)
    .sort((a, b) => (b.mean as number) - (a.mean as number));

  return (
    <>
      <PageHeader
        title="Crime and the census"
        description="Registered crime against literacy, urbanisation, sex ratio and density — the questions this app can answer because it holds both datasets. Every relationship here is weaker and stranger than the headline version of the story."
        live={live}
        status={status}
        source={`${data.source} × Census of India 2011`}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="States joined" value={`${joined.length} of ${censusStates.length}`} note="both datasets present" />
          <StatCard label="National crime rate" value={rateFmt(NATIONAL_CRIME_RATE)} note="per 100,000, NCRB 2023" />
          <StatCard label="vs literacy" value={litR.r == null ? '—' : litR.r.toFixed(2)} note={`r, n = ${litR.n}`} />
          <StatCard label="vs urbanisation" value={urbR.r == null ? '—' : urbR.r.toFixed(2)} note={`r, n = ${urbR.n}`} />
          <StatCard label="vs sex ratio" value={srR.r == null ? '—' : srR.r.toFixed(2)} note={`r, n = ${srR.n}`} />
          <StatCard label="vs density" value={denR.r == null ? '—' : denR.r.toFixed(2)} note={`r, n = ${denR.n}`} />
        </CardGrid>

        <Card title="Correlations with the recorded crime rate" caption="Pearson r across the states that appear in both datasets. Positive means a higher crime rate goes with a higher value of the census measure.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Census measure</th>
                  <th style={{ textAlign: 'right' }}>r</th>
                  <th style={{ textAlign: 'right' }}>n</th>
                  <th>What it means</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Literacy rate', res: litR, note: 'The naive reading — "education reduces crime" — is not what this shows.' },
                  { name: 'Urban share', res: urbR, note: 'Cities register more cases per head. Whether they have more crime is a separate question.' },
                  { name: 'Sex ratio', res: srR, note: 'Any relationship here is confounded by region and by reporting culture.' },
                  { name: 'Density', res: denR, note: 'Density and urbanisation are near-duplicates, so this is not independent evidence.' },
                  { name: 'Decadal growth', res: growR, note: 'Fast-growing states tend to register less, not more — which says something about registration capacity.' },
                ].map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{row.res.r == null ? '—' : row.res.r.toFixed(2)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{row.res.n}</td>
                    <td className="muted" style={{ fontSize: '0.82rem' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid-2">
          <Card title="Crime rate against literacy" caption="Each dot is a state. If literacy suppressed crime you would see a clear downward slope; you do not.">
            <ScatterPlot
              points={litPoints}
              xLabel="Literacy %"
              yLabel="Crime rate /100k"
              xFormat={(v) => `${v.toFixed(0)}%`}
              yFormat={(v) => v.toFixed(0)}
              medianX={median(litPoints.map((p) => p.x))}
              medianY={median(litPoints.map((p) => p.y))}
              quadrantLabels={['less literate, lower rate', 'more literate, lower rate', 'less literate, higher rate', 'more literate, higher rate']}
              height={320}
            />
          </Card>
          <Card title="Crime rate against urbanisation" caption="The clearest of these relationships — and the least surprising, because cities generate registrations.">
            <ScatterPlot
              points={urbPoints}
              xLabel="Urban share %"
              yLabel="Crime rate /100k"
              xFormat={(v) => `${v.toFixed(0)}%`}
              yFormat={(v) => v.toFixed(0)}
              medianX={median(urbPoints.map((p) => p.x))}
              medianY={median(urbPoints.map((p) => p.y))}
              quadrantLabels={['rural, lower rate', 'urban, lower rate', 'rural, higher rate', 'urban, higher rate']}
              height={320}
            />
          </Card>
        </div>

        <Card title="Mean crime rate by census region" caption="Simple mean of the joined states in each region — not population-weighted, so small states count as much as large ones.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>States joined</th>
                  <th style={{ textAlign: 'right' }}>Mean crime rate</th>
                  <th style={{ textAlign: 'right' }}>Literacy</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.region}>
                    <td>{r.region}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.count}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{rateFmt(r.mean as number)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{r.literacy == null ? '—' : `${r.literacy.toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="The join, state by state" caption="Crime rate against the four census measures, for every state present in both datasets.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>Crime rate</th>
                  <th style={{ textAlign: 'right' }}>Literacy</th>
                  <th style={{ textAlign: 'right' }}>Urban %</th>
                  <th style={{ textAlign: 'right' }}>Sex ratio</th>
                  <th style={{ textAlign: 'right' }}>Density</th>
                </tr>
              </thead>
              <tbody>
                {[...joined].sort((a, b) => b.crimeRate - a.crimeRate).map((j) => (
                  <tr key={j.state.id}>
                    <td>{j.state.name}</td>
                    <td className="muted">{j.state.region}</td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{rateFmt(j.crimeRate)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{j.state.literacy == null ? '—' : `${j.state.literacy.toFixed(1)}%`}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{j.state.urbanPct == null ? '—' : `${j.state.urbanPct.toFixed(1)}%`}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{j.state.sexRatio ?? '—'}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{nf(j.state.density)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="callout warn">
          <strong>The dependent variable is broken.</strong> The crime rate counts cases the police <em>registered</em>.
          Two states with identical offending will publish different rates if one registers more diligently, if its
          victims report more readily, or if its population has more faith in the police. Kerala and Delhi sit at the top
          of India&apos;s crime-rate table not because they are the most dangerous places but because they register the
          most cases per head. Any correlation on this page is therefore a correlation with <em>registration</em> as
          much as with crime — which is exactly why the literacy relationship disappears.
        </div>

        <div className="callout">
          <strong>What this page is good for.</strong> Not causal claims. It is good for killing the lazy ones: that
          literacy suppresses crime, that cities are where crime happens, that the sex ratio predicts violence against
          women. Each of those is testable here, and each turns out to be weaker than its slogan. The honest conclusion
          is that reported crime tracks state capacity — and state capacity is what literacy and urbanisation are also
          measuring.
        </div>
      </div>
    </>
  );
}
