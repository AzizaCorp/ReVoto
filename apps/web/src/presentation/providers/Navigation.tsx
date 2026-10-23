import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createSequence,
  next as nextOf,
  previous as previousOf,
  progress as progressOf,
  screenFromText,
  screenName,
  type Progress,
  type ScreenId,
  type Sequence,
  NATIONAL,
  type Territory,
} from '@/domain';

/** Views outside the sequence: lite version, open data, states catalog, methodology, dictionary. */
export type AuxiliaryViewId = 'W-15' | 'W-16' | 'W-17' | 'W-18' | 'W-19';
export type ViewId = ScreenId | AuxiliaryViewId;
/** Bottom sheets that open on top of any screen. */
export type SheetId = 'W-11' | 'W-12' | 'W-13' | 'W-20';
/** What the share sheet (W-12) starts with: the archetype, the badge or both cards. */
export type ShareSubject = 'archetype' | 'badge' | 'both';

const AUXILIARY: readonly AuxiliaryViewId[] = ['W-15', 'W-16', 'W-17', 'W-18', 'W-19'];

export interface Navigation {
  sequence: Sequence;
  currentView: ViewId;
  /** Last story screen visited (the lite version uses it to continue from there). */
  lastScreen: ScreenId;
  progress: Progress | null;
  /** How the current screen was reached; the top bar plays its fill in reverse going back (DEF-29). */
  direction: 'forward' | 'back';
  stepName: string | null;
  sheet: SheetId | null;
  /** Label of the chosen territory: «Ciudad de México · Iztacalco», «Jalisco» or «Nacional». */
  territory: string;
  /** Territory chosen in W-02 (national until the person picks one). Never stored (RNF-13). */
  selected: Territory;
  chooseTerritory: (t: Territory) => void;
  goTo: (id: ViewId) => void;
  /** `null` at the ends (HU-10: no wrap-around). */
  next: (() => void) | null;
  previous: (() => void) | null;
  /** `share` preselects the card when opening W-12 (W-09 → archetype, W-09b → badge, W-09c → both). */
  openSheet: (sheet: SheetId, options?: { share?: ShareSubject }) => void;
  /** Card chosen by the button that opened W-12. */
  shareSubject: ShareSubject;
  closeSheet: () => void;
  /** Opens W-02 from the chip and remembers where to come back to (HU-28). */
  changeTerritory: () => void;
  /** Leaves W-02: goes back to the screen of origin, or moves on if it was reached in order. */
  confirmTerritory: () => void;
  /** Opens W-02b from «Cambiar respuestas» or «Responder ahora» and remembers the origin (DEF-25). */
  editAnswers: () => void;
  /** Screen W-02b will go back to, or null when it was reached in order. */
  answersReturnTo: ScreenId | null;
  /** Leaves W-02b: back to the screen of origin, or on to the next screen. */
  doneAnswers: () => void;
}

const Context = createContext<Navigation | null>(null);

function viewFromHash(hash: string): ViewId | null {
  const text = hash.replace(/^#\/?/, '');
  const aux = AUXILIARY.find((a) => a === text.toUpperCase());
  return aux ?? screenFromText(text);
}

const isScreen = (v: ViewId): v is ScreenId => !AUXILIARY.includes(v as AuxiliaryViewId);

/**
 * Sequence engine (US-09). The URL reflects the screen (`#/W-03`) so the browser's back button
 * works and a screen can be opened directly. It never advances on its own (HU-10).
 */
export function NavigationProvider({
  children,
  sequence: initialSequence,
}: {
  children: ReactNode;
  sequence?: Sequence;
}) {
  const sequence = useMemo(() => initialSequence ?? createSequence(), [initialSequence]);
  const [current, setCurrent] = useState<ViewId>(
    () => viewFromHash(window.location.hash) ?? 'W-01',
  );
  const [lastScreen, setLastScreen] = useState<ScreenId>(isScreen(current) ? current : 'W-01');
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [shareSubject, setShareSubject] = useState<ShareSubject>('archetype');
  const [returnTo, setReturnTo] = useState<ScreenId | null>(null);
  const [answersReturnTo, setAnswersReturnTo] = useState<ScreenId | null>(null);
  const [selected, setSelected] = useState<Territory>(NATIONAL);

  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const currentRef = useRef(current);

  const goTo = useCallback(
    (id: ViewId) => {
      const from = sequence.screens.indexOf(currentRef.current as ScreenId);
      const to = sequence.screens.indexOf(id as ScreenId);
      // The hash echo of a move lands on the same screen and keeps the direction.
      if (to !== from) setDirection(from >= 0 && to >= 0 && to < from ? 'back' : 'forward');
      currentRef.current = id;
      setSheet(null);
      setCurrent(id);
      if (isScreen(id)) setLastScreen(id);
      // Leaving «Sobre ti» by any other way forgets the pending return.
      if (id !== 'W-02b') setAnswersReturnTo(null);
    },
    [sequence],
  );

  // URL ↔ state
  useEffect(() => {
    const target = `#/${current}`;
    if (window.location.hash !== target) window.location.hash = target;
  }, [current]);
  useEffect(() => {
    const onHashChange = () => {
      const v = viewFromHash(window.location.hash);
      if (v) goTo(v);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [goTo]);

  const value = useMemo<Navigation>(() => {
    const inSequence = isScreen(current) && sequence.screens.includes(current);
    const nextId = inSequence ? nextOf(sequence, current) : null;
    const previousId = inSequence ? previousOf(sequence, current) : null;
    return {
      sequence,
      currentView: current,
      lastScreen,
      progress: inSequence ? progressOf(sequence, current) : null,
      direction,
      stepName: isScreen(current) ? screenName(current) : null,
      sheet,
      territory:
        selected.level === 'municipality'
          ? `${selected.stateName} · ${selected.name}`
          : selected.name,
      selected,
      chooseTerritory: setSelected,
      goTo,
      next: nextId ? () => goTo(nextId) : null,
      previous: previousId ? () => goTo(previousId) : null,
      openSheet: (id, options) => {
        setShareSubject(options?.share ?? 'archetype');
        setSheet(id);
      },
      shareSubject,
      closeSheet: () => setSheet(null),
      changeTerritory: () => {
        if (isScreen(current) && current !== 'W-02') setReturnTo(current);
        goTo('W-02');
      },
      confirmTerritory: () => {
        const target = returnTo ?? nextOf(sequence, 'W-02') ?? 'W-03';
        setReturnTo(null);
        goTo(target);
      },
      editAnswers: () => {
        if (isScreen(current) && current !== 'W-02b') setAnswersReturnTo(current);
        goTo('W-02b');
      },
      answersReturnTo,
      doneAnswers: () => {
        const target = answersReturnTo ?? nextOf(sequence, 'W-02b') ?? 'W-03';
        goTo(target);
      },
    };
  }, [
    sequence,
    current,
    lastScreen,
    direction,
    sheet,
    goTo,
    returnTo,
    answersReturnTo,
    selected,
    shareSubject,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNavigation(): Navigation {
  const n = useContext(Context);
  if (!n) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return n;
}
