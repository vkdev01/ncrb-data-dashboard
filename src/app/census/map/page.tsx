'use client';

/**
 * Census map — every measure in the section, rendered as a choropleth.
 *
 * The boundary file is district-level, so each district is coloured by its
 * state's value: this is a state map drawn from district geometry. Shading is by
 * rank, because census measures are skewed (a couple of states hold most of the
 * population) and a linear ramp leaves the whole map at one end.
 */
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChoroplethMap } from '@/components/charts/ChoroplethMap';
import { ExportButton } from '@/components/ui/ExportButton';
import { useGeo } from '@/lib/hooks/useGeo';
import { censusMeta, censusStates } from '@/lib/data/census';
import { median, METRICS, metricById, ranked } from '@/lib/census';
import { nf } from '@/lib/format';
import type { PathFeature } from '@/lib/geo';

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

const GROUPS = [...new Set(METRICS.map((m) => m.group))];

export default function CensusMapPage() {
  const { geo, error } = useGeo();
  const [metricId, setMetricId] = useState('pop2011');

  const metric = metricById.get(metricId) ?? METRICS[0];

  const values = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of censusStates) {
      const v = metric.get(s);
      if (typeof v === 'number' && Number.isFinite(v)) m.set(norm(s.name), v);
    }
    return m;
  }, [metric]);

  const valueOf = (f: PathFeature) => {
    const key = norm(f.state);
    return values.get(ALIASES[key] ?? key);
  };

  const rows = ranked(metric.id);
  const missing = censusStates.length - rows.length;
  const med = median(rows.map((r) => r.value));

  return (
    <>
      <PageHeader
        title="Census map"
        description="Population, density, growth, sex ratio, literacy and urbanisation — switch between them on the same map. Shading is by rank, so the pattern stays readable even where one state dominates."
        source={censusMeta.source}
      />

      <div className="stack">
        <Card
          title={metric.label}
          caption={metric.blurb}
          action={<span className="badge badge-muted">2011</span>}
        >
          <div className="map-controls">
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
                  from={metric.from}
                  to={metric.to}
                  legendTitle={metric.label}
                  format={metric.format}
                  ariaLabel={`India choropleth: ${metric.label}, Census 2011`}
                />
              )}
            </div>

            <aside className="map-side">
              <div className="rank-list">
                <h4>Highest</h4>
                {rows.slice(0, 6).map((r) => (
                  <div className="rank-row" key={r.state.id}>
                    <span className="rank-name">{r.state.name}</span>
                    <span className="rank-val">{metric.format(r.value)}</span>
                  </div>
                ))}
              </div>
              <div className="rank-list">
                <h4>Lowest</h4>
                {rows.slice(-6).reverse().map((r) => (
                  <div className="rank-row" key={r.state.id}>
                    <span className="rank-name">{r.state.name}</span>
                    <span className="rank-val">{metric.format(r.value)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Card>

        <Card
          title="As a table"
          caption={`All ${rows.length} states and UTs with a value for ${metric.short.toLowerCase()}${missing ? ` · ${missing} not tabulated` : ''}.`}
          action={
            <ExportButton
              rows={rows.map((r) => ({
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
                {rows.map((r, i) => (
                  <tr key={r.state.id}>
                    <td className="num" style={{ textAlign: 'right' }}>{i + 1}</td>
                    <td>{r.state.name}</td>
                    <td className="muted">{r.state.region}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{metric.format(r.value)}</td>
                    <td className="num" style={{ textAlign: 'right' }} title={`Median across the ${rows.length} units: ${metric.format(med)}`}>
                      {`${r.value - med >= 0 ? '+' : '−'}${metric.format(Math.abs(r.value - med))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="callout">
          <strong>Grey means not tabulated.</strong> Telangana, Ladakh, and the merged Dadra &amp; Nagar Haveli and
          Daman &amp; Diu did not exist as these units at census time, so a few cells — child sex ratio and literacy for
          all three — were never published at this geography. They are left blank rather than estimated.
        </div>

        <div className="callout warn">
          <strong>Boundaries are current, figures are 2011.</strong> The outline shows India as it is now (Telangana
          separate, Ladakh a union territory, DNH and Daman &amp; Diu merged). The census figures have been reconciled
          onto that geography, which is why a few units carry partial data. Counts also include the census&apos;s
          estimated population for areas it could not enumerate — the census publishes those estimates, so they are
          used here as published.
        </div>

        <div className="callout">
          <strong>Rank shading, not absolute shading.</strong> A darker region is higher <em>relative to other states</em>,
          not high in absolute terms. For density in particular the spread is extreme — Delhi is {nf(11297)} per km²
          against Ladakh&apos;s single digits — and a linear ramp would render the entire country as one pale shade.
        </div>
      </div>
    </>
  );
}
