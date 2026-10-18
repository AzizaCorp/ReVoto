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

// Estructura que publica apps/pipeline (export/exportar_ine_exploratorio.py). Las rutas pueden ir
// dentro de una carpeta de versión (AAAAMMDD-hash7/…) o directamente en public/data.
const sinVersion = (rel) => rel.replace(/^\d{8}-[0-9a-f]{7}\//, '');
const esquemaPara = (rel) => {
  const r = sinVersion(rel);
  if (r === 'manifest.json') return 'manifest.schema.json';
  if (r === 'nacional.json') return 'nacional.schema.json';
  if (r === 'calidad.json') return 'calidad.schema.json';
  if (r === 'catalogos/entidades.json') return 'entidades.schema.json';
  if (/^entidad\/[a-z0-9_-]+\.json$/.test(r)) return 'entidad.schema.json';
  if (/^municipio\/(\d{2}-\d{3}|[a-z0-9-]+\/[A-Za-z0-9_-]+)\.json$/.test(r))
    return 'municipio.schema.json';
  return null;
};

// Archivos del L4 que no tienen JSON Schema propio: geometría TopoJSON, catálogos auxiliares
// y evidencia de validación del pipeline.
const sinEsquema = (rel) =>
  /^(geo\/[a-z0-9_-]+\.topo\.json|catalogos\/archivos-entidades\.json|catalogos\/municipios\/[a-z0-9-]+\.json|validacion\/.+)$/.test(
    sinVersion(rel),
  );

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
  if (!id && sinEsquema(rel)) continue;
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
