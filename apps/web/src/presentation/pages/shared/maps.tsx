import { listStates } from '@/application';
import { NATIONAL, type ElectionYear, type Territory } from '@/domain';
import { ChoroplethMap, Slot } from '@/presentation/components';
import { percent } from '@/presentation/format';
import { useAsync } from '@/presentation/hooks/useAsync';
import { useDependencies } from '@/presentation/providers/Dependencies';
import type { TerritoryStory } from '@/application';

const CREDIT = 'Geometría: marco geoestadístico INEGI';
const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? 'sin dato' : percent(v);

/** W-03 · Every municipality of the country colored by turnout in one election. */
export function CountryMap({
  year,
  typeName,
  highlight,
}: {
  year: ElectionYear;
  typeName: string;
  highlight: string | null;
}) {
  const { geography, turnout } = useDependencies();
  const data = useAsync(
    () => Promise.all([geography.country(), geography.countryTurnout(), listStates(turnout)]),
    [geography, turnout],
  );
  if (data.status !== 'ready') {
    return (
      <Slot
        label={
          data.status === 'error'
            ? 'No pudimos cargar el mapa'
            : 'Cargando el mapa de participación por municipio…'
        }
        height="fill"
      />
    );
  }
  const [layer, points, states] = data.data;
  const stateName = new Map(
    states.map((s) => [s.level === 'state' ? s.stateCode : 0, s.name] as const),
  );
  return (
    <ChoroplethMap
      layer={layer}
      valueOf={(id) => points.get(id)?.turnout[year] ?? null}
      label={`Mapa de México: participación por municipio en la elección ${typeName} ${year}`}
      legendTitle={`Participación · ${typeName} ${year}`}
      format={percent}
      tooltip={(id) => {
        const p = points.get(id);
        return p
          ? {
              title: `${p.name}, ${stateName.get(p.stateCode) ?? ''}`,
              detail: `Participación ${pct(p.turnout[year])}`,
            }
          : null;
      }}
      highlight={highlight}
      zoomable
      credit={CREDIT}
    />
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
    (story?.overview?.municipalities ?? []).map((m) => [
      String(m.municipality.municipalityCode),
      m,
    ]),
  );
  const own = territory.level === 'municipality' ? String(territory.municipalityCode) : null;
  const stateName = territory.level === 'municipality' ? territory.stateName : territory.name;
  return (
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
                ? 'Menos de 50 personas en lista (RN-05)'
                : `Participación ${pct(m.turnout[year])}`,
            }
          : null;
      }}
      highlight={own}
      outlined={(story?.profile?.neighbours ?? []).map(String)}
      zoomable
      size="compact"
      credit={CREDIT}
    />
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
    />
  );
}
