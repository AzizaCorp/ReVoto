import { useState } from 'react';
import type { MunicipalityTurnout } from '@/domain';
import { Button, Slot, StatCard, Text } from '@/presentation/components';
import { percent } from '@/presentation/format';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import { placeOf, YEAR } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';
import styles from './W08YourPlace.module.css';

interface RankRow {
  position: number;
  name: string;
  turnout: number | null;
  mine: boolean;
}

function Rows({ rows }: { rows: readonly (RankRow | 'gap')[] }) {
  return (
    <ol className={styles.list}>
      {rows.map((r, i) =>
        r === 'gap' ? (
          <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">
            ⋮
          </li>
        ) : (
          <li
            key={`${r.position}-${r.name}`}
            className={[styles.row, r.mine ? styles.mine : ''].join(' ')}
          >
            <span className={styles.badge}>{r.mine ? `#${r.position}` : r.position}</span>
            <span className={styles.name}>{r.name}</span>
            <span className={styles.value}>{r.turnout === null ? '—' : percent(r.turnout)}</span>
          </li>
        ),
      )}
    </ol>
  );
}

/** W-08 · Your place in your state. Position of the municipality among those of its state. */
export function W08YourPlace() {
  const nav = useNavigation();
  const story = useStoryData();
  const t = nav.selected;
  const p = story ? placeOf(story) : null;
  const stateName =
    t.level === 'national' ? '[Entidad]' : t.level === 'state' ? t.name : t.stateName;
  const [full, setFull] = useState(false);
  const own = story?.own.elections.find((e) => e.election.year === YEAR)?.total.value ?? null;
  const row = (m: MunicipalityTurnout, position: number): RankRow => ({
    position,
    name: m.name,
    turnout: m.turnout,
    mine: t.level === 'municipality' && m.code === t.key,
  });
  // Board W-08: the two highest, yours and the lowest; «Ver el Top 5» opens the five highest.
  const rows: (RankRow | 'gap')[] = [];
  if (p?.rank && t.level === 'municipality') {
    const head = p.top.slice(0, full ? 5 : 2).map((m, i) => row(m, i + 1));
    rows.push(...head);
    const position = p.rank.position;
    if (position > head.length) {
      if (position > head.length + 1) rows.push('gap');
      rows.push({ position, name: t.name, turnout: own, mine: true });
    }
    if (!full && p.lowest && position < p.rank.total) {
      if (position < p.rank.total - 1) rows.push('gap');
      rows.push(row(p.lowest, p.rank.total));
    }
  }

  if (t.level !== 'municipality') {
    return (
      <StoryFrame label="Tu lugar" hasSource={false}>
        <Text variant="h1">Tu lugar en tu entidad</Text>
        <Text variant="lead">
          Elige un municipio para ver su lugar entre los de su entidad, ordenados por participación.
        </Text>
        <Button variant="primary" icon="pin" onClick={nav.changeTerritory}>
          Elegir municipio
        </Button>
      </StoryFrame>
    );
  }

  return (
    <StoryFrame
      pending={!p?.rank}
      label="Tu lugar"
      visual={
        p?.rank ? (
          <section className={styles.scale} aria-label={`Ranking de ${stateName}`}>
            <h2 className={styles.title}>
              {full ? `Las 5 con mayor participación en ${stateName}` : `Ranking de ${stateName}`} ·{' '}
              {YEAR}
            </h2>
            <Rows rows={rows} />
            <Button variant="text" onClick={() => setFull((f) => !f)}>
              {full ? 'Ver tu lugar' : `Ver el Top 5 de ${stateName}`}
            </Button>
          </section>
        ) : (
          <Slot label="Ranking: mayor participación → tu municipio → menor" height="fill" />
        )
      }
    >
      <Text variant="h1">Tu lugar en {stateName}</Text>
      <Text variant="lead">
        Entre los {p?.rank?.total ?? '[n]'} municipios de {stateName} · Elección federal {YEAR}
      </Text>
      <DataStatus />
      <StatCard
        icon="star"
        label={`Posición en ${stateName}`}
        value={p?.rank ? `#${p.rank.position} de ${p.rank.total}` : '#— de [n]'}
        pending={!p?.rank}
        highlight
        hero
      >
        <Text variant="meta">
          {p?.rank
            ? `Vota más que el ${Math.round(p.rank.aheadOf * 100)} % de los municipios de ${stateName}.`
            : `Vota más que el —— % de los municipios de ${stateName}.`}
        </Text>
      </StatCard>
      {p?.rank && (
        <div className={styles.scale} aria-hidden="true">
          <div className={styles.bar}>
            <span
              className={styles.marker}
              style={{
                left: `${Math.round((1 - (p.rank.position - 1) / Math.max(p.rank.total - 1, 1)) * 100)}%`,
              }}
            />
          </div>
          <div className={styles.ends}>
            <span>Menor participación</span>
            <span>Mayor participación</span>
          </div>
        </div>
      )}
    </StoryFrame>
  );
}
