import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

const AUXILIARY: readonly AuxiliaryViewId[] = ['W-15', 'W-16', 'W-17', 'W-18', 'W-19'];

export interface Navigation {
  sequence: Sequence;
  currentView: ViewId;
  /** Last story screen visited (the lite version uses it to continue from there). */
  lastScreen: ScreenId;
  progress: Progress | null;
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
  openSheet: (sheet: SheetId) => void;
  closeSheet: () => void;
  /** Opens W-02 from the chip and remembers where to come back to (HU-28). */
  changeTerritory: () => void;
  /** Leaves W-02: goes back to the screen of origin, or moves on if it was reached in order. */
  confirmTerritory: () => void;
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
  const [returnTo, setReturnTo] = useState<ScreenId | null>(null);
  const [selected, setSelected] = useState<Territory>(NATIONAL);

  const goTo = useCallback((id: ViewId) => {
    setSheet(null);
    setCurrent(id);
    if (isScreen(id)) setLastScreen(id);
  }, []);

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
      openSheet: setSheet,
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
    };
  }, [sequence, current, lastScreen, sheet, goTo, returnTo, selected]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNavigation(): Navigation {
  const n = useContext(Context);
  if (!n) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return n;
}
