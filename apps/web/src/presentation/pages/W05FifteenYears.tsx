import { averageByType, changeBetween, pointDifference } from '@/domain';
import { BarChart, Button, StatCard, Text } from '@/presentation/components';
import { percent, PENDING, place, points, pointsAbs } from '@/presentation/format';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

const ELECTIONS = [
  ['2009', 'midterm'],
  ['2012', 'presidential'],
  ['2015', 'midterm'],
  ['2018', 'presidential'],
  ['2021', 'midterm'],
  ['2024', 'presidential'],
] as const;

/** W-05 · Fifteen years of elections (RF-08, RN-03). 2009–2024 series. */
export function W05FifteenYears() {
  const nav = useNavigation();
  const story = useStoryData();
  const elections = story?.own.elections ?? [];
  const presidential = averageByType(elections, 'presidential');
  const midterm = averageByType(elections, 'midterm');
  const change = changeBetween(elections, 2018, 2024);
  const diff =
    presidential !== null && midterm !== null ? pointDifference(presidential, midterm) : null;
  return (
    <StoryFrame
      pending={!story}
      label="15 años"
      after={
        <Averages
          presidential={presidential}
          midterm={midterm}
          change={change}
          onTable={() => nav.goTo('W-15')}
        />
      }
      visual={
        <BarChart
          title="Participación por elección"
          bars={ELECTIONS.map(([label, kind]) => {
            const e = elections.find((x) => String(x.election.year) === label);
            return {
              label,
              kind,
              value: e ? (e.total.value * 100).toFixed(1) : PENDING,
              ratio: e ? e.total.value : null,
            };
          })}
        />
      }
    >
      <Text variant="h1">
        {diff === null
          ? '[Mensaje sobre presidenciales e intermedias]'
          : diff >= 0
            ? `En presidenciales se vota ${pointsAbs(diff)} más que en intermedias`
            : `En intermedias se vota ${pointsAbs(diff)} más que en presidenciales`}
      </Text>
      <Text variant="lead">
        {story ? place(story.own.territory) : '[Territorio]'} · Elecciones federales 2009–2024
      </Text>
      <DataStatus />
    </StoryFrame>
  );
}

function Averages({
  presidential,
  midterm,
  change,
  onTable,
}: {
  presidential: number | null;
  midterm: number | null;
  change: number | null;
  onTable: () => void;
}) {
  return (
    <>
      <div className={[layout.grid3, layout.wideTwo].join(' ')}>
        <StatCard
          label="Promedio presidencial"
          value={presidential === null ? `${PENDING} %` : percent(presidential)}
          pending={presidential === null}
          highlight
        />
        <StatCard
          label="Promedio intermedia"
          value={midterm === null ? `${PENDING} %` : percent(midterm)}
          pending={midterm === null}
        />
        <StatCard
          label="De 2018 a 2024"
          value={change === null ? `± ${PENDING} pts` : points(change)}
          pending={change === null}
        />
      </div>
      <Button variant="text" onClick={onTable}>
        Ver como tabla
      </Button>
    </>
  );
}
