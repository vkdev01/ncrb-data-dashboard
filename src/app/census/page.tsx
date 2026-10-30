'use client';

/**
 * Census overview — the national picture, then the splits that matter:
 * how the population is distributed, and how the human-development measures
 * (literacy, sex ratio) sit against the demographic ones.
 */
import Link from 'next/link';
import { Card, CardGrid } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { HorizontalBars } from '@/components/charts/HorizontalBars';
import { DonutChart } from '@/components/charts/DonutChart';
import { colorAt } from '@/config/palette';
import { censusMeta, censusStates, india } from '@/lib/data/census';
import { literacyBands, METRICS, popShare, ranked, regionSummaries } from '@/lib/census';
import { compactIN, nf, pct } from '@/lib/format';

const SUBPAGES = [
  { href: '/census/population', label: 'Population & density', blurb: 'Where 1.21 billion people live, and how tightly.' },
  { href: '/census/growth', label: 'Decadal growth', blurb: 'Which states grew 25% in a decade, and which barely moved.' },
  { href: '/census/sex-ratio', label: 'Sex ratio', blurb: 'Women per 1,000 men — and the child ratio that reveals son preference.' },
  { href: '/census/literacy', label: 'Literacy', blurb: 'Total, male and female rates, and the gap between them.' },
  { href: '/census/urbanisation', label: 'Urbanisation', blurb: 'The urban share, and the states that hold India’s cities.' },
  { href: '/census/age', label: 'Age structure', blurb: 'The population pyramid and what the dependency ratio implies.' },
  { href: '/census/cities', label: 'Cities', blurb: 'The largest cities and how fast each grew to 2011.' },
  { href: '/census/map', label: 'Map', blurb: 'Sixteen state measures and three district measures, choropleth.' },
  { href: '/census/compare', label: 'Compare', blurb: 'Any two states, every measure, side by side.' },
  { href: '/census/crime', label: 'Crime × Census', blurb: 'Registered crime against literacy and urbanisation — and why it confounds.' },
];

export default function CensusOverviewPage() {
  const regions = regionSummaries();
  const top10 = ranked('pop2011').slice(0, 10);
  const top10Share = top10.reduce((t, r) => t + popShare(r.state), 0);

  const litBands = literacyBands.map((b, i) => ({
    name: b.label,
    value: censusStates.filter((s) => s.literacy != null && b.test(s.literacy)).length,
    color: colorAt(i + 1),
  }));

  const sexRows = ranked('sexRatio');
  const csrRows = ranked('childSexRatio');

  return (
    <>
      <PageHeader
        title="Census of India 2011"
        description="The last completed census: 1.21 billion people, 36 states and union territories, and a decade of change measured against 2001. Population, density, growth, sex ratio, literacy and urbanisation — with the cross-currents between them."
        source={censusMeta.source}
      />

      <div className="stack">
        <CardGrid min={210}>
          <StatCard label="Population" value={compactIN(india.pop2011)} note={`${nf(india.pop2011)} persons`} tone="accent" />
          <StatCard label="Decadal growth" value={`${india.growth}%`} note="2001 → 2011" />
          <StatCard label="Density" value={nf(india.density)} note="persons per km²" />
          <StatCard label="Sex ratio" value={india.sexRatio} note={`${india.sexRatio - india.sexRatio2001 > 0 ? '+' : ''}${india.sexRatio - india.sexRatio2001} vs 2001 (${india.sexRatio2001})`} tone="good" />
          <StatCard label="Child sex ratio" value={india.childSexRatio} note={`${india.childSexRatio - india.childSexRatio2001} vs 2001 (${india.childSexRatio2001})`} tone="warn" />
          <StatCard label="Literacy" value={pct(india.literacy)} note={`male ${pct(india.literacyMale)} · female ${pct(india.literacyFemale)}`} />
          <StatCard label="Urban share" value={pct(india.urbanPct)} note={`${compactIN((india.pop2011 * india.urbanPct) / 100)} people in towns and cities`} />
        </CardGrid>

        <div className="callout">
          <strong>Two numbers that point in opposite directions.</strong> India&apos;s overall sex ratio improved over the
          decade — {india.sexRatio2001} to {india.sexRatio}, because women live longer and the gap narrows with
          development. The <em>child</em> sex ratio moved the other way, {india.childSexRatio2001} to{' '}
          {india.childSexRatio}: fewer girls are born and survive to age six for every 1,000 boys. An improving headline
          figure can sit on top of a worsening one, which is why both are shown everywhere in this section.
        </div>

        <div className="grid-2">
          <Card title="Where India lives" caption="Population share by region. The South and West hold a large share of output with a smaller share of people — the demographic split that drives fiscal-devolution debates.">
            <DonutChart
              slices={regions.map((r, i) => ({ name: r.region, value: r.population, color: colorAt(i) }))}
              valueFormat={(v) => compactIN(v)}
            />
          </Card>

          <Card title="Ten states, most of the country" caption={`The ten most populous states hold ${top10Share.toFixed(1)}% of the population.`}>
            <HorizontalBars
              items={top10.map((r) => ({ label: r.state.name, value: r.value, note: `${popShare(r.state).toFixed(1)}%` }))}
              valueFormat={(v) => compactIN(v)}
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Sex ratio — best and worst" caption="Females per 1,000 males. Click through to the full ranking.">
            <HorizontalBars
              items={[
                ...sexRows.slice(0, 5).map((r) => ({ label: r.state.name, value: r.value, note: 'highest' })),
                ...sexRows.slice(-5).reverse().map((r) => ({ label: r.state.name, value: r.value, note: 'lowest' })),
              ]}
              valueFormat={(v) => v.toFixed(0)}
              sort={false}
            />
          </Card>

          <Card title="Child sex ratio — best and worst" caption="Girls per 1,000 boys aged 0–6. The distribution here is the one that matters for son preference.">
            <HorizontalBars
              items={[
                ...csrRows.slice(0, 5).map((r) => ({ label: r.state.name, value: r.value, note: 'highest' })),
                ...csrRows.slice(-5).reverse().map((r) => ({ label: r.state.name, value: r.value, note: 'lowest' })),
              ]}
              valueFormat={(v) => v.toFixed(0)}
              sort={false}
              color="var(--c2)"
              highlightColor="var(--c2)"
            />
          </Card>
        </div>

        <div className="grid-2">
          <Card title="Literacy distribution" caption="How many states and UTs fall into each literacy band.">
            <DonutChart slices={litBands} valueFormat={(v) => `${v.toFixed(0)} states`} />
          </Card>

          <Card title="Regional averages" caption="Population-weighted, so Uttar Pradesh counts for more than Sikkim.">
            <div className="table-wrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th style={{ textAlign: 'right' }}>Population</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                    <th style={{ textAlign: 'right' }}>Literacy</th>
                    <th style={{ textAlign: 'right' }}>Urban</th>
                    <th style={{ textAlign: 'right' }}>Sex ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r) => (
                    <tr key={r.region}>
                      <td>{r.region}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{compactIN(r.population)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{pct(r.share)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{r.literacy == null ? '—' : pct(r.literacy)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{r.urbanPct == null ? '—' : pct(r.urbanPct)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{r.sexRatio == null ? '—' : r.sexRatio.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card title="Every measure in this section" caption="Each one is a page; the map renders all of them at once.">
          <div className="card-grid" style={{ ['--min' as string]: '240px' }}>
            {SUBPAGES.map((p) => (
              <Link key={p.href} href={p.href} className="nav-card">
                <strong>{p.label}</strong>
                <span className="muted" style={{ fontSize: '0.82rem' }}>{p.blurb}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Metrics available" caption="The full set the map and tables can render.">
          <div className="chip-row">
            {METRICS.map((m) => (
              <span className="chip" key={m.id} title={m.blurb}>{m.short}</span>
            ))}
          </div>
        </Card>

        <Card title="State profiles" caption="Every state and union territory has its own page — all measures, ranks, and its regional average.">
          <div className="chip-row">
            {[...censusStates]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <Link key={s.id} href={`/census/state/${s.id}`} className="chip">
                  {s.name}
                </Link>
              ))}
          </div>
        </Card>

        <div className="callout warn">
          <strong>This is a 2011 snapshot.</strong> No census has been completed since, so every figure here is
          fifteen years old — states that have grown fast since (Bihar, Uttar Pradesh, the big metros) are certainly
          larger now. The next census has a reference date of {censusMeta.nextCensus}. Read this section as the shape of
          India in 2011, not as today&apos;s population.
        </div>
      </div>
    </>
  );
}
