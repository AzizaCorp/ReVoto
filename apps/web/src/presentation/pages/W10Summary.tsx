import {
  Button,
  SummaryRow,
  Text,
  type BubbleTone,
  type IconName,
} from '@/presentation/components';
import { useNavigation, type ViewId } from '@/presentation/providers/Navigation';
import layout from './shared/Layout.module.css';
import { StoryFrame } from './shared/StoryFrame';

const FIGURES: readonly [string, string, IconName, BubbleTone, ViewId][] = [
  ['—.— %', 'Nacional · [año]', 'chart', 'brand-strong', 'W-03'],
  ['—.— %', '[Municipio] · [año]', 'pin', 'brand', 'W-04'],
  ['#— de [n]', 'Tu lugar en [Entidad] · [año]', 'star', 'violet', 'W-08'],
  ['—.— pts', '18–24 vs. 60 + · [año]', 'users', 'indigo', 'W-06'],
  ['—.— pts', 'Mujeres vs. hombres · [año]', 'user', 'neutral', 'W-07'],
];

/** W-10 · Your summary (RF-04, US-21). Close of the story with five figures. */
export function W10Summary() {
  const nav = useNavigation();
  const rows = (
    <div className={layout.stack}>
      {FIGURES.map(([value, context, icon, tone, target]) => (
        <SummaryRow
          key={context}
          icon={icon}
          tone={tone}
          value={value}
          context={context}
          pending
          onClick={() => nav.goTo(target)}
        />
      ))}
    </div>
  );
  return (
    <StoryFrame
      label="Resumen"
      hasSource={false}
      shareable={false}
      secondaryAction={{ label: 'Metodología', icon: 'info', onClick: () => nav.goTo('W-16') }}
      visual={<div className={layout.wideOnly}>{rows}</div>}
    >
      <Text variant="h1">Lo esencial, en cinco cifras</Text>
      <div className={layout.row}>
        <Button size="small" icon="pin" onClick={() => nav.goTo('W-09')}>
          Tu municipio: «[Arquetipo]»
        </Button>
        <Button size="small" icon="star" onClick={() => nav.goTo('W-09b')}>
          Tú: «[Insignia]»
        </Button>
      </div>
      <div className={[layout.narrowOnly, layout.fill].join(' ')}>{rows}</div>
      <Button
        variant="primary"
        icon="share"
        fullWidth="mobile"
        onClick={() => nav.openSheet('W-12')}
      >
        Compartir mi resumen
      </Button>
      <div className={layout.grid2}>
        <Button icon="download" onClick={() => nav.goTo('W-16')}>
          Datos abiertos
        </Button>
        <Button icon="redo" onClick={() => nav.goTo('W-01')}>
          Volver a empezar
        </Button>
      </div>
      <Text variant="meta">
        Fuente: conteos censales INE 2009–2024 · Hecho por Angel y Kira · Sin datos personales
      </Text>
    </StoryFrame>
  );
}
