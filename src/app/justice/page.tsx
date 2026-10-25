'use client';

import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { useDataset } from '@/lib/hooks/useDataset';
import { compactIN, nf, pct } from '@/lib/format';

interface PoliceRatio {
  id: string;
  name: string;
  sanctioned: number;
  actual: number;
}

function Funnel({ steps, note }: { steps: { label: string; value: number; sub?: string }[]; note?: string }) {
  const max = Math.max(...steps.map((s) => s.value)) || 1;
  return (
    <div className="funnel">
      {steps.map((s) => (
        <div className="funnel-step" key={s.label}>
          <span>
            {s.label}
            {s.sub ? <div className="funnel-note">{s.sub}</div> : null}
          </span>
          <div className="funnel-bar">
            <div className="funnel-fill" style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
          <span className="funnel-val">{compactIN(s.value, 1)}</span>
        </div>
      ))}
      {note ? <p className="card-cap" style={{ margin: 0 }}>{note}</p> : null}
    </div>
  );
}

export default function JusticePage() {
  const { data: police, live, status } = useDataset('police');
  const { data: justice } = useDataset('justice');
  const f = justice.funnel;
  const d = justice.trialDuration;

  const columns: Column<PoliceRatio>[] = [
    { key: 'name', header: 'State / UT', render: (r) => r.name, sortValue: (r) => r.name },
    { key: 'sanctioned', header: 'Sanctioned /lakh', align: 'right', render: (r) => r.sanctioned.toFixed(1), sortValue: (r) => r.sanctioned },
    { key: 'actual', header: 'Actual /lakh', align: 'right', render: (r) => r.actual.toFixed(1), sortValue: (r) => r.actual },
    {
      key: 'gap',
      header: 'Vacancy',
      align: 'right',
      render: (r) => {
        const gap = r.sanctioned ? ((r.sanctioned - r.actual) / r.sanctioned) * 100 : 0;
        return <span style={{ color: gap > 20 ? 'var(--warn)' : 'var(--text-dim)' }}>{pct(gap, 1)}</span>;
      },
      sortValue: (r) => (r.sanctioned ? ((r.sanctioned - r.actual) / r.sanctioned) * 100 : 0),
    },
  ];

  return (
    <>
      <PageHeader
        title="Police & the justice pipeline"
        description="What happens after a case is registered: police strength against sanctioned posts, and the path from investigation through charge-sheet to conviction."
        live={live}
        status={status}
        source={justice.source}
      />

      <div className="stack">
        <div className="card-grid" style={{ ['--min' as string]: '210px' }}>
          <StatCard label="Sanctioned police strength" value={compactIN(police.sanctionedStrength)} note={`${police.sanctionedRatePerLakh} per lakh`} />
          <StatCard label="Actual strength" value={compactIN(police.actualStrength)} note={`${police.actualRatePerLakh} per lakh`} tone="accent" />
          <StatCard label="Vacancy" value={pct(police.vacancyPct)} note={`${nf(police.sanctionedStrength - police.actualStrength)} posts`} tone="accent2" />
          <StatCard label="Women in the force" value={pct(police.womenPolicePct)} note={`${nf(police.womenPoliceTotal)} personnel`} />
          <StatCard label="Charge-sheeting rate" value={pct(f.chargesheetRate)} note="of cases disposed by police" />
          <StatCard label="Conviction rate" value={pct(f.convictionRate)} note="of cases decided by courts" />
        </div>

        <div className="grid-2">
          <Card title="Police stage" caption="From registration to charge-sheet.">
            <Funnel
              steps={[
                { label: 'Cases for investigation', value: f.totalForInvestigation, sub: 'pending + reported + reopened' },
                { label: 'Disposed by police', value: f.investigated, sub: `${pct((f.investigated / f.totalForInvestigation) * 100)} of the above` },
                { label: 'Charge-sheeted', value: f.chargesheeted, sub: `${pct(f.chargesheetRate)} of those disposed` },
              ]}
            />
          </Card>
          <Card title="Court stage" caption="From trial to outcome.">
            <Funnel
              steps={[
                { label: 'Cases for trial', value: f.totalForTrial, sub: 'pending + received' },
                { label: 'Trials completed', value: f.trialCompleted, sub: `${pct((f.trialCompleted / f.totalForTrial) * 100)} of the above` },
                { label: 'Convicted', value: f.convicted, sub: `${pct(f.convictionRate)} of those decided` },
                { label: 'Acquitted', value: f.acquitted },
              ]}
              note={`Pendency: ${pct(f.pendencyRate)} of cases awaiting trial, ${nf(f.pendingTrial)} cases.`}
            />
          </Card>
        </div>

        <div className="card-grid" style={{ ['--min' as string]: '200px' }}>
          <StatCard label="Average trial duration" value={`${d.avgYears} yrs`} note="for completed trials" />
          <StatCard label="Trials over 5 years" value={pct(d.casesOver5Years)} note="of pending cases" tone="accent2" />
          <StatCard label="Trials over 10 years" value={pct(d.casesOver10Years)} note="of pending cases" tone="accent2" />
          <StatCard label="Judges per million" value={d.judgesPerMillion.toFixed(1)} note="population" />
        </div>

        <div className="grid-2">
          <Card title="Police strength vs sanctioned posts" caption="Actual strength per lakh population — the bar; the gap to sanctioned posts is the vacancy.">
            <HorizontalBars
              items={police.stateRatios.slice(0, 14).map((s) => ({ label: s.name, value: s.actual }))}
              valueFormat={(v) => v.toFixed(0)}
            />
          </Card>
          <Card title="Where the pipeline leaks" caption="Two very different drop-offs, for two different reasons.">
            <ul className="about-list">
              <li>
                <strong>Police stage.</strong> Of {compactIN(f.totalForInvestigation)} cases for investigation,
                {' '}{compactIN(f.chargesheeted)} ended in a charge-sheet ({pct(f.chargesheetRate)} of disposals) and
                {' '}{compactIN(f.pendingInvestigation)} were still pending.
              </li>
              <li>
                <strong>Court stage.</strong> Of {compactIN(f.totalForTrial)} cases for trial, only
                {' '}{compactIN(f.trialCompleted)} were decided — {pct(f.pendencyRate)} remained pending.
              </li>
              <li>
                <strong>Read the rates carefully.</strong> A charge-sheeting rate is a process statistic, not a
                measure of how many crimes are solved; a conviction rate is over cases that <em>reach</em> a decision,
                which excludes the large pending backlog.
              </li>
            </ul>
          </Card>
        </div>

        <Card title="Police strength by state" caption="Per lakh population. Click a column to sort.">
          <DataTable
            rows={police.stateRatios}
            columns={columns}
            initialSort="actual"
            exportName="ncrb-police-strength-by-state"
            csvRow={(r) => ({ state: r.name, sanctioned_per_lakh: r.sanctioned, actual_per_lakh: r.actual })}
          />
        </Card>

        <div className="callout">
          <strong>Not a measure of effectiveness.</strong> Police strength, charge-sheeting and conviction rates all
          depend on what gets registered in the first place. A higher charge-sheet rate can reflect better policing or
          a lower threshold for closing cases; neither number should be read as "how much crime is solved".
        </div>
      </div>
    </>
  );
}
