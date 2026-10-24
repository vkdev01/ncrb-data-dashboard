import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { sources, site } from '@/config/site';
import { SOURCES } from '@/lib/data/sources';

export const metadata: Metadata = {
  title: 'About & methodology',
  description: 'How the NCRB dashboard is built, where its data comes from, and what the figures can and cannot tell you.',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About & methodology"
        description="Where the numbers come from, how they are loaded, and the limits worth remembering before quoting any of them."
      />

      <div className="stack">
        <Card title="What this is" caption="A dashboard over India's recorded crime statistics.">
          <p className="card-cap" style={{ fontSize: '0.92rem' }}>
            The dashboard visualises <strong>recorded</strong> offences published by the National Crime Records Bureau
            (NCRB) in its annual <em>Crime in India</em> reports. It is a reader and a charting layer — it does not
            collect, estimate or adjust the underlying figures. Every page shows the upstream source it is drawing on.
          </p>
          <p className="card-cap" style={{ fontSize: '0.92rem' }}>
            This is <strong>not an official NCRB product</strong>. Verify any figure against the source report before
            publishing.
          </p>
        </Card>

        <Card title="How the data is loaded" caption="Live first, bundled snapshot as a fallback.">
          <ol className="about-list">
            <li>
              Each dataset has a <strong>live endpoint</strong> registered in <code>src/lib/data/sources.ts</code>. On
              load the app fetches it (CORS-enabled, no API key) and renders the result.
            </li>
            <li>
              If the fetch fails, it falls back to a <strong>bundled snapshot</strong> in{' '}
              <code>src/lib/data/fallback.ts</code>, so the page is never blank. The badge in each header says which
              one you are seeing: <em>live data</em> or <em>snapshot</em>.
            </li>
            <li>
              Results are cached in memory (<code>src/lib/data/client.ts</code>) so several components share one
              request.
            </li>
            <li>
              <code>scripts/fetch-data.mjs</code> regenerates the bundled snapshot from the live sources — run{' '}
              <code>npm run fetch-data</code> to refresh it.
            </li>
          </ol>
          <div className="callout" style={{ marginTop: 14 }}>
            <strong>Adding a dataset.</strong> Drop a JSON file next to the others, add one entry to{' '}
            <code>SOURCES</code>, and every hook, chart and table works with it — no page changes needed.
          </div>
        </Card>

        <Card title="Sources" caption="Every figure traces back to one of these.">
          <ul className="about-sources">
            {sources.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
                <span>{s.detail}</span>
              </li>
            ))}
          </ul>
          <p className="card-cap" style={{ marginTop: 12 }}>
            Datasets currently wired up:{' '}
            {Object.values(SOURCES)
              .map((s) => s.label)
              .join(', ')}
            .
          </p>
        </Card>

        <Card title="Limitations — read before quoting" caption="These are properties of the source data, not bugs in the app.">
          <ul className="about-list">
            <li>
              <strong>Recorded, not actual.</strong> Police statistics count what gets reported and registered.
              Under-reporting is real, varies by offence and by state, and cannot be corrected by arithmetic.
            </li>
            <li>
              <strong>Rate ≠ safety.</strong> A higher crime rate often means more registration, not more harm.
              Conversely, a low rate may simply mean less reporting.
            </li>
            <li>
              <strong>Definitions change.</strong> Offence heads are legal categories; they shift with statutes
              (for example IPC → BNS), which breaks long time-series comparability.
            </li>
            <li>
              <strong>Denominators differ.</strong> The all-crime rate uses total population; crimes against women use
              women as the denominator. They are not interchangeable.
            </li>
            <li>
              <strong>Different periods.</strong> Figures from different chapters and agencies (NCRB, MoRTH, BPRD,
              I4C) may describe different reference years.
            </li>
            <li>
              <strong>Not audited here.</strong> The dashboard presents the upstream numbers as published. It has not
              independently verified them against the source tables.
            </li>
          </ul>
        </Card>

        <Card title="Tech" caption="Built to be extended.">
          <ul className="about-list">
            <li>Next.js (App Router) with a fully static export — no server, no database.</li>
            <li>Typed data layer: <code>types.ts</code>, <code>sources.ts</code>, <code>client.ts</code>, plus a <code>useDataset</code> hook.</li>
            <li>Hand-rolled SVG charts (line, donut, ranked bars) — no charting dependency to keep in sync.</li>
            <li>Reusable UI primitives: cards, stat cards, sortable tables, live/snapshot badges.</li>
          </ul>
          <p className="card-cap" style={{ marginTop: 12 }}>
            Source code: <a href={site.repo} target="_blank" rel="noreferrer">{site.repo}</a>
          </p>
        </Card>
      </div>
    </>
  );
}
