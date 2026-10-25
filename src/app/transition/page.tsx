'use client';

import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { headComparisons, newBnsHeads, totals, transitionCaveats, type HeadComparison } from '@/lib/data/transition';
import { compactIN, nf, signedPct } from '@/lib/format';
import { contributions, deltaPct } from '@/lib/analytics';

export default function TransitionPage() {
  const { ipc2023, bns2024 } = totals;
  const allChange = deltaPct(ipc2023.all, bns2024.all);
  const contrib = contributions(headComparisons.map((h) => ({ label: h.head, from: h.ipc2023, to: h.bns2024 })));
  const biggest = contrib[0];

  const columns: Column<HeadComparison>[] = [
    {
      key: 'head',
      header: 'Offence head',
      render: (r) => (
        <span>
          {r.head}
          {r.reclassified ? <span className="flag" title={r.note}>reclassified</span> : null}
        </span>
      ),
      sortValue: (r) => r.head,
    },
    { key: 'ipc2023', header: '2023 (IPC)', align: 'right', render: (r) => nf(r.ipc2023), sortValue: (r) => r.ipc2023 },
    { key: 'bns2024', header: '2024 (BNS)', align: 'right', render: (r) => nf(r.bns2024), sortValue: (r) => r.bns2024 },
    {
      key: 'change',
      header: 'Change',
      align: 'right',
      render: (r) => {
        const d = deltaPct(r.ipc2023, r.bns2024);
        return <span style={{ color: d >= 0 ? 'var(--warn)' : 'var(--good)' }}>{signedPct(d)}</span>;
      },
      sortValue: (r) => deltaPct(r.ipc2023, r.bns2024),
    },
    {
      key: 'note',
      header: '',
      render: (r) => (r.note ? <span className="muted" style={{ fontSize: '0.78rem' }}>{r.note}</span> : null),
    },
  ];

  return (
    <>
      <PageHeader
        title="IPC → BNS: the 2024 transition"
        description="On 1 July 2024 the Bharatiya Nyaya Sanhita replaced the Indian Penal Code. NCRB counted both in 2024. Here is what changed — and why most of it is not a like-for-like comparison."
        source="NCRB Crime in India 2023 & 2024"
      />

      <div className="stack">
        <div className="card-grid" style={{ ['--min' as string]: '210px' }}>
          <StatCard label="Total cognizable crimes, 2023" value={compactIN(ipc2023.all)} note={`rate ${ipc2023.rate} per lakh`} />
          <StatCard label="Total cognizable crimes, 2024" value={compactIN(bns2024.all)} note={`rate ${bns2024.rate} per lakh`} tone="accent" />
          <StatCard label="Change" value={signedPct(allChange)} note="headline fall, mostly definitional" tone="accent2" />
          <StatCard label="IPC/BNS vs SLL" value={`${((bns2024.ipc / bns2024.all) * 100).toFixed(1)}% / ${((bns2024.sll / bns2024.all) * 100).toFixed(1)}%`} note="share of total, 2024" />
        </div>

        <div className="callout warn">
          <strong>Read this before comparing the two years.</strong>
          <ul>
            {transitionCaveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="grid-2">
          <Card title="2023 · IPC-era heads" caption="Recorded cases by head.">
            <HorizontalBars
              items={headComparisons.map((h) => ({ label: h.head, value: h.ipc2023 }))}
              valueFormat={(v) => compactIN(v, 1)}
              color="var(--c3)"
              highlightColor="var(--c3)"
            />
          </Card>
          <Card title="2024 · BNS-era heads" caption="Same heads, the following year.">
            <HorizontalBars
              items={headComparisons.map((h) => ({ label: h.head, value: h.bns2024 }))}
              valueFormat={(v) => compactIN(v, 1)}
              color="var(--c1)"
              highlightColor="var(--c1)"
            />
          </Card>
        </div>

        <Card title="Head-by-head comparison" caption="Click a column to sort. 'Reclassified' flags heads that are not strictly comparable across the two years.">
          <DataTable
            rows={headComparisons}
            columns={columns}
            initialSort="bns2024"
            exportName="ncrb-ipc-bns-transition"
            csvRow={(r) => ({ offence_head: r.head, cases_2023_ipc: r.ipc2023, cases_2024_bns: r.bns2024, reclassified: r.reclassified ?? false })}
          />
        </Card>

        <Card
          title="What actually moved the total"
          caption="Contribution analysis: each head's share of the total absolute change between the two years."
        >
          <HorizontalBars
            items={contrib.map((c) => ({
              label: `${c.label}  (${signedPct((c.delta / c.from) * 100)})`,
              value: Math.abs(c.delta),
              note: `${c.share.toFixed(0)}% of the movement`,
            }))}
            valueFormat={(v) => nf(v)}
            color="var(--c2)"
            highlightColor="var(--c2)"
          />
          <p className="card-cap" style={{ marginTop: 12 }}>
            The single largest movement is <strong>{biggest?.label}</strong> at {signedPct((biggest?.delta ?? 0) / (biggest?.from || 1) * 100)} —
            and it is the one flagged as reclassified, so most of the headline fall is definitional rather than a
            change in offending.
          </p>
        </Card>

        <Card title="Heads that only exist under the BNS" caption="No IPC equivalent — these cannot be compared with 2023.">
          <HorizontalBars
            items={newBnsHeads.map((h) => ({ label: h.head, value: h.cases }))}
            valueFormat={(v) => nf(v)}
            color="var(--c6)"
            highlightColor="var(--c6)"
          />
        </Card>
      </div>
    </>
  );
}
