import { useEffect, useRef, useState } from 'react';
import { next, previous, progress, storyLength, type ScreenId } from '@/domain';
import { LiteScreen } from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import { place } from '@/presentation/format';
import { useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import { liteStep } from './lite/LiteSteps';
import styles from './lite/Lite.module.css';

/**
 * W-15 · Lite version (RF-18): the same story as text and tables, ≤ 500 KB. Each sequence screen
 * has its own lite step (boards WL/TL/DL on the «secuencia» page); it starts where the person was.
 */
export function W15Lite() {
  const nav = useNavigation();
  const profile = useProfile();
  const story = useStoryData();
  const wide = useMediaQuery('(min-width: 768px)');
  const [id, setId] = useState<ScreenId>(nav.lastScreen);
  const [answersReturnTo, setAnswersReturnTo] = useState<ScreenId | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    // Move focus to the new heading so screen readers announce the step (not on first render).
    if (first.current) first.current = false;
    else title.current?.focus();
  }, [id]);

  const show = (target: ScreenId) => {
    if (target !== 'W-02b') setAnswersReturnTo(null);
    setId(nav.sequence.screens.includes(target) ? target : (next(nav.sequence, target) ?? 'W-01'));
    window.scrollTo?.(0, 0);
  };
  const step = liteStep(id, {
    show,
    screens: storyLength(nav.sequence),
    editAnswers: () => {
      if (id !== 'W-02b') setAnswersReturnTo(id);
      show('W-02b');
    },
    answersReturnTo,
    open: nav.goTo,
    wide,
    answers: profile.answers,
    answer: profile.answer,
    badge: profile.badge,
    votes: profile.votes,
    territory: nav.selected,
    story,
    choose: nav.chooseTerritory,
  });
  const previousId = previous(nav.sequence, id);
  const nextId = next(nav.sequence, id);
  const position = progress(nav.sequence, id).text;

  return (
    <LiteScreen
      onFullVersion={() => nav.goTo(id)}
      onSource={step.source ? () => nav.openSheet('W-11') : undefined}
      footer={
        <>
          <button
            type="button"
            className={styles.navLink}
            disabled={!previousId}
            onClick={() => previousId && show(previousId)}
          >
            ‹ Anterior
          </button>
          {nextId ? (
            <button type="button" className={styles.navLink} onClick={() => show(nextId)}>
              Siguiente ›
            </button>
          ) : (
            <span className={styles.end}>Fin</span>
          )}
        </>
      }
    >
      <p className={styles.meta}>
        {id === 'W-01' ? step.label : `${position} · ${step.label}`}
        {step.territory && (
          <>
            {` · ${place(nav.selected)} · `}
            <button type="button" className={styles.link} onClick={() => show('W-02')}>
              cambiar
            </button>
          </>
        )}
      </p>
      <h1 ref={title} tabIndex={-1} className={styles.title}>
        {step.title}
      </h1>
      {step.body}
      {step.source && (
        <p className={styles.meta}>
          Fuente: INE, conteos censales 2009–2024. Fórmula: votaron ÷ (lista nominal − sin dato).{' '}
          <button type="button" className={styles.link} onClick={() => nav.openSheet('W-11')}>
            Ver fuente
          </button>
        </p>
      )}
    </LiteScreen>
  );
}
