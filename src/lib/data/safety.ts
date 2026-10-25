/**
 * Women's safety — a 50-country comparison from a working analysis.
 *
 * PROVISIONAL. These figures were compiled by hand and have not been audited
 * against the underlying country source tables. They are presented with that
 * caveat on the page, and must not be read as a verified international ranking.
 * Prevalence counts women affected at least once in a year — not criminal
 * incidents — and is not comparable to police-recorded case counts.
 */

export interface CountryRow {
  rank: number;
  country: string;
  /** past-year prevalence of intimate-partner violence, % of ever-partnered women 15-49 */
  ipv: number;
  /** women affected per 100,000 women per year */
  affectedPer100k: number;
  /** World Justice Project overall rule-of-law score (0-1), provisional */
  ruleOfLaw: number;
  /** true for the focus country */
  highlight?: boolean;
}

export const SAFETY_ROWS: CountryRow[] = [
  { rank: 1, country: 'Sierra Leone', ipv: 41.0, affectedPer100k: 41000, ruleOfLaw: 0.44 },
  { rank: 2, country: 'Afghanistan', ipv: 39.7, affectedPer100k: 39700, ruleOfLaw: 0.31 },
  { rank: 3, country: 'DR Congo', ipv: 33.2, affectedPer100k: 33200, ruleOfLaw: 0.34 },
  { rank: 4, country: 'Uganda', ipv: 24.2, affectedPer100k: 24200, ruleOfLaw: 0.38 },
  { rank: 5, country: 'Tanzania', ipv: 23.8, affectedPer100k: 23800, ruleOfLaw: 0.46 },
  { rank: 6, country: 'Dominican Republic', ipv: 22.8, affectedPer100k: 22800, ruleOfLaw: 0.50 },
  { rank: 7, country: 'India', ipv: 22.4, affectedPer100k: 22400, ruleOfLaw: 0.49, highlight: true },
  { rank: 8, country: 'Morocco', ipv: 21.6, affectedPer100k: 21600, ruleOfLaw: 0.48 },
  { rank: 9, country: 'Malawi', ipv: 20.9, affectedPer100k: 20900, ruleOfLaw: 0.52 },
  { rank: 10, country: 'Ethiopia', ipv: 20.1, affectedPer100k: 20100, ruleOfLaw: 0.36 },
  { rank: 11, country: 'Nigeria', ipv: 19.6, affectedPer100k: 19600, ruleOfLaw: 0.41 },
  { rank: 12, country: 'Rwanda', ipv: 18.4, affectedPer100k: 18400, ruleOfLaw: 0.63 },
  { rank: 13, country: 'Egypt', ipv: 17.2, affectedPer100k: 17200, ruleOfLaw: 0.35 },
  { rank: 14, country: 'Bangladesh', ipv: 15.7, affectedPer100k: 15700, ruleOfLaw: 0.39 },
  { rank: 15, country: 'Bolivia', ipv: 15.2, affectedPer100k: 15200, ruleOfLaw: 0.37 },
  { rank: 16, country: 'Colombia', ipv: 14.8, affectedPer100k: 14800, ruleOfLaw: 0.47 },
  { rank: 17, country: 'Kenya', ipv: 14.6, affectedPer100k: 14600, ruleOfLaw: 0.45 },
  { rank: 18, country: 'Thailand', ipv: 14.3, affectedPer100k: 14300, ruleOfLaw: 0.50 },
  { rank: 19, country: 'Ghana', ipv: 13.4, affectedPer100k: 13400, ruleOfLaw: 0.54 },
  { rank: 20, country: 'Türkiye', ipv: 13.3, affectedPer100k: 13300, ruleOfLaw: 0.41 },
  { rank: 21, country: 'Pakistan', ipv: 13.1, affectedPer100k: 13100, ruleOfLaw: 0.37 },
  { rank: 22, country: 'Nepal', ipv: 12.3, affectedPer100k: 12300, ruleOfLaw: 0.52 },
  { rank: 23, country: 'Vietnam', ipv: 11.2, affectedPer100k: 11200, ruleOfLaw: 0.50 },
  { rank: 24, country: 'South Africa', ipv: 10.6, affectedPer100k: 10600, ruleOfLaw: 0.56 },
  { rank: 25, country: 'Argentina', ipv: 10.6, affectedPer100k: 10600, ruleOfLaw: 0.54 },
  { rank: 26, country: 'Romania', ipv: 10.6, affectedPer100k: 10600, ruleOfLaw: 0.61 },
  { rank: 27, country: 'China', ipv: 10.6, affectedPer100k: 10600, ruleOfLaw: 0.48 },
  { rank: 28, country: 'Canada', ipv: 8.5, affectedPer100k: 8500, ruleOfLaw: 0.79 },
  { rank: 29, country: 'South Korea', ipv: 8.4, affectedPer100k: 8400, ruleOfLaw: 0.74 },
  { rank: 30, country: 'Sri Lanka', ipv: 8.0, affectedPer100k: 8000, ruleOfLaw: 0.51 },
  { rank: 31, country: 'Peru', ipv: 8.0, affectedPer100k: 8000, ruleOfLaw: 0.48 },
  { rank: 32, country: 'United States', ipv: 7.4, affectedPer100k: 7400, ruleOfLaw: 0.68 },
  { rank: 33, country: 'Guatemala', ipv: 7.2, affectedPer100k: 7200, ruleOfLaw: 0.44 },
  { rank: 34, country: 'Mexico', ipv: 7.0, affectedPer100k: 7000, ruleOfLaw: 0.40 },
  { rank: 35, country: 'Netherlands', ipv: 5.2, affectedPer100k: 5200, ruleOfLaw: 0.82 },
  { rank: 36, country: 'Germany', ipv: 4.7, affectedPer100k: 4700, ruleOfLaw: 0.83 },
  { rank: 37, country: 'Sweden', ipv: 4.3, affectedPer100k: 4300, ruleOfLaw: 0.85 },
  { rank: 38, country: 'United Kingdom', ipv: 4.0, affectedPer100k: 4000, ruleOfLaw: 0.78 },
  { rank: 39, country: 'Japan', ipv: 3.7, affectedPer100k: 3700, ruleOfLaw: 0.78 },
  { rank: 40, country: 'Indonesia', ipv: 3.6, affectedPer100k: 3600, ruleOfLaw: 0.52 },
  { rank: 41, country: 'France', ipv: 3.4, affectedPer100k: 3400, ruleOfLaw: 0.72 },
  { rank: 42, country: 'Denmark', ipv: 2.9, affectedPer100k: 2900, ruleOfLaw: 0.90 },
  { rank: 43, country: 'Italy', ipv: 2.8, affectedPer100k: 2800, ruleOfLaw: 0.66 },
  { rank: 44, country: 'Finland', ipv: 2.7, affectedPer100k: 2700, ruleOfLaw: 0.87 },
  { rank: 45, country: 'Singapore', ipv: 2.6, affectedPer100k: 2600, ruleOfLaw: 0.78 },
  { rank: 46, country: 'Brazil', ipv: 2.4, affectedPer100k: 2400, ruleOfLaw: 0.50 },
  { rank: 47, country: 'Spain', ipv: 2.4, affectedPer100k: 2400, ruleOfLaw: 0.71 },
  { rank: 48, country: 'Australia', ipv: 1.8, affectedPer100k: 1800, ruleOfLaw: 0.80 },
  { rank: 49, country: 'Poland', ipv: 1.7, affectedPer100k: 1700, ruleOfLaw: 0.66 },
  { rank: 50, country: 'New Zealand', ipv: 1.2, affectedPer100k: 1200, ruleOfLaw: 0.83 },
];

export const SAFETY_CAVEATS = [
  'Provisional working figures — not an audited international ranking.',
  'Prevalence counts women affected at least once in a year, not the number of criminal incidents.',
  'It cannot be compared with police-recorded case counts, which measure reporting, not occurrence.',
  'Reference years, age groups and survey instruments differ between countries.',
];
