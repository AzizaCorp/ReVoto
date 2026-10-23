import { useRef, useState } from 'react';
import { ARCHETYPES, BADGES } from '@/domain';
import {
  ArchetypeCard,
  BadgeCard,
  Button,
  DuoCard,
  Notice,
  SegmentedControl,
  SheetTemplate,
  Text,
} from '@/presentation/components';
import { place } from '@/presentation/format';
import { useNavigation, type ShareSubject } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import { cardToPng, download, shareOrDownload, slug } from '@/presentation/share/exportCard';
import { useShareBlocker } from '../shared/shareBlocker';
import { archetypeStat, compareWithGeneration } from '../shared/storyFigures';

const WHAT = [
  { value: 'archetype', text: 'Mi arquetipo' },
  { value: 'badge', text: 'Mi insignia' },
  { value: 'both', text: 'Los dos' },
] as const;
const FORMATS = [
  { value: 'story', text: 'Historia 9:16' },
  { value: 'square', text: 'Publicación 1:1' },
] as const;
const FILE: Record<ShareSubject, string> = {
  archetype: 'arquetipo',
  badge: 'insignia',
  both: 'mi-municipio-y-yo',
};
const SCREEN: Record<ShareSubject, string> = { archetype: 'W-09', badge: 'W-09b', both: 'W-09c' };

/**
 * W-12 · Create a card (RF-15, RN-08): the archetype of the chosen municipality, the badge of the
 * person, or both, with real figures. It opens on the card of the button that called it, and
 * downloads or shares it as a 1080 px PNG. Never includes personal data: the answers stay on the
 * device and only the badge name and its comparison are drawn.
 */
export function W12Share() {
  const nav = useNavigation();
  const story = useStoryData();
  const { badge, votes, answers } = useProfile();
  const [what, setWhat] = useState<ShareSubject>(nav.shareSubject);
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const cardBox = useRef<HTMLDivElement>(null);

  const t = nav.selected;
  const profile = story?.profile?.archetype ?? null;
  const placeText = t.level === 'municipality' ? place(t) : undefined;
  const cmp = compareWithGeneration(story, votes, answers.age);
  const cardFormat = format === 'square' ? 'post' : 'story';
  const you = `${votes} de 3`;

  const blocker = useShareBlocker(what);
  const missing = blocker?.text ?? null;

  const name = `revoto-${FILE[what]}${placeText ? `-${slug(t.name)}` : ''}-${format === 'square' ? '1x1' : '9x16'}.png`;
  const caption =
    what === 'badge'
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
    const url = `${location.origin}${location.pathname}#/${SCREEN[what]}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Enlace copiado.');
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
      <SegmentedControl
        label="Qué compartes"
        options={WHAT}
        value={what}
        onChange={(v) => setWhat(v as ShareSubject)}
      />
      <SegmentedControl
        label="Formato"
        options={FORMATS}
        value={format}
        onChange={(v) => setFormat(v as 'story' | 'square')}
      />
      {missing ? (
        <Notice tone="pending">
          {missing}{' '}
          {blocker?.fix === 'answer' && (
            <Button variant="text" onClick={nav.editAnswers}>
              Responder ahora
            </Button>
          )}
          {blocker?.fix === 'territory' && (
            <Button variant="text" onClick={nav.changeTerritory}>
              Elegir municipio
            </Button>
          )}
        </Notice>
      ) : (
        <div ref={cardBox}>
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
        Imagen PNG de 1080 px. Nunca incluye datos personales: tus respuestas no salen de tu
        teléfono.
      </Text>
      <p aria-live="polite" role="status">
        <Text variant="meta">{status}</Text>
      </p>
    </SheetTemplate>
  );
}

export { shareBlocker, type ShareBlocker } from '../shared/shareBlocker';
