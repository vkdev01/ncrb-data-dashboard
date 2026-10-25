import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = {
  title: 'Glossary',
  description: 'Plain-language definitions of the crime heads, legal categories and statistical terms used in NCRB reports.',
};

interface Term {
  term: string;
  def: string;
}

const LEGAL: Term[] = [
  { term: 'Cognizable offence', def: 'An offence for which police may register a case and investigate without a magistrate’s order. NCRB counts cognizable crimes.' },
  { term: 'Non-cognizable offence', def: 'An offence where police need a magistrate’s order to investigate. These are not counted in the main NCRB totals — which is why reclassifying an offence can move the numbers.' },
  { term: 'FIR', def: 'First Information Report — the document that starts a police case. One FIR may contain several offences.' },
  { term: 'IPC', def: 'Indian Penal Code, the general criminal code in force until 30 June 2024.' },
  { term: 'BNS', def: 'Bharatiya Nyaya Sanhita — the code that replaced the IPC from 1 July 2024. NCRB counted IPC and BNS separately for 2024.' },
  { term: 'SLL', def: 'Special and Local Laws — offences under other statutes (Arms Act, NDPS Act, Excise Act, IT Act, state prohibition laws, and so on), reported alongside IPC/BNS crimes.' },
  { term: 'POCSO Act', def: 'Protection of Children from Sexual Offences Act, 2012 — a special law, so its cases sit under SLL rather than IPC/BNS.' },
  { term: 'SC/ST (PoA) Act', def: 'Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act — another SLL statute, tracked as its own crime category.' },
];

const STATS: Term[] = [
  { term: 'Principal Offence Rule', def: 'Where several offences are registered in one FIR, only the most serious is counted. This keeps cases and crimes aligned, but means less serious offences in the same FIR are not counted separately.' },
  { term: 'Crime rate', def: 'Cases registered per 100,000 (or per lakh) population. It normalises for population size, but still reflects how much gets reported and registered.' },
  { term: 'Charge-sheeting rate', def: 'Share of cases disposed by police that were sent to court. A process statistic — it is not a measure of how many crimes are solved.' },
  { term: 'Conviction rate', def: 'Share of decided cases that ended in conviction. Because it is over cases that reached a decision, the large pending backlog is excluded.' },
  { term: 'Pendency', def: 'Cases still awaiting investigation or trial at the end of the year.' },
  { term: 'Recorded vs actual crime', def: 'All NCRB figures are police-recorded. Surveys that ask people directly find far more crime than is reported, so recorded numbers are a floor, not a true count.' },
  { term: 'Metropolitan city', def: 'In NCRB reports, cities with a population of 10 lakh or more as per the 2011 Census. Data is published for 53 such cities, and in hard copy for the 19 with over 20 lakh.' },
  { term: 'Crime head', def: 'A category of offence as defined in law — murder, theft, rioting, and so on. Heads change when statutes change, which breaks comparisons across the IPC→BNS boundary.' },
  { term: 'LGD code', def: 'Local Government Directory code — a stable numeric identifier for a district or state, useful for joining datasets that spell names differently.' },
  { term: 'I4C', def: 'Indian Cyber Crime Coordination Centre. Its portal complaints count what citizens report; NCRB counts FIRs registered. The gap between them is the cybercrime reporting gap.' },
];

export default function GlossaryPage() {
  return (
    <>
      <PageHeader
        title="Glossary"
        description="The legal categories and statistical terms that NCRB reports rely on. Several of them are routinely misread, so the definitions matter as much as the numbers."
      />

      <div className="stack">
        <Card title="Legal categories" caption="How offences are classified, and why classification changes the counts.">
          <dl className="gloss">
            {LEGAL.map((t) => (
              <div className="gloss-item" key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.def}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Statistical terms" caption="What each measure actually counts.">
          <dl className="gloss">
            {STATS.map((t) => (
              <div className="gloss-item" key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.def}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="callout warn">
          <strong>Two mistakes worth avoiding.</strong> First, treating a crime rate as a measure of safety: a state
          that registers more cases will always look worse, regardless of underlying crime. Second, comparing counts
          across the IPC→BNS boundary as if the categories were unchanged — several heads were merged, split or newly
          created, so much of the apparent change is definitional.
        </div>

        <Card title="Source" caption="Where these definitions come from.">
          <p className="card-cap" style={{ fontSize: '0.9rem' }}>
            Definitions follow NCRB&rsquo;s own glossary in the <em>Crime in India</em> reports and the accompanying
            methodology notes, including the Disclaimer &amp; Limitations and Methodology of Data Collection sections.
            Where a term is used differently in the dashboard, the page using it says so.
          </p>
        </Card>
      </div>
    </>
  );
}
