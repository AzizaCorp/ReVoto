// Capa de infraestructura: adaptadores que implementan los puertos de application.
// Solo la importa el punto de composición (src/main.tsx).
export { JsonParticipacionRepository } from './json-estatico/JsonParticipacionRepository';
export { ClienteJson } from './json-estatico/ClienteJson';
