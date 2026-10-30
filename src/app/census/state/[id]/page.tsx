/**
 * Route wrapper for /census/state/[id].
 *
 * Static export needs the full list of paths up front, so the 36 profiles are
 * generated at build time. The page header is rendered here (server) and the
 * interactive body is a client island.
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { censusMeta, censusStates } from '@/lib/data/census';
import { StateProfile } from './StateProfile';

export function generateStaticParams() {
  return censusStates.map((s) => ({ id: s.id }));
}

export default async function StatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = censusStates.find((s) => s.id === id);

  return (
    <>
      <PageHeader
        title={state ? state.name : 'Unknown state'}
        description={
          state
            ? `Census 2011 profile — population, growth, density, sex ratio, literacy and urbanisation, each with its rank among the 36 states and union territories, and the regional average for context.`
            : 'That state code is not in the dataset.'
        }
        source={censusMeta.source}
      />
      <StateProfile id={id} />
    </>
  );
}
