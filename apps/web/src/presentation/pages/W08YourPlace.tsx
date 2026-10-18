import { Button, ComparisonBar, Slot, StatCard, Text } from '@/presentation/components';
import { percent } from '@/presentation/format';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStoryData } from '@/presentation/providers/Story';
import { DataStatus } from './shared/DataStatus';
import layout from './shared/Layout.module.css';
import { placeOf, YEAR } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

/** W-08 · Your place in your state. Position of the municipality among those of its state. */
export function W08YourPlace() {
  const nav = useNavigation();
  const story = useStoryData();
  const t = nav.selected;
  const p = story ? placeOf(story) : null;
  const stateName =
    t.level === 'national' ? '[Entidad]' : t.level === 'state' ? t.name : t.stateName;
  const mine =
    p && t.level === 'municipality' && !p.top.some((m) => m.code === t.key)
      ? { name: t.name, value: story?.own.elections.at(-1)?.total.value ?? null }
      : null;

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
        p ? (
          <section className={layout.panel}>
            <h2 className={layout.panelTitle}>
              Mayor participación en {stateName} · {YEAR}
            </h2>
            {p.top.map((m, i) => (
              <ComparisonBar
                key={m.code}
                label={`${i + 1}. ${m.name}`}
                value={m.turnout === null ? '—' : percent(m.turnout)}
                ratio={m.turnout}
              />
            ))}
            {mine && p.rank && (
              <ComparisonBar
                label={`${p.rank.position}. ${mine.name}`}
                value={mine.value === null ? '—' : percent(mine.value)}
                ratio={mine.value}
              />
            )}
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
    </StoryFrame>
  );
}
