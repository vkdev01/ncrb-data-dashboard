/**
 * Shared domain types for the NCRB dashboard.
 *
 * These mirror the shape of the data files published by the data pipeline
 * (see `scripts/fetch-data.mjs` and `src/lib/data/sources.ts`). Keeping the
 * types in one place means every page, chart and table agrees on the contract.
 */

/** A single year in a national-level time series. */
export interface NationalTrendPoint {
  year: string;
  total: number;
  ipc: number;
  sll: number;
  rate: number; // crimes per 100,000 population
}

/** A named offence category with a case count and its share of the total. */
export interface CrimeHead {
  id: string;
  name: string;
  cases: number;
  pct: number;
}

/** A state/UT with a rate and (optionally) a raw case count. */
export interface StateRate {
  id: string;
  name: string;
  rate: number;
  total?: number;
}

export interface Summary {
  year: string;
  dataYear: string;
  totalCrimes: number;
  crimeRate: number;
  roadDeaths: number;
  chargesheetRatePct: number;
  convictionRatePct: number;
  womenCrimes: number;
  cybercrimes: number;
  policeRatioActual: number;
  lastUpdated: string;
  source: string;
}

export interface Overview {
  year: string;
  nationalTrend: NationalTrendPoint[];
  ipcComposition: CrimeHead[];
  stateRates: StateRate[];
  homicideRate: { year: string; value: number }[];
  source: string;
}

export interface WomenSafety {
  year: string;
  nationalTrend: { year: string; total: number; rate: number }[];
  crimeTypes: CrimeHead[];
  stateRates: StateRate[];
  source: string;
}

export interface Cybercrime {
  year: string;
  ncrbTrend: { year: string; cases: number; rate: number }[];
  crimeTypes: CrimeHead[];
  i4cComplaints: number;
  i4cFinancialLossCrore: number;
  i4cNote?: string;
  source: string;
}

/** Every dataset the app can render, keyed by a stable id. */
export interface DatasetMap {
  summary: Summary;
  overview: Overview;
  womenSafety: WomenSafety;
  cybercrime: Cybercrime;
}

export type DatasetId = keyof DatasetMap;
