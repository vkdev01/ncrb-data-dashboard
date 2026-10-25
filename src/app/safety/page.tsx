import type { Metadata } from 'next';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { SAFETY_CAVEATS, SAFETY_ROWS } from '@/lib/data/safety';
import { SafetyExplorer } from './SafetyExplorer';

export const metadata: Metadata = {
  title: "Women's safety",
  description: 'A provisional 50-country comparison of violence against women, with its caveats stated plainly.',
};

export default function SafetyPage() {
  const india = SAFETY_ROWS.find((r) => r.highlight)!;
  const median = [...SAFETY_ROWS].sort((a, b) => a.ipv - b.ipv)[Math.floor(SAFETY_ROWS.length / 2)];
  const ordinal = ['th', 'st', 'nd', 'rd'][india.rank % 10] ?? 'th';

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
          <StatCard label="Rank of the 50 selected" value={`${india.rank}${ordinal} highest`} note="higher = more prevalent" />
          <StatCard
            label="Women affected per 100,000 per year"
            value={Intl.NumberFormat('en-IN').format(india.affectedPer100k)}
            note="provisional"
          />
          <StatCard label="Median of the 50" value={`${median.ipv.toFixed(1)}%`} note={median.country} />
        </div>

        <SafetyExplorer />

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
