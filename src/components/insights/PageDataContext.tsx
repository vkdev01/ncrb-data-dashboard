'use client';

/**
 * Page data publishing.
 *
 * Some pages fetch their numbers in the browser (climate, air, economy), so the
 * insights panel cannot read them from a static registry — the values only exist
 * in page state after a fetch resolves. This is the bridge: a page publishes
 * whatever it is currently showing, and the panel reads it.
 *
 * Precedence in the panel is: published page data → static route registry →
 * generic fallback. That order matters, because the published data is the only
 * one guaranteed to match what the reader is looking at right now.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PageContext } from '@/lib/insights/engine';

interface Store {
  page: PageContext | null;
  setPage: (page: PageContext | null) => void;
}

const StoreContext = createContext<Store>({ page: null, setPage: () => {} });

export function PageDataProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageContext | null>(null);
  const value = useMemo(() => ({ page, setPage }), [page]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** The page context published by the route currently rendered, if any. */
export function usePublishedPage(): PageContext | null {
  return useContext(StoreContext).page;
}

/**
 * Publish the data a page is showing. Pass a memoised context (or null while
 * loading); the value is cleared when the page unmounts so a stale context can
 * never leak into the next route.
 */
export function usePublishPageData(page: PageContext | null) {
  const { setPage } = useContext(StoreContext);
  useEffect(() => {
    setPage(page);
    return () => setPage(null);
  }, [page, setPage]);
}
