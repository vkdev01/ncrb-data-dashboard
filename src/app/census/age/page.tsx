'use client';

/**
 * Age structure — the population pyramid and the dependency ratios.
 *
 * National only: the census publishes state-level age tables, but they are not
 * bundled here. Rather than fake a state breakdown, this page stays national and
 * says so, and puts the numbers in the context that matters — the momentum a
 * young age structure already guarantees.
 */
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { PopulationPyramid } from '@/components/charts/PopulationPyramid';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { ageGroups, ageShares, ageTotal, childDependency, dependencyRatio, oldAgeDependency } from '@/lib/data/age';
import { censusMeta, india } from '@/lib/data/census';
import { compactIN, nf, pct } from '@/lib/format';

export default function AgePage() {
  const rows = ageGroups.filter((g) => g.g !== 'Unknown');
  const unknown = ageGroups.find((g) => g.g === 'Unknown');

  const widest = [...rows].sort((a, b) => b.total - a.total).slice(0, 6);
  const sexGap = rows.map((g) => ({ label: g.g, value: ((g.female / g.male) * 1000) }));

  const youngPop = rows
    .filter((g) => parseInt(g.g, 10) <= 14)
    .reduce((t, g) => t + g.total, 0);

  return (
    <>
      <PageHeader
        title="Age structure"
        description="India in 2011 was a young country with a narrowing base: a third of the population under fifteen, and a working-age bulge that will keep growing for another two decades even if every family now had two children. The pyramid is the clearest single picture of that."
        source={`${censusMeta.source} — age tables`}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Under 15" value={pct(ageShares.young)} note={compactIN(youngPop)} tone="accent" />
          <StatCard label="Working age, 15–64" value={pct(ageShares.working)} note="the demographic dividend" />
          <StatCard label="65 and above" value={pct(ageShares.old)} note={`${nf(rows.filter((g) => parseInt(g.g, 10) >= 65).reduce((t, g) => t + g.total, 0))} people`} />
          <StatCard label="Dependency ratio" value={dependencyRatio} note="dependants per 100 workers" />
          <StatCard label="Child dependency" value={childDependency} note="under-15s per 100 workers" />
          <StatCard label="Old-age dependency" value={oldAgeDependency} note="65+ per 100 workers" />
        </CardGrid>

        <Card
          title="Population pyramid, 2011"
          caption="Five-year age bands. Males left, females right. The bars narrow at the base — fertility had already fallen — and stay wide through the working ages."
        >
          <PopulationPyramid groups={ageGroups} />
        </Card>

        <div className="grid-2">
          <Card title="Largest age bands" caption="Where the population actually is.">
            <HorizontalBars
              items={widest.map((g) => ({ label: g.g, value: g.total, note: `${((g.total / ageTotal) * 100).toFixed(1)}%` }))}
              valueFormat={(v) => compactIN(v)}
            />
          </Card>
          <Card title="Females per 1,000 males, by age" caption="Above 1,000 means more women than men in that band. The crossover is the demographic signature of longevity: women outlive men, but only after the childbearing years.">
            <HorizontalBars
              items={sexGap.map((g) => ({ label: g.label, value: g.value }))}
              valueFormat={(v) => v.toFixed(0)}
              sort={false}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
        </div>

        <div className="callout">
          <strong>The base is already narrowing.</strong> The 0–4 band holds {compactIN(rows[0].total)} children against{' '}
          {compactIN(rows[2].total)} in the 10–14 band. Fertility fell during the decade, so each cohort arriving is
          smaller than the one before it. That is why India&apos;s population will keep growing for decades after
          fertility reaches replacement: the number of people who will reach childbearing age is already determined by
          the cohorts alive today.
        </div>

        <div className="callout warn">
          <strong>This is a national pyramid, not a state one.</strong> Age structure varies enormously across India —
          Bihar&apos;s median age is roughly a decade below Kerala&apos;s — and that difference is the whole
          demographic-dividend story. The census publishes state-level age tables, but they are not bundled in this
          build, so this page deliberately stops at the national picture rather than implying a uniformity that does
          not exist.
        </div>

        {unknown ? (
          <div className="callout">
            <strong>Age not stated: {nf(unknown.total)} people.</strong> The census publishes an &ldquo;age not
            stated&rdquo; row, about {((unknown.total / ageTotal) * 100).toFixed(2)}% of the population. It is included
            in the total but excluded from the pyramid and from the shares above, which is why the shares sum to slightly
            under 100.
          </div>
        ) : null}

        <Card title="The bands, as a table" caption="Every group with males, females and total. This is the accessible alternative to the pyramid.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Age band</th>
                  <th style={{ textAlign: 'right' }}>Male</th>
                  <th style={{ textAlign: 'right' }}>Female</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>% of India</th>
                  <th style={{ textAlign: 'right' }}>F per 1,000 M</th>
                </tr>
              </thead>
              <tbody>
                {ageGroups.map((g) => (
                  <tr key={g.g}>
                    <td>{g.g}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{nf(g.male)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{nf(g.female)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{nf(g.total)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{pct((g.total / ageTotal) * 100, 2)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{g.male ? ((g.female / g.male) * 1000).toFixed(0) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="callout">
          <strong>Cross-check.</strong> The bands sum to {nf(ageTotal)} — the census total for 2011, to the person. If
          you see a figure here that disagrees with the overview page, one of the two is wrong, and it is worth knowing
          which.
        </div>
      </div>
    </>
  );
}
