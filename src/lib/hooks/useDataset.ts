'use client';

/**
 * useDataset — subscribe a component to a dataset.
 *
 * Renders the bundled snapshot immediately (so there is never a blank state),
 * then upgrades to the live payload once it arrives. The initial state is the
 * snapshot on both server and client, so there is no hydration mismatch.
 */
import { useEffect, useState } from 'react';
import { getDataset } from '@/lib/data/client';
import { SOURCES } from '@/lib/data/sources';
import type { DatasetId, DatasetMap } from '@/lib/data/types';

export interface UseDataset<K extends DatasetId> {
  data: DatasetMap[K];
  /** true once we know the payload is live; false while loading or on fallback. */
  live: boolean;
  status: 'loading' | 'ready';
}

export function useDataset<K extends DatasetId>(id: K): UseDataset<K> {
  const [data, setData] = useState<DatasetMap[K]>(SOURCES[id].fallback);
  const [live, setLive] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    let active = true;
    getDataset(id)
      .then((r) => {
        if (!active) return;
        setData(r.data);
        setLive(r.live);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, [id]);

  return { data, live, status };
}
