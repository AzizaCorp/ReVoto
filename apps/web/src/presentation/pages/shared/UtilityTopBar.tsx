import { TopBar } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

/** Top bar for utility screens that are still part of the story (W-02, W-02b, W-10). */
export function UtilityTopBar() {
  const nav = useNavigation();
  return (
    <TopBar
      progress={nav.progress}
      stepName={nav.stepName ?? undefined}
      onSettings={() => nav.openSheet('W-13')}
    />
  );
}
