import { compareTerritory } from '@/application';
import { territoryLabel } from '@/domain';
import {
  Button,
  ComparisonBar,
  Notice,
  StatCard,
  TerritoryChip,
  Text,
} from '@/presentation/components';
import { count, percent, points } from '@/presentation/format';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useStoryData } from '@/presentation/providers/Story';
import { StateMap } from './shared/maps';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

const YEAR = 2024;

/** W-04 · Your territory (RF-07). Your municipality against its state, the country and its neighbors. */
export function W04YourTerritory() {
  const nav = useNavigation();
  const { turnout } = useDependencies();
  const t = nav.selected;
  const story = useStoryData();
  const result = useAsync(() => compareTerritory(turnout, t, YEAR), [turnout, t]);
  const c = result.status === 'ready' ? result.data : null;

  const rows: [string, number | null][] = c
    ? [
        [t.level === 'national' ? 'Nacional' : t.name, c.own.value],
        ...(c.state && t.level === 'municipality'
          ? ([[t.stateName, c.state.value]] as [string, number][])
          : []),
        ...(t.level === 'national' ? [] : ([['Nacional', c.national.value]] as [string, number][])),
        ...(c.neighbours
          ? ([[`Tus vecinos (${c.neighbours.count})`, c.neighbours.average]] as [string, number][])
          : []),
      ]
    : [
        ['[Municipio]', null],
        ['[Entidad]', null],
        ['Nacional', null],
        ['Tus vecinos', null],
      ];

  return (
    <StoryFrame
      pending={!c}
      label="Tu territorio"
      visual={
        <>
          <StateMap territory={t} story={story} year={YEAR} />
          <section className={layout.panel}>
            <h2 className={layout.panelTitle}>Comparado con</h2>
            {rows.map(([label, value]) => (
              <ComparisonBar
                key={label}
                label={label}
                value={value === null ? '—.— %' : percent(value)}
                ratio={value}
              />
            ))}
          </section>
        </>
      }
    >
      <Text variant="h1">{territoryLabel(t)}</Text>
      <TerritoryChip territory={nav.territory} onClick={nav.changeTerritory} />
      <Text variant="meta">
        Elección federal {YEAR} · lista nominal {c ? count(c.registeredVoters) : '[n]'}
      </Text>
      {c?.notice && (
        <Notice tone="threshold" title="Mostramos tu entidad">
          Tu municipio tiene menos de 50 personas en la lista nominal; sus cifras no se publican
          (RN-05).
        </Notice>
      )}
      {result.status === 'error' ? (
        <Notice tone="error" title="No pudimos cargar las cifras">
          <Button variant="text" onClick={result.retry}>
            Reintentar
          </Button>
        </Notice>
      ) : (
        <StatCard
          icon="pin"
          label={t.level === 'municipality' ? 'Participación en tu municipio' : 'Participación'}
          value={c ? percent(c.own.value) : '—.— %'}
          pending={!c}
          highlight
          hero
        >
          <Text variant="meta">
            {c
              ? t.level === 'national'
                ? `${c.own.source.name}`
                : `${points(c.differenceVsNational)} vs. nacional`
              : '± —.— pts vs. nacional'}
          </Text>
        </StatCard>
      )}
    </StoryFrame>
  );
}
