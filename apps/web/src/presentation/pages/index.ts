import type { IdVista } from '@/presentation/providers/Navegacion';
import { W01Portada } from './W01Portada';
import { W02Territorio } from './W02Territorio';
import { W02bSobreTi } from './W02bSobreTi';
import { W03MexicoVoto } from './W03MexicoVoto';
import { W04TuTerritorio } from './W04TuTerritorio';
import { W05QuinceAnios } from './W05QuinceAnios';
import { W06TuGeneracion } from './W06TuGeneracion';
import { W07MujeresHombres } from './W07MujeresHombres';
import { W08TuLugar } from './W08TuLugar';
import { W09Arquetipo } from './W09Arquetipo';
import { W09bInsignia } from './W09bInsignia';
import { W09cMunicipioYYo } from './W09cMunicipioYYo';
import { W10Resumen } from './W10Resumen';
import { W15Ligera } from './W15Ligera';
import { W16DatosAbiertos } from './W16DatosAbiertos';
import { W17Estados } from './W17Estados';

export { HOJAS } from './hojas';

/** Una página por vista. El orden de la historia lo decide `domain/narrativa`, no este mapa. */
export const PAGINAS: Record<IdVista, () => React.JSX.Element> = {
  'W-01': W01Portada,
  'W-02': W02Territorio,
  'W-02b': W02bSobreTi,
  'W-03': W03MexicoVoto,
  'W-04': W04TuTerritorio,
  'W-05': W05QuinceAnios,
  'W-06': W06TuGeneracion,
  'W-07': W07MujeresHombres,
  'W-08': W08TuLugar,
  'W-09': W09Arquetipo,
  'W-09b': W09bInsignia,
  'W-09c': W09cMunicipioYYo,
  'W-10': W10Resumen,
  'W-15': W15Ligera,
  'W-16': W16DatosAbiertos,
  'W-17': W17Estados,
};
