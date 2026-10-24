import { averageByType, changeBetween, pointDifference } from '@/domain';
import { BarChart, ChartTable, StatCard, Text } from '@/presentation/components';
import { percent, PENDING, place, points, pointsAbs } from '@/presentation/format';
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
  const story = useStoryData();
  const elections = story?.own.elections ?? [];
  const presidential = averageByType(elections, 'presidential');
  const midterm = averageByType(elections, 'midterm');
  const change = changeBetween(elections, 2018, 2024);
  const bars = ELECTIONS.map(([label, kind]) => {
    const e = elections.find((x) => String(x.election.year) === label);
    return {
      label,
      kind,
      value: e ? (e.total.value * 100).toFixed(1) : PENDING,
      ratio: e ? e.total.value : null,
    };
  });
  const diff =
    presidential !== null && midterm !== null ? pointDifference(presidential, midterm) : null;
  return (
    <StoryFrame
      pending={!story}
      label="2009–2024"
      after={<Averages presidential={presidential} midterm={midterm} change={change} />}
      visual={
        <ChartTable
          table={{
            caption: `Participación por elección · ${story ? place(story.own.territory) : '[Territorio]'}`,
            head: ['Elección', 'Tipo', 'Participación'],
            numericFrom: 2,
            rows: bars.map((b) => [
              b.label,
              b.kind === 'presidential' ? 'Presidencial' : 'Intermedia',
              b.ratio === null ? `${PENDING} %` : `${b.value} %`,
            ]),
          }}
        >
          <BarChart title="Participación por elección" bars={bars} />
        </ChartTable>
      }
    >
      <Text variant="h1">
        {diff === null
          ? '[Mensaje sobre presidenciales e intermedias]'
          : diff >= 0
            ? `De 2009 a 2024, en presidenciales se vota ${pointsAbs(diff)} más que en intermedias`
            : `De 2009 a 2024, en intermedias se vota ${pointsAbs(diff)} más que en presidenciales`}
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
}: {
  presidential: number | null;
  midterm: number | null;
  change: number | null;
}) {
  return (
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
        label="Cambio entre las dos últimas presidenciales"
        value={change === null ? `± ${PENDING} pts` : points(change)}
        pending={change === null}
      />
    </div>
  );
}
