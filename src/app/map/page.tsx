'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChoroplethMap } from '@/components/charts/ChoroplethMap';
import { ExportButton } from '@/components/ui/ExportButton';
import { useDataset } from '@/lib/hooks/useDataset';
import { useGeo } from '@/lib/hooks/useGeo';
import { buildDistrictIndex, normName } from '@/lib/match';
import { nf, rate as rateFmt } from '@/lib/format';

type Level = 'state' | 'district';
type StateMetric = 'rate' | 'total' | 'womenRate';
type DistrictMetric = 'murder' | 'womenChild';

interface DistrictRow {
  d: string;
  s: string;
  murder?: number;
  womenChild?: number;
}

const STATE_METRICS: Record<StateMetric, { label: string; from: string; to: string; fmt: (v: number) => string }> = {
  rate: { label: 'Crime rate per 100,000', from: '#e6eef8', to: '#1d4e89', fmt: rateFmt },
  total: { label: 'Total recorded cases', from: '#f6ece0', to: '#b45309', fmt: (v) => nf(v) },
  womenRate: { label: 'Crimes against women per 100,000 women', from: '#fbe4ea', to: '#be123c', fmt: rateFmt },
};

const DISTRICT_METRICS: Record<DistrictMetric, { label: string; from: string; to: string }> = {
  murder: { label: 'Murders recorded, 2024', from: '#f1e6f5', to: '#7c3f98' },
  womenChild: { label: 'Offences against women & children, 2024', from: '#fbe4ea', to: '#be123c' },
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const STATE_ALIASES: Record<string, string> = {
  Orissa: 'Odisha',
  Uttaranchal: 'Uttarakhand',
  'Jammu and Kashmir': 'Jammu & Kashmir',
};

const key = (s: string, d: string) => `${normName(s)}|${normName(d)}`;

export default function MapPage() {
  const { data: overview, live, status } = useDataset('overview');
  const { data: women } = useDataset('womenSafety');
  const { geo, error } = useGeo();

  const [level, setLevel] = useState<Level>('state');
  const [stateMetric, setStateMetric] = useState<StateMetric>('rate');
  const [districtMetric, setDistrictMetric] = useState<DistrictMetric>('murder');
  const [selected, setSelected] = useState<string | null>(null);
  const [districts, setDistricts] = useState<DistrictRow[] | null>(null);
  const [districtErr, setDistrictErr] = useState(false);
  const firstSync = useRef(true);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/data/districts.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: DistrictRow[]) => alive && setDistricts(d))
      .catch(() => alive && setDistrictErr(true));
    return () => {
      alive = false;
    };
  }, []);

  /* ---- shareable URL state: read once, then keep the query string in sync ---- */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const l = p.get('level');
    const m = p.get('metric');
    const s = p.get('state');
    if (l === 'state' || l === 'district') setLevel(l);
    if (m && m in STATE_METRICS) setStateMetric(m as StateMetric);
    if (m && m in DISTRICT_METRICS) {
      setDistrictMetric(m as DistrictMetric);
      setLevel('district');
    }
    if (s) setSelected(s);
  }, []);

  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    const metric = level === 'state' ? stateMetric : districtMetric;
    const params = new URLSearchParams({ level, metric });
    if (selected) params.set('state', selected);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [level, stateMetric, districtMetric, selected]);

  const stateMaps = useMemo(() => {
    const rate = new Map<string, number>();
    const total = new Map<string, number>();
    for (const s of overview.stateRates) {
      const k = normName(STATE_ALIASES[s.name] ?? s.name);
      rate.set(k, s.rate);
      if (s.total != null) total.set(k, s.total);
    }
    const womenRate = new Map<string, number>();
    for (const s of women.stateRates) womenRate.set(normName(STATE_ALIASES[s.name] ?? s.name), s.rate);
    return { rate, total, womenRate };
  }, [overview.stateRates, women.stateRates]);

  const districtView = useMemo(() => {
    if (!geo || !districts) return null;
    const rows = districts
      .map((r) => ({ d: r.d, s: r.s, v: (districtMetric === 'murder' ? r.murder : r.womenChild) as number }))
      .filter((r) => typeof r.v === 'number');
    const index = buildDistrictIndex(rows);
    const values = new Map<string, number>();
    let total = 0;
    for (const f of geo.features) {
      const { d, s } = f.properties;
      if (!d) continue;
      total++;
      const hit = index.get(s, d);
      if (hit) values.set(key(s, d), hit.value);
    }
    return { values, matched: values.size, total };
  }, [geo, districts, districtMetric]);

  /* ---- rows for the drill-down table + CSV ---- */
  const selectedRows = useMemo(() => {
    if (!selected || !districts) return [];
    const target = normName(selected);
    return districts
      .filter((r) => normName(r.s) === target)
      .map((r) => ({ district: r.d, state: r.s, murders_2024: r.murder ?? null, women_child_2024: r.womenChild ?? null }))
      .sort((a, b) => (b.murders_2024 ?? 0) - (a.murders_2024 ?? 0));
  }, [selected, districts]);

  const allStateRows = useMemo(
    () =>
      overview.stateRates.map((s) => ({
        state: s.name,
        crime_rate_per_100k: s.rate,
        cases: s.total ?? null,
        women_crime_rate_per_100k_women: women.stateRates.find((w) => w.name === s.name)?.rate ?? null,
      })),
    [overview.stateRates, women.stateRates],
  );

  const sm = STATE_METRICS[stateMetric];
  const dm = DISTRICT_METRICS[districtMetric];
  const title = level === 'state' ? sm.label : dm.label;
  const from = level === 'state' ? sm.from : dm.from;
  const to = level === 'state' ? sm.to : dm.to;
  const format = level === 'state' ? sm.fmt : (v: number) => nf(v);

  const valueOf = (f: { district: string; state: string }) =>
    level === 'state'
      ? stateMaps[stateMetric].get(normName(STATE_ALIASES[f.state] ?? f.state))
      : districtView?.values.get(key(f.state, f.district));

  const coverage =
    level === 'district' && districtView
      ? `${districtView.matched} of ${districtView.total} district boundaries matched a data row`
      : undefined;

  return (
    <>
      <PageHeader
        title="Map of India"
        description="Recorded crime drawn over India's boundaries. Click any region to see its districts, and use the table view for a screen-reader friendly alternative."
        live={live}
        status={status}
        source={overview.source}
      />

      <div className="stack">
        <Card
          title={title}
          caption={
            level === 'state'
              ? 'Shading is by rank, so the pattern stays visible even though a few states dominate. Grey means no data. Click a state to list its districts.'
              : `District-level figures for 2024, from NCRB district tables. Shading is by rank. Grey means no data${coverage ? ` — ${coverage}.` : '.'}`
          }
          action={
            <div className="seg">
              <button className={level === 'state' ? 'on' : ''} onClick={() => setLevel('state')}>
                State
              </button>
              <button
                className={level === 'district' ? 'on' : ''}
                onClick={() => setLevel('district')}
                disabled={districtErr}
                title={districtErr ? 'District data unavailable in this build' : undefined}
              >
                District
              </button>
            </div>
          }
        >
          <div className="controls" style={{ marginBottom: 16 }}>
            {level === 'state'
              ? (Object.keys(STATE_METRICS) as StateMetric[]).map((k) => (
                  <button key={k} className={`chip${stateMetric === k ? ' active' : ''}`} onClick={() => setStateMetric(k)}>
                    {STATE_METRICS[k].label.split(' per ')[0]}
                  </button>
                ))
              : (Object.keys(DISTRICT_METRICS) as DistrictMetric[]).map((k) => (
                  <button
                    key={k}
                    className={`chip${districtMetric === k ? ' active' : ''}`}
                    onClick={() => setDistrictMetric(k)}
                  >
                    {DISTRICT_METRICS[k].label.replace(', 2024', '')}
                  </button>
                ))}
          </div>

          {error ? (
            <div className="callout warn">Could not load the boundary file (public/data/india-districts.geojson).</div>
          ) : level === 'district' && !districtView ? (
            <div className="chart-empty">
              {districtErr ? 'District data is not available in this build.' : 'Loading district data…'}
            </div>
          ) : !geo ? (
            <div className="chart-empty">Loading map…</div>
          ) : (
            <ChoroplethMap
              geo={geo}
              valueOf={valueOf}
              from={from}
              to={to}
              legendTitle={title}
              format={format}
              onSelect={(f) => setSelected(f.state)}
              ariaLabel={`India choropleth: ${title}`}
            />
          )}
        </Card>

        {selected ? (
          <Card
            title={`Districts in ${selected}`}
            caption={`${selectedRows.length} districts · 2024 figures from NCRB district tables.`}
            action={selectedRows.length ? <ExportButton rows={selectedRows} filename={`ncrb-districts-${normName(selected)}`} /> : null}
          >
            {selectedRows.length ? (
              <div className="table-wrap">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th style={{ textAlign: 'right' }}>Murders</th>
                      <th style={{ textAlign: 'right' }}>Offences vs women &amp; children</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((r) => (
                      <tr key={r.district}>
                        <td>{r.district}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{r.murders_2024 != null ? nf(r.murders_2024) : '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{r.women_child_2024 != null ? nf(r.women_child_2024) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">
                No district rows for this state in the dataset — it may be a union territory reported without district detail.
              </p>
            )}
          </Card>
        ) : null}

        <details className="card" open={false}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--ink)' }}>
            View as a table (accessible alternative)
          </summary>
          <div style={{ marginTop: 14 }}>
            <div className="table-tools" style={{ marginBottom: 8 }}>
              <span className="muted" style={{ fontSize: '0.78rem' }}>{allStateRows.length} states &amp; UTs</span>
              <ExportButton rows={allStateRows} filename="ncrb-states-map-values" />
            </div>
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>State / UT</th>
                    <th style={{ textAlign: 'right' }}>Crime rate</th>
                    <th style={{ textAlign: 'right' }}>Cases</th>
                    <th style={{ textAlign: 'right' }}>Women (rate)</th>
                  </tr>
                </thead>
                <tbody>
                  {allStateRows.map((r) => (
                    <tr key={r.state}>
                      <td>{r.state}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{rateFmt(r.crime_rate_per_100k)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{r.cases != null ? nf(r.cases) : '—'}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{r.women_crime_rate_per_100k_women != null ? rateFmt(r.women_crime_rate_per_100k_women) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {districts ? (
              <div className="table-tools" style={{ marginTop: 12 }}>
                <span className="muted" style={{ fontSize: '0.78rem' }}>{districts.length} district rows</span>
                <ExportButton
                  rows={districts.map((d) => ({ district: d.d, state: d.s, murders_2024: d.murder ?? null, women_child_2024: d.womenChild ?? null }))}
                  filename="ncrb-districts-2024-all"
                  label="CSV (all districts)"
                />
              </div>
            ) : null}
          </div>
        </details>

        <div className="callout">
          <strong>What the colours do and don&apos;t mean.</strong> A darker region has a higher <em>recorded</em> figure.
          That reflects offending, reporting and registration together — areas that register more cases look darker
          regardless of underlying crime. Shading is by rank rather than absolute value, so the darkest district is
          simply the highest, not a fixed multiple of the lightest. Boundaries are the 2011-census vintage, so later
          district splits are not reflected.
        </div>
      </div>
    </>
  );
}
