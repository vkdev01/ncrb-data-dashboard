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

/** Police strength (BPRD), including per-state sanctioned vs actual ratios. */
export interface Police {
  year: string;
  sanctionedStrength: number;
  actualStrength: number;
  vacancyPct: number;
  sanctionedRatePerLakh: number;
  actualRatePerLakh: number;
  unRecommended: number;
  womenPolicePct: number;
  womenPoliceTotal: number;
  stateRatios: { id: string; name: string; sanctioned: number; actual: number }[];
  source: string;
}

/** The justice pipeline: FIR → investigation → charge-sheet → trial → outcome. */
export interface Justice {
  year: string;
  funnel: {
    totalForInvestigation: number;
    investigated: number;
    chargesheeted: number;
    chargesheetRate: number;
    totalForTrial: number;
    trialCompleted: number;
    convicted: number;
    acquitted: number;
    convictionRate: number;
    pendingInvestigation: number;
    pendingTrial: number;
    pendencyRate: number;
  };
  trialDuration: {
    avgYears: number;
    casesOver5Years: number;
    casesOver10Years: number;
    judgesPerMillion: number;
  };
  source: string;
}

/** A named indicator with a per-state value. */
export interface Indicator {
  id: string;
  name: string;
  category: string;
  unit: string;
  states: { id: string; name: string; value: number }[];
  source: string;
}
export interface Indicators {
  year: string;
  indicators: Indicator[];
}

/** Every dataset the app can render, keyed by a stable id. */
export interface DatasetMap {
  summary: Summary;
  overview: Overview;
  womenSafety: WomenSafety;
  cybercrime: Cybercrime;
  police: Police;
  justice: Justice;
  indicators: Indicators;
}

export type DatasetId = keyof DatasetMap;
