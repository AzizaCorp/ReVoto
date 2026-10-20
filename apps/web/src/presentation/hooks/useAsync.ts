import { useCallback, useEffect, useState, type DependencyList } from 'react';

export type AsyncState<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: unknown };

/**
 * Runs a use case and follows its state. Ignores a stale answer when the inputs change
 * before it arrives; `retry` runs it again (W-17).
 */
export function useAsync<T>(
  run: () => Promise<T>,
  deps: DependencyList,
): AsyncState<T> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    run().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error: unknown) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return { ...state, retry };
}
