import { StatusView, Text, UtilityScreen } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

/**
 * W-17 · States catalog (QA only: `#/W-17`). In the app the states are not a screen: each page
 * shows them with `StatusView` depending on the use case result.
 */
export function W17States() {
  const nav = useNavigation();
  return (
    <UtilityScreen title="Estados de pantalla" onBack={() => nav.goTo(nav.lastScreen)}>
      <Text variant="label">A · Cargando</Text>
      <StatusView status="loading" />
      <Text variant="label">B · Error</Text>
      <StatusView status="error" onRetry={() => {}} onLiteVersion={() => nav.goTo('W-15')} />
      <Text variant="label">C · Umbral de publicación</Text>
      <StatusView status="threshold" />
      <Text variant="label">D · Periodo faltante</Text>
      <StatusView status="missing-period" />
      <Text variant="label">E · Sin dato en esa elección</Text>
      <StatusView status="no-data" />
      <Text variant="label">F · Sin dataset</Text>
      <StatusView status="no-dataset" />
    </UtilityScreen>
  );
}
