'use client';

/**
 * The master table — every census measure, one row per state, sortable and
 * exportable. This is the page someone actually uses when they want a number.
 */
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { censusMeta, censusStates, type CensusState } from '@/lib/data/census';
import { literacyGap, popShare, urbanPop } from '@/lib/census';
import { nf, pct } from '@/lib/format';

const REGIONS = ['All', 'North', 'Central', 'West', 'East', 'North East', 'South'] as const;

export default function CensusStatesPage() {
  const [region, setRegion] = useState<(typeof REGIONS)[number]>('All');
  const [q, setQ] = useState('');

  const rows = useMemo(
    () =>
      censusStates.filter(
        (s) =>
          (region === 'All' || s.region === region) &&
          s.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [region, q],
  );

  const columns: Column<CensusState>[] = [
    { key: 'name', header: 'State / UT', render: (r) => r.name, sortValue: (r) => r.name, width: '18%' },
    { key: 'region', header: 'Region', render: (r) => <span className="muted">{r.region}</span>, sortValue: (r) => r.region },
    { key: 'pop', header: 'Population', align: 'right', render: (r) => nf(r.pop2011), sortValue: (r) => r.pop2011 },
    { key: 'share', header: '% of India', align: 'right', render: (r) => popShare(r).toFixed(2), sortValue: (r) => popShare(r) },
    { key: 'growth', header: 'Growth', align: 'right', render: (r) => `${r.growth.toFixed(1)}%`, sortValue: (r) => r.growth },
    { key: 'density', header: 'Density', align: 'right', render: (r) => nf(r.density), sortValue: (r) => r.density },
    { key: 'sr', header: 'Sex ratio', align: 'right', render: (r) => (r.sexRatio == null ? '—' : nf(r.sexRatio)), sortValue: (r) => r.sexRatio ?? 0 },
    { key: 'csr', header: 'Child ratio', align: 'right', render: (r) => (r.childSexRatio == null ? '—' : nf(r.childSexRatio)), sortValue: (r) => r.childSexRatio ?? 0 },
    { key: 'lit', header: 'Literacy', align: 'right', render: (r) => (r.literacy == null ? '—' : pct(r.literacy)), sortValue: (r) => r.literacy ?? 0 },
    { key: 'litf', header: 'Female lit.', align: 'right', render: (r) => (r.literacyFemale == null ? '—' : pct(r.literacyFemale)), sortValue: (r) => r.literacyFemale ?? 0 },
    { key: 'gap', header: 'Gap', align: 'right', render: (r) => { const g = literacyGap(r); return g == null ? '—' : g.toFixed(1); }, sortValue: (r) => literacyGap(r) ?? 0 },
    { key: 'urban', header: 'Urban %', align: 'right', render: (r) => (r.urbanPct == null ? '—' : pct(r.urbanPct)), sortValue: (r) => r.urbanPct ?? 0 },
    { key: 'urbanpop', header: 'Urban pop.', align: 'right', render: (r) => { const u = urbanPop(r); return u == null ? '—' : nf(u); }, sortValue: (r) => urbanPop(r) ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="All census measures"
        description="Every state and union territory, every measure in this section, in one sortable table. Blank cells are figures the census never published at this geography."
        source={censusMeta.source}
      />

      <div className="stack">
        <Card
          title={`${rows.length} of ${censusStates.length} states and UTs`}
          caption="Click any column header to sort. The CSV export follows the current filter and sort."
          action={
            <input
              className="filter"
              placeholder="Filter by name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Filter states by name"
            />
          }
        >
          <div className="chip-row" style={{ marginTop: 4 }}>
            {REGIONS.map((r) => (
              <button
                key={r}
                className={`chip${region === r ? ' active' : ''}`}
                onClick={() => setRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <DataTable
            rows={rows}
            columns={columns}
            initialSort="pop"
            exportName="census-states-all-measures"
            csvRow={(r) => ({
              state: r.name,
              region: r.region,
              population_2011: r.pop2011,
              share_of_india_pct: +popShare(r).toFixed(3),
              decadal_growth_pct: r.growth,
              area_km2: r.area,
              density_per_km2: r.density,
              sex_ratio: r.sexRatio,
              child_sex_ratio: r.childSexRatio,
              sex_ratio_2001: r.sexRatio2001,
              child_sex_ratio_2001: r.childSexRatio2001,
              literacy_total: r.literacy,
              literacy_male: r.literacyMale,
              literacy_female: r.literacyFemale,
              literacy_gap_points: literacyGap(r) == null ? null : +(literacyGap(r) as number).toFixed(2),
              urban_pct: r.urbanPct,
              urban_population: urbanPop(r) == null ? null : Math.round(urbanPop(r) as number),
            })}
          />
        </Card>

        <div className="callout">
          <strong>Reading across a row.</strong> The columns are ordered as the argument usually runs: how many people,
          how fast that changed, how tightly they are packed, who they are, what they can read, and where they live. A
          state can be large and sparse (Rajasthan), small and dense (Bihar), urban and literate (Delhi) or urban with a
          wide gender gap (Chandigarh) — the row is more informative than any single column.
        </div>
      </div>
    </>
  );
}
