/**
 * Source registry.
 *
 * Each dataset declares where its *live* copy lives and what to fall back to
 * when the network is unavailable. Adding a new dataset means adding one entry
 * here — every page, hook and chart then works with it for free.
 *
 * Live source: indiandataproject.org publishes NCRB-derived crime data as
 * static JSON with `Access-Control-Allow-Origin: *` and no API key, which is
 * what makes a fully static (server-less) dashboard possible.
 */
import {
  fallbackCybercrime,
  fallbackIndicators,
  fallbackJustice,
  fallbackOverview,
  fallbackPolice,
  fallbackSummary,
  fallbackWomenSafety,
} from './fallback';
import type { DatasetId, DatasetMap } from './types';

export const LIVE_BASE = 'https://indiandataproject.org/data/crime/2025-26';

export interface SourceDef<K extends DatasetId = DatasetId> {
  id: K;
  /** Human label shown in the UI. */
  label: string;
  /** Endpoint for the live copy. */
  liveUrl: string;
  /** Bundled snapshot used when the live fetch fails. */
  fallback: DatasetMap[K];
  /** Upstream attribution. */
  origin: string;
}

export const SOURCES: { [K in DatasetId]: SourceDef<K> } = {
  summary: {
    id: 'summary',
    label: 'National summary',
    liveUrl: `${LIVE_BASE}/summary.json`,
    fallback: fallbackSummary,
    origin: 'NCRB Crime in India 2023 + MoRTH + BPRD',
  },
  overview: {
    id: 'overview',
    label: 'Crime overview',
    liveUrl: `${LIVE_BASE}/overview.json`,
    fallback: fallbackOverview,
    origin: 'NCRB Crime in India 2023 + World Bank',
  },
  womenSafety: {
    id: 'womenSafety',
    label: 'Crimes against women',
    liveUrl: `${LIVE_BASE}/women-safety.json`,
    fallback: fallbackWomenSafety,
    origin: 'NCRB Crime in India 2023, Chapter 5',
  },
  cybercrime: {
    id: 'cybercrime',
    label: 'Cybercrime',
    liveUrl: `${LIVE_BASE}/cybercrime.json`,
    fallback: fallbackCybercrime,
    origin: 'NCRB Crime in India 2023 + I4C',
  },
  police: {
    id: 'police',
    label: 'Police strength',
    liveUrl: `${LIVE_BASE}/police.json`,
    fallback: fallbackPolice,
    origin: 'BPRD Data on Police Organisations',
  },
  justice: {
    id: 'justice',
    label: 'Justice pipeline',
    liveUrl: `${LIVE_BASE}/justice.json`,
    fallback: fallbackJustice,
    origin: 'NCRB Crime in India 2023 — disposal of IPC cases',
  },
  indicators: {
    id: 'indicators',
    label: 'State indicators',
    liveUrl: `${LIVE_BASE}/indicators.json`,
    fallback: fallbackIndicators,
    origin: 'NCRB + MoRTH + BPRD, via Indian Data Project',
  },
};

export const DATASET_IDS = Object.keys(SOURCES) as DatasetId[];
