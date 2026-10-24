import { ARCHETYPES, BADGES } from '@/domain';
import { Button, DuoCard, Text } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import { place } from '@/presentation/format';
import layout from './shared/Layout.module.css';
import { ShareAction } from './shared/ShareAction';
import { ageGroupOfAnswer, archetypeStat } from './shared/storyFigures';
import { StoryFrame } from './shared/StoryFrame';

/**
 * W-09c · My municipality and me. Archetype crossed with the badge (30 headlines). Each half
 * that is missing (no municipality or no archetype, no answers) waits with the step that completes
 * it, so the four combinations have their own copy and card.
 */
export function W09cMyMunicipalityAndMe() {
  const nav = useNavigation();
  const { badge, votes, answers } = useProfile();
  const story = useStoryData();
  const wide = useMediaQuery('(min-width: 768px)');
  // The card never previews an archetype the municipality does not have (DEF-26).
  const archetype = story?.profile?.archetype ?? null;
  const t = nav.selected;
  const municipality = t.level === 'municipality' ? t : null;
  const stateName = story?.overview?.state.name ?? null;
  const group = ageGroupOfAnswer(answers.age);
  const expected = group ? story?.overview?.expectedVotes[group] : undefined;
  // No placeholders on the card: the generation shows only when it is known.
  const you =
    expected === undefined || stateName === null
      ? `${votes} de 3`
      : wide
        ? `${votes} de 3 · tu generación en ${stateName}: ${expected.toFixed(1)} de 3`
        : `${votes} de 3 · tu gen. ${expected.toFixed(1)}`;
  const lead =
    archetype && badge
      ? `Juntamos el arquetipo de ${municipality?.name ?? 'tu municipio'} con tu insignia: cada cruce tiene su titular.`
      : archetype
        ? 'Tu municipio ya tiene su mitad. Responde «Sobre ti» para completar la tarjeta con tu insignia.'
        : badge
          ? municipality
            ? `Tu insignia ya tiene su mitad, pero ${municipality.name} aún no tiene arquetipo: tiene menos de 5 elecciones.`
            : 'Tu insignia ya tiene su mitad. Elige tu municipio para completar la tarjeta con su arquetipo.'
          : municipality
            ? `${municipality.name} aún no tiene arquetipo. Responde «Sobre ti» para tener tu mitad de la tarjeta.`
            : 'La tarjeta junta el arquetipo de tu municipio con tu insignia. Elige tu municipio y responde «Sobre ti» para armarla.';
  return (
    <StoryFrame
      pending={Boolean(municipality) && !story}
      label="Mi municipio y yo"
      shareable={false}
      visualFirst
      visual={
        <DuoCard
          archetype={archetype?.archetype ?? null}
          badge={badge}
          format={wide ? 'story' : 'post'}
          you={you}
          {...(municipality ? { place: place(municipality) } : {})}
          {...(archetype ? { figure: archetypeStat(archetype) } : {})}
        />
      }
    >
      <Text variant="h1">Tu municipio y tú, en una tarjeta</Text>
      <Text variant="lead">{lead}</Text>
      <div className={layout.row}>
        {municipality ? (
          <Button size="small" icon="pin" onClick={() => nav.goTo('W-09')}>
            {archetype
              ? `Tu municipio: «${ARCHETYPES[archetype.archetype]}»`
              : 'Tu municipio: sin arquetipo'}
          </Button>
        ) : (
          <Button size="small" icon="pin" onClick={nav.changeTerritory}>
            Tu municipio: elígelo
          </Button>
        )}
        <Button
          size="small"
          icon="star"
          onClick={badge ? () => nav.goTo('W-09b') : nav.editAnswers}
        >
          {badge ? `Tú: «${BADGES[badge]}»` : 'Tú: responde «Sobre ti»'}
        </Button>
      </div>
      {badge ? (
        <ShareAction what="both">Compartir los dos</ShareAction>
      ) : (
        <Button variant="primary" icon="star" fullWidth="mobile" onClick={nav.editAnswers}>
          Responder «Sobre ti»
        </Button>
      )}
    </StoryFrame>
  );
}
