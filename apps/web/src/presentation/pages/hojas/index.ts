import type { IdHoja } from '@/presentation/providers/Navegacion';
import { W11Fuente } from './W11Fuente';
import { W12Compartir } from './W12Compartir';
import { W13Ajustes } from './W13Ajustes';

/** Hojas inferiores que se abren sobre cualquier pantalla (manual §7.2). */
export const HOJAS: Record<IdHoja, () => React.JSX.Element> = {
  'W-11': W11Fuente,
  'W-12': W12Compartir,
  'W-13': W13Ajustes,
};
