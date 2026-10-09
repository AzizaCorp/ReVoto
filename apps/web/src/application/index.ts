// Capa de aplicación: casos de uso y puertos. Orquesta el dominio; no conoce React ni fetch.
export type { ParticipacionRepository } from './ports/ParticipacionRepository';
export { DatosNoDisponibles } from './errores';
export { consultarParticipacion, type ResultadoConsulta } from './casos-uso/consultarParticipacion';
export { listarEntidades, listarMunicipios } from './casos-uso/elegirTerritorio';
