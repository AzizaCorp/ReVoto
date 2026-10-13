import { useState } from 'react';
import { latestOfType, type ElectionType } from '@/domain';
import { SegmentedControl, StatCard, Text } from '@/presentation/components';
import { count, percent, PENDING } from '@/presentation/format';
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
      visual={
        <CountryMap
          year={e?.election.year ?? (type === 'presidential' ? 2024 : 2021)}
          typeName={type === 'presidential' ? 'presidencial' : 'intermedia'}
          highlight={story?.profile?.inegiCode ?? null}
        />
      }
    >
      <Text variant="h1">Así vota México</Text>
      <Text variant="lead">
        Cada municipio, coloreado según su participación en la elección federal {year}.
      </Text>
      <SegmentedControl
        label="Tipo de elección"
        options={TYPES}
        value={type}
        onChange={(v) => setType(v as ElectionType)}
      />
      <DataStatus />
      <StatCard
        icon="chart"
        label={`Participación nacional · ${year}`}
        value={e ? percent(e.total.value) : `${PENDING} %`}
        pending={!e}
        hero
      >
        {e && <Text variant="meta">Lista nominal: {count(e.registeredVoters)} personas</Text>}
      </StatCard>
    </StoryFrame>
  );
}
