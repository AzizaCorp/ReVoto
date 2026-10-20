import { gap } from '@/domain';
import { IconBubble, Notice, StatCard, Text, VisuallyHidden } from '@/presentation/components';
import { percent, PENDING, place, points, pointsAbs } from '@/presentation/format';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import layout from './shared/Layout.module.css';
import { breakdown, YEAR } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';
import styles from './W07WomenAndMen.module.css';

const CIRCUMFERENCE = 2 * Math.PI * 48;

/** Ring with the turnout of one sex; dashed while there is no figure. */
function Ring({
  name,
  value,
  tone,
}: {
  name: string;
  value: number | undefined;
  tone: 'women' | 'men';
}) {
  const pending = value === undefined;
  return (
    <figure className={styles.ring}>
      <svg className={styles.svg} viewBox="0 0 120 120" aria-hidden="true">
        <circle
          className={[styles.track, pending ? styles.pending : ''].join(' ')}
          cx="60"
          cy="60"
          r="48"
        />
        {!pending && (
          <circle
            className={[styles.arc, styles[tone]].join(' ')}
            cx="60"
            cy="60"
            r="48"
            strokeDasharray={`${value * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          />
        )}
        <text
          className={[styles.value, pending ? styles.pending : ''].join(' ')}
          x="60"
          y="67"
          textAnchor="middle"
        >
          {pending ? `${PENDING}%` : percent(value)}
        </text>
      </svg>
      <figcaption className={styles.label}>
        <IconBubble icon="user" tone={tone === 'women' ? 'brand' : 'violet'} size={32} />
        {name}
        <VisuallyHidden>: {pending ? 'sin dato' : percent(value)}</VisuallyHidden>
      </figcaption>
    </figure>
  );
}

/** W-07 · Women and men (RF-10, RN-06). */
export function W07WomenAndMen() {
  const story = useStoryData();
  const b = story ? breakdown(story, 'sex', 'territory') : null;
  const bySex = b?.figures?.bySex ?? {};
  const diff = gap(bySex.M, bySex.H);
  return (
    <StoryFrame
      pending={diff === null}
      label="Mujeres y hombres"
      visual={
        <div className={layout.grid2}>
          <Ring name="Mujeres" value={bySex.M} tone="women" />
          <Ring name="Hombres" value={bySex.H} tone="men" />
        </div>
      }
      after={
        <>
          <StatCard
            icon="trend"
            label="Diferencia entre mujeres y hombres"
            value={diff === null ? `${PENDING} pts` : points(diff)}
            pending={diff === null}
            highlight
            hero
          />
          <Notice tone="pending">Se excluyen registros con sexo fuera de catálogo (RN-06).</Notice>
        </>
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
    </StoryFrame>
  );
}
