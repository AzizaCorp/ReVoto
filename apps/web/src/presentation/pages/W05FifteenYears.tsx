import { BarChart, Button, StatCard, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
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
  const nav = useNavigation();
  return (
    <StoryFrame
      pending
      label="15 años"
      visual={
        <BarChart
          title="Participación por elección"
          bars={ELECTIONS.map(([label, kind]) => ({ label, kind, value: '—.—', ratio: null }))}
        />
      }
    >
      <Text variant="h1">[Mensaje sobre presidenciales e intermedias]</Text>
      <Text variant="lead">[Territorio] · Elecciones federales 2009–2024</Text>
      <div className={[layout.grid3, layout.wideTwo].join(' ')}>
        <StatCard label="Promedio presidencial" value="—.— %" pending highlight />
        <StatCard label="Promedio intermedia" value="—.— %" pending />
        <StatCard label="De 2018 a 2024" value="± —.— pts" pending />
      </div>
      <Button variant="text" onClick={() => nav.goTo('W-15')}>
        Ver como tabla
      </Button>
    </StoryFrame>
  );
}
