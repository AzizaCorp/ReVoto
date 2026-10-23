import { ARCHETYPES, BADGES, gap, turnoutIn } from '@/domain';
import {
  Button,
  SummaryRow,
  Text,
  type BubbleTone,
  type IconName,
} from '@/presentation/components';
import { percent, PENDING, points } from '@/presentation/format';
import { useNavigation, type ViewId } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import layout from './shared/Layout.module.css';
import { breakdown, placeOf, YEAR } from './shared/storyFigures';
import { ShareAction } from './shared/ShareAction';
import { StoryFrame } from './shared/StoryFrame';

type Row = readonly [string | null, string, IconName, BubbleTone, ViewId];

/** W-10 · Your summary (RF-04, US-21). Close of the story with five figures. */
export function W10Summary() {
  const nav = useNavigation();
  const story = useStoryData();
  const { badge } = useProfile();
  const t = nav.selected;
  const national = story ? turnoutIn(story.national.elections, YEAR) : null;
  const own = story ? turnoutIn(story.own.elections, YEAR) : null;
  const rank = story ? placeOf(story)?.rank : null;
  const age = story ? breakdown(story, 'age', 'territory') : null;
  const sex = story ? breakdown(story, 'sex', 'territory') : null;
  const ageGap = gap(age?.figures?.byAge['18-24'], age?.figures?.byAge['60+']);
  const sexGap = gap(sex?.figures?.bySex.M, sex?.figures?.bySex.H);
  const stateName = t.level === 'municipality' ? t.stateName : t.level === 'state' ? t.name : null;
  const archetype = story?.profile?.archetype?.archetype;

  const figures: readonly Row[] = [
    [
      national ? percent(national.total.value) : null,
      `Nacional · ${YEAR}`,
      'chart',
      'brand-strong',
      'W-03',
    ],
    ...(t.level === 'national'
      ? []
      : ([
          [
            own ? percent(own.total.value) : null,
            `${story?.own.territory.name ?? t.name} · ${YEAR}`,
            'pin',
            'brand',
            'W-04',
          ],
        ] as Row[])),
    ...(t.level === 'municipality'
      ? ([
          [
            rank ? `#${rank.position} de ${rank.total}` : null,
            `Tu lugar en ${stateName} · ${YEAR}`,
            'star',
            'violet',
            'W-08',
          ],
        ] as Row[])
      : []),
    [
      ageGap === null ? null : points(ageGap),
      `18–24 vs. 60 + · ${age?.territory.name ?? ''} · ${YEAR}`,
      'users',
      'indigo',
      'W-06',
    ],
    [
      sexGap === null ? null : points(sexGap),
      `Mujeres vs. hombres · ${sex?.territory.name ?? ''} · ${YEAR}`,
      'user',
      'neutral',
      'W-07',
    ],
  ];

  const rows = (
    <div className={layout.stack}>
      {figures.map(([value, context, icon, tone, target]) => (
        <SummaryRow
          key={icon}
          icon={icon}
          tone={tone}
          value={value ?? `${PENDING}`}
          context={context}
          pending={value === null}
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
      secondaryAction={{ label: 'Metodología', icon: 'info', onClick: () => nav.goTo('W-18') }}
      visual={<div className={layout.wideOnly}>{rows}</div>}
    >
      <Text variant="h1">
        Lo esencial, en {figures.length === 5 ? 'cinco' : figures.length === 4 ? 'cuatro' : 'tres'}{' '}
        cifras
      </Text>
      <div className={layout.row}>
        <Button size="small" icon="pin" onClick={() => nav.goTo('W-09')}>
          {archetype ? `Tu municipio: «${ARCHETYPES[archetype]}»` : 'Tu municipio: sin arquetipo'}
        </Button>
        <Button size="small" icon="star" onClick={() => nav.goTo(badge ? 'W-09b' : 'W-02b')}>
          {badge ? `Tú: «${BADGES[badge]}»` : 'Tú: responde «Sobre ti»'}
        </Button>
      </div>
      <div className={[layout.narrowOnly, layout.fill].join(' ')}>{rows}</div>
      <ShareAction what="both">Compartir mi resumen</ShareAction>
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
