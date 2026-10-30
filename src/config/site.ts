/** Site-wide configuration: identity, domains, navigation and attribution. */

export const site = {
  name: 'India in Data',
  shortName: 'India',
  tagline: 'Crime, census, climate, air, economy and society — one explorer',
  description:
    'An open, interactive explorer of India: NCRB crime statistics, the 2011 census, a warming climate, live air ' +
    'quality, sixty years of economic progress and how India compares on women’s safety.',
  repo: 'https://github.com/vkdev01/ncrb-data-dashboard',
};

export interface Domain {
  id: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  blurb: string;
  domain: string;
}

/** Top-level domains, in the order they appear in the header. */
export const domains: Domain[] = [
  { id: 'crime', label: 'Crime' },
  { id: 'census', label: 'Census' },
  { id: 'climate', label: 'Climate' },
  { id: 'air', label: 'Air' },
  { id: 'economy', label: 'Economy' },
  { id: 'society', label: 'Society' },
  { id: 'about', label: 'About' },
];

export const nav: NavItem[] = [
  // ---- crime (NCRB) ----
  { href: '/', label: 'Overview', blurb: 'National headline numbers and the ten-year trend.', domain: 'crime' },
  { href: '/map', label: 'Map', blurb: 'Choropleth of India by state and district.', domain: 'crime' },
  { href: '/trends', label: 'Trends', blurb: 'Year-wise totals, IPC vs SLL and crime rate.', domain: 'crime' },
  { href: '/crime-heads', label: 'Crime heads', blurb: 'How recorded offences split across heads.', domain: 'crime' },
  { href: '/states', label: 'States', blurb: 'State and UT comparison by crime rate.', domain: 'crime' },
  { href: '/women', label: 'Women', blurb: 'Crimes against women: trend, types and states.', domain: 'crime' },
  { href: '/cyber', label: 'Cybercrime', blurb: 'Cyber offences and the I4C reporting gap.', domain: 'crime' },
  { href: '/justice', label: 'Justice', blurb: 'Police strength and the FIR-to-conviction pipeline.', domain: 'crime' },
  { href: '/transition', label: 'IPC→BNS', blurb: 'The 2024 criminal-law transition, head by head.', domain: 'crime' },

  // ---- census (2011) ----
  { href: '/census', label: 'Overview', blurb: 'The national picture: 1.21 billion people in 2011.', domain: 'census' },
  { href: '/census/map', label: 'Map', blurb: 'Any census measure, choropleth, state by state.', domain: 'census' },
  { href: '/census/population', label: 'Population', blurb: 'Scale, share of India, and density.', domain: 'census' },
  { href: '/census/growth', label: 'Growth', blurb: 'Decadal growth, 2001 → 2011.', domain: 'census' },
  { href: '/census/sex-ratio', label: 'Sex ratio', blurb: 'Women per 1,000 men, and the child ratio.', domain: 'census' },
  { href: '/census/literacy', label: 'Literacy', blurb: 'Total, male, female — and the gap between them.', domain: 'census' },
  { href: '/census/urbanisation', label: 'Urbanisation', blurb: 'The urban share, and where the cities are.', domain: 'census' },
  { href: '/census/age', label: 'Age', blurb: 'The population pyramid and dependency ratios.', domain: 'census' },
  { href: '/census/cities', label: 'Cities', blurb: 'The largest cities and how fast they grew.', domain: 'census' },
  { href: '/census/compare', label: 'Compare', blurb: 'Any two states, every measure, side by side.', domain: 'census' },
  { href: '/census/states', label: 'All measures', blurb: 'Every measure, every state, one table.', domain: 'census' },
  { href: '/census/insights', label: 'Insights', blurb: 'Cross-metric analysis and correlations.', domain: 'census' },
  { href: '/census/crime', label: 'Crime × Census', blurb: 'Crime rates against literacy, urbanisation and sex ratio.', domain: 'census' },
  { href: '/census/methodology', label: 'Method', blurb: 'Sources, reconciliation and limits.', domain: 'census' },

  // ---- climate ----
  { href: '/climate', label: 'Warming', blurb: 'How much hotter each Indian city has become since 1950.', domain: 'climate' },

  // ---- air ----
  { href: '/air', label: 'Air quality', blurb: 'Live PM2.5 and AQI across major cities.', domain: 'air' },

  // ---- economy ----
  { href: '/economy', label: 'Economy', blurb: 'Sixty years of World Bank indicators for India.', domain: 'economy' },

  // ---- society ----
  { href: '/safety', label: "Women's safety", blurb: "A 50-country comparison, with its caveats.", domain: 'society' },

  // ---- about ----
  { href: '/glossary', label: 'Glossary', blurb: 'What the terms actually mean.', domain: 'about' },
  { href: '/about', label: 'Methodology', blurb: 'Sources, methods and limitations.', domain: 'about' },
];

/** Items belonging to a domain, in nav order. */
export function navForDomain(domain: string): NavItem[] {
  return nav.filter((n) => n.domain === domain);
}

/** Which domain a pathname belongs to (longest matching href wins). */
export function domainOf(pathname: string): string {
  const matches = nav
    .filter((n) => (n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.domain ?? 'crime';
}

/** First page of a domain — where the header link points. */
export function domainEntry(domain: string): string {
  return navForDomain(domain)[0]?.href ?? '/';
}

export const sources = [
  { name: 'NCRB — Crime in India', url: 'https://www.ncrb.gov.in/', note: 'Primary publisher of crime statistics.' },
  {
    name: 'Census of India 2011',
    url: 'https://censusindia.gov.in/',
    note: 'Population, literacy, sex ratio and settlement — the latest completed census. Next census reference date: 1 March 2027.',
  },
  { name: 'Open-Meteo', url: 'https://open-meteo.com/', note: 'Historical climate archive and live air quality, CC BY 4.0.' },
  { name: 'World Bank Open Data', url: 'https://data.worldbank.org/', note: 'Economic and development indicators.' },
  { name: 'Indian Data Project', url: 'https://indiandataproject.org/open-data', note: 'NCRB-derived JSON feeds.' },
  { name: 'Esri India Living Atlas', url: 'https://livingatlas.esri.in/server1/rest/services/NCRB', note: 'NCRB district tables as feature services.' },
];
