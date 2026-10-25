/**
 * Bundled fallback snapshot.
 *
 * The dashboard prefers to fetch live data at runtime (see `sources.ts`).
 * This snapshot is what renders when the live source is unreachable — so the
 * site is never blank. It is a *subset* of the full dataset (the live feed
 * carries longer series), and every figure below is NCRB-derived.
 *
 * Source: NCRB "Crime in India 2023" (+ MoRTH / BPRD / I4C where noted),
 * as published via indiandataproject.org's open-data endpoints.
 * Snapshot taken: 2026-10-25.
 */
import type { Cybercrime, Indicators, Justice, Overview, Police, Summary, WomenSafety } from './types';

export const fallbackSummary: Summary = {
  year: '2025-26',
  dataYear: '2023',
  totalCrimes: 6241569,
  crimeRate: 448.3,
  roadDeaths: 172890,
  chargesheetRatePct: 72.7,
  convictionRatePct: 54.0,
  womenCrimes: 448211,
  cybercrimes: 86420,
  policeRatioActual: 154.84,
  lastUpdated: '2026-07-15',
  source: 'NCRB Crime in India 2023 + MoRTH 2023 + BPRD 2023',
};

export const fallbackOverview: Overview = {
  year: '2025-26',
  nationalTrend: [
    { year: '2014', total: 4730830, ipc: 2851563, sll: 1879267, rate: 374.6 },
    { year: '2015', total: 4647459, ipc: 2810024, sll: 1837435, rate: 363.0 },
    { year: '2016', total: 4831515, ipc: 2975711, sll: 1855804, rate: 372.6 },
    { year: '2017', total: 5059089, ipc: 3091676, sll: 1967413, rate: 385.5 },
    { year: '2018', total: 5015127, ipc: 3132954, sll: 1882173, rate: 377.8 },
    { year: '2019', total: 5156172, ipc: 3225701, sll: 1930471, rate: 383.5 },
    { year: '2020', total: 6601285, ipc: 4254356, sll: 2346929, rate: 487.8 },
    { year: '2021', total: 6096310, ipc: 3663360, sll: 2432950, rate: 445.9 },
    { year: '2022', total: 5824946, ipc: 3561379, sll: 2263567, rate: 422.2 },
    { year: '2023', total: 6241569, ipc: 3763102, sll: 2478467, rate: 448.3 },
  ],
  ipcComposition: [
    { id: 'theft', name: 'Theft', cases: 689580, pct: 18.3 },
    { id: 'hurt', name: 'Causing Hurt', cases: 636767, pct: 16.9 },
    { id: 'cheating', name: 'Forgery, Cheating & Fraud', cases: 181553, pct: 4.8 },
    { id: 'cruelty-women', name: 'Cruelty by Husband/Relatives', cases: 133676, pct: 3.6 },
    { id: 'kidnapping', name: 'Kidnapping & Abduction', cases: 113564, pct: 3.0 },
    { id: 'burglary', name: 'Burglary', cases: 107573, pct: 2.9 },
    { id: 'assault-women', name: 'Assault on Women', cases: 83891, pct: 2.2 },
    { id: 'riots', name: 'Riots', cases: 39260, pct: 1.0 },
    { id: 'rape', name: 'Rape', cases: 29670, pct: 0.8 },
    { id: 'murder', name: 'Murder', cases: 27721, pct: 0.7 },
    { id: 'robbery', name: 'Robbery', cases: 26599, pct: 0.7 },
    { id: 'other-ipc', name: 'Other IPC Crimes', cases: 1693248, pct: 45.1 },
  ],
  stateRates: [
    { id: 'KL', name: 'Kerala', rate: 1631.2, total: 584373 },
    { id: 'DL', name: 'Delhi', rate: 1602.0, total: 344263 },
    { id: 'GJ', name: 'Gujarat', rate: 806.3, total: 578879 },
    { id: 'HR', name: 'Haryana', rate: 739.2, total: 224216 },
    { id: 'TN', name: 'Tamil Nadu', rate: 701.4, total: 539651 },
    { id: 'MN', name: 'Manipur', rate: 627.8, total: 20283 },
    { id: 'MP', name: 'Madhya Pradesh', rate: 570.3, total: 495708 },
    { id: 'TS', name: 'Telangana', rate: 481.6, total: 183644 },
    { id: 'MH', name: 'Maharashtra', rate: 470.4, total: 596103 },
    { id: 'OD', name: 'Odisha', rate: 431.2, total: 199954 },
    { id: 'RJ', name: 'Rajasthan', rate: 390.4, total: 317480 },
    { id: 'CG', name: 'Chhattisgarh', rate: 381.2, total: 115493 },
    { id: 'AP', name: 'Andhra Pradesh', rate: 346.3, total: 184293 },
    { id: 'UP', name: 'Uttar Pradesh', rate: 335.3, total: 793020 },
    { id: 'MZ', name: 'Mizoram', rate: 326.3, total: 4050 },
    { id: 'KA', name: 'Karnataka', rate: 315.8, total: 214234 },
    { id: 'UK', name: 'Uttarakhand', rate: 291.3, total: 34017 },
    { id: 'BR', name: 'Bihar', rate: 277.5, total: 353502 },
    { id: 'HP', name: 'Himachal Pradesh', rate: 267.2, total: 19987 },
    { id: 'PB', name: 'Punjab', rate: 227.1, total: 69944 },
    { id: 'JK', name: 'Jammu & Kashmir', rate: 217.0, total: 29595 },
    { id: 'GA', name: 'Goa', rate: 195.4, total: 3082 },
    { id: 'AR', name: 'Arunachal Pradesh', rate: 187.9, total: 2941 },
    { id: 'WB', name: 'West Bengal', rate: 181.6, total: 180272 },
    { id: 'AS', name: 'Assam', rate: 181.3, total: 64959 },
    { id: 'JH', name: 'Jharkhand', rate: 161.1, total: 63838 },
    { id: 'TR', name: 'Tripura', rate: 120.4, total: 5002 },
    { id: 'ML', name: 'Meghalaya', rate: 105.2, total: 3532 },
    { id: 'SK', name: 'Sikkim', rate: 103.9, total: 718 },
    { id: 'NL', name: 'Nagaland', rate: 84.9, total: 1899 },
  ],
  homicideRate: [
    { year: '1990', value: 5.11 }, { year: '1991', value: 5.5 }, { year: '1992', value: 5.5 },
    { year: '1993', value: 5.2 }, { year: '1994', value: 5.04 }, { year: '1995', value: 4.83 },
    { year: '1996', value: 4.79 }, { year: '1997', value: 4.75 }, { year: '1998', value: 4.84 },
    { year: '1999', value: 4.6 }, { year: '2000', value: 4.55 }, { year: '2001', value: 4.31 },
    { year: '2002', value: 4.17 }, { year: '2003', value: 3.97 }, { year: '2004', value: 4.09 },
    { year: '2005', value: 3.91 }, { year: '2006', value: 3.83 }, { year: '2007', value: 3.81 },
    { year: '2008', value: 3.81 },
  ],
  source: 'NCRB Crime in India 2023 + World Bank',
};

export const fallbackWomenSafety: WomenSafety = {
  year: '2025-26',
  nationalTrend: [
    { year: '2014', total: 337922, rate: 56.3 },
    { year: '2015', total: 327394, rate: 53.9 },
    { year: '2016', total: 338954, rate: 55.2 },
    { year: '2017', total: 359849, rate: 57.9 },
    { year: '2018', total: 378236, rate: 58.8 },
    { year: '2019', total: 405861, rate: 62.4 },
    { year: '2020', total: 371503, rate: 56.5 },
    { year: '2021', total: 428278, rate: 64.5 },
    { year: '2022', total: 445256, rate: 66.4 },
    { year: '2023', total: 448211, rate: 66.2 },
  ],
  crimeTypes: [
    { id: 'cruelty', name: 'Cruelty by Husband/Relatives', cases: 133676, pct: 29.8 },
    { id: 'kidnapping', name: 'Kidnapping & Abduction of Women', cases: 88605, pct: 19.8 },
    { id: 'assault', name: 'Assault to Outrage Modesty', cases: 83891, pct: 18.7 },
    { id: 'pocso', name: 'POCSO (Child Sexual Offences)', cases: 66232, pct: 14.8 },
    { id: 'rape', name: 'Rape', cases: 29670, pct: 6.6 },
    { id: 'dowry-death', name: 'Dowry Deaths', cases: 6156, pct: 1.4 },
    { id: 'other-women', name: 'Other Crimes Against Women', cases: 39981, pct: 8.9 },
  ],
  stateRates: [
    { id: 'DL', name: 'Delhi', rate: 133.6, total: 13439 },
    { id: 'TS', name: 'Telangana', rate: 124.9, total: 23678 },
    { id: 'RJ', name: 'Rajasthan', rate: 114.8, total: 45450 },
    { id: 'OD', name: 'Odisha', rate: 112.4, total: 25914 },
    { id: 'HR', name: 'Haryana', rate: 110.3, total: 15758 },
    { id: 'KL', name: 'Kerala', rate: 86.1, total: 16025 },
    { id: 'AP', name: 'Andhra Pradesh', rate: 84.2, total: 22418 },
    { id: 'MH', name: 'Maharashtra', rate: 77.5, total: 47101 },
    { id: 'MP', name: 'Madhya Pradesh', rate: 76.8, total: 32342 },
    { id: 'WB', name: 'West Bengal', rate: 71.3, total: 34691 },
    { id: 'AS', name: 'Assam', rate: 68.6, total: 12070 },
    { id: 'UK', name: 'Uttarakhand', rate: 66.9, total: 3808 },
    { id: 'KA', name: 'Karnataka', rate: 60.9, total: 20336 },
    { id: 'UP', name: 'Uttar Pradesh', rate: 58.6, total: 66381 },
    { id: 'CG', name: 'Chhattisgarh', rate: 53.2, total: 8035 },
    { id: 'HP', name: 'Himachal Pradesh', rate: 43.5, total: 1604 },
    { id: 'AR', name: 'Arunachal Pradesh', rate: 42.8, total: 326 },
    { id: 'SK', name: 'Sikkim', rate: 41.0, total: 134 },
    { id: 'TR', name: 'Tripura', rate: 38.7, total: 791 },
    { id: 'BR', name: 'Bihar', rate: 37.5, total: 22952 },
    { id: 'ML', name: 'Meghalaya', rate: 37.5, total: 628 },
    { id: 'GA', name: 'Goa', rate: 36.5, total: 286 },
    { id: 'JH', name: 'Jharkhand', rate: 36.1, total: 6989 },
    { id: 'PB', name: 'Punjab', rate: 35.9, total: 5258 },
    { id: 'MZ', name: 'Mizoram', rate: 29.9, total: 184 },
    { id: 'TN', name: 'Tamil Nadu', rate: 23.2, total: 8943 },
    { id: 'GJ', name: 'Gujarat', rate: 22.9, total: 7805 },
    { id: 'MN', name: 'Manipur', rate: 12.5, total: 201 },
    { id: 'NL', name: 'Nagaland', rate: 5.2, total: 56 },
  ],
  source: 'NCRB Crime in India 2023, Chapter 5',
};

export const fallbackCybercrime: Cybercrime = {
  year: '2025-26',
  ncrbTrend: [
    { year: '2017', cases: 21796, rate: 1.7 },
    { year: '2018', cases: 27248, rate: 2.1 },
    { year: '2019', cases: 44735, rate: 3.3 },
    { year: '2020', cases: 50035, rate: 3.7 },
    { year: '2021', cases: 52974, rate: 3.8 },
    { year: '2022', cases: 65893, rate: 4.8 },
    { year: '2023', cases: 86420, rate: 6.2 },
  ],
  crimeTypes: [
    { id: 'fraud', name: 'Fraud', cases: 59526, pct: 68.9 },
    { id: 'sexual', name: 'Sexual Exploitation', cases: 4199, pct: 4.9 },
    { id: 'extortion', name: 'Extortion', cases: 3326, pct: 3.8 },
    { id: 'other-cyber', name: 'Other Motives', cases: 19369, pct: 22.4 },
  ],
  i4cComplaints: 2268000,
  i4cFinancialLossCrore: 2290,
  i4cNote:
    'I4C complaints are citizen-reported via portal. NCRB counts FIR-registered cases. The gap ' +
    '(22.68L complaints vs 86,420 cyber FIRs in 2023) reflects under-registration of cybercrime as FIRs.',
  source: 'NCRB Crime in India 2023 + I4C / cybercrime.gov.in',
};

/* ------------------------------------------------------------------ police */

export const fallbackPolice: Police = {
  year: '2025-26',
  sanctionedStrength: 2722669,
  actualStrength: 2141305,
  vacancyPct: 21.35,
  sanctionedRatePerLakh: 196.88,
  actualRatePerLakh: 154.84,
  unRecommended: 222,
  womenPolicePct: 12.32,
  womenPoliceTotal: 263762,
  stateRatios: [
    { id: 'NL', name: 'Nagaland', sanctioned: 1201.48, actual: 1135.94 },
    { id: 'MN', name: 'Manipur', sanctioned: 1093.8, actual: 941.63 },
    { id: 'SK', name: 'Sikkim', sanctioned: 999.56, actual: 834.4 },
    { id: 'AR', name: 'Arunachal Pradesh', sanctioned: 983.79, actual: 766.75 },
    { id: 'MZ', name: 'Mizoram', sanctioned: 916.63, actual: 595.21 },
    { id: 'TR', name: 'Tripura', sanctioned: 719.04, actual: 555.57 },
    { id: 'GA', name: 'Goa', sanctioned: 687.84, actual: 498.47 },
    { id: 'ML', name: 'Meghalaya', sanctioned: 505.25, actual: 422.92 },
    { id: 'DL', name: 'Delhi', sanctioned: 444.7, actual: 380.2 },
    { id: 'PB', name: 'Punjab', sanctioned: 278.39, actual: 241.02 },
    { id: 'HP', name: 'Himachal Pradesh', sanctioned: 257.71, actual: 240.4 },
    { id: 'CG', name: 'Chhattisgarh', sanctioned: 266.79, actual: 214.74 },
    { id: 'AS', name: 'Assam', sanctioned: 229.86, actual: 205.74 },
    { id: 'HR', name: 'Haryana', sanctioned: 292.15, actual: 199.08 },
    { id: 'UK', name: 'Uttarakhand', sanctioned: 193.45, actual: 183.96 },
    { id: 'AP', name: 'Andhra Pradesh', sanctioned: 200.4, actual: 165.89 },
    { id: 'TS', name: 'Telangana', sanctioned: 226.47, actual: 162.66 },
    { id: 'TN', name: 'Tamil Nadu', sanctioned: 172.56, actual: 159.54 },
    { id: 'JH', name: 'Jharkhand', sanctioned: 211.04, actual: 157.71 },
    { id: 'KA', name: 'Karnataka', sanctioned: 165.04, actual: 150.95 },
    { id: 'KL', name: 'Kerala', sanctioned: 172.73, actual: 150.68 },
    { id: 'MH', name: 'Maharashtra', sanctioned: 184.92, actual: 136.83 },
    { id: 'UP', name: 'Uttar Pradesh', sanctioned: 182.24, actual: 135.39 },
    { id: 'GJ', name: 'Gujarat', sanctioned: 173.5, actual: 123.84 },
    { id: 'MP', name: 'Madhya Pradesh', sanctioned: 145.54, actual: 121.13 },
    { id: 'OD', name: 'Odisha', sanctioned: 150.99, actual: 120.58 },
    { id: 'RJ', name: 'Rajasthan', sanctioned: 140.61, actual: 118.18 },
    { id: 'WB', name: 'West Bengal', sanctioned: 166.93, actual: 101.13 },
    { id: 'BR', name: 'Bihar', sanctioned: 114.57, actual: 81.49 },
  ],
  source: 'BPRD Data on Police Organisations (as on 01.01.2023)',
};

/* ----------------------------------------------------------------- justice */

export const fallbackJustice: Justice = {
  year: '2025-26',
  funnel: {
    totalForInvestigation: 5361518,
    investigated: 3785839,
    chargesheeted: 2753235,
    chargesheetRate: 72.7,
    totalForTrial: 17990929,
    trialCompleted: 1678367,
    convicted: 907028,
    acquitted: 706718,
    convictionRate: 54.0,
    pendingInvestigation: 1565450,
    pendingTrial: 15880050,
    pendencyRate: 88.3,
  },
  trialDuration: { avgYears: 3.5, casesOver5Years: 28.6, casesOver10Years: 10.2, judgesPerMillion: 21.0 },
  source: 'NCRB Crime in India 2023 — Disposal of IPC Cases by Police & Courts (Table 18A.1)',
};

/* -------------------------------------------------------------- indicators */

const crimeRate = [
  ['KL','Kerala',1631.2],['DL','Delhi',1602.0],['GJ','Gujarat',806.3],['HR','Haryana',739.2],
  ['TN','Tamil Nadu',701.4],['MN','Manipur',627.8],['MP','Madhya Pradesh',570.3],['TS','Telangana',481.6],
  ['MH','Maharashtra',470.4],['OD','Odisha',431.2],['RJ','Rajasthan',390.4],['CG','Chhattisgarh',381.2],
  ['AP','Andhra Pradesh',346.3],['UP','Uttar Pradesh',335.3],['MZ','Mizoram',326.3],['KA','Karnataka',315.8],
  ['UK','Uttarakhand',291.3],['BR','Bihar',277.5],['HP','Himachal Pradesh',267.2],['PB','Punjab',227.1],
  ['JK','Jammu & Kashmir',217.0],['GA','Goa',195.4],['AR','Arunachal Pradesh',187.9],['WB','West Bengal',181.6],
  ['AS','Assam',181.3],['JH','Jharkhand',161.1],['TR','Tripura',120.4],['ML','Meghalaya',105.2],
  ['SK','Sikkim',103.9],['NL','Nagaland',84.9],
] as const;

const womenCrimeRate = [
  ['DL','Delhi',133.6],['TS','Telangana',124.9],['RJ','Rajasthan',114.8],['OD','Odisha',112.4],
  ['HR','Haryana',110.3],['KL','Kerala',86.1],['AP','Andhra Pradesh',84.2],['MH','Maharashtra',77.5],
  ['MP','Madhya Pradesh',76.8],['WB','West Bengal',71.3],['AS','Assam',68.6],['UK','Uttarakhand',66.9],
  ['KA','Karnataka',60.9],['UP','Uttar Pradesh',58.6],['CG','Chhattisgarh',53.2],['HP','Himachal Pradesh',43.5],
  ['AR','Arunachal Pradesh',42.8],['SK','Sikkim',41.0],['TR','Tripura',38.7],['BR','Bihar',37.5],
  ['ML','Meghalaya',37.5],['GA','Goa',36.5],['JH','Jharkhand',36.1],['PB','Punjab',35.9],
  ['MZ','Mizoram',29.9],['TN','Tamil Nadu',23.2],['GJ','Gujarat',22.9],['MN','Manipur',12.5],
  ['NL','Nagaland',5.2],
] as const;

const roadFatalityRate = [
  ['TN','Tamil Nadu',23.8],['CG','Chhattisgarh',20.4],['TS','Telangana',20.1],['GA','Goa',18.4],
  ['KA','Karnataka',18.2],['HR','Haryana',16.4],['MP','Madhya Pradesh',15.9],['PB','Punjab',15.7],
  ['AP','Andhra Pradesh',15.3],['RJ','Rajasthan',14.5],['OD','Odisha',12.4],['MH','Maharashtra',12.1],
  ['HP','Himachal Pradesh',11.9],['KL','Kerala',11.4],['GJ','Gujarat',10.9],['JH','Jharkhand',10.5],
  ['UP','Uttar Pradesh',10.0],['AR','Arunachal Pradesh',9.2],['AS','Assam',9.2],['UK','Uttarakhand',9.0],
  ['SK','Sikkim',8.3],['MZ','Mizoram',7.7],['BR','Bihar',7.0],['DL','Delhi',6.8],
  ['TR','Tripura',6.3],['WB','West Bengal',6.1],['ML','Meghalaya',5.0],['NL','Nagaland',3.8],
  ['MN','Manipur',2.3],
] as const;

const toStates = (rows: readonly (readonly [string, string, number])[]) =>
  rows.map(([id, name, value]) => ({ id, name, value }));

export const fallbackIndicators: Indicators = {
  year: '2025-26',
  indicators: [
    { id: 'crime_rate', name: 'Crime rate (per lakh population)', category: 'overall', unit: 'per lakh', states: toStates(crimeRate), source: 'NCRB Crime in India 2023' },
    { id: 'women_crime_rate', name: 'Crimes against women (per lakh women)', category: 'women-safety', unit: 'per lakh', states: toStates(womenCrimeRate), source: 'NCRB Crime in India 2023' },
    { id: 'road_fatality_rate', name: 'Road accident fatality rate (per lakh)', category: 'road-safety', unit: 'per lakh', states: toStates(roadFatalityRate), source: 'MoRTH Road Accidents in India 2023' },
  ],
};
