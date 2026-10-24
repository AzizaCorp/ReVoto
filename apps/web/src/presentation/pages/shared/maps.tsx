import { useState } from 'react';
import { NATIONAL, type ElectionYear, type Territory } from '@/domain';
import { Button, ChartTable, ChoroplethMap, Slot } from '@/presentation/components';
import { percent } from '@/presentation/format';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import type { TerritoryStory } from '@/application';
import styles from './maps.module.css';

const CREDIT = 'Geometría: marco geoestadístico INEGI';
const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? 'sin dato' : percent(v);

/** Table rows of a map, highest turnout first; areas without data go last (DEF-24). */
function byTurnout(rows: readonly [string, number | null][]): [string, string][] {
  return [...rows]
    .sort(([a, x], [b, y]) => (y ?? -1) - (x ?? -1) || a.localeCompare(b, 'es'))
    .map(([name, v]) => [name, pct(v)]);
}

/**
 * W-03 · The 32 states colored by turnout in one election. Touching a state opens the map of its
 * municipalities, so the national view stays light (one file) and the detail loads on demand.
 */
export function CountryMap({
  year,
  typeName,
  highlight,
}: {
  year: ElectionYear;
  typeName: string;
  highlight: number | null;
}) {
  const { geography } = useDependencies();
  const [open, setOpen] = useState<number | null>(null);
  const data = useAsync(
    () => Promise.all([geography.states(), geography.statesTurnout()]),
    [geography],
  );
  if (data.status !== 'ready') {
    return (
      <Slot
        label={
          data.status === 'error'
            ? 'No pudimos cargar el mapa'
            : 'Cargando el mapa de participación por entidad…'
        }
        height="fill"
      />
    );
  }
  const [layer, points] = data.data;
  if (open !== null) {
    return (
      <MunicipalitiesOf
        stateCode={open}
        stateName={points.get(open)?.name ?? ''}
        year={year}
        onBack={() => setOpen(null)}
      />
    );
  }
  return (
    <ChartTable
      table={{
        caption: `Participación por entidad · elección ${typeName} ${year}`,
        head: ['Entidad', 'Participación'],
        rows: byTurnout([...points.values()].map((p) => [p.name, p.turnout[year] ?? null])),
        ...(highlight !== null && points.get(highlight)
          ? { highlight: points.get(highlight)?.name }
          : {}),
      }}
    >
      <ChoroplethMap
        layer={layer}
        valueOf={(id) => points.get(Number(id))?.turnout[year] ?? null}
        label={`Mapa de México: participación por entidad en la elección ${typeName} ${year}`}
        legendTitle={`Participación · ${typeName} ${year}`}
        format={percent}
        tooltip={(id) => {
          const p = points.get(Number(id));
          return p
            ? {
                title: p.name,
                detail: `Participación ${pct(p.turnout[year])} · toca para ver sus municipios`,
              }
            : null;
        }}
        highlight={highlight === null ? null : String(highlight)}
        onSelect={(id) => setOpen(Number(id))}
        zoomable
        credit={CREDIT}
      />
    </ChartTable>
  );
}

/** W-03 · Municipalities of the state touched on the national map. */
function MunicipalitiesOf({
  stateCode,
  stateName,
  year,
  onBack,
}: {
  stateCode: number;
  stateName: string;
  year: ElectionYear;
  onBack: () => void;
}) {
  const { geography, turnout } = useDependencies();
  const data = useAsync(
    () => Promise.all([geography.municipalities(stateCode), turnout.stateOverview(stateCode)]),
    [geography, turnout, stateCode],
  );
  if (data.status !== 'ready') {
    return (
      <Slot
        label={data.status === 'error' ? 'No pudimos cargar el mapa' : `Cargando ${stateName}…`}
        height="fill"
      />
    );
  }
  const [layer, overview] = data.data;
  const byKey = new Map(overview.municipalities.map((m) => [m.municipality.key, m]));
  return (
    <div className={styles.drill}>
      <Button size="small" icon="back" onClick={onBack}>
        Volver a México
      </Button>
      <ChartTable
        table={{
          caption: `Participación por municipio · ${stateName} · ${year}`,
          head: ['Municipio', 'Participación'],
          rows: byTurnout(
            overview.municipalities.map((m) => [
              m.municipality.name,
              m.suppressed ? null : (m.turnout[year] ?? null),
            ]),
          ),
        }}
      >
        <ChoroplethMap
          layer={layer}
          valueOf={(id) => {
            const m = byKey.get(id);
            return m && !m.suppressed ? (m.turnout[year] ?? null) : null;
          }}
          label={`Mapa de ${stateName}: participación por municipio en ${year}`}
          legendTitle={`Participación en ${stateName} · ${year}`}
          format={percent}
          tooltip={(id) => {
            const m = byKey.get(id);
            return m
              ? { title: m.municipality.name, detail: `Participación ${pct(m.turnout[year])}` }
              : null;
          }}
          highlight={null}
          zoomable
          credit={CREDIT}
        />
      </ChartTable>
    </div>
  );
}

/** W-04 · The municipalities of the chosen state; yours outlined and your neighbours dashed. */
export function StateMap({
  territory,
  story,
  year,
}: {
  territory: Territory;
  story: TerritoryStory | null;
  year: ElectionYear;
}) {
  const { geography } = useDependencies();
  const stateCode = territory.level === 'national' ? null : territory.stateCode;
  const layer = useAsync(
    () => (stateCode ? geography.municipalities(stateCode) : Promise.resolve(null)),
    [geography, stateCode],
  );
  if (territory === NATIONAL || layer.status !== 'ready' || !layer.data) {
    return (
      <Slot
        label={
          territory.level === 'national'
            ? 'Elige tu entidad para ver el mapa de sus municipios'
            : layer.status === 'error'
              ? 'No pudimos cargar el mapa'
              : 'Cargando el mapa…'
        }
        height="fill"
      />
    );
  }
  const byCode = new Map(
    (story?.overview?.municipalities ?? []).map((m) => [m.municipality.key, m]),
  );
  const own = territory.level === 'municipality' ? territory.key : null;
  const stateName = territory.level === 'municipality' ? territory.stateName : territory.name;
  const ownName = territory.level === 'municipality' ? territory.name : undefined;
  return (
    <ChartTable
      table={{
        caption: `Participación por municipio · ${stateName} · ${year}`,
        head: ['Municipio', 'Participación'],
        rows: byTurnout(
          [...byCode.values()].map((m) => [
            m.municipality.name,
            m.suppressed ? null : (m.turnout[year] ?? null),
          ]),
        ),
        ...(ownName ? { highlight: ownName } : {}),
      }}
    >
      <ChoroplethMap
        layer={layer.data}
        valueOf={(id) => {
          const m = byCode.get(id);
          return m && !m.suppressed ? (m.turnout[year] ?? null) : null;
        }}
        label={`Mapa de ${stateName}: participación por municipio en ${year}`}
        legendTitle={`Participación en ${stateName} · ${year}`}
        format={percent}
        tooltip={(id) => {
          const m = byCode.get(id);
          return m
            ? {
                title: m.municipality.name,
                detail: m.suppressed
                  ? 'Menos de 50 personas en la lista nominal'
                  : `Participación ${pct(m.turnout[year])}`,
              }
            : null;
        }}
        highlight={own}
        outlined={story?.profile?.neighbours ?? []}
        zoomable
        size="compact"
        credit={CREDIT}
      />
    </ChartTable>
  );
}

/** W-02 · The 32 states as a picker. */
export function StatesPicker({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (stateCode: number) => void;
}) {
  const { geography } = useDependencies();
  const layer = useAsync(() => geography.states(), [geography]);
  if (layer.status !== 'ready') {
    return <Slot label="Mapa de entidades (elige en la lista o en el mapa)" height="large" />;
  }
  return (
    <ChoroplethMap
      layer={layer.data}
      valueOf={() => null}
      label="Mapa de entidades: elige la tuya"
      legendTitle=""
      format={percent}
      tooltip={(id) => {
        const a = layer.data.areas.find((x) => x.id === id);
        return a
          ? { title: a.name, detail: selected === Number(id) ? 'Elegida' : 'Toca para elegir' }
          : null;
      }}
      highlight={selected === null ? null : String(selected)}
      onSelect={(id) => onSelect(Number(id))}
      picker
      zoomable
    />
  );
}
