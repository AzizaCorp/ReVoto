import { Notice, StatCard, Text } from '@/presentation/components';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

/** W-07 · Women and men (RF-10, RN-06). */
export function W07WomenAndMen() {
  return (
    <StoryFrame
      pending
      label="Mujeres y hombres"
      visual={
        <div className={layout.grid2}>
          <StatCard icon="user" tone="brand" label="Mujeres" value="—.— %" pending />
          <StatCard icon="user" tone="violet" label="Hombres" value="—.— %" pending />
        </div>
      }
    >
      <Text variant="h1">[Mensaje sobre la participación por sexo]</Text>
      <Text variant="lead">[Territorio] · Elección federal [año]</Text>
      <StatCard
        icon="trend"
        label="Diferencia entre mujeres y hombres"
        value="—.— pts"
        pending
        highlight
        hero
      />
      <Notice tone="pending">Se excluyen registros con sexo fuera de catálogo (RN-06).</Notice>
    </StoryFrame>
  );
}
