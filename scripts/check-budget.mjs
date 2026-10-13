#!/usr/bin/env node
// Verifica los presupuestos de peso de budget.json (RNF-01, RNF-04).
// 1. App: archivos de apps/web/dist sin data/, comprimidos con gzip, ≤ app_inicial_kb.
// 2. Datos: cada entidad/*.json ≤ entidad_kb y cada municipio/*.json ≤ municipio_kb (sin comprimir).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const presupuesto = JSON.parse(readFileSync(join(raiz, 'budget.json'), 'utf8'));
const KB = 1024;
const errores = [];

const listar = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((n) => {
        const ruta = join(dir, n);
        return statSync(ruta).isDirectory() ? listar(ruta) : [ruta];
      })
    : [];

// 1 · App
const dist = join(raiz, 'apps', 'web', 'dist');
if (!existsSync(dist)) {
  console.warn('⚠ apps/web/dist no existe: ejecuta "npm run build" antes de este check.');
} else {
  const archivosApp = listar(dist).filter((f) => !relative(dist, f).startsWith(`data${sep}`));
  const total = archivosApp.reduce((s, f) => s + gzipSync(readFileSync(f)).length, 0);
  const kb = (total / KB).toFixed(1);
  console.log(`App inicial (gzip): ${kb} KB / ${presupuesto.app_inicial_kb} KB`);
  if (total > presupuesto.app_inicial_kb * KB) errores.push(`App inicial ${kb} KB excede RNF-01`);
}

// 2 · Datos
const datos = join(raiz, 'apps', 'web', 'public', 'data');
for (const archivo of listar(datos).filter((f) => f.endsWith('.json'))) {
  const rel = relative(datos, archivo).split(sep).join('/');
  const tam = statSync(archivo).size;
  const limite = rel.endsWith('/geo/municipios.topo.json')
    ? presupuesto.mapa_nacional_kb
    : rel.includes('/entidad/') || rel.includes('/geo/') || rel.includes('/mapa/')
    ? presupuesto.entidad_kb
    : rel.includes('/municipio/')
      ? presupuesto.municipio_kb
      : null;
  if (limite !== null && tam > limite * KB) {
    errores.push(`${rel}: ${(tam / KB).toFixed(1)} KB excede ${limite} KB (RNF-04)`);
  }
}

if (errores.length) {
  console.error(`✖ Presupuesto excedido:\n  - ${errores.join('\n  - ')}`);
  process.exit(1);
}
console.log('✔ Presupuestos de peso dentro del límite');
