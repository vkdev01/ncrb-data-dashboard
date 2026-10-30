'use client';

/**
 * One state's full census profile. Rendered as a client island from the server
 * wrapper so the route can be statically generated for all 36 units.
 */
import Link from 'next/link';
import { Card, CardGrid } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { censusMeta, censusStates, india } from '@/lib/data/census';
import { literacyGap, METRICS, popShare, rankOf, regionSummaries, urbanPop } from '@/lib/census';
import { compactIN, nf, pct } from '@/lib/format';

export function StateProfile({ id }: { id: string }) {
  const s = censusStates.find((x) => x.id === id);

  if (!s) {
    return (
      <div className="callout warn">
        No state or union territory with that code. <Link href="/census/states">See the full list</Link>.
      </div>
    );
  }

  const region = regionSummaries().find((r) => r.region === s.region);
  const gap = literacyGap(s);
  const u = urbanPop(s);

  const headline = METRICS.filter((m) =>
    ['pop2011', 'density', 'growth', 'sexRatio', 'childSexRatio', 'literacy', 'urbanPct'].includes(m.id),
  );

  const others = censusStates.filter((x) => x.region === s.region && x.id !== s.id);

  return (
    <>
      <div className="stack">
        <CardGrid min={200}>
          <StatCard label="Population" value={compactIN(s.pop2011)} note={`${popShare(s).toFixed(2)}% of India`} tone="accent" />
          <StatCard label="Decadal growth" value={`${s.growth.toFixed(1)}%`} note={`rank ${rankOf(s.name, 'growth')} of ${censusStates.length}`} />
          <StatCard label="Density" value={nf(s.density)} note="per km²" />
          <StatCard label="Sex ratio" value={s.sexRatio ?? '—'} note={`rank ${rankOf(s.name, 'sexRatio')}`} />
          <StatCard label="Child sex ratio" value={s.childSexRatio ?? '—'} note={s.childSexRatio == null ? 'not tabulated' : `rank ${rankOf(s.name, 'childSexRatio')}`} />
          <StatCard label="Literacy" value={s.literacy == null ? '—' : pct(s.literacy)} note={s.literacy == null ? 'not tabulated' : `rank ${rankOf(s.name, 'literacy')}`} />
          <StatCard label="Urban share" value={s.urbanPct == null ? '—' : pct(s.urbanPct)} note={u == null ? '' : `${compactIN(u)} people`} />
          <StatCard label="Literacy gap" value={gap == null ? '—' : `${gap.toFixed(1)} pts`} note="male minus female" />
        </CardGrid>

        <Card title={`${s.name} on every measure`} caption={`Rank among all 36 states and union territories, 1 = highest. ${s.region} region shown for context.`}>
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th style={{ textAlign: 'right' }}>{s.name}</th>
                  <th style={{ textAlign: 'right' }}>Rank</th>
                  <th style={{ textAlign: 'right' }}>India</th>
                  <th style={{ textAlign: 'right' }}>{s.region} region</th>
                </tr>
              </thead>
              <tbody>
                {headline.map((m) => {
                  const v = m.get(s);
                  const national: Record<string, number> = {
                    pop2011: india.pop2011,
                    density: india.density,
                    growth: india.growth,
                    sexRatio: india.sexRatio,
                    childSexRatio: india.childSexRatio,
                    literacy: india.literacy,
                    urbanPct: india.urbanPct,
                  };
                  const regionValue: Record<string, number | null | undefined> = {
                    growth: region?.growth,
                    sexRatio: region?.sexRatio,
                    literacy: region?.literacy,
                    urbanPct: region?.urbanPct,
                  };
                  const rv = regionValue[m.id];
                  return (
                    <tr key={m.id}>
                      <td>{m.label}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{v == null ? '—' : m.format(v)}</td>
                      <td className="num muted" style={{ textAlign: 'right' }}>{rankOf(s.name, m.id) || '—'}</td>
                      <td className="num muted" style={{ textAlign: 'right' }}>{m.format(national[m.id])}</td>
                      <td className="num muted" style={{ textAlign: 'right' }}>{rv == null ? '—' : m.format(rv)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {others.length ? (
          <Card title={`Peers in ${s.region}`} caption="Other units in the same region, by population.">
            <HorizontalBars
              items={others.map((o) => ({ label: o.name, value: o.pop2011 }))}
              valueFormat={(v) => compactIN(v)}
            />
          </Card>
        ) : null}

        <Card title="Jump to another state">
          <div className="chip-row">
            {censusStates.map((x) => (
              <Link key={x.id} href={`/census/state/${x.id}`} className={`chip${x.id === s.id ? ' active' : ''}`}>
                {x.name}
              </Link>
            ))}
          </div>
        </Card>

        <div className="callout">
          <strong>Source and vintage.</strong> {censusMeta.source}, 2011. Boundaries are current: {s.name} is shown on
          its present outline, which for Telangana, Ladakh and the merged Dadra &amp; Nagar Haveli and Daman &amp; Diu
          means some cells were never published at this geography and read as &ldquo;—&rdquo; rather than being
          estimated.
        </div>
      </div>
    </>
  );
}
