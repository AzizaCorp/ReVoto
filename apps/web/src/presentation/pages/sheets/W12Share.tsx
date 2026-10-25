import { useRef, useState } from 'react';
import { ARCHETYPES, BADGES, screenName, type ScreenId } from '@/domain';
import {
  ArchetypeCard,
  BadgeCard,
  Button,
  DuoCard,
  Notice,
  Pill,
  SegmentedControl,
  SheetTemplate,
  SlideCard,
  SwitchRow,
  Text,
} from '@/presentation/components';
import { place } from '@/presentation/format';
import { useNavigation, type ShareSubject } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import { cardToPng, download, shareOrDownload, slug } from '@/presentation/share/exportCard';
import { buildShareUrl } from '@/presentation/share/sharedLink';
import { useShareBlocker } from '../shared/shareBlocker';
import { isSlideScreen, slideCard, type SlideScreen } from '../shared/slideCards';
import { archetypeStat, compareWithGeneration } from '../shared/storyFigures';
import styles from './W12Share.module.css';

type Identity = Exclude<ShareSubject, 'slide'>;

const WHAT = [
  { value: 'archetype', text: 'Mi arquetipo' },
  { value: 'badge', text: 'Mi insignia' },
  { value: 'both', text: 'Los dos' },
] as const;
const FORMATS = [
  { value: 'story', text: 'Historia 9:16' },
  { value: 'square', text: 'Publicación 1:1' },
] as const;
const FILE: Record<Identity, string> = {
  archetype: 'arquetipo',
  badge: 'insignia',
  both: 'mi-municipio-y-yo',
};
const SCREEN: Record<Identity, ScreenId> = { archetype: 'W-09', badge: 'W-09b', both: 'W-09c' };
/** W-09, W-09b and W-09c share their identity card as «this screen». */
const IDENTITY_OF: Partial<Record<ScreenId, Identity>> = {
  'W-09': 'archetype',
  'W-09b': 'badge',
  'W-09c': 'both',
};

/** Card the sheet opens on: the one asked for, or the card of the screen under the sheet. */
function initialSubject(asked: ShareSubject, screen: ScreenId): ShareSubject {
  if (asked !== 'slide') return asked;
  return isSlideScreen(screen) ? 'slide' : (IDENTITY_OF[screen] ?? 'archetype');
}

/**
 * W-12 · Create a card (RF-15, RN-08, US-24): the card of the screen it was opened from (W-03 to
 * W-10), the archetype of the chosen municipality, the badge of the person, or both, with real
 * figures, as a 9:16 story or a 1:1 post. It downloads or shares it as a 1080 px PNG. Never
 * includes personal data: the answers stay on the device and only the badge name and its
 * comparison are drawn.
 */
export function W12Share() {
  const nav = useNavigation();
  const story = useStoryData();
  const { badge, votes, answers } = useProfile();
  const screen = nav.lastScreen;
  const slideScreen: SlideScreen | null = isSlideScreen(screen) ? screen : null;
  const [what, setWhat] = useState<ShareSubject>(() => initialSubject(nav.shareSubject, screen));
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  // RN-08: the answers only travel in the link when the person turns this on.
  const [withAnswers, setWithAnswers] = useState(false);
  const cardBox = useRef<HTMLDivElement>(null);

  const t = nav.selected;
  const profile = story?.profile?.archetype ?? null;
  const placeText = t.level === 'municipality' ? place(t) : undefined;
  const cmp = compareWithGeneration(story, votes, answers.age);
  const cardFormat = format === 'square' ? 'post' : 'story';
  const you = `${votes} de 3`;
  const answered = Object.values(answers).some((a) => a !== null);

  const slide = what === 'slide' && slideScreen ? slideCard(slideScreen, story, t) : null;
  const blocker = useShareBlocker(what);
  const missing = slide
    ? slide.status === 'missing'
      ? slide.reason
      : null
    : (blocker?.text ?? null);

  const size = format === 'square' ? '1x1' : '9x16';
  const name =
    slide?.status === 'ready'
      ? `revoto-${slide.card.file}-${slug(slide.card.place)}-${size}.png`
      : `revoto-${FILE[what === 'slide' ? 'archetype' : what]}${placeText ? `-${slug(t.name)}` : ''}-${size}.png`;
  const caption =
    slide?.status === 'ready'
      ? slide.card.caption
      : what === 'badge'
        ? `Mi insignia en ReVoto: «${badge ? BADGES[badge] : ''}».`
        : profile && t.level === 'municipality'
          ? `${t.name} es «${ARCHETYPES[profile.archetype]}» en ReVoto.`
          : 'ReVoto';

  const exportCard = async (mode: 'download' | 'share') => {
    const card = cardBox.current?.querySelector<HTMLElement>('figure');
    if (!card || missing) return;
    setBusy(true);
    setStatus('Creando la imagen…');
    try {
      const png = await cardToPng(card);
      if (mode === 'download') {
        download(png, name);
        setStatus(`Imagen descargada: ${name}`);
      } else {
        const r = await shareOrDownload(png, name, caption);
        setStatus(
          r === 'shared'
            ? 'Imagen compartida.'
            : r === 'cancelled'
              ? 'Compartir cancelado.'
              : `Tu navegador no comparte archivos: descargamos ${name}.`,
        );
      }
    } catch {
      setStatus('No pudimos crear la imagen. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const target = what === 'slide' ? screen : SCREEN[what];
    const url = buildShareUrl(
      `${location.origin}${location.pathname}`,
      target,
      t,
      withAnswers ? answers : undefined,
    );
    try {
      await navigator.clipboard.writeText(url);
      setStatus(
        withAnswers && answered
          ? 'Enlace copiado, con tu territorio y tus respuestas.'
          : t.level === 'national'
            ? 'Enlace copiado.'
            : 'Enlace copiado, con tu territorio.',
      );
    } catch {
      setStatus(`Copia este enlace: ${url}`);
    }
  };

  return (
    <SheetTemplate
      open
      title="Comparte este dato"
      onClose={nav.closeSheet}
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            icon="share"
            fullWidth
            disabled={busy || Boolean(missing)}
            onClick={() => void exportCard('share')}
          >
            Compartir…
          </Button>
          <Button
            icon="download"
            fullWidth
            disabled={busy || Boolean(missing)}
            onClick={() => void exportCard('download')}
          >
            Descargar imagen
          </Button>
          <Button icon="copy" fullWidth onClick={() => void copyLink()}>
            Copiar enlace
          </Button>
        </>
      }
    >
      {/* A story screen shares its own card; only the identity screens choose what to share. */}
      {slide && slideScreen ? (
        <p className={styles.subject}>
          <Pill number="Esta pantalla">{screenName(slideScreen)}</Pill>
        </p>
      ) : (
        <SegmentedControl
          label="Qué compartes"
          options={WHAT}
          value={what}
          onChange={(v) => setWhat(v as ShareSubject)}
        />
      )}
      <SegmentedControl
        label="Formato"
        options={FORMATS}
        value={format}
        onChange={(v) => setFormat(v as 'story' | 'square')}
      />
      {missing ? (
        <Notice tone="pending">
          {missing}{' '}
          {slide?.status === 'missing' && slide.needs && (
            <Button variant="text" onClick={nav.changeTerritory}>
              {slide.needs === 'municipality' ? 'Elegir municipio' : 'Elegir territorio'}
            </Button>
          )}
          {!slide && blocker?.fix === 'answer' && (
            <Button variant="text" onClick={nav.editAnswers}>
              Responder ahora
            </Button>
          )}
          {!slide && blocker?.fix === 'territory' && (
            <Button variant="text" onClick={nav.changeTerritory}>
              Elegir municipio
            </Button>
          )}
        </Notice>
      ) : (
        <div ref={cardBox}>
          {slide?.status === 'ready' && (
            <SlideCard
              theme={slide.card.screen}
              format={cardFormat === 'post' ? 'post' : 'story'}
              chip={slide.card.chip}
              kicker={slide.card.kicker}
              figure={slide.card.figure}
              figureCaption={slide.card.figureCaption}
              title={slide.card.title}
              bars={slide.card.bars}
              place={slide.card.place}
              period={slide.card.period}
            />
          )}
          {what === 'archetype' && profile && (
            <ArchetypeCard
              archetype={profile.archetype}
              format={cardFormat}
              stat={archetypeStat(profile)}
              {...(placeText ? { place: placeText } : {})}
            />
          )}
          {what === 'badge' && badge && (
            <BadgeCard
              badge={badge}
              you={you}
              generation={cmp.generation}
              format={cardFormat}
              {...(cmp.stateName ? { entity: cmp.stateName } : {})}
              {...(cmp.pace ? { pace: cmp.pace } : {})}
            />
          )}
          {what === 'both' && profile && (
            <DuoCard
              archetype={profile.archetype}
              badge={badge}
              format={cardFormat}
              figure={archetypeStat(profile)}
              you={`${you} · tu generación en ${cmp.stateName ?? '[Entidad]'}: ${cmp.generation}`}
              {...(placeText ? { place: placeText } : {})}
            />
          )}
        </div>
      )}
      <Text variant="meta">
        Imagen PNG de 1080 px. La imagen nunca incluye tus respuestas ni datos personales.
      </Text>
      {answered && (
        <SwitchRow
          icon="user"
          title="Incluir mis respuestas en el enlace"
          description="Quien lo abra verá esta pantalla con tu edad y si votaste en 2018, 2021 y 2024. Apagado, el enlace solo lleva la pantalla y tu territorio."
          checked={withAnswers}
          onChange={setWithAnswers}
        />
      )}
      <p aria-live="polite" role="status">
        <Text variant="meta">{status}</Text>
      </p>
    </SheetTemplate>
  );
}

export { shareBlocker, type ShareBlocker } from '../shared/shareBlocker';
