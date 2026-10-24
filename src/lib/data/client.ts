/**
 * Data client — the single place that talks to the network.
 *
 * Strategy: try the live source, fall back to the bundled snapshot, and cache
 * the result so multiple components share one request. Pages never crash on a
 * network failure; they just render the snapshot and mark themselves as such.
 */
import { SOURCES } from './sources';
import type { DatasetId, DatasetMap } from './types';

export interface DatasetResult<K extends DatasetId> {
  data: DatasetMap[K];
  /** true when the payload came from the live source, false when from the snapshot. */
  live: boolean;
}

const cache = new Map<DatasetId, DatasetResult<DatasetId>>();

export async function getDataset<K extends DatasetId>(id: K): Promise<DatasetResult<K>> {
  const hit = cache.get(id);
  if (hit) return hit as DatasetResult<K>;

  const src = SOURCES[id];
  let result: DatasetResult<K>;

  try {
    const res = await fetch(src.liveUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as DatasetMap[K];
    result = { data, live: true };
  } catch {
    result = { data: src.fallback, live: false };
  }

  cache.set(id, result as DatasetResult<DatasetId>);
  return result;
}

/** Test seam — lets tests/preview harnesses inject fixtures. */
export function __clearCache() {
  cache.clear();
}
