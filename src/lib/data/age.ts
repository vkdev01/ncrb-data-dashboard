/**
 * Census of India 2011 — age structure.
 *
 * Five-year age groups with males, females and totals, plus the "age not
 * stated" row the census publishes. Used for the population pyramid and the
 * dependency ratios.
 *
 * National only. The census publishes state-level age tables, but they are not
 * bundled here, so nothing on the age page is disaggregated by state — and the
 * page says so.
 */

export interface AgeGroup {
  /** Label as published, e.g. "0–4", "100+" or "Unknown". */
  g: string;
  male: number;
  female: number;
  total: number;
}

export const ageGroups: AgeGroup[] = [
  { g: "0\u20134", male: 58632074, female: 54174704, total: 112806778 },
  { g: "5\u20139", male: 66300466, female: 60627660, total: 126928126 },
  { g: "10\u201314", male: 69418835, female: 63290377, total: 132709212 },
  { g: "15\u201319", male: 63982396, female: 56544053, total: 120526449 },
  { g: "20\u201324", male: 57584693, female: 53839529, total: 111424222 },
  { g: "25\u201329", male: 51344208, female: 50069757, total: 101413965 },
  { g: "30\u201334", male: 44660674, female: 43934277, total: 88594951 },
  { g: "35\u201339", male: 42919381, female: 42221303, total: 85140684 },
  { g: "40\u201344", male: 37545386, female: 34892726, total: 72438112 },
  { g: "45\u201349", male: 32138114, female: 30180213, total: 62318327 },
  { g: "50\u201354", male: 25843266, female: 23225988, total: 49069254 },
  { g: "55\u201359", male: 19456012, female: 19690043, total: 39146055 },
  { g: "60\u201364", male: 18701749, female: 18961958, total: 37663707 },
  { g: "65\u201369", male: 12944326, female: 13510657, total: 26454983 },
  { g: "70\u201374", male: 9651499, female: 9557343, total: 19208842 },
  { g: "75\u201379", male: 4490603, female: 4741900, total: 9232503 },
  { g: "80\u201384", male: 2927040, female: 3293189, total: 6220229 },
  { g: "85\u201389", male: 1120106, female: 1263061, total: 2383167 },
  { g: "90\u201394", male: 652465, female: 794069, total: 1446534 },
  { g: "95\u201399", male: 294759, female: 338538, total: 633297 },
  { g: "100+", male: 289325, female: 316453, total: 605778 },
  { g: "Unknown", male: 2372881, female: 2116921, total: 4489802 },
];

/** Total enumerated population across the groups. */
export const ageTotal = 1210854977;

/** Percent of population aged 0–14, 15–64 and 65+. */
export const ageShares = { young: 30.76, working: 63.4, old: 5.47 };

/** Total dependency ratio: (0–14 + 65+) / 15–64, in percent. */
export const dependencyRatio = 57.1;

/** Child dependency ratio: 0–14 / 15–64. */
export const childDependency = 48.5;

/** Old-age dependency ratio: 65+ / 15–64. */
export const oldAgeDependency = 8.6;
