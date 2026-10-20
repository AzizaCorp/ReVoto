import { Button, Text } from '../../atoms';
import { Notice } from '../../molecules';
import styles from './StatusView.module.css';

export type Status =
  'loading' | 'error' | 'threshold' | 'missing-period' | 'no-data' | 'no-dataset';

export interface StatusViewProps {
  status: Status;
  /** Territory that was requested, e.g. «Guadalajara, Jalisco». */
  territory?: string;
  onRetry?: () => void;
  onLiteVersion?: () => void;
}

/** Screen states of W-17: loading, error with retry (ALT-01), RN-05 threshold and gaps. */
export function StatusView({
  status,
  territory = '[territorio]',
  onRetry,
  onLiteVersion,
}: StatusViewProps) {
  if (status === 'loading') {
    return (
      <div className={styles.statusView} aria-busy="true">
        <span className={styles.srOnly}>Cargando cifras…</span>
        <i className={[styles.skeleton, styles.title].join(' ')} />
        <i className={styles.skeleton} />
        <i className={[styles.skeleton, styles.short].join(' ')} />
        <i className={[styles.skeleton, styles.block].join(' ')} />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className={styles.statusView}>
        <Notice tone="error" title="Error">
          <Text variant="body">No pudimos cargar las cifras de {territory}.</Text>
          <Text variant="meta">Revisa tu conexión; tus cifras no se perdieron.</Text>
        </Notice>
        <div className={styles.actions}>
          {onRetry && (
            <Button variant="primary" size="small" icon="redo" onClick={onRetry}>
              Reintentar
            </Button>
          )}
          {onLiteVersion && (
            <Button variant="text" size="small" onClick={onLiteVersion}>
              Ver versión ligera
            </Button>
          )}
        </div>
      </div>
    );
  }
  const texts: Record<Exclude<Status, 'loading' | 'error'>, string> = {
    threshold:
      'Mostramos cifras de [Entidad]: el municipio tiene muy pocos registros para publicarlos sin riesgo de identificar a grupos pequeños.',
    'missing-period':
      'Este municipio tiene datos de [año] a 2024. Antes no existía con sus límites actuales.',
    'no-data':
      'En [año], [Municipio] no tiene registros con dato de participación. No es abstención: el registro no trae información.',
    'no-dataset':
      'Las cifras aparecen como —.— % y los mapas con colores de ejemplo hasta conectar el dataset final.',
  };
  return (
    <Notice tone={status === 'no-dataset' ? 'pending' : 'threshold'}>
      <Text variant="meta">{texts[status]}</Text>
    </Notice>
  );
}
