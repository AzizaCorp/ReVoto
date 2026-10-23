import { useState } from 'react';
import { AGE_GROUPS, gap } from '@/domain';
import { ComparisonBar, Notice, SegmentedControl, StatCard, Text } from '@/presentation/components';
import { percent, PENDING, place, points, pointsAbs } from '@/presentation/format';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import layout from './shared/Layout.module.css';
import { breakdown, YEAR } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

const LABEL: Record<(typeof AGE_GROUPS)[number], string> = {
  '18-24': '18–24 años',
  '25-34': '25–34 años',
  '35-44': '35–44 años',
  '45-59': '45–59 años',
  '60+': '60 + años',
};

/** W-06 · Your generation (RF-09, RN-04). Turnout by age group. */
export function W06YourGeneration() {
  const story = useStoryData();
  const [chosen, setScope] = useState<'territory' | 'national'>('territory');
  const own = story ? breakdown(story, 'age', 'territory').territory : null;
  // DEF-35: with national figures there is nothing to compare, so no «Nacional | Nacional».
  const comparable = own !== null && own.level !== 'national';
  const scope = comparable ? chosen : 'territory';
  const b = story ? breakdown(story, 'age', scope) : null;
  const byAge = b?.figures?.byAge ?? {};
  const youngVsOld = gap(byAge['18-24'], byAge['60+']);
  const scopes = [
    {
      value: 'territory',
      text: own ? own.name : '[Territorio]',
    },
    { value: 'national', text: 'Nacional' },
  ];
  return (
    <StoryFrame
      pending={!b?.figures}
      label="Tu generación"
      after={
        <Text variant="lead">
          {b
            ? `Diferencia entre el grupo más joven y el mayor en ${place(b.territory)}, elección federal ${YEAR}. La cifra describe cuánto votó cada grupo, no por qué.`
            : '[Texto descriptivo de la brecha entre el grupo más joven y el mayor, sin juicios.]'}
        </Text>
      }
      visual={
        <>
          {(comparable || !story) && (
            <SegmentedControl
              label="Ámbito"
              options={scopes}
              value={scope}
              onChange={(v) => setScope(v as 'territory' | 'national')}
            />
          )}
          <section className={layout.panel}>
            <h2 className={layout.panelTitle}>Participación por grupo de edad · {YEAR}</h2>
            {AGE_GROUPS.map((g) => (
              <ComparisonBar
                key={g}
                label={LABEL[g]}
                value={byAge[g] === undefined ? `${PENDING} %` : percent(byAge[g])}
                ratio={byAge[g] ?? null}
              />
            ))}
          </section>
        </>
      }
    >
      <Text variant="h1">
        {youngVsOld === null
          ? '[Mensaje sobre la participación por edad]'
          : youngVsOld < 0
            ? `Quienes tienen 60 + votan ${pointsAbs(youngVsOld)} más que quienes tienen 18–24`
            : `Quienes tienen 18–24 votan ${pointsAbs(youngVsOld)} más que quienes tienen 60 +`}
      </Text>
      <DataStatus />
      {b?.fromState && (
        <Notice tone="pending">
          Por ahora la edad se publica por entidad: mostramos {b.territory.name}.
        </Notice>
      )}
      <StatCard
        icon="users"
        label="Brecha 18–24 vs. 60 +"
        value={youngVsOld === null ? `${PENDING} pts` : points(youngVsOld)}
        pending={youngVsOld === null}
        highlight
        hero
      />
    </StoryFrame>
  );
}
