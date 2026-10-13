import { Button, Notice, OptionGroup, UtilityScreen } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';
import { QUESTIONS, useProfile } from '@/presentation/providers/Profile';
import { useStepNumber } from './shared/StoryFrame';
import { UtilityTopBar } from './shared/UtilityTopBar';

/** W-02b · About you (optional). Four questions for the badge; nothing leaves the device. */
export function W02bAboutYou() {
  const nav = useNavigation();
  const { answers, answer } = useProfile();
  const number = useStepNumber();
  return (
    <UtilityScreen
      top={<UtilityTopBar />}
      label="Sobre ti · Opcional"
      number={number}
      title="Cuéntanos de ti"
      lead="4 toques y al final te damos tu insignia, comparada con tu generación en [Entidad]."
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            trailingIcon="→"
            fullWidth
            onClick={nav.next ?? undefined}
          >
            Ver mis cifras
          </Button>
          <Button size="small" icon="←" onClick={nav.previous ?? undefined}>
            Anterior
          </Button>
          <Button variant="text" onClick={nav.next ?? undefined}>
            Saltar
          </Button>
        </>
      }
    >
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
    </UtilityScreen>
  );
}
