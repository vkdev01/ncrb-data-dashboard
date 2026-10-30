/**
 * Census methodology — where every figure comes from, what was reconciled, and
 * what the data cannot support. Deliberately plain: this page exists so a reader
 * can check the work rather than trust the charts.
 */
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { censusMeta, censusStates } from '@/lib/data/census';

const SOURCE_ROWS = [
  { name: 'Census of India 2011 — Primary Census Abstract', what: 'Population, literacy, sex ratio, child population, SC/ST counts.' },
  { name: 'Census of India 2011 — state summary tables', what: 'Area, density, decadal growth, rural and urban split, males and females.' },
  { name: 'Office of the Registrar General & Census Commissioner', what: 'The publishing authority for all of the above.' },
];

export default function CensusMethodologyPage() {
  const withLiteracy = censusStates.filter((s) => s.literacy != null).length;
  const withCsr = censusStates.filter((s) => s.childSexRatio != null).length;

  return (
    <>
      <PageHeader
        title="Census methodology"
        description="Every figure in this section comes from the Census of India 2011. Nothing is modelled, interpolated or estimated except where this page says so explicitly — and the two places where something is derived are labelled as derived."
        source={censusMeta.source}
      />

      <div className="stack">
        <Card title="Sources" caption="All figures are as published. No projection, no smoothing.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>What it supplies</th>
                </tr>
              </thead>
              <tbody>
                {SOURCE_ROWS.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td className="muted">{s.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Geography: current boundaries, 2011 figures" caption="This is the one place where the data had to be reconciled, and it is worth being precise about how.">
          <div className="stack" style={{ gap: 10 }}>
            <p className="muted">
              The map draws India as it is now: Telangana separate from Andhra Pradesh, Ladakh separate from Jammu and
              Kashmir, and Dadra &amp; Nagar Haveli merged with Daman &amp; Diu. The 2011 census was conducted on the
              previous boundaries. The figures here have been reconciled onto the current ones:
            </p>
            <ul className="muted" style={{ paddingLeft: 20, margin: 0 }}>
              <li><strong>Telangana</strong> — shown separately, using the re-tabulated 2011 figures for the districts that became Telangana.</li>
              <li><strong>Ladakh</strong> — shown separately from Jammu and Kashmir, using the 2011 figures for Leh and Kargil.</li>
              <li><strong>Dadra and Nagar Haveli and Daman and Diu</strong> — the two former territories combined, as they are administered today.</li>
            </ul>
            <p className="muted">
              Summing the 36 units gives {new Intl.NumberFormat('en-IN').format(censusStates.reduce((t, s) => t + s.pop2011, 0))}
              {' '}against the published national total of 1,21,08,54,977 — a difference of about 0.03%, which is the
              rounding in the source tables plus the boundary reconciliation above. National figures shown anywhere in
              this section are the published national figures, not a sum of the states.
            </p>
          </div>
        </Card>

        <Card title="Missing cells" caption="Left blank rather than estimated.">
          <p className="muted">
            Two measures are incomplete: literacy is available for {withLiteracy} of {censusStates.length} units and
            child sex ratio for {withCsr} of {censusStates.length}. The gaps are Telangana, Ladakh, and the merged
            Dadra &amp; Nagar Haveli and Daman &amp; Diu — units that did not exist at census time, and for which the
            source tables publish no value at this geography. They render as &ldquo;—&rdquo; in tables and grey on the
            map. Nothing has been filled in.
          </p>
        </Card>

        <Card title="Derived figures" caption="Four measures are computed rather than published. Each is labelled wherever it appears.">
          <div className="table-wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>How it is computed</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Share of India</td><td className="muted">State population ÷ 1,210,854,977 × 100</td></tr>
                <tr><td>Urban and rural population</td><td className="muted">State population × published urban share. The census publishes the share; the headcount here is arithmetic.</td></tr>
                <tr><td>Literacy gender gap</td><td className="muted">Male rate − female rate, in percentage points</td></tr>
                <tr><td>Change since 2001</td><td className="muted">2011 value − 2001 value, for both sex ratios</td></tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Definitions worth knowing" caption="These decide what the numbers mean.">
          <div className="stack" style={{ gap: 12 }}>
            <div>
              <strong>Literacy</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Persons aged 7 and above who can read and write with understanding. Self-reported by the enumerator.
                Excludes children under 7 by definition, which is why a state with high fertility can show a lower rate
                purely from age structure.
              </p>
            </div>
            <div>
              <strong>Sex ratio and child sex ratio</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Females per 1,000 males, overall and for ages 0–6. The overall figure is a stock shaped by mortality,
                migration and longevity; the child figure is a flow, and is the one that reflects what is happening to
                girls now.
              </p>
            </div>
            <div>
              <strong>Urban</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Statutory towns plus census towns (5,000+ people, 75% male non-farm employment, density threshold). A
                place can be counted urban without having a municipal government.
              </p>
            </div>
            <div>
              <strong>Density</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Persons per square kilometre of total area, including uninhabited land — which is why mountain and desert
                units read as near-empty regardless of where their people actually live.
              </p>
            </div>
          </div>
        </Card>

        <div className="callout warn">
          <strong>The biggest limitation is age.</strong> This is a 2011 cross-section. Census 2011 remains the latest
          completed census; the next one has a reference date of {censusMeta.nextCensus} and no provisional totals exist
          yet. Between 2011 and now, India added well over a hundred million people, urbanised further, and improved
          female literacy — none of which this data can show. Where later sample surveys (NFHS, PLFS) exist, they
          disagree with the 2011 census in both directions, and neither is &ldquo;wrong&rdquo;: they measure different
          things with different methods.
        </div>

        <div className="callout">
          <strong>What this section deliberately does not do.</strong> It does not project population forward, rank
          states on a composite &ldquo;development index&rdquo;, or infer causation from a cross-section. Every
          correlation shown is stated with its coefficient and its sample size, and the pages say plainly where a
          relationship is weak. The rankings and the outliers are the parts that survive that scrutiny.
        </div>
      </div>
    </>
  );
}
