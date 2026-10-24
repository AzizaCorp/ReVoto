import { useState } from 'react';
import { stateExtremes } from '@/application';
import { latestOfType, type ElectionType, type ElectionYear } from '@/domain';
import { SegmentedControl, StatCard, Text } from '@/presentation/components';
import { count, percent, PENDING } from '@/presentation/format';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import { CountryMap } from './shared/maps';
import { StoryFrame } from './shared/StoryFrame';

const TYPES = [
  { value: 'presidential', text: 'Presidencial' },
  { value: 'midterm', text: 'Intermedia' },
] as const;

/** W-03 · Mexico voted (RF-06). National turnout of the latest election of each type. */
export function W03MexicoVoted() {
  const story = useStoryData();
  const [type, setType] = useState<ElectionType>('presidential');
  const e = story ? latestOfType(story.national.elections, type) : null;
  const year = e?.election.year ?? '[año]';
  return (
    <StoryFrame
      pending={!e}
      label="México"
      after={
        <StatCard
          icon="chart"
          label={`Participación nacional · ${year}`}
          value={e ? percent(e.total.value) : `${PENDING} %`}
          pending={!e}
          hero
        >
          {e && <Text variant="meta">Lista nominal: {count(e.registeredVoters)} personas</Text>}
        </StatCard>
      }
      visual={
        <CountryMap
          year={e?.election.year ?? (type === 'presidential' ? 2024 : 2021)}
          typeName={type === 'presidential' ? 'presidencial' : 'intermedia'}
          highlight={
            story && story.territory.level !== 'national' ? story.territory.stateCode : null
          }
        />
      }
    >
      <Text variant="h1">Así vota México</Text>
      <Text variant="lead">
        Cada entidad, coloreada según su participación en la elección federal {year}. Toca una para
        ver sus municipios.
      </Text>
      {e && <Extremes year={e.election.year} />}
      <SegmentedControl
        label="Tipo de elección"
        options={TYPES}
        value={type}
        onChange={(v) => setType(v as ElectionType)}
      />
      <DataStatus />
    </StoryFrame>
  );
}

/** One sentence with the highest and lowest state, so the main contrast is read, not inferred. */
function Extremes({ year }: { year: ElectionYear }) {
  const { geography } = useDependencies();
  const data = useAsync(() => geography.statesTurnout(), [geography]);
  const r = data.status === 'ready' ? stateExtremes(data.data, year) : null;
  if (!r) return null;
  return (
    <Text variant="body">
      En {year}, <strong>{r.highest.name}</strong> tuvo la participación más alta (
      {percent(r.highest.turnout)}) y <strong>{r.lowest.name}</strong> la más baja (
      {percent(r.lowest.turnout)}).
    </Text>
  );
}
