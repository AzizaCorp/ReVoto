import { Notice, OptionGroup, Text } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { QUESTIONS, useProfile } from '@/presentation/providers/Profile';
import { useStoryData } from '@/presentation/providers/Story';
import { StoryFrame } from './shared/StoryFrame';

/**
 * W-02b · About you (optional). Four questions for the badge; nothing leaves the device. It uses
 * the same frame as the rest of the story (DEF-23): progress on top, ‹ › at the bottom. Opened
 * from another screen, the main button goes back to it (DEF-25).
 */
export function W02bAboutYou() {
  const story = useStoryData();
  const nav = useNavigation();
  const { answers, answer } = useProfile();
  // Opened from «Cambiar respuestas»: the main button goes back there (DEF-25).
  const returning = nav.answersReturnTo !== null;
  const answered = QUESTIONS.some((q) => answers[q.key] !== null);
  const stateName = story?.overview?.state.name ?? null;
  return (
    <StoryFrame
      label="Sobre ti · Opcional"
      hasSource={false}
      shareable={false}
      nextLabel={returning ? 'Guardar y volver' : answered ? 'Ver mis cifras' : 'Saltar'}
      onNext={nav.doneAnswers}
    >
      <Text variant="h1">Cuéntanos de ti</Text>
      <Text variant="lead">
        {stateName
          ? `4 toques y al final te damos tu insignia, comparada con tu generación en ${stateName}.`
          : '4 toques y al final te damos tu insignia, comparada con tu generación.'}
      </Text>
      {QUESTIONS.map((q) => (
        <OptionGroup
          key={q.key}
          question={q.text}
          options={q.options}
          selected={answers[q.key]}
          onSelect={(v) => answer(q.key, v)}
        />
      ))}
      <Notice>
        Tus respuestas se quedan en tu teléfono: no las guardamos ni las enviamos. Solo sirven para
        darte tu insignia.
      </Notice>
    </StoryFrame>
  );
}
