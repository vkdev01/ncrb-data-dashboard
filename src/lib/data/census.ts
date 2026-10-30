/**
 * Census of India 2011 — state and union-territory level.
 *
 * Every figure here is from the Census of India 2011 as tabulated in the public
 * tables (primary census abstract + the state-level summary tables), reconciled
 * onto *current* state boundaries:
 *
 *  - Telangana is shown separately (it was carved out of Andhra Pradesh in 2014;
 *    the 2011 figures here are the re-tabulated ones).
 *  - Ladakh is shown separately from Jammu and Kashmir (a union territory since 2019).
 *  - Dadra and Nagar Haveli and Daman and Diu are merged (merged in 2020).
 *
 * Where a value was never tabulated for a unit that did not exist at census time
 * it is `null`, and the UI says "not tabulated" rather than showing a made-up number.
 * Affected: child sex ratio for Telangana, DNH & Daman and Diu and Ladakh; literacy
 * for the same three.
 *
 * Census 2011 remains the latest completed census. The next census has a reference
 * date of 1 March 2027, so no provisional totals exist yet.
 */

export type Region = 'North' | 'Central' | 'West' | 'East' | 'North East' | 'South';

export interface CensusState {
  /** Short id, e.g. "UP". */
  id: string;
  name: string;
  region: Region;
  /** 2011 census population. */
  pop2011: number;
  /** Decadal growth 2001 → 2011, in percent. */
  growth: number;
  /** Area in km². */
  area: number;
  /** Persons per km², 2011. */
  density: number;
  /** Females per 1,000 males, 2011. */
  sexRatio: number | null;
  /** Girls per 1,000 boys aged 0–6, 2011. */
  childSexRatio: number | null;
  sexRatio2001: number | null;
  childSexRatio2001: number | null;
  /** Literacy rate %, 7+ population, 2011. */
  literacy: number | null;
  literacyMale: number | null;
  literacyFemale: number | null;
  /** Share of population living in urban areas, %. */
  urbanPct: number | null;
  males: number | null;
  females: number | null;
}

export interface IndiaTotals {
  pop2011: number;
  growth: number;
  area: number;
  density: number;
  sexRatio: number;
  childSexRatio: number;
  sexRatio2001: number;
  childSexRatio2001: number;
  literacy: number;
  literacyMale: number;
  literacyFemale: number;
  urbanPct: number;
  males: number;
  females: number;
  ruralPct: number;
}

/** National totals, as published for Census 2011. */
export const india: IndiaTotals = {
  pop2011: 1210854977,
  growth: 17.7,
  area: 3287263,
  density: 382,
  sexRatio: 943,
  childSexRatio: 919,
  sexRatio2001: 933,
  childSexRatio2001: 927,
  literacy: 74.04,
  literacyMale: 82.14,
  literacyFemale: 65.46,
  urbanPct: 31.16,
  ruralPct: 68.84,
  males: 623270258,
  females: 587584473,
};

export const censusMeta = {
  year: '2011',
  label: 'Census of India 2011',
  source: 'Census of India 2011 — Primary Census Abstract & state summary tables',
  nextCensus: '1 March 2027',
  note:
    'State boundaries are current (post-2019). Census 2011 is the most recent completed census; ' +
    'the 2027 census has not yet reported, so every figure here is a 2011 snapshot.',
};

export const censusStates: CensusState[] = [
  { id: 'UP', name: "Uttar Pradesh", region: 'Central', pop2011: 199812341, growth: 20.2, area: 240928, density: 828, sexRatio: 912, childSexRatio: 902, sexRatio2001: 898, childSexRatio2001: 916, literacy: 67.68, literacyMale: 77.28, literacyFemale: 57.18, urbanPct: 22.27, males: 104480510, females: 95331831 },
  { id: 'MH', name: "Maharashtra", region: 'West', pop2011: 112374333, growth: 16, area: 307713, density: 365, sexRatio: 929, childSexRatio: 894, sexRatio2001: 922, childSexRatio2001: 913, literacy: 82.34, literacyMale: 88.38, literacyFemale: 75.87, urbanPct: 45.22, males: 58243056, females: 54131277 },
  { id: 'BR', name: "Bihar", region: 'East', pop2011: 104099452, growth: 25.4, area: 94163, density: 1102, sexRatio: 918, childSexRatio: 935, sexRatio2001: 919, childSexRatio2001: 942, literacy: 61.8, literacyMale: 71.2, literacyFemale: 51.5, urbanPct: 11.29, males: 54278157, females: 49821295 },
  { id: 'WB', name: "West Bengal", region: 'East', pop2011: 91276115, growth: 13.8, area: 88752, density: 1029, sexRatio: 953, childSexRatio: 956, sexRatio2001: 934, childSexRatio2001: 960, literacy: 76.36, literacyMale: 81.69, literacyFemale: 70.54, urbanPct: 31.87, males: 46809027, females: 44467088 },
  { id: 'MP', name: "Madhya Pradesh", region: 'Central', pop2011: 72626809, growth: 20.3, area: 308252, density: 236, sexRatio: 931, childSexRatio: 918, sexRatio2001: 919, childSexRatio2001: 932, literacy: 69.32, literacyMale: 78.73, literacyFemale: 59.24, urbanPct: 27.63, males: 37612306, females: 35014503 },
  { id: 'TN', name: "Tamil Nadu", region: 'South', pop2011: 72147030, growth: 15.6, area: 130060, density: 555, sexRatio: 996, childSexRatio: 943, sexRatio2001: 987, childSexRatio2001: 942, literacy: 80.09, literacyMale: 86.77, literacyFemale: 73.44, urbanPct: 48.4, males: 36137975, females: 36009055 },
  { id: 'RJ', name: "Rajasthan", region: 'West', pop2011: 68548437, growth: 21.3, area: 342239, density: 201, sexRatio: 928, childSexRatio: 888, sexRatio2001: 921, childSexRatio2001: 909, literacy: 66.11, literacyMale: 79.19, literacyFemale: 52.12, urbanPct: 24.87, males: 35550997, females: 32997440 },
  { id: 'KA', name: "Karnataka", region: 'South', pop2011: 61095297, growth: 15.6, area: 191791, density: 319, sexRatio: 973, childSexRatio: 948, sexRatio2001: 965, childSexRatio2001: 946, literacy: 75.36, literacyMale: 82.47, literacyFemale: 68.08, urbanPct: 38.67, males: 30966657, females: 30128640 },
  { id: 'GJ', name: "Gujarat", region: 'West', pop2011: 60439692, growth: 19.3, area: 196244, density: 308, sexRatio: 919, childSexRatio: 890, sexRatio2001: 920, childSexRatio2001: 883, literacy: 78.03, literacyMale: 85.75, literacyFemale: 69.68, urbanPct: 42.6, males: 31491260, females: 28948432 },
  { id: 'AP', name: "Andhra Pradesh", region: 'South', pop2011: 49577103, growth: 11, area: 162970, density: 303, sexRatio: 993, childSexRatio: 939, sexRatio2001: 978, childSexRatio2001: 961, literacy: 67.02, literacyMale: 74.88, literacyFemale: 59.15, urbanPct: 29.47, males: 42442146, females: 42138631 },
  { id: 'OD', name: "Odisha", region: 'East', pop2011: 41974219, growth: 14, area: 155707, density: 269, sexRatio: 978, childSexRatio: 941, sexRatio2001: 972, childSexRatio2001: 953, literacy: 72.87, literacyMale: 81.59, literacyFemale: 64.01, urbanPct: 16.69, males: 21212136, females: 20762082 },
  { id: 'TS', name: "Telangana", region: 'South', pop2011: 35003674, growth: 13.6, area: 112077, density: 312, sexRatio: 988, childSexRatio: null, sexRatio2001: null, childSexRatio2001: null, literacy: null, literacyMale: null, literacyFemale: null, urbanPct: 38.88, males: null, females: null },
  { id: 'KL', name: "Kerala", region: 'South', pop2011: 33406061, growth: 4.9, area: 38852, density: 859, sexRatio: 1084, childSexRatio: 964, sexRatio2001: 1058, childSexRatio2001: 960, literacy: 94, literacyMale: 96.11, literacyFemale: 91.07, urbanPct: 47.7, males: 16027412, females: 17378649 },
  { id: 'JH', name: "Jharkhand", region: 'East', pop2011: 32988134, growth: 22.4, area: 79716, density: 414, sexRatio: 948, childSexRatio: 948, sexRatio2001: 941, childSexRatio2001: 965, literacy: 66.41, literacyMale: 76.84, literacyFemale: 55.42, urbanPct: 24.05, males: 16930315, females: 16057819 },
  { id: 'AS', name: "Assam", region: 'North East', pop2011: 31205576, growth: 17.1, area: 78438, density: 398, sexRatio: 958, childSexRatio: 962, sexRatio2001: 935, childSexRatio2001: 965, literacy: 72.19, literacyMale: 77.85, literacyFemale: 66.27, urbanPct: 14.1, males: 15939443, females: 15266133 },
  { id: 'PB', name: "Punjab", region: 'North', pop2011: 27743338, growth: 13.9, area: 50362, density: 551, sexRatio: 895, childSexRatio: 846, sexRatio2001: 876, childSexRatio2001: 798, literacy: 75.84, literacyMale: 80.44, literacyFemale: 70.73, urbanPct: 37.48, males: 14639465, females: 13103873 },
  { id: 'CT', name: "Chhattisgarh", region: 'Central', pop2011: 25545198, growth: 22.6, area: 135192, density: 189, sexRatio: 991, childSexRatio: 969, sexRatio2001: 989, childSexRatio2001: 975, literacy: 70.28, literacyMale: 80.27, literacyFemale: 60.24, urbanPct: 23.24, males: 12832895, females: 12712303 },
  { id: 'HR', name: "Haryana", region: 'North', pop2011: 25351462, growth: 19.9, area: 44212, density: 573, sexRatio: 879, childSexRatio: 834, sexRatio2001: 861, childSexRatio2001: 819, literacy: 75.55, literacyMale: 84.06, literacyFemale: 65.94, urbanPct: 34.88, males: 13494734, females: 11856728 },
  { id: 'DL', name: "Delhi", region: 'North', pop2011: 16787941, growth: 21.2, area: 1483, density: 11297, sexRatio: 868, childSexRatio: 871, sexRatio2001: 821, childSexRatio2001: 868, literacy: 86.21, literacyMale: 90.94, literacyFemale: 80.76, urbanPct: 97.5, males: 8887326, females: 7800615 },
  { id: 'JK', name: "Jammu and Kashmir", region: 'North', pop2011: 12267032, growth: 23.6, area: 55538, density: 297, sexRatio: 890, childSexRatio: 862, sexRatio2001: 892, childSexRatio2001: 941, literacy: 67.16, literacyMale: 76.75, literacyFemale: 56.43, urbanPct: 26.11, males: 6640662, females: 5900640 },
  { id: 'UK', name: "Uttarakhand", region: 'North', pop2011: 10086292, growth: 18.8, area: 53483, density: 189, sexRatio: 963, childSexRatio: 890, sexRatio2001: 962, childSexRatio2001: 908, literacy: 78.82, literacyMale: 87.4, literacyFemale: 70.01, urbanPct: 30.23, males: 5137773, females: 4948519 },
  { id: 'HP', name: "Himachal Pradesh", region: 'North', pop2011: 6864602, growth: 12.9, area: 55673, density: 123, sexRatio: 972, childSexRatio: 909, sexRatio2001: 968, childSexRatio2001: 896, literacy: 82.8, literacyMale: 89.53, literacyFemale: 75.93, urbanPct: 10.03, males: 3481873, females: 3382729 },
  { id: 'TR', name: "Tripura", region: 'North East', pop2011: 3673917, growth: 14.8, area: 10486, density: 350, sexRatio: 960, childSexRatio: 957, sexRatio2001: 948, childSexRatio2001: 966, literacy: 87.22, literacyMale: 92.53, literacyFemale: 82.73, urbanPct: 26.17, males: 1874376, females: 1799541 },
  { id: 'ML', name: "Meghalaya", region: 'North East', pop2011: 2966889, growth: 27.9, area: 22429, density: 132, sexRatio: 989, childSexRatio: 970, sexRatio2001: 972, childSexRatio2001: 973, literacy: 74.43, literacyMale: 75.95, literacyFemale: 72.89, urbanPct: 20.07, males: 1491832, females: 1475057 },
  { id: 'MN', name: "Manipur", region: 'North East', pop2011: 2570390, growth: 24.5, area: 22327, density: 122, sexRatio: 992, childSexRatio: 930, sexRatio2001: 978, childSexRatio2001: 957, literacy: 76.94, literacyMale: 83.58, literacyFemale: 70.26, urbanPct: 30.21, males: 1290171, females: 1280219 },
  { id: 'NL', name: "Nagaland", region: 'North East', pop2011: 1978502, growth: -0.6, area: 16579, density: 119, sexRatio: 931, childSexRatio: 943, sexRatio2001: 900, childSexRatio2001: 964, literacy: 79.55, literacyMale: 82.75, literacyFemale: 76.11, urbanPct: 28.86, males: 1024649, females: 953853 },
  { id: 'GA', name: "Goa", region: 'West', pop2011: 1458545, growth: 8.2, area: 3702, density: 394, sexRatio: 973, childSexRatio: 942, sexRatio2001: 961, childSexRatio2001: 938, literacy: 88.7, literacyMale: 92.65, literacyFemale: 84.66, urbanPct: 62.17, males: 739140, females: 719405 },
  { id: 'AR', name: "Arunachal Pradesh", region: 'North East', pop2011: 1383727, growth: 26, area: 83743, density: 17, sexRatio: 938, childSexRatio: 972, sexRatio2001: 893, childSexRatio2001: 964, literacy: 65.38, literacyMale: 72.55, literacyFemale: 57.7, urbanPct: 22.94, males: 713912, females: 669815 },
  { id: 'PY', name: "Puducherry", region: 'South', pop2011: 1247953, growth: 28.1, area: 490, density: 2598, sexRatio: 1037, childSexRatio: 967, sexRatio2001: 1001, childSexRatio2001: 967, literacy: 85.85, literacyMale: 91.26, literacyFemale: 80.67, urbanPct: 68.33, males: 612511, females: 635442 },
  { id: 'MZ', name: "Mizoram", region: 'North East', pop2011: 1097206, growth: 23.5, area: 21081, density: 52, sexRatio: 976, childSexRatio: 970, sexRatio2001: 935, childSexRatio2001: 964, literacy: 91.33, literacyMale: 93.35, literacyFemale: 89.27, urbanPct: 52.11, males: 555339, females: 541867 },
  { id: 'CH', name: "Chandigarh", region: 'North', pop2011: 1055450, growth: 17.2, area: 114, density: 9252, sexRatio: 818, childSexRatio: 880, sexRatio2001: 777, childSexRatio2001: 845, literacy: 86.05, literacyMale: 89.99, literacyFemale: 81.19, urbanPct: 97.25, males: 580663, females: 474787 },
  { id: 'SK', name: "Sikkim", region: 'North East', pop2011: 610577, growth: 12.9, area: 7096, density: 86, sexRatio: 890, childSexRatio: 957, sexRatio2001: 875, childSexRatio2001: 963, literacy: 81.42, literacyMale: 86.55, literacyFemale: 75.61, urbanPct: 25.15, males: 323070, females: 287507 },
  { id: 'DH', name: "Dadra and Nagar Haveli and Daman and Diu", region: 'West', pop2011: 585764, growth: 55.1, area: 603, density: 970, sexRatio: 711, childSexRatio: null, sexRatio2001: null, childSexRatio2001: null, literacy: null, literacyMale: null, literacyFemale: null, urbanPct: 58.43, males: null, females: null },
  { id: 'AN', name: "Andaman and Nicobar Islands", region: 'South', pop2011: 380581, growth: 6.9, area: 8249, density: 46, sexRatio: 876, childSexRatio: 968, sexRatio2001: 846, childSexRatio2001: 957, literacy: 86.63, literacyMale: 90.27, literacyFemale: 82.43, urbanPct: 37.7, males: 202871, females: 177710 },
  { id: 'LA', name: "Ladakh", region: 'North', pop2011: 274000, growth: 17.8, area: 166698, density: 2.8, sexRatio: 853, childSexRatio: null, sexRatio2001: null, childSexRatio2001: null, literacy: null, literacyMale: null, literacyFemale: null, urbanPct: 84, males: null, females: null },
  { id: 'LD', name: "Lakshadweep", region: 'South', pop2011: 64473, growth: 6.3, area: 32, density: 2013, sexRatio: 946, childSexRatio: 911, sexRatio2001: 948, childSexRatio2001: 959, literacy: 91.85, literacyMale: 95.56, literacyFemale: 87.95, urbanPct: 78.07, males: 33123, females: 31350 },];

/** Lookup by state name. */
export const censusByName = new Map(censusStates.map((s) => [s.name, s]));
