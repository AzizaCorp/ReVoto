import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  assignBadge,
  votesCount,
  type BadgeId,
  type VoteAnswer,
  type VotingHistory,
} from '@/domain';

/** W-02b questions (shown in Spanish). Answers live only in memory: never stored or sent. */
export const QUESTIONS = [
  {
    key: 'age',
    text: '1. ¿En qué rango de edad estás?',
    options: ['18–24', '25–34', '35–44', '45–59', '60 +', 'Prefiero no decir'],
  },
  {
    key: 'voted2018',
    text: '2. ¿Votaste en 2018? · presidencial',
    options: ['Sí', 'No', 'No podía', 'No recuerdo'],
  },
  {
    key: 'voted2021',
    text: '3. ¿Votaste en 2021? · intermedia',
    options: ['Sí', 'No', 'No podía', 'No recuerdo'],
  },
  {
    key: 'voted2024',
    text: '4. ¿Votaste en 2024? · presidencial',
    options: ['Sí', 'No', 'No podía', 'No recuerdo'],
  },
] as const;

export type QuestionKey = (typeof QUESTIONS)[number]['key'];
export type Answers = Record<QuestionKey, string | null>;

const EMPTY: Answers = { age: null, voted2018: null, voted2021: null, voted2024: null };

interface Profile {
  answers: Answers;
  answer: (key: QuestionKey, value: string) => void;
  /** The three voting questions are answered: a badge can be assigned. */
  complete: boolean;
  /** Badge from the answers (domain rule), or `null` while they are incomplete. */
  badge: BadgeId | null;
  /** Elections in which the person voted (0 to 3). */
  votes: number;
}

const VOTE: Record<string, VoteAnswer> = {
  Sí: 'voted',
  No: 'did-not-vote',
  'No podía': 'could-not',
  'No recuerdo': 'unknown',
};
const history = (a: Answers): VotingHistory => ({
  2018: VOTE[a.voted2018 ?? ''] ?? 'unknown',
  2021: VOTE[a.voted2021 ?? ''] ?? 'unknown',
  2024: VOTE[a.voted2024 ?? ''] ?? 'unknown',
});

const Context = createContext<Profile | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const value = useMemo<Profile>(() => {
    const complete = Boolean(answers.voted2018 && answers.voted2021 && answers.voted2024);
    return {
      answers,
      answer: (key, v) => setAnswers((a) => ({ ...a, [key]: v })),
      complete,
      badge: complete ? assignBadge(history(answers)) : null,
      votes: votesCount(history(answers)),
    };
  }, [answers]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useProfile(): Profile {
  const p = useContext(Context);
  if (!p) throw new Error('useProfile must be used inside <ProfileProvider>');
  return p;
}
