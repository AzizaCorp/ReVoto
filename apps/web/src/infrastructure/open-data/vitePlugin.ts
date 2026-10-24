// Vite plugin that publishes the open data downloads (W-16) next to the L4 files:
// dist/data/descargas/*.csv|json at build time, and the same paths from memory in `vite dev`.
// It reads public/data from disk, so it only runs in Node (vite.config.ts), never in the browser.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import type {
  DatosEntidadDto,
  DatosMunicipioDto,
  EntidadDto,
  SerieNacionalDto,
} from '@revoto/contracts';
import { DOWNLOADS_DIR, openDataFiles, type OpenDataInput } from './buildOpenData';

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

/** Reads the L4 copy following the catalog and the `archivo` fields, as the app does. */
export function readOpenDataInput(dataDir: string): OpenDataInput | null {
  if (!existsSync(join(dataDir, 'catalogos', 'entidades.json'))) return null;
  const catalog = readJson<EntidadDto[]>(join(dataDir, 'catalogos', 'entidades.json'));
  const states = catalog.flatMap((entry) =>
    entry.archivo ? [{ entry, data: readJson<DatosEntidadDto>(join(dataDir, entry.archivo)) }] : [],
  );
  const municipalities = states.flatMap(({ data }) =>
    data.municipios.flatMap((m) =>
      m.archivo && existsSync(join(dataDir, m.archivo))
        ? [readJson<DatosMunicipioDto>(join(dataDir, m.archivo))]
        : [],
    ),
  );
  return {
    national: readJson<SerieNacionalDto>(join(dataDir, 'nacional.json')),
    states,
    municipalities,
  };
}

const TYPES: Record<string, string> = {
  csv: 'text/csv; charset=utf-8',
  json: 'application/json; charset=utf-8',
};

export function openDataPlugin(dataDir: string): Plugin {
  let cache: Record<string, string> | null = null;
  const files = () => {
    if (!cache) {
      const input = readOpenDataInput(dataDir);
      cache = input ? openDataFiles(input) : {};
    }
    return cache;
  };
  return {
    name: 'revoto-open-data',
    configureServer(server) {
      server.middlewares.use(`/data/${DOWNLOADS_DIR}/`, (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').replace(/^\//, '').split('?')[0] ?? '');
        const body = files()[name];
        if (body === undefined) return next();
        res.setHeader('Content-Type', TYPES[name.split('.').pop() ?? ''] ?? 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        res.end(body);
      });
    },
    generateBundle() {
      for (const [name, source] of Object.entries(files())) {
        this.emitFile({ type: 'asset', fileName: `data/${DOWNLOADS_DIR}/${name}`, source });
      }
    },
  };
}
