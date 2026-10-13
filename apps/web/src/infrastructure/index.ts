// Infrastructure layer: adapters that implement the ports of application.
// Only the composition root (src/main.tsx) imports it.
export { JsonTurnoutRepository } from './static-json/JsonTurnoutRepository';
export { JsonClient } from './static-json/JsonClient';
