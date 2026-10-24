/** Site-wide configuration: identity, navigation and source attribution. */

export const site = {
  name: 'NCRB Data Dashboard',
  shortName: 'NCRB',
  tagline: "India's crime statistics — categorised, visualised and analysed",
  description:
    'An interactive dashboard for National Crime Records Bureau (NCRB) statistics: national trends, ' +
    'crime heads, state-wise rates, crimes against women and cybercrime.',
  repo: 'https://github.com/vkdev01/ncrb-data-dashboard',
};

export interface NavItem {
  href: string;
  label: string;
  /** Short blurb used on the home page card grid. */
  blurb?: string;
}

export const nav: NavItem[] = [
  { href: '/', label: 'Overview', blurb: 'National headline numbers and the ten-year trend.' },
  { href: '/map', label: 'Map', blurb: 'Choropleth of India by state and district.' },
  { href: '/trends', label: 'Trends', blurb: 'Year-wise totals, IPC vs SLL and crime rate.' },
  { href: '/crime-heads', label: 'Crime heads', blurb: 'How the IPC total breaks down by offence.' },
  { href: '/states', label: 'States', blurb: 'State and UT comparison by crime rate.' },
  { href: '/women', label: 'Women', blurb: 'Crimes against women: trend, types and states.' },
  { href: '/cyber', label: 'Cybercrime', blurb: 'Cyber offences, types and the I4C reporting gap.' },
  { href: '/transition', label: 'IPC→BNS', blurb: 'The 2024 criminal-law transition, head by head.' },
  { href: '/about', label: 'About', blurb: 'Methodology, sources and limitations.' },
];

/**
 * Upstream sources the dashboard draws on. Shown on the About page and in
 * footers so every figure can be traced.
 */
export const sources = [
  {
    name: 'National Crime Records Bureau (NCRB)',
    detail: 'Crime in India reports — the primary publisher of these statistics.',
    url: 'https://www.ncrb.gov.in/',
  },
  {
    name: 'Open Government Data (data.gov.in)',
    detail: 'Official "Crime in India" catalogues, distributed as ZIP downloads.',
    url: 'https://www.data.gov.in/catalog/crime-india-2023',
  },
  {
    name: 'Indian Data Project — open data',
    detail: 'NCRB-derived JSON endpoints (CORS-enabled, no key) used as the live feed.',
    url: 'https://indiandataproject.org/open-data',
  },
  {
    name: 'OpenCity (CKAN)',
    detail: 'Public-domain mirror of NCRB tables, including CSV resources.',
    url: 'https://data.opencity.in/',
  },
];
