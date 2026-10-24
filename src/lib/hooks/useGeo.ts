'use client';

import { useEffect, useState } from 'react';
import { loadGeo, type GeoCollection } from '@/lib/geo';

/** Loads the bundled India district boundaries once. */
export function useGeo() {
  const [geo, setGeo] = useState<GeoCollection | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGeo()
      .then((g) => alive && setGeo(g))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return { geo, error };
}
