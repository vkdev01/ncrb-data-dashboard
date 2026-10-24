'use client';

import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { LineChart } from '@/components/charts/LineChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { useDataset } from '@/lib/hooks/useDataset';
import { colorAt } from '@/config/palette';
import { compactIN, crore, nf, pct } from '@/lib/format';
import { first, last } from '@/lib/analytics';

export default function CyberPage() {
  const { data, live, status } = useDataset('cybercrime');
  const start = first(data.ncrbTrend);
  const end = last(data.ncrbTrend);
  const multiple = start && end ? end.cases / start.cases : 0;
  const firsVsComplaints = end ? data.i4cComplaints / end.cases : 0;

  return (
    <>
      <PageHeader
        title="Cybercrime"
        description="FIR-registered cyber offences, their composition, and how they compare with complaints filed on the national cybercrime portal."
        live={live}
        status={status}
        source={data.source}
      />

      <div className="stack">
        <div className="card-grid" style={{ ['--min' as string]: '210px' }}>
          <StatCard label="Cyber FIRs (latest)" value={compactIN(end?.cases ?? 0)} note={`${nf(end?.cases ?? 0)} cases`} tone="accent2" />
          <StatCard label="Growth since 2017" value={`${multiple.toFixed(1)}×`} note="FIR-registered cases" />
          <StatCard label="Portal complaints" value={compactIN(data.i4cComplaints, 1)} note="I4C / cybercrime.gov.in" />
          <StatCard label="Reported losses" value={crore(data.i4cFinancialLossCrore)} note="financial fraud" />
        </div>

        <div className="grid-2">
          <Card title="Cybercrime FIRs over time" caption="Cases registered under cybercrime heads, 2017 onwards.">
            <LineChart
              height={280}
              series={[{ name: 'Cyber FIRs', color: 'var(--c2)', points: data.ncrbTrend.map((t) => ({ x: t.year, y: t.cases })), area: true }]}
              valueFormat={(v) => `${compactIN(v)} (${nf(v)})`}
            />
          </Card>
          <Card title="Composition by motive" caption="Share of recorded cyber offences.">
            <DonutChart
              slices={data.crimeTypes.map((c, i) => ({ name: c.name, value: c.cases, color: colorAt(i) }))}
              valueFormat={(v) => compactIN(v, 1)}
            />
          </Card>
        </div>

        <Card title="The reporting gap" caption="Portal complaints vs FIR-registered cases — two different measures.">
          <HorizontalBars
            items={[
              { label: 'Portal complaints (I4C)', value: data.i4cComplaints },
              { label: 'FIR-registered (NCRB)', value: end?.cases ?? 0, highlight: true },
            ]}
            valueFormat={(v) => `${compactIN(v, 1)} (${nf(v)})`}
            sort={false}
          />
          {data.i4cNote ? <p className="card-cap" style={{ marginTop: 12 }}>{data.i4cNote}</p> : null}
          <p className="card-cap">
            On these figures the portal receives roughly <strong>{firsVsComplaints.toFixed(1)}×</strong> more complaints
            than become registered FIRs — a useful reminder that "recorded crime" is a process outcome, not a count of
            what happened.
          </p>
        </Card>

        <div className="card-grid" style={{ ['--min' as string]: '260px' }}>
          <Card title="By motive" caption="Cases and share of the cyber total.">
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Motive</th>
                    <th style={{ textAlign: 'right' }}>Cases</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.crimeTypes.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{nf(c.cases)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{pct(c.pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Year-by-year" caption="Cases and rate per 100,000.">
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th style={{ textAlign: 'right' }}>Cases</th>
                    <th style={{ textAlign: 'right' }}>Rate /100k</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ncrbTrend.map((t) => (
                    <tr key={t.year}>
                      <td>{t.year}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{nf(t.cases)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{t.rate.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
