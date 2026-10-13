// Adapters over the L4 files published in apps/web/public/data, read from disk (tests only).
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  JsonClient,
  JsonGeographyRepository,
  JsonOpenDataRepository,
  JsonQualityRepository,
  JsonTurnoutRepository,
} from '@/infrastructure';

/** Vitest runs from apps/web. */
export const DATA_DIR = `${resolve(process.cwd(), 'public/data')}/`;
export const hasRealData = existsSync(`${DATA_DIR}manifest.json`);

/** fetch over the files on disk: «/data/x» → public/data/x. */
export const fetchFromDisk = (async (url: RequestInfo | URL) => {
  const path = `${DATA_DIR}${String(url).replace(/^\/data\//, '')}`;
  return existsSync(path)
    ? new Response(readFileSync(path, 'utf8'))
    : new Response('', { status: 404 });
}) as typeof fetch;

/** The same dependencies as src/main.tsx, over the files on disk. */
export function realDependencies() {
  const client = new JsonClient('/data', fetchFromDisk);
  return {
    turnout: new JsonTurnoutRepository(client),
    quality: new JsonQualityRepository(client),
    openData: new JsonOpenDataRepository(client),
    geography: new JsonGeographyRepository(client),
  };
}
