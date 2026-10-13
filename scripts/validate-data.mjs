#!/usr/bin/env node
// Valida cada JSON de apps/web/public/data contra los esquemas de packages/contracts/schemas.
// Si todavía no hay datos (antes de US-06), termina en verde con un aviso.
import Ajv from 'ajv';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirEsquemas = join(raiz, 'packages', 'contracts', 'schemas');
const dirDatos = join(raiz, 'apps', 'web', 'public', 'data');

const ajv = new Ajv({ allErrors: true, strict: false });
for (const f of readdirSync(dirEsquemas).filter((n) => n.endsWith('.schema.json'))) {
  ajv.addSchema(JSON.parse(readFileSync(join(dirEsquemas, f), 'utf8')));
}

const esquemaPara = (rel) => {
  if (rel === 'manifest.json') return 'manifest.schema.json';
  if (rel.endsWith('/nacional.json')) return 'nacional.schema.json';
  if (rel.endsWith('/catalogos/entidades.json')) return 'entidades.schema.json';
  if (/\/entidad\/\d+\.json$/.test(rel)) return 'entidad.schema.json';
  if (/\/municipio\/\d+-\d{3}\.json$/.test(rel)) return 'municipio.schema.json';
  if (/^\d{8}-[0-9a-f]{7}\/calidad\.json$/.test(rel)) return 'calidad.schema.json';
  if (/\/geo\/(entidades|\d+)\.topo\.json$/.test(rel)) return 'geo.schema.json';
  return null;
};

const listar = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((n) => {
        const ruta = join(dir, n);
        return statSync(ruta).isDirectory() ? listar(ruta) : [ruta];
      })
    : [];

const archivos = listar(dirDatos).filter((f) => f.endsWith('.json'));
if (archivos.length === 0) {
  console.warn('⚠ No hay datos en apps/web/public/data todavía (se generan en US-06).');
  process.exit(0);
}

const errores = [];
for (const archivo of archivos) {
  const rel = relative(dirDatos, archivo).split(sep).join('/');
  const id = esquemaPara(rel);
  if (!id) {
    errores.push(`${rel}: no corresponde a ningún archivo del contrato L4`);
    continue;
  }
  const validar = ajv.getSchema(id);
  if (!validar(JSON.parse(readFileSync(archivo, 'utf8')))) {
    errores.push(`${rel}: ${ajv.errorsText(validar.errors)}`);
  }
}

if (errores.length) {
  console.error(`✖ Datos fuera de contrato:\n  - ${errores.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✔ ${archivos.length} archivos conformes al contrato L4`);
