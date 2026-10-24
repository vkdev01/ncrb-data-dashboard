'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChoroplethMap } from '@/components/charts/ChoroplethMap';
import { useDataset } from '@/lib/hooks/useDataset';
import { useGeo } from '@/lib/hooks/useGeo';
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

const ALIASES: Record<string, string> = {
  Orissa: 'Odisha',
  Uttaranchal: 'Uttarakhand',
  'Jammu and Kashmir': 'Jammu & Kashmir',
};

export default function MapPage() {
  const { data: overview, live, status } = useDataset('overview');
  const { data: women } = useDataset('womenSafety');
  const { geo, error } = useGeo();

  const [level, setLevel] = useState<Level>('state');
  const [stateMetric, setStateMetric] = useState<StateMetric>('rate');
  const [districtMetric, setDistrictMetric] = useState<DistrictMetric>('murder');
  const [districts, setDistricts] = useState<DistrictRow[] | null>(null);
  const [districtErr, setDistrictErr] = useState(false);

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

  const stateMaps = useMemo(() => {
    const rate = new Map<string, number>();
    const total = new Map<string, number>();
    for (const s of overview.stateRates) {
      rate.set(s.name, s.rate);
      if (s.total != null) total.set(s.name, s.total);
    }
    const womenRate = new Map<string, number>();
    for (const s of women.stateRates) womenRate.set(s.name, s.rate);
    return { rate, total, womenRate };
  }, [overview.stateRates, women.stateRates]);

  const districtMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of districts ?? []) {
      const v = districtMetric === 'murder' ? r.murder : r.womenChild;
      if (typeof v === 'number') m.set(r.d, v);
    }
    return m;
  }, [districts, districtMetric]);

  const sm = STATE_METRICS[stateMetric];
  const dm = DISTRICT_METRICS[districtMetric];

  const title = level === 'state' ? sm.label : dm.label;
  const from = level === 'state' ? sm.from : dm.from;
  const to = level === 'state' ? sm.to : dm.to;
  const format = level === 'state' ? sm.fmt : (v: number) => nf(v);

  return (
    <>
      <PageHeader
        title="Map of India"
        description="Recorded crime drawn over India's boundaries. Switch between the state view (every district inherits its state's value) and the district view, then hover any region."
        live={live}
        status={status}
        source={overview.source}
      />

      <div className="stack">
        <Card
          title={title}
          caption={
            level === 'state'
              ? 'Colour shows the state value. Grey means no data for that region.'
              : 'District-level figures for 2024, from NCRB district tables. Grey means no data.'
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
          ) : level === 'district' && !districts ? (
            <div className="chart-empty">
              {districtErr ? 'District data is not available in this build.' : 'Loading district data…'}
            </div>
          ) : !geo ? (
            <div className="chart-empty">Loading map…</div>
          ) : (
            <ChoroplethMap
              geo={geo}
              valueOf={(f) =>
                level === 'state'
                  ? stateMaps[stateMetric].get(ALIASES[f.state] ?? f.state)
                  : districtMap.get(f.district)
              }
              from={from}
              to={to}
              legendTitle={title}
              format={format}
              ariaLabel={`India choropleth: ${title}`}
            />
          )}
        </Card>

        {level === 'district' && districts ? (
          <p className="muted" style={{ fontSize: '0.82rem' }}>
            {districts.length} districts loaded · NCRB 2024 district tables, published via Esri India's Living Atlas.
            Names follow the source, so a few may not match the boundary file exactly.
          </p>
        ) : null}

        <div className="callout">
          <strong>What the colours do and don't mean.</strong> A darker region has a higher <em>recorded</em> figure.
          That reflects offending, reporting and registration together — areas that register more cases look darker
          regardless of underlying crime. Boundaries are the 2011-census vintage, so later district splits are not
          reflected.
        </div>
      </div>
    </>
  );
}
