import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SAFETY_CAVEATS, SAFETY_ROWS, type CountryRow } from '@/lib/data/safety';

export const metadata: Metadata = {
  title: "Women's safety",
  description: 'A provisional 50-country comparison of violence against women, with its caveats stated plainly.',
};

export default function SafetyPage() {
  const india = SAFETY_ROWS.find((r) => r.highlight)!;
  const median = [...SAFETY_ROWS].sort((a, b) => a.ipv - b.ipv)[Math.floor(SAFETY_ROWS.length / 2)];

  const columns: Column<CountryRow>[] = [
    { key: 'rank', header: '#', render: (r) => r.rank, sortValue: (r) => r.rank },
    {
      key: 'country',
      header: 'Country',
      render: (r) => (r.highlight ? <strong>{r.country}</strong> : r.country),
      sortValue: (r) => r.country,
    },
    { key: 'ipv', header: 'Past-year IPV prevalence', align: 'right', render: (r) => `${r.ipv.toFixed(1)}%`, sortValue: (r) => r.ipv },
    {
      key: 'affected',
      header: 'Women affected / 100k / yr',
      align: 'right',
      render: (r) => Intl.NumberFormat('en-IN').format(r.affectedPer100k),
      sortValue: (r) => r.affectedPer100k,
    },
    { key: 'rol', header: 'Rule of law', align: 'right', render: (r) => r.ruleOfLaw.toFixed(2), sortValue: (r) => r.ruleOfLaw },
  ];

  return (
    <>
      <PageHeader
        title="Women's safety — what the data can and cannot say"
        description="Comparing countries on violence against women is hard: different laws, different reporting, different definitions. This is a provisional 50-country comparison, presented with its limits."
        source="Working analysis — provisional, unaudited"
      />

      <div className="stack">
        <div className="callout warn">
          <strong>Provisional — not a verified ranking.</strong>
          <ul>
            {SAFETY_CAVEATS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="card-grid" style={{ ['--min' as string]: '200px' }}>
          <StatCard label="India — past-year IPV prevalence" value={`${india.ipv.toFixed(1)}%`} tone="accent2" note="provisional" />
          <StatCard label="Rank of the 50 selected" value={`${india.rank}${['th', 'st', 'nd', 'rd'][india.rank % 10] ?? 'th'} highest`} note="higher = more prevalent" />
          <StatCard label="Women affected per 100,000 per year" value={Intl.NumberFormat('en-IN').format(india.affectedPer100k)} note="provisional" />
          <StatCard label="Median of the 50" value={`${median.ipv.toFixed(1)}%`} note={`${median.country}`} />
        </div>

        <Card title="All 50 countries" caption="Ranked by past-year prevalence. India highlighted. Every value here is provisional.">
          <HorizontalBars
            items={SAFETY_ROWS.map((r) => ({
              label: `${r.rank}. ${r.country}`,
              value: r.ipv,
              highlight: r.highlight,
            }))}
            valueFormat={(v) => `${v.toFixed(1)}%`}
            color="var(--c4)"
            highlightColor="var(--c2)"
          />
        </Card>

        <Card title="The working table" caption="Click a column to sort. Download as CSV if you want to check it yourself.">
          <DataTable
            rows={SAFETY_ROWS}
            columns={columns}
            initialSort="ipv"
            rowClassName={(r) => (r.highlight ? 'self' : '')}
            exportName="women-safety-50-countries-provisional"
            csvRow={(r) => ({
              rank: r.rank,
              country: r.country,
              ipv_prevalence_pct: r.ipv,
              women_affected_per_100k_year: r.affectedPer100k,
              rule_of_law: r.ruleOfLaw,
            })}
          />
        </Card>

        <div className="callout">
          <strong>Why this is presented so cautiously.</strong> Prevalence measures women who experienced violence,
          usually in the past year, as reported in surveys. Police-recorded crime measures cases registered. They move
          for entirely different reasons — a country with better reporting can look worse while being safer. Any
          ranking built on either number alone is misleading, which is why this page leads with the caveat rather than
          the chart.
        </div>
      </div>
    </>
  );
}
