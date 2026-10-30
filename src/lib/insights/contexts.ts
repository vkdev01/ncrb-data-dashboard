/**
 * Page contexts for the insights panel.
 *
 * One registry, keyed by route, so the panel can be mounted once in the layout
 * and still answer about the page the reader is on. Each context is built from
 * the same data modules the pages render — there is no second copy of the
 * figures, and no place for the panel to drift out of sync with the charts.
 */
import { censusStates, india } from '@/lib/data/census';
import { censusCities, cityGrowth } from '@/lib/data/cities';
import { ageGroups, ageTotal } from '@/lib/data/age';
import { METRICS } from '@/lib/census';
import { fallbackCybercrime, fallbackOverview, fallbackWomenSafety } from '@/lib/data/fallback';
import { SAFETY_ROWS } from '@/lib/data/safety';
import { nf, pct } from '@/lib/format';
import type { PageContext, Series } from './engine';

const ONE = (v: number) => v.toFixed(1);
const ZERO = (v: number) => v.toFixed(0);

/** All state-level census measures as insight series. */
function censusSeries(): Series[] {
  return METRICS.map((m) => ({
    id: m.id,
    label: m.label,
    short: m.short,
    unit: m.unit,
    format: m.format,
    higherIsBetter: m.higherIsBetter,
    note: m.blurb,
    points: censusStates
      .map((s) => ({ name: s.name, value: m.get(s) }))
      .filter((p): p is { name: string; value: number } => typeof p.value === 'number' && Number.isFinite(p.value)),
  })).filter((s) => s.points.length > 0);
}

/** NCRB state crime rates, as published in the bundled snapshot. */
function crimeSeries(): Series[] {
  return [
    {
      id: 'crimeRate',
      label: 'Crime rate per 100,000 population',
      short: 'Crime rate',
      unit: 'per 100,000',
      format: (v) => v.toFixed(1),
      higherIsBetter: false,
      note:
        'Registered cases per 100,000 people. It measures registration and reporting as much as offending, which is why it should never be read as "danger".',
      points: fallbackOverview.stateRates.map((s) => ({ name: s.name, value: s.rate })),
    },
  ];
}

/** Age bands as shares of the population. */
function ageSeries(): Series[] {
  return [
    {
      id: 'ageShare',
      label: 'Share of population by age band',
      short: 'Age band share',
      unit: '%',
      format: (v) => `${ONE(v)}%`,
      higherIsBetter: null,
      note: 'Five-year age bands, as a percentage of the enumerated population.',
      points: ageGroups
        .filter((g) => g.g !== 'Unknown')
        .map((g) => ({ name: g.g, value: (g.total / ageTotal) * 100 })),
    },
    {
      id: 'ageCount',
      label: 'Population by age band',
      short: 'Age band population',
      unit: 'persons',
      format: nf,
      higherIsBetter: null,
      points: ageGroups.filter((g) => g.g !== 'Unknown').map((g) => ({ name: g.g, value: g.total })),
    },
  ];
}

/** City populations and their decadal growth. */
function citySeries(): Series[] {
  return [
    {
      id: 'cityPop',
      label: 'City population, 2011',
      short: 'City population',
      unit: 'persons',
      format: nf,
      higherIsBetter: null,
      points: censusCities.map((c) => ({ name: c.n, value: c.pop2011 })),
    },
    {
      id: 'cityGrowth',
      label: 'City growth, 2001 to 2011',
      short: 'City growth',
      unit: '%',
      format: (v) => `${ONE(v)}%`,
      higherIsBetter: null,
      note: 'Growth inside municipal boundaries, so annexation and suburban spillover move this as much as migration does.',
      points: censusCities.map((c) => ({ name: c.n, value: cityGrowth(c) })),
    },
  ];
}

const CENSUS_CAVEATS = [
  'Every figure is a 2011 snapshot — the last completed census. The next has a reference date of 1 March 2027.',
  'Telangana, Ladakh and the merged Dadra & Nagar Haveli and Daman & Diu were never tabulated for child sex ratio or literacy, so those cells are blank rather than estimated.',
  'State boundaries are current (post-2019); the census figures have been reconciled onto them.',
];

const CRIME_CAVEATS = [
  'Crime rates count registered cases, not offences. States that register more diligently look worse.',
  'The 2024 IPC → BNS reclassification changes what falls under each head, so 2024 is not comparable with earlier years.',
];

function censusContext(route: string, title: string, blurb: string, extra: Series[] = [], prompts?: string[]): PageContext {
  return {
    route,
    title,
    blurb,
    series: [...extra, ...censusSeries()],
    caveats: CENSUS_CAVEATS,
    source: 'Census of India 2011',
    prompts,
  };
}

/* ------------------------------------------------------------------ registry */

const CONTEXTS: PageContext[] = [
  censusContext(
    '/census',
    'Census of India 2011',
    '1.21 billion people across 36 states and union territories, measured against 2001 on population, growth, sex ratio, literacy and urbanisation.',
    [],
    ['Summarise this page', 'Which state is most literate?', 'Compare Kerala and Bihar on literacy', 'How is literacy correlated with urbanisation?'],
  ),
  censusContext('/census/population', 'Population and density', 'Where 1.21 billion people live, and how tightly they are packed.', [], [
    'Which state is most populous?',
    'Which state is densest?',
    'What is the average density?',
  ]),
  censusContext('/census/growth', 'Decadal growth', 'Population change between 2001 and 2011, state by state.', [], [
    'Which state grew fastest?',
    'Which states shrank?',
    'Is growth related to literacy?',
  ]),
  censusContext('/census/sex-ratio', 'Sex ratio and child sex ratio', 'Women per 1,000 men, and girls per 1,000 boys aged 0 to 6.', [], [
    'Which state has the lowest child sex ratio?',
    'Which states improved their sex ratio?',
    'Summarise the sex ratio story',
  ]),
  censusContext('/census/literacy', 'Literacy', 'Total, male and female literacy, and the gap between them.', [], [
    'Which state is most literate?',
    'Where is the gender gap widest?',
    'What is the median literacy rate?',
  ]),
  censusContext('/census/urbanisation', 'Urbanisation', 'The urban share of each state, and the states that hold India\u2019s cities.', [], [
    'Which state is most urbanised?',
    'Which state has the most urban people?',
  ]),
  censusContext('/census/age', 'Age structure', 'The population pyramid, dependency ratios and age bands for India in 2011.', ageSeries(), [
    'Which age band is largest?',
    'What share is under 15?',
    'Which age bands have more women than men?',
  ]),
  censusContext('/census/cities', 'Cities', 'The largest cities, with their 2001 and 2011 populations.', citySeries(), [
    'Which city is largest?',
    'Which city grew fastest?',
    'Compare Mumbai and Delhi',
  ]),
  censusContext('/census/states', 'All census measures', 'Every state and union territory, every measure, in one table.', [], [
    'Summarise the table',
    'Which state has the highest density?',
    'What is the average literacy rate?',
  ]),
  censusContext('/census/map', 'Census map', 'Sixteen state measures and three district measures on one choropleth.', [], [
    'Which state is most populous?',
    'Which state has the lowest density?',
  ]),
  censusContext('/census/compare', 'Compare two states', 'Any two states side by side, with ranks.', [], [
    'Compare Kerala and Bihar on literacy',
    'Compare Punjab and Haryana on child sex ratio',
  ]),
  censusContext('/census/insights', 'What the numbers say together', 'Correlations and quadrants across the census measures.', [], [
    'How is literacy correlated with urbanisation?',
    'Which measure is most unusual?',
  ]),
  {
    route: '/census/crime',
    title: 'Crime and the census',
    blurb: 'Registered crime against literacy, urbanisation, sex ratio and density.',
    series: [...crimeSeries(), ...censusSeries()],
    caveats: [...CRIME_CAVEATS, ...CENSUS_CAVEATS.slice(0, 1)],
    source: 'NCRB Crime in India 2023 × Census of India 2011',
    prompts: ['Which state has the highest crime rate?', 'Is crime related to urbanisation?', 'Compare Kerala and Bihar on crime rate'],
  },
  {
    route: '/states',
    title: 'States and union territories',
    blurb: 'Crime rate per 100,000 population by state — the fairer basis for comparison than raw case counts.',
    series: crimeSeries(),
    caveats: CRIME_CAVEATS,
    source: 'NCRB Crime in India',
    prompts: ['Which state has the highest crime rate?', 'Which state has the lowest?', 'Summarise this page'],
  },
  {
    route: '/map',
    title: 'Map of India',
    blurb: 'State and district crime figures as a choropleth, with a violent-crime timeline.',
    series: crimeSeries(),
    caveats: [...CRIME_CAVEATS, 'Shading is by rank, not absolute value.'],
    source: 'NCRB Crime in India',
    prompts: ['Which state has the highest crime rate?', 'Which state has the lowest?', 'Summarise this page'],
  },
  {
    route: '/trends',
    title: 'Crime trends',
    blurb: 'Year-wise totals, IPC against special and local laws, and the population-normalised crime rate.',
    series: [
      {
        id: 'crimeTotal',
        label: 'Total cognizable crimes recorded',
        short: 'Total crimes',
        unit: 'cases',
        format: nf,
        higherIsBetter: false,
        note: 'Registered cases, not offences. The 2020 spike reflects pandemic-period reporting changes as much as any change in crime.',
        points: fallbackOverview.nationalTrend.map((t) => ({ name: t.year, value: t.total })),
      },
      {
        id: 'crimeRate',
        label: 'Crime rate per 100,000 population',
        short: 'Crime rate',
        unit: 'per 100,000',
        format: (v) => v.toFixed(1),
        higherIsBetter: false,
        note: 'Cases per 100,000 people, which normalises for population growth.',
        points: fallbackOverview.nationalTrend.map((t) => ({ name: t.year, value: t.rate })),
      },
    ],
    caveats: CRIME_CAVEATS,
    source: 'NCRB Crime in India',
    prompts: ['Which year had the most crimes?', 'Summarise this page', 'Is the crime rate rising?'],
  },
  {
    route: '/women',
    title: 'Crimes against women',
    blurb: 'Recorded crimes against women by state, and how the composition has shifted.',
    series: [
      {
        id: 'womenRate',
        label: 'Crimes against women per 100,000 women',
        short: 'Women crime rate',
        unit: 'per 100,000 women',
        format: (v) => v.toFixed(1),
        higherIsBetter: false,
        note: 'Registered cases per 100,000 women. Reporting rates vary enormously by state, so this is a measure of registration too.',
        points: fallbackWomenSafety.stateRates.map((s) => ({ name: s.name, value: s.rate })),
      },
    ],
    caveats: CRIME_CAVEATS,
    source: 'NCRB Crime in India, chapter 5',
    prompts: ['Which state has the highest rate?', 'Which state has the lowest?', 'Summarise this page'],
  },
  {
    route: '/cyber',
    title: 'Cybercrime',
    blurb: 'Cybercrime cases recorded by NCRB against complaints on the I4C portal.',
    series: [
      {
        id: 'cyberCases',
        label: 'Cybercrime cases recorded',
        short: 'Cyber cases',
        unit: 'cases',
        format: nf,
        higherIsBetter: false,
        points: fallbackCybercrime.ncrbTrend.map((t) => ({ name: t.year, value: t.cases })),
      },
    ],
    caveats: [
      'NCRB counts FIR-registered cases; I4C counts citizen complaints. The gap between them is the story, not an error.',
      ...CRIME_CAVEATS.slice(0, 1),
    ],
    source: 'NCRB Crime in India + I4C',
    prompts: ['Which year had the most cases?', 'Summarise this page'],
  },
  {
    route: '/safety',
    title: "Women's safety — 50-country comparison",
    blurb: 'Past-year intimate-partner violence prevalence against a rule-of-law score, across 50 countries.',
    series: [
      {
        id: 'ipv',
        label: 'Past-year intimate-partner violence prevalence',
        short: 'IPV prevalence',
        unit: '% of ever-partnered women',
        format: (v) => `${v.toFixed(1)}%`,
        higherIsBetter: false,
        note: 'Women affected at least once in the past year — not criminal incidents, and not comparable to police-recorded counts.',
        points: SAFETY_ROWS.map((r) => ({ name: r.country, value: r.ipv })),
      },
      {
        id: 'ruleOfLaw',
        label: 'Rule of law score',
        short: 'Rule of law',
        unit: '0–1 index',
        format: (v) => v.toFixed(2),
        higherIsBetter: true,
        points: SAFETY_ROWS.map((r) => ({ name: r.country, value: r.ruleOfLaw })),
      },
    ],
    caveats: [
      'PROVISIONAL: these figures were compiled by hand and have not been audited against the underlying country tables.',
      'Prevalence counts women affected, not incidents, so it is not comparable to police-recorded crime counts.',
      'Fifty countries is a small sample for a cross-country correlation; treat any r here as descriptive.',
    ],
    source: 'Working analysis (provisional)',
    prompts: ['Where does India rank?', 'Which country has the highest prevalence?', 'Is prevalence related to rule of law?'],
  },
  {
    route: '/census/methodology',
    title: 'Census methodology',
    blurb: 'Sources, boundary reconciliation, missing cells and limits.',
    series: censusSeries(),
    caveats: CENSUS_CAVEATS,
    source: 'Census of India 2011',
    prompts: ['Summarise this page', 'Which measures are derived?'],
  },
];

/** Fallback for any route without its own context. */
const DEFAULT_CONTEXT: PageContext = {
  route: '/',
  title: 'India in Data',
  blurb:
    'Crime, census, climate, air and the economy — one explorer. This route has no page-specific context, ' +
    'so answers come from the national figures.',
  series: [...crimeSeries(), ...censusSeries()],
  caveats: [...CRIME_CAVEATS, ...CENSUS_CAVEATS],
  source: 'NCRB × Census of India 2011',
  prompts: ['Summarise this page', 'Which state has the highest crime rate?', 'Which state is most literate?'],
};

/** Resolve the context for a pathname (longest matching prefix wins). */
export function contextForPath(pathname: string): PageContext {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const exact = CONTEXTS.find((c) => c.route === clean);
  if (exact) return exact;
  // /census/state/UP → the census overview context
  if (clean.startsWith('/census/state/')) {
    return { ...CONTEXTS[0], route: clean, title: 'State profile' };
  }
  const prefixed = CONTEXTS.filter((c) => clean.startsWith(c.route) && c.route !== '/census')
    .sort((a, b) => b.route.length - a.route.length)[0];
  if (prefixed) return prefixed;
  if (clean.startsWith('/census')) return CONTEXTS[0];
  return DEFAULT_CONTEXT;
}

/** National figures, for the panel's header line. */
export const nationalLine = `India 2011: ${nf(india.pop2011)} people, ${pct(india.literacy)} literate, sex ratio ${india.sexRatio}, ${pct(india.urbanPct)} urban.`;
