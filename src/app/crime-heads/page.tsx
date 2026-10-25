'use client';

import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DonutChart } from '@/components/charts/DonutChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDataset } from '@/lib/hooks/useDataset';
import { colorAt } from '@/config/palette';
import { compactIN, nf, pct } from '@/lib/format';
import type { CrimeHead } from '@/lib/data/types';

function headColumns(): Column<CrimeHead>[] {
  return [
    { key: 'name', header: 'Offence head', render: (r) => r.name, sortValue: (r) => r.name },
    { key: 'cases', header: 'Cases', align: 'right', render: (r) => nf(r.cases), sortValue: (r) => r.cases },
    { key: 'pct', header: 'Share', align: 'right', render: (r) => pct(r.pct), sortValue: (r) => r.pct },
  ];
}

export default function CrimeHeadsPage() {
  const { data: overview, live, status } = useDataset('overview');
  const { data: women } = useDataset('womenSafety');
  const { data: cyber } = useDataset('cybercrime');

  return (
    <>
      <PageHeader
        title="Crime heads"
        description="Categorisation: how recorded offences split across offence heads, for all IPC crimes and for the women's-safety and cybercrime slices."
        live={live}
        status={status}
        source={overview.source}
      />

      <div className="stack">
        <div className="grid-2">
          <Card title="All IPC crimes by head" caption="Latest year. 'Other IPC' covers the long tail of minor heads.">
            <DonutChart
              slices={overview.ipcComposition.map((c, i) => ({ name: c.name, value: c.cases, color: colorAt(i) }))}
              valueFormat={(v) => compactIN(v, 1)}
            />
          </Card>
          <Card title="Ranked by volume" caption="The same heads, ordered by case count.">
            <HorizontalBars
              items={overview.ipcComposition.map((c) => ({ label: c.name, value: c.cases }))}
              valueFormat={(v) => compactIN(v, 1)}
            />
          </Card>
        </div>

        <Card title="All IPC crime heads" caption="Click a header to sort.">
          <DataTable
            rows={overview.ipcComposition}
            columns={headColumns()}
            initialSort="cases"
            exportName="ncrb-ipc-heads"
            csvRow={(r) => ({ crime_head: r.name, cases: r.cases, share_pct: r.pct })}
          />
        </Card>

        <div className="grid-2">
          <Card title="Crimes against women — by head" caption="Breakdown of the women's-safety total (NCRB Chapter 5).">
            <HorizontalBars
              items={women.crimeTypes.map((c) => ({ label: c.name, value: c.cases }))}
              valueFormat={(v) => compactIN(v, 1)}
              color="var(--c4)"
              highlightColor="var(--c4)"
            />
          </Card>
          <Card title="Cybercrime — by motive" caption="Recorded cyber offences by the motive recorded.">
            <HorizontalBars
              items={cyber.crimeTypes.map((c) => ({ label: c.name, value: c.cases }))}
              valueFormat={(v) => compactIN(v, 1)}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
        </div>

        <div className="card-grid" style={{ ['--min' as string]: '320px' }}>
          <Card title="Women's-safety heads" caption="Cases and share.">
            <DataTable rows={women.crimeTypes} columns={headColumns()} initialSort="cases" />
          </Card>
          <Card title="Cybercrime heads" caption="Cases and share.">
            <DataTable rows={cyber.crimeTypes} columns={headColumns()} initialSort="cases" />
          </Card>
        </div>

        <div className="callout">
          <strong>Read heads with care.</strong> Heads are defined by law, not by severity, and they change when
          statutes change (for example the move from IPC to BNS). A large head is not automatically a large harm, and
          a small head is not automatically a small one — several serious offences sit inside the long tail.
        </div>
      </div>
    </>
  );
}
