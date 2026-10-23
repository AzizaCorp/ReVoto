import type { ReactNode } from 'react';
import { Button } from '@/presentation/components';
import { useNavigation, type ShareSubject } from '@/presentation/providers/Navigation';
import { useShareBlocker } from './shareBlocker';

/**
 * The «Compartir…» button of W-09, W-09b, W-09c and W-10. When the card would miss a figure
 * (DEF-26) it becomes the step that unblocks it: choose a municipality or answer «Sobre ti».
 */
export function ShareAction({
  what,
  children,
  fullWidth = 'mobile',
}: {
  what: ShareSubject;
  children: ReactNode;
  /** Full width on mobile, as the main action of W-09, W-09c and W-10; W-09b keeps it inline. */
  fullWidth?: 'mobile' | false;
}) {
  const nav = useNavigation();
  const blocker = useShareBlocker(what);
  if (!blocker) {
    return (
      <Button
        variant="primary"
        icon="share"
        fullWidth={fullWidth}
        onClick={() => nav.openSheet('W-12', { share: what })}
      >
        {children}
      </Button>
    );
  }
  if (blocker.fix === 'territory') {
    return (
      <Button variant="primary" icon="pin" fullWidth={fullWidth} onClick={nav.changeTerritory}>
        Elige tu municipio para compartir
      </Button>
    );
  }
  if (blocker.fix === 'answer') {
    return (
      <Button variant="primary" icon="star" fullWidth={fullWidth} onClick={() => nav.goTo('W-02b')}>
        Responder «Sobre ti»
      </Button>
    );
  }
  return null;
}
