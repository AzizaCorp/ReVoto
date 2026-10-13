import { Boton, Ranura, Texto } from '../../atoms';
import { Aviso } from '../../molecules';
import estilos from './VistaEstado.module.css';

export type Estado =
  'cargando' | 'error' | 'umbral' | 'periodo-faltante' | 'sin-dato' | 'sin-dataset';

export interface VistaEstadoProps {
  estado: Estado;
  /** Territorio que se intentó mostrar, p. ej. «Guadalajara, Jalisco». */
  territorio?: string;
  onReintentar?: () => void;
  onVersionLigera?: () => void;
}

/** Estados de pantalla de W-17: carga, error con reintento (ALT-01), umbral RN-05 y faltantes. */
export function VistaEstado({
  estado,
  territorio = '[territorio]',
  onReintentar,
  onVersionLigera,
}: VistaEstadoProps) {
  if (estado === 'cargando') {
    return (
      <div className={estilos.vistaEstado} aria-busy="true">
        <Texto rol="meta">Cargando cifras…</Texto>
        <Ranura etiqueta="Cargando" alto="chica">
          {' '}
        </Ranura>
        <Ranura etiqueta="Cargando" alto="grande">
          {' '}
        </Ranura>
      </div>
    );
  }
  if (estado === 'error') {
    return (
      <div className={estilos.vistaEstado}>
        <Aviso tono="error" titulo="Error">
          <Texto rol="cuerpo">No pudimos cargar las cifras de {territorio}.</Texto>
          <Texto rol="meta">Revisa tu conexión; tus cifras no se perdieron.</Texto>
        </Aviso>
        <div className={estilos.acciones}>
          {onReintentar && (
            <Boton variante="primario" onClick={onReintentar}>
              Reintentar
            </Boton>
          )}
          {onVersionLigera && <Boton onClick={onVersionLigera}>Versión ligera</Boton>}
        </div>
      </div>
    );
  }
  const textos: Record<Exclude<Estado, 'cargando' | 'error'>, string> = {
    umbral:
      'Mostramos cifras de [Entidad]: el municipio tiene muy pocos registros para publicarlos sin riesgo de identificar a grupos pequeños.',
    'periodo-faltante':
      'Este municipio tiene datos de [año] a 2024. Antes no existía con sus límites actuales.',
    'sin-dato':
      'En [año], [Municipio] no tiene registros con dato de participación. No es abstención: el registro no trae información.',
    'sin-dataset':
      'Las cifras aparecen como —.— % y los mapas con colores de ejemplo hasta conectar el dataset final.',
  };
  return (
    <Aviso tono={estado === 'sin-dataset' ? 'pendiente' : 'umbral'}>
      <Texto rol="meta">{textos[estado]}</Texto>
    </Aviso>
  );
}
