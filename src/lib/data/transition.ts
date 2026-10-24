/**
 * IPC → BNS transition data.
 *
 * The Bharatiya Nyaya Sanhita (BNS) replaced the Indian Penal Code (IPC) on
 * 1 July 2024. NCRB collected IPC and BNS registrations separately for 2024, and
 * several heads were merged, removed or newly created — so a like-for-like
 * comparison is genuinely difficult. These figures pair the heads that are
 * closest to comparable, and the caveats are stated on the page.
 *
 * Sources: NCRB Crime in India 2023 (IPC-era) and NCRB Crime in India 2024
 * (BNS-era), as published in the report snapshots and re-published summaries.
 */

export interface HeadComparison {
  head: string;
  /** Cases in 2023, under the IPC. */
  ipc2023: number;
  /** Cases in 2024, under the BNS/combined head. */
  bns2024: number;
  /** true when the two years are not strictly like-for-like. */
  reclassified?: boolean;
  note?: string;
}

export const headComparisons: HeadComparison[] = [
  { head: 'Theft', ipc2023: 689580, bns2024: 621945 },
  {
    head: 'Hurt',
    ipc2023: 636767,
    bns2024: 441996,
    reclassified: true,
    note: 'BNS merged the hurt sections and made simple hurt non-cognizable — the fall is largely definitional.',
  },
  { head: 'Forgery, Cheating & Fraud', ipc2023: 181553, bns2024: 192382 },
  { head: 'Cruelty by Husband/Relatives', ipc2023: 133676, bns2024: 120227 },
  { head: 'Kidnapping & Abduction', ipc2023: 113564, bns2024: 96079 },
  { head: 'Burglary', ipc2023: 107573, bns2024: 107532 },
  {
    head: 'Assault on Women',
    ipc2023: 83891,
    bns2024: 48303,
    reclassified: true,
    note: 'Grouping changed between the IPC and BNS heads — treat with care.',
  },
  { head: 'Rioting', ipc2023: 39260, bns2024: 30348 },
  { head: 'Rape', ipc2023: 29670, bns2024: 29536 },
  { head: 'Murder', ipc2023: 27721, bns2024: 27049 },
  { head: 'Robbery', ipc2023: 26599, bns2024: 23145 },
];

export const totals = {
  ipc2023: {
    label: '2023 · IPC era',
    ipc: 3763102,
    sll: 2478467,
    all: 6241569,
    rate: 448.3,
  },
  bns2024: {
    label: '2024 · BNS era',
    ipc: 3544608,
    sll: 2341259,
    all: 5885867,
    rate: 418.9,
  },
};

/** Heads that exist only in the BNS-era data. */
export const newBnsHeads = [
  { head: 'Organised Crime', cases: 840 },
  { head: 'Petty Organised Crime', cases: 876 },
  { head: 'Terrorist Act', cases: 24 },
];

export const transitionCaveats = [
  'BNS replaced the IPC on 1 July 2024, so 2024 mixes two legal regimes within a single calendar year.',
  'Several IPC heads were merged, split, removed or newly created. Names that look the same may cover different conduct.',
  'The fall in "Hurt" is largely definitional: simple hurt became a non-cognizable offence, so far fewer such cases are registered.',
  'New heads (organised crime, petty organised crime) have no IPC equivalent, so they cannot be compared with 2023 at all.',
  'A change between the two years is therefore a mix of real change and reclassification — it is not a clean measure of more or less crime.',
];
