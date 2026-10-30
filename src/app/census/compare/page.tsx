'use client';

/**
 * Compare two states across every measure, with the rank of each within the
 * country. Ranks make the deltas interpretable: a two-point literacy gap means
 * something different at rank 3 than at rank 30.
 */
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { censusMeta, censusStates, india } from '@/lib/data/census';
import { METRICS, metricById, rankOf, regionSummaries } from '@/lib/census';
import { nf } from '@/lib/format';

export default function ComparePage() {
  const [aId, setAId] = useState('KL');
  const [bId, setBId] = useState('BR');

  const a = censusStates.find((s) => s.id === aId) ?? censusStates[0];
  const b = censusStates.find((s) => s.id === bId) ?? censusStates[1];

  const rows = METRICS.map((m) => {
    const va = m.get(a);
    const vb = m.get(b);
    return {
      metric: m,
      a: va,
      b: vb,
      diff: typeof va === 'number' && typeof vb === 'number' ? vb - va : null,
      ra: rankOf(a.name, m.id),
      rb: rankOf(b.name, m.id),
    };
  });

  const regions = regionSummaries();

  return (
    <>
      <PageHeader
        title="Compare two states"
        description="Every measure side by side, with each state's rank among the 36 states and union territories. The rank column is the honest one: it tells you whether a difference is a rounding error or a chasm."
        source={censusMeta.source}
      />

      <div className="stack">
        <Card title="Pick a pair" caption="Any two of the 36 states and union territories.">
          <div className="map-controls">
            <label className="field">
              <span>State A</span>
              <select value={aId} onChange={(e) => setAId(e.target.value)}>
                {censusStates.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>State B</span>
              <select value={bId} onChange={(e) => setBId(e.target.value)}>
                {censusStates.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <button
              className="btn-ghost"
              onClick={() => { const t = aId; setAId(bId); setBId(t); }}
              title="Swap the two states"
            >
              ⇄ Swap
            </button>
          </div>
        </Card>

        <Card title={`${a.name} vs ${b.name}`} caption="Ranks are 1 = highest in the country. A dash means the measure was not published for that unit.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th style={{ textAlign: 'right' }}>{a.name}</th>
                  <th style={{ textAlign: 'right' }}>rank</th>
                  <th style={{ textAlign: 'right' }}>{b.name}</th>
                  <th style={{ textAlign: 'right' }}>rank</th>
                  <th style={{ textAlign: 'right' }}>difference</th>
                  <th style={{ textAlign: 'right' }}>India</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const national: Record<string, number> = {
                    pop2011: india.pop2011,
                    density: india.density,
                    growth: india.growth,
                    sexRatio: india.sexRatio,
                    childSexRatio: india.childSexRatio,
                    literacy: india.literacy,
                    literacyFemale: india.literacyFemale,
                    urbanPct: india.urbanPct,
                  };
                  const nat = national[r.metric.id];
                  return (
                    <tr key={r.metric.id}>
                      <td>{r.metric.label}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {r.a == null ? '—' : r.metric.format(r.a)}
                      </td>
                      <td className="num muted" style={{ textAlign: 'right' }}>{r.ra || '—'}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {r.b == null ? '—' : r.metric.format(r.b)}
                      </td>
                      <td className="num muted" style={{ textAlign: 'right' }}>{r.rb || '—'}</td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {r.diff == null ? '—' : `${r.diff >= 0 ? '+' : '−'}${r.metric.format(Math.abs(r.diff))}`}
                      </td>
                      <td className="num muted" style={{ textAlign: 'right' }}>{nat == null ? '—' : r.metric.format(nat)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid-2">
          <Card title="Regional context" caption="Both states against their region's population-weighted average.">
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th style={{ textAlign: 'right' }}>Literacy</th>
                    <th style={{ textAlign: 'right' }}>Urban</th>
                    <th style={{ textAlign: 'right' }}>Sex ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {[a.region, b.region]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .map((reg) => {
                      const r = regions.find((x) => x.region === reg);
                      return (
                        <tr key={reg}>
                          <td>{reg}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{r?.literacy == null ? '—' : `${r.literacy.toFixed(1)}%`}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{r?.urbanPct == null ? '—' : `${r.urbanPct.toFixed(1)}%`}</td>
                          <td className="num" style={{ textAlign: 'right' }}>{r?.sexRatio == null ? '—' : r.sexRatio.toFixed(0)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Population weight" caption="What the comparison is actually weighting.">
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>State</th>
                    <th style={{ textAlign: 'right' }}>Population</th>
                    <th style={{ textAlign: 'right' }}>Share of India</th>
                    <th style={{ textAlign: 'right' }}>Area km²</th>
                  </tr>
                </thead>
                <tbody>
                  {[a, b].map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{nf(s.pop2011)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{((s.pop2011 / india.pop2011) * 100).toFixed(2)}%</td>
                      <td className="num" style={{ textAlign: 'right' }}>{nf(s.area)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="callout">
          <strong>A difference is not a verdict.</strong> Every measure on this page is a 2011 snapshot, and several are
          shaped by things the other state cannot copy: coastline, terrain, colonial-era port cities, the timing of the
          demographic transition. Comparing Kerala with Bihar is genuinely informative — they sit at opposite ends of
          almost every column — but it is a comparison of two different points in a transition, not a scorecard.
        </div>
      </div>
    </>
  );
}
