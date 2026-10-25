'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChoroplethMap } from '@/components/charts/ChoroplethMap';
import { ExportButton } from '@/components/ui/ExportButton';
import { useDataset } from '@/lib/hooks/useDataset';
import { useGeo } from '@/lib/hooks/useGeo';
import { buildDistrictIndex, normName } from '@/lib/match';
import { nf, pct, rate as rateFmt } from '@/lib/format';

type Level = 'state' | 'district';

interface DistrictRow {
  d: string;
  s: string;
  [k: string]: string | number | null | undefined;
}
interface TsRow {
  state: string;
  violentCrimes: Record<string, number | null>;
  rate: Record<string, number | null>;
  chargesheetRate: Record<string, number | null>;
}

interface Metric {
  id: string;
  label: string;
  group: string;
  from: string;
  to: string;
  fmt: (v: number) => string;
  /** years, for time-series metrics */
  years?: number[];
}

/* ---------------------------------------------------------------- registry */

const STATE_STATIC: Record<string, Metric> = {
  crimeRate: { id: 'crimeRate', label: 'Crime rate per 100,000', group: 'Overall', from: '#e6eef8', to: '#1d4e89', fmt: rateFmt },
  totalCases: { id: 'totalCases', label: 'Total recorded cases', group: 'Overall', from: '#eef2f7', to: '#334155', fmt: (v) => nf(v) },
  womenRate: { id: 'womenRate', label: 'Crimes against women per 100k women', group: "Women's safety", from: '#fbe4ea', to: '#be123c', fmt: rateFmt },
  womenCases: { id: 'womenCases', label: 'Crimes against women (cases)', group: "Women's safety", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  roadFatality: { id: 'roadFatality', label: 'Road fatality rate per 100,000', group: 'Road safety', from: '#fdf0e3', to: '#c2410c', fmt: rateFmt },
  policePerLakh: { id: 'policePerLakh', label: 'Police strength per 100,000', group: 'Police', from: '#e8eef7', to: '#0f5499', fmt: (v) => v.toFixed(0) },
  policeVacancy: { id: 'policeVacancy', label: 'Police vacancy (%)', group: 'Police', from: '#f3e8ff', to: '#7c3f98', fmt: (v) => pct(v) },
};

const STATE_TS: Record<string, Metric> = {
  violentCrimes: { id: 'violentCrimes', label: 'Violent crimes', group: 'Violent crime — timeline', from: '#fde8e8', to: '#b91c1c', fmt: (v) => nf(v), years: [2020, 2021, 2022, 2023, 2024] },
  violentRate: { id: 'violentRate', label: 'Violent crime rate per 100,000', group: 'Violent crime — timeline', from: '#fde8e8', to: '#b91c1c', fmt: rateFmt, years: [2022, 2023, 2024] },
  chargesheetRate: { id: 'chargesheetRate', label: 'Charge-sheeting rate (%)', group: 'Justice — timeline', from: '#e6f4ef', to: '#0f766e', fmt: (v) => pct(v), years: [2022, 2023, 2024] },
};

const DISTRICT_METRICS: Record<string, Metric> = {
  murder: { id: 'murder', label: 'Murders', group: 'Human body', from: '#f1e6f5', to: '#7c3f98', fmt: (v) => nf(v) },
  culpableHomicide: { id: 'culpableHomicide', label: 'Culpable homicide not amounting to murder', group: 'Human body', from: '#f1e6f5', to: '#7c3f98', fmt: (v) => nf(v) },
  deathByNegligence: { id: 'deathByNegligence', label: 'Causing death by negligence', group: 'Human body', from: '#f6ece0', to: '#b45309', fmt: (v) => nf(v) },
  abetmentSuicide: { id: 'abetmentSuicide', label: 'Abetment of suicide', group: 'Human body', from: '#f6ece0', to: '#b45309', fmt: (v) => nf(v) },
  womenChild: { id: 'womenChild', label: 'All offences vs women & children', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  rape: { id: 'rape', label: 'Rape', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  attemptRape: { id: 'attemptRape', label: 'Attempt to commit rape', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  assaultWomen: { id: 'assaultWomen', label: 'Assault on women (outraging modesty)', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  sexualHarassment: { id: 'sexualHarassment', label: 'Sexual harassment', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  stalking: { id: 'stalking', label: 'Stalking', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  insultModesty: { id: 'insultModesty', label: 'Insult to modesty of women', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  voyeurism: { id: 'voyeurism', label: 'Voyeurism', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  crueltyHusband: { id: 'crueltyHusband', label: 'Cruelty by husband or relatives', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  dowryDeath: { id: 'dowryDeath', label: 'Dowry deaths', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
  kidnapWomenMarriage: { id: 'kidnapWomenMarriage', label: 'Kidnapping of women to compel marriage', group: "Women & children", from: '#fbe4ea', to: '#be123c', fmt: (v) => nf(v) },
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const STATE_ALIASES: Record<string, string> = { Orissa: 'Odisha', Uttaranchal: 'Uttarakhand', 'Jammu and Kashmir': 'Jammu & Kashmir' };
const key = (s: string, d: string) => `${normName(s)}|${normName(d)}`;

export default function MapPage() {
  const { data: overview, live, status } = useDataset('overview');
  const { data: women } = useDataset('womenSafety');
  const { data: police } = useDataset('police');
  const { data: indicators } = useDataset('indicators');
  const { geo, error } = useGeo();

  const [level, setLevel] = useState<Level>('state');
  const [metricId, setMetricId] = useState('crimeRate');
  const [year, setYear] = useState(2024);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [districts, setDistricts] = useState<DistrictRow[] | null>(null);
  const [ts, setTs] = useState<TsRow[] | null>(null);
  const [districtErr, setDistrictErr] = useState(false);
  const firstSync = useRef(true);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/data/districts.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then((d) => alive && setDistricts(d)).catch(() => alive && setDistrictErr(true));
    fetch(`${BASE}/data/states-timeseries.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then((d) => alive && setTs(d)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const metric: Metric = level === 'district' ? DISTRICT_METRICS[metricId] ?? DISTRICT_METRICS.murder : STATE_STATIC[metricId] ?? STATE_TS[metricId] ?? STATE_STATIC.crimeRate;

  // reset the metric when the level changes to one that doesn't have it
  useEffect(() => {
    if (level === 'district' && !DISTRICT_METRICS[metricId]) setMetricId('murder');
    if (level === 'state' && DISTRICT_METRICS[metricId]) setMetricId('crimeRate');
  }, [level, metricId]);

  // URL state
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const l = p.get('level'); const m = p.get('metric'); const s = p.get('state'); const y = p.get('year');
    if (l === 'state' || l === 'district') setLevel(l);
    if (m && (m in STATE_STATIC || m in STATE_TS || m in DISTRICT_METRICS)) setMetricId(m);
    if (s) setSelected(s);
    if (y) setYear(Number(y));
  }, []);
  useEffect(() => {
    if (firstSync.current) { firstSync.current = false; return; }
    const params = new URLSearchParams({ level, metric: metricId });
    if (metric.years) params.set('year', String(year));
    if (selected) params.set('state', selected);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [level, metricId, year, selected, metric.years]);

  // timeline playback
  useEffect(() => {
    if (!playing || !metric.years) return;
    const t = setInterval(() => setYear((y) => {
      const ys = metric.years!;
      const i = ys.indexOf(y);
      return ys[(i + 1) % ys.length];
    }), 1100);
    return () => clearInterval(t);
  }, [playing, metric.years]);

  /* ---------------------------------------------------------- state values */
  const stateValues = useMemo(() => {
    const m = new Map<string, number>();
    const put = (name: string, v: number | null | undefined) => {
      if (typeof v === 'number' && Number.isFinite(v)) m.set(normName(STATE_ALIASES[name] ?? name), v);
    };
    if (metric.id === 'crimeRate' || metric.id === 'totalCases') {
      for (const s of overview.stateRates) put(s.name, metric.id === 'crimeRate' ? s.rate : s.total);
    } else if (metric.id === 'womenRate' || metric.id === 'womenCases') {
      for (const s of women.stateRates) put(s.name, metric.id === 'womenRate' ? s.rate : s.total);
    } else if (metric.id === 'roadFatality') {
      const ind = indicators.indicators.find((i) => i.id === 'road_fatality_rate');
      for (const s of ind?.states ?? []) put(s.name, s.value);
    } else if (metric.id === 'policePerLakh') {
      for (const s of police.stateRatios) put(s.name, s.actual);
    } else if (metric.id === 'policeVacancy') {
      for (const s of police.stateRatios) put(s.name, s.sanctioned ? ((s.sanctioned - s.actual) / s.sanctioned) * 100 : null);
    } else if (ts) {
      const field = metric.id === 'violentCrimes' ? 'violentCrimes' : metric.id === 'violentRate' ? 'rate' : 'chargesheetRate';
      for (const r of ts) put(r.state, r[field]?.[String(year)] ?? null);
    }
    return m;
  }, [metric.id, overview.stateRates, women.stateRates, police.stateRatios, indicators.indicators, ts, year]);

  /* ------------------------------------------------------- district values */
  const districtView = useMemo(() => {
    if (!geo || !districts) return null;
    const rows = districts
      .map((r) => ({ d: r.d as string, s: r.s as string, v: Number(r[metric.id]) }))
      .filter((r) => Number.isFinite(r.v));
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
  }, [geo, districts, metric.id]);

  const selectedRows = useMemo(() => {
    if (!selected || !districts) return [];
    const target = normName(selected);
    return districts
      .filter((r) => normName(r.s as string) === target)
      .map((r) => {
        const row: Record<string, unknown> = { district: r.d, state: r.s };
        for (const k of Object.keys(DISTRICT_METRICS)) row[k] = (r[k] as number) ?? null;
        return row;
      })
      .sort((a, b) => Number(b.murder ?? 0) - Number(a.murder ?? 0));
  }, [selected, districts]);

  const valueOf = (f: { district: string; state: string }) =>
    level === 'state'
      ? stateValues.get(normName(STATE_ALIASES[f.state] ?? f.state))
      : districtView?.values.get(key(f.state, f.district));

  /* ------------------------------------------------- top / bottom readout */
  const extremes = useMemo(() => {
    const entries: { name: string; value: number }[] = [];
    if (level === 'state') {
      for (const f of geo?.features ?? []) {
        if (!f.properties.d) continue;
        const v = valueOf({ district: f.properties.d, state: f.properties.s });
        if (typeof v === 'number') entries.push({ name: f.properties.s, value: v });
      }
    } else {
      for (const f of geo?.features ?? []) {
        const v = valueOf({ district: f.properties.d, state: f.properties.s });
        if (typeof v === 'number') entries.push({ name: f.properties.d, value: v });
      }
    }
    const uniq = new Map<string, number>();
    for (const e of entries) uniq.set(e.name, e.value);
    const sorted = [...uniq.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { top: sorted.slice(0, 6), bottom: sorted.slice(-6).reverse() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, level, stateValues, districtView]);

  const grouped = useMemo(() => {
    const src = level === 'state' ? { ...STATE_STATIC, ...STATE_TS } : DISTRICT_METRICS;
    const groups = new Map<string, Metric[]>();
    for (const m of Object.values(src)) {
      if (!groups.has(m.group)) groups.set(m.group, []);
      groups.get(m.group)!.push(m);
    }
    return [...groups.entries()];
  }, [level]);

  const coverage = level === 'district' && districtView ? `${districtView.matched} of ${districtView.total} boundaries matched` : undefined;

  return (
    <>
      <PageHeader
        title="Map of India"
        description="Every category NCRB publishes by geography — 16 district-level heads plus state indicators, with a timeline for violent crime. Click a region to drill in."
        live={live}
        status={status}
        source={overview.source}
      />

      <div className="stack">
        <Card
          title={metric.label + (metric.years ? ` · ${year}` : '')}
          caption={
            level === 'state'
              ? 'Shading is by rank, so the pattern stays visible even though a few states dominate. Grey means no data.'
              : `District-level figures for 2024. Shading is by rank.${coverage ? ` ${coverage}.` : ''}`
          }
          action={
            <div className="seg">
              <button className={level === 'state' ? 'on' : ''} onClick={() => setLevel('state')}>State</button>
              <button className={level === 'district' ? 'on' : ''} onClick={() => setLevel('district')} disabled={districtErr} title={districtErr ? 'District data unavailable' : undefined}>District</button>
            </div>
          }
        >
          <div className="map-controls">
            <label className="field">
              <span>Measure</span>
              <select value={metricId} onChange={(e) => setMetricId(e.target.value)}>
                {grouped.map(([group, ms]) => (
                  <optgroup key={group} label={group}>
                    {ms.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            {metric.years ? (
              <div className="timeline">
                <button className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause timeline' : 'Play timeline'}>
                  {playing ? '❚❚' : '▶'}
                </button>
                <input
                  type="range"
                  min={0}
                  max={metric.years.length - 1}
                  value={Math.max(0, metric.years.indexOf(year))}
                  onChange={(e) => { setPlaying(false); setYear(metric.years![Number(e.target.value)]); }}
                  aria-label="Year"
                />
                <div className="year-ticks">
                  {metric.years.map((y) => (
                    <button key={y} className={y === year ? 'on' : ''} onClick={() => { setPlaying(false); setYear(y); }}>{y}</button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="map-layout">
            <div className="map-main">
              {error ? (
                <div className="callout warn">Could not load the boundary file.</div>
              ) : level === 'district' && !districtView ? (
                <div className="chart-empty">{districtErr ? 'District data is not available in this build.' : 'Loading district data…'}</div>
              ) : !geo ? (
                <div className="chart-empty">Loading map…</div>
              ) : (
                <ChoroplethMap
                  geo={geo}
                  valueOf={valueOf}
                  from={metric.from}
                  to={metric.to}
                  legendTitle={metric.label}
                  format={metric.fmt}
                  onSelect={(f) => setSelected(f.state)}
                  ariaLabel={`India choropleth: ${metric.label}`}
                />
              )}
            </div>

            <aside className="map-side">
              <div className="rank-list">
                <h4>Highest</h4>
                {extremes.top.map((e) => (
                  <button key={e.name} className="rank-row" onClick={() => setSelected(e.name)}>
                    <span className="rank-name">{e.name}</span>
                    <span className="rank-val">{metric.fmt(e.value)}</span>
                  </button>
                ))}
              </div>
              <div className="rank-list">
                <h4>Lowest</h4>
                {extremes.bottom.map((e) => (
                  <button key={e.name} className="rank-row" onClick={() => setSelected(e.name)}>
                    <span className="rank-name">{e.name}</span>
                    <span className="rank-val">{metric.fmt(e.value)}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </Card>

        {selected ? (
          <Card
            title={`Districts in ${selected}`}
            caption={`${selectedRows.length} districts · all 16 NCRB heads, 2024.`}
            action={selectedRows.length ? <ExportButton rows={selectedRows} filename={`ncrb-districts-${normName(selected)}`} /> : null}
          >
            {selectedRows.length ? (
              <div className="table-wrap">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th style={{ textAlign: 'right' }}>Murder</th>
                      <th style={{ textAlign: 'right' }}>Rape</th>
                      <th style={{ textAlign: 'right' }}>Cruelty</th>
                      <th style={{ textAlign: 'right' }}>Women &amp; children</th>
                      <th style={{ textAlign: 'right' }}>Negligence deaths</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((r) => (
                      <tr key={String(r.district)}>
                        <td>{String(r.district)}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{r.murder != null ? nf(Number(r.murder)) : '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{r.rape != null ? nf(Number(r.rape)) : '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{r.crueltyHusband != null ? nf(Number(r.crueltyHusband)) : '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{r.womenChild != null ? nf(Number(r.womenChild)) : '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{r.deathByNegligence != null ? nf(Number(r.deathByNegligence)) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No district rows for this state — it may be a union territory reported without district detail.</p>
            )}
          </Card>
        ) : null}

        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--ink)' }}>View as a table (accessible alternative)</summary>
          <div style={{ marginTop: 14 }}>
            <div className="table-tools" style={{ marginBottom: 8 }}>
              <span className="muted" style={{ fontSize: '0.78rem' }}>{overview.stateRates.length} states &amp; UTs · {metric.label}</span>
              <ExportButton rows={overview.stateRates.map((s) => ({ state: s.name, crime_rate_per_100k: s.rate, cases: s.total ?? null }))} filename="ncrb-states-map-values" />
            </div>
            <div className="table-wrap">
              <table className="dtable">
                <thead><tr><th>State / UT</th><th style={{ textAlign: 'right' }}>Crime rate</th><th style={{ textAlign: 'right' }}>Cases</th></tr></thead>
                <tbody>
                  {overview.stateRates.map((s) => (
                    <tr key={s.name}><td>{s.name}</td><td className="num" style={{ textAlign: 'right' }}>{rateFmt(s.rate)}</td><td className="num" style={{ textAlign: 'right' }}>{s.total != null ? nf(s.total) : '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {districts ? (
              <div className="table-tools" style={{ marginTop: 12 }}>
                <span className="muted" style={{ fontSize: '0.78rem' }}>{districts.length} district rows × 16 heads</span>
                <ExportButton rows={districts.map((d) => { const o: Record<string, unknown> = { district: d.d, state: d.s }; for (const k of Object.keys(DISTRICT_METRICS)) o[k] = d[k] ?? null; return o; })} filename="ncrb-districts-2024-all" label="CSV (all districts)" />
              </div>
            ) : null}
          </div>
        </details>

        <div className="callout">
          <strong>What the colours do and don&apos;t mean.</strong> A darker region has a higher <em>recorded</em> figure. That reflects offending, reporting and registration together — areas that register more cases look darker regardless of underlying crime. Shading is by rank, not absolute value. Boundaries are the 2011-census vintage.
        </div>

        <div className="callout warn">
          <strong>Read the timeline&apos;s 2024 step with care.</strong> Violent-crime counts jump sharply in 2024 across
          almost every state — Odisha 31,749 → 75,403, Bihar 52,165 → 107,303, Maharashtra 46,249 → 87,791. That is
          overwhelmingly the <em>IPC → BNS reclassification</em>, which changed what falls under each head and brought
          new offences into the count. It is not a sudden surge in violent crime. Treat 2020–2023 as comparable with
          each other, and 2024 as a different legal basis.
        </div>
      </div>
    </>
  );
}
