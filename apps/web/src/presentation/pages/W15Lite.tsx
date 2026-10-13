import { useState } from 'react';
import { next, previous, progress, screenName, type ScreenId } from '@/domain';
import { Button, LiteScreen, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

const YEARS = [
  [2009, 'Intermedia'],
  [2012, 'Presidencial'],
  [2015, 'Intermedia'],
  [2018, 'Presidencial'],
  [2021, 'Intermedia'],
  [2024, 'Presidencial'],
] as const;

/** W-15 · Lite version (RF-18): the same story as text and tables, ≤ 500 KB. */
export function W15Lite() {
  const nav = useNavigation();
  const [id, setId] = useState<ScreenId>(nav.lastScreen);
  const previousId = previous(nav.sequence, id);
  const nextId = next(nav.sequence, id);
  return (
    <LiteScreen
      onFullVersion={() => nav.goTo(id)}
      footer={
        <>
          <Button
            variant="text"
            disabled={!previousId}
            onClick={() => previousId && setId(previousId)}
          >
            ‹ Anterior
          </Button>
          <Button variant="text" disabled={!nextId} onClick={() => nextId && setId(nextId)}>
            Siguiente ›
          </Button>
        </>
      }
    >
      <Text variant="meta">
        {progress(nav.sequence, id).text} · {nav.territory}
      </Text>
      <Text variant="h1">{screenName(id)}</Text>
      <Text variant="body">[Mensaje de la pantalla]</Text>
      <table>
        <caption>Participación por elección federal (datos pendientes)</caption>
        <thead>
          <tr>
            <th scope="col">Año</th>
            <th scope="col">Tipo</th>
            <th scope="col">Territorio</th>
            <th scope="col">Nacional</th>
          </tr>
        </thead>
        <tbody>
          {YEARS.map(([year, type]) => (
            <tr key={year}>
              <th scope="row">{year}</th>
              <td>{type}</td>
              <td>—.— %</td>
              <td>—.— %</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Text variant="meta">Fuente: INE, conteos censales 2009–2024.</Text>
    </LiteScreen>
  );
}
