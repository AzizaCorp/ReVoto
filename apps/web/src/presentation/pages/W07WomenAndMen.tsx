import { gap } from '@/domain';
import { Notice, StatCard, Text } from '@/presentation/components';
import { percent, PENDING, place, points, pointsAbs } from '@/presentation/format';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import layout from './shared/Layout.module.css';
import { breakdown, YEAR } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

/** W-07 · Women and men (RF-10, RN-06). */
export function W07WomenAndMen() {
  const story = useStoryData();
  const b = story ? breakdown(story, 'sex', 'territory') : null;
  const bySex = b?.figures?.bySex ?? {};
  const diff = gap(bySex.M, bySex.H);
  const value = (v: number | undefined) => (v === undefined ? `${PENDING} %` : percent(v));
  return (
    <StoryFrame
      pending={diff === null}
      label="Mujeres y hombres"
      visual={
        <div className={layout.grid2}>
          <StatCard
            icon="user"
            tone="brand"
            label="Mujeres"
            value={value(bySex.M)}
            pending={!bySex.M}
          />
          <StatCard
            icon="user"
            tone="violet"
            label="Hombres"
            value={value(bySex.H)}
            pending={!bySex.H}
          />
        </div>
      }
    >
      <Text variant="h1">
        {diff === null
          ? '[Mensaje sobre la participación por sexo]'
          : diff === 0
            ? 'Mujeres y hombres votan lo mismo'
            : diff > 0
              ? `Las mujeres votan ${pointsAbs(diff)} más que los hombres`
              : `Los hombres votan ${pointsAbs(diff)} más que las mujeres`}
      </Text>
      <Text variant="lead">
        {b ? place(b.territory) : '[Territorio]'} · Elección federal {YEAR}
      </Text>
      <DataStatus />
      {b?.fromState && (
        <Notice tone="pending">
          Por ahora el sexo se publica por entidad: mostramos {b.territory.name}.
        </Notice>
      )}
      <StatCard
        icon="trend"
        label="Diferencia entre mujeres y hombres"
        value={diff === null ? `${PENDING} pts` : points(diff)}
        pending={diff === null}
        highlight
        hero
      />
      <Notice tone="pending">Se excluyen registros con sexo fuera de catálogo (RN-06).</Notice>
    </StoryFrame>
  );
}
