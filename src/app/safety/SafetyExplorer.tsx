'use client';

import { Card } from '@/components/ui/Card';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SAFETY_ROWS, type CountryRow } from '@/lib/data/safety';

/**
 * The interactive half of /safety. Split into its own client component because
 * the page itself is a server component (it exports metadata), and function
 * props cannot cross that boundary.
 */
export function SafetyExplorer() {
  const columns: Column<CountryRow>[] = [
    { key: 'rank', header: '#', render: (r) => r.rank, sortValue: (r) => r.rank },
    {
      key: 'country',
      header: 'Country',
      render: (r) => (r.highlight ? <strong>{r.country}</strong> : r.country),
      sortValue: (r) => r.country,
    },
    {
      key: 'ipv',
      header: 'Past-year IPV prevalence',
      align: 'right',
      render: (r) => `${r.ipv.toFixed(1)}%`,
      sortValue: (r) => r.ipv,
    },
    {
      key: 'affected',
      header: 'Women affected / 100k / yr',
      align: 'right',
      render: (r) => Intl.NumberFormat('en-IN').format(r.affectedPer100k),
      sortValue: (r) => r.affectedPer100k,
    },
    {
      key: 'rol',
      header: 'Rule of law',
      align: 'right',
      render: (r) => r.ruleOfLaw.toFixed(2),
      sortValue: (r) => r.ruleOfLaw,
    },
  ];

  return (
    <>
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
    </>
  );
}
