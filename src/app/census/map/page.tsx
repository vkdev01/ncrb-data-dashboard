'use client';

/**
 * Census map — every state measure, plus a genuine district-level view.
 *
 * Two levels from the same boundary file:
 *  - `state`: each district is coloured by its state's value
 *  - `district`: each district is coloured by its own value (population, density,
 *    area — the three measures the district tables publish)
 *
 * District names come from a different source than the boundaries, so matching is
 * exact-then-fuzzy within the state (see lib/match.ts) and the coverage achieved
 * is reported rather than hidden.
 */
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChoroplethMap } from '@/components/charts/ChoroplethMap';
import { ExportButton } from '@/components/ui/ExportButton';
import { useGeo } from '@/lib/hooks/useGeo';
import { censusMeta, censusStates } from '@/lib/data/census';
import { censusDistricts } from '@/lib/data/districts';
import { median, METRICS, metricById, ranked } from '@/lib/census';
import { buildDistrictIndex } from '@/lib/match';
import { compactIN, nf } from '@/lib/format';
import type { PathFeature } from '@/lib/geo';

type Level = 'state' | 'district';

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const ALIASES: Record<string, string> = {
  orissa: 'odisha',
  uttaranchal: 'uttarakhand',
  'nct of delhi': 'delhi',
  'jammu & kashmir': 'jammu and kashmir',
  'dadra and nagar haveli': 'dadra and nagar haveli and daman and diu',
  'daman and diu': 'dadra and nagar haveli and daman and diu',
  pondicherry: 'puducherry',
};

interface DistrictMetric {
  id: string;
  label: string;
  from: string;
  to: string;
  get: (d: { pop: number | null; density: number | null; area: number | null }) => number | null;
  format: (v: number) => string;
}

const DISTRICT_METRICS: DistrictMetric[] = [
  {
    id: 'd-pop',
    label: 'District population (2011)',
    from: '#eef2f7',
    to: '#334155',
    get: (d) => d.pop,
    format: (v) => nf(v),
  },
  {
    id: 'd-density',
    label: 'District density (per km²)',
    from: '#eaf1f7',
    to: '#0c4a6e',
    get: (d) => d.density,
    format: (v) => nf(v),
  },
  {
    id: 'd-area',
    label: 'District area (km²)',
    from: '#f2f1ec',
    to: '#57534e',
    get: (d) => d.area,
    format: (v) => nf(v),
  },
];

const GROUPS = [...new Set(METRICS.map((m) => m.group))];

export default function CensusMapPage() {
  const { geo, error } = useGeo();
  const [level, setLevel] = useState<Level>('state');
  const [metricId, setMetricId] = useState('pop2011');
  const [districtMetricId, setDistrictMetricId] = useState('d-pop');

  const metric = metricById.get(metricId) ?? METRICS[0];
  const dMetric = DISTRICT_METRICS.find((m) => m.id === districtMetricId) ?? DISTRICT_METRICS[0];

  /* ------------------------------------------------------------- state values */
  const stateValues = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of censusStates) {
      const v = metric.get(s);
      if (typeof v === 'number' && Number.isFinite(v)) m.set(norm(s.name), v);
    }
    return m;
  }, [metric]);

  /* ---------------------------------------------------------- district values */
  const districtView = useMemo(() => {
    const rows = censusDistricts
      .map((d) => ({ d: d.d, s: d.s, v: dMetric.get(d) }))
      .filter((r): r is { d: string; s: string; v: number } => typeof r.v === 'number' && Number.isFinite(r.v));
    const index = buildDistrictIndex(rows);
    const values = new Map<string, number>();
    let total = 0;
    for (const f of geo?.features ?? []) {
      const p = f.properties;
      if (!p.d) continue;
      total++;
      const hit = index.get(p.s, p.d);
      if (hit) values.set(`${norm(p.s)}|${norm(p.d)}`, hit.value);
    }
    return { values, matched: values.size, total, rows };
  }, [geo, dMetric]);

  const valueOf = (f: PathFeature) =>
    level === 'state'
      ? stateValues.get(norm(f.state)) ?? stateValues.get(ALIASES[norm(f.state)] ?? norm(f.state))
      : districtView.values.get(`${norm(f.state)}|${norm(f.district)}`);

  const stateRows = ranked(metric.id);
  const med = median(stateRows.map((r) => r.value));
  const missing = censusStates.length - stateRows.length;

  const districtRows = [...districtView.rows].sort((a, b) => b.v - a.v);

  const activeLabel = level === 'state' ? metric.label : dMetric.label;
  const activeFormat = level === 'state' ? metric.format : dMetric.format;
  const activeFrom = level === 'state' ? metric.from : dMetric.from;
  const activeTo = level === 'state' ? metric.to : dMetric.to;

  return (
    <>
      <PageHeader
        title="Census map"
        description="Sixteen state-level measures and three district-level ones on the same map. Shading is by rank, so the pattern stays readable even where one state or district dominates."
        source={censusMeta.source}
      />

      <div className="stack">
        <Card
          title={activeLabel}
          caption={
            level === 'state'
              ? metric.blurb
              : 'District-level figures. Only population, area and density were published at this geography, so literacy and sex ratio stay state-level.'
          }
          action={
            <div className="seg">
              <button className={level === 'state' ? 'on' : ''} onClick={() => setLevel('state')}>State</button>
              <button className={level === 'district' ? 'on' : ''} onClick={() => setLevel('district')}>District</button>
            </div>
          }
        >
          <div className="map-controls">
            {level === 'state' ? (
              <label className="field">
                <span>Measure</span>
                <select value={metricId} onChange={(e) => setMetricId(e.target.value)}>
                  {GROUPS.map((g) => (
                    <optgroup key={g} label={g}>
                      {METRICS.filter((m) => m.group === g).map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
            ) : (
              <label className="field">
                <span>District measure</span>
                <select value={districtMetricId} onChange={(e) => setDistrictMetricId(e.target.value)}>
                  {DISTRICT_METRICS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </label>
            )}
            {level === 'district' ? (
              <span className="badge badge-muted">
                {districtView.matched} of {districtView.total} boundaries matched
              </span>
            ) : null}
          </div>

          <div className="map-layout">
            <div className="map-main">
              {error ? (
                <div className="callout warn">Could not load the boundary file.</div>
              ) : !geo ? (
                <div className="chart-empty">Loading map…</div>
              ) : (
                <ChoroplethMap
                  geo={geo}
                  valueOf={valueOf}
                  from={activeFrom}
                  to={activeTo}
                  legendTitle={activeLabel}
                  format={activeFormat}
                  ariaLabel={`India choropleth: ${activeLabel}, Census 2011`}
                />
              )}
            </div>

            <aside className="map-side">
              <div className="rank-list">
                <h4>Highest</h4>
                {(level === 'state'
                  ? stateRows.slice(0, 6).map((r) => ({ name: r.state.name, value: r.value }))
                  : districtRows.slice(0, 6).map((r) => ({ name: r.d, value: r.v }))
                ).map((r) => (
                  <div className="rank-row" key={r.name}>
                    <span className="rank-name">{r.name}</span>
                    <span className="rank-val">{activeFormat(r.value)}</span>
                  </div>
                ))}
              </div>
              <div className="rank-list">
                <h4>Lowest</h4>
                {(level === 'state'
                  ? stateRows.slice(-6).reverse().map((r) => ({ name: r.state.name, value: r.value }))
                  : districtRows.slice(-6).reverse().map((r) => ({ name: r.d, value: r.v }))
                ).map((r) => (
                  <div className="rank-row" key={r.name}>
                    <span className="rank-name">{r.name}</span>
                    <span className="rank-val">{activeFormat(r.value)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Card>

        {level === 'state' ? (
          <Card
            title="As a table"
            caption={`All ${stateRows.length} states and UTs with a value for ${metric.short.toLowerCase()}${missing ? ` · ${missing} not tabulated` : ''}.`}
            action={
              <ExportButton
                rows={stateRows.map((r) => ({
                  state: r.state.name,
                  region: r.state.region,
                  metric: metric.id,
                  value: +r.value.toFixed(2),
                }))}
                filename={`census-${metric.id}`}
              />
            }
          >
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>#</th>
                    <th>State / UT</th>
                    <th>Region</th>
                    <th style={{ textAlign: 'right' }}>{metric.short}</th>
                    <th style={{ textAlign: 'right' }}>vs median</th>
                  </tr>
                </thead>
                <tbody>
                  {stateRows.map((r, i) => (
                    <tr key={r.state.id}>
                      <td className="num" style={{ textAlign: 'right' }}>{i + 1}</td>
                      <td>{r.state.name}</td>
                      <td className="muted">{r.state.region}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{metric.format(r.value)}</td>
                      <td className="num" style={{ textAlign: 'right' }} title={`Median across the ${stateRows.length} units: ${metric.format(med)}`}>
                        {`${r.value - med >= 0 ? '+' : '−'}${metric.format(Math.abs(r.value - med))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card
            title="Districts"
            caption={`${districtView.rows.length} districts with a value for this measure, ranked. ${districtView.matched} of ${districtView.total} boundary polygons were matched by name.`}
            action={
              <ExportButton
                rows={districtRows.map((r) => ({ district: r.d, state: r.s, metric: dMetric.id, value: Math.round(r.v) }))}
                filename={`census-districts-${dMetric.id}`}
              />
            }
          >
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>#</th>
                    <th>District</th>
                    <th>State / UT</th>
                    <th style={{ textAlign: 'right' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {districtRows.slice(0, 40).map((r, i) => (
                    <tr key={`${r.s}-${r.d}`}>
                      <td className="num" style={{ textAlign: 'right' }}>{i + 1}</td>
                      <td>{r.d}</td>
                      <td className="muted">{r.s}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{dMetric.format(r.v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10 }}>
              Top 40 shown; the CSV has all {districtView.rows.length}. Largest district population:{' '}
              {districtRows[0]?.d} ({compactIN(districtRows[0]?.v ?? 0)}).
            </p>
          </Card>
        )}

        <div className="callout">
          <strong>Grey means no value, for two different reasons.</strong> At state level, Telangana, Ladakh and the
          merged Dadra &amp; Nagar Haveli and Daman &amp; Diu were never tabulated for child sex ratio or literacy. At
          district level, the grey patches are districts created <em>after</em> 2011 — they exist on the modern boundary
          file but had no separate census figure, so nothing is coloured in. Roughly nine in ten boundaries match.
        </div>

        <div className="callout warn">
          <strong>Boundaries current, figures 2011.</strong> The outline shows India as it is now; the census figures have
          been reconciled onto that geography. Shading is by rank, not absolute value — for density in particular the
          spread is so extreme (Delhi&apos;s {nf(11297)} per km² against Ladakh&apos;s {nf(3)}) that a linear ramp would
          render the whole country one pale shade.
        </div>
      </div>
    </>
  );
}
