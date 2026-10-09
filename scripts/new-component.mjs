#!/usr/bin/env node
// Generador de componentes de Atomic Design.
// Uso: npm run ui:nuevo -- <atomo|molecula|organismo|plantilla> <NombreEnPascalCase>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NIVELES = {
  atomo: 'atoms',
  molecula: 'molecules',
  organismo: 'organisms',
  plantilla: 'templates',
};

const [nivelArg, nombre] = process.argv.slice(2);
const carpetaNivel = NIVELES[nivelArg];

if (!carpetaNivel || !nombre) {
  console.error(
    'Uso: npm run ui:nuevo -- <atomo|molecula|organismo|plantilla> <NombreEnPascalCase>',
  );
  process.exit(1);
}
if (!/^[A-Z][A-Za-z0-9]+$/.test(nombre)) {
  console.error(
    `"${nombre}" debe ir en PascalCase, sin acentos, ñ ni espacios (ej. ChipTerritorio).`,
  );
  process.exit(1);
}

const raiz = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'apps',
  'web',
  'src',
  'presentation',
  'components',
  carpetaNivel,
);
const destino = join(raiz, nombre);
if (existsSync(destino)) {
  console.error(`Ya existe ${destino}`);
  process.exit(1);
}
mkdirSync(destino, { recursive: true });

const clase = nombre.charAt(0).toLowerCase() + nombre.slice(1);

writeFileSync(
  join(destino, `${nombre}.tsx`),
  `import type { ReactNode } from 'react';
import estilos from './${nombre}.module.css';

export interface ${nombre}Props {
  children?: ReactNode;
}

/** TODO: describir el propósito, el wireframe (W-NN) y el requisito que cubre. */
export function ${nombre}({ children }: ${nombre}Props) {
  return <div className={estilos.${clase}}>{children}</div>;
}
`,
);

writeFileSync(
  join(destino, `${nombre}.module.css`),
  `/* Solo tokens de presentation/styles/tokens.css: nada de valores literales. */
.${clase} {
  font-family: var(--rv-fuente);
}
`,
);

writeFileSync(
  join(destino, `${nombre}.test.tsx`),
  `import { render, screen } from '@testing-library/react';
import { ${nombre} } from './${nombre}';

describe('${nombre}', () => {
  it('renderiza su contenido', () => {
    render(<${nombre}>contenido</${nombre}>);
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });
});
`,
);

writeFileSync(join(destino, 'index.ts'), `export * from './${nombre}';\n`);

const barril = join(raiz, 'index.ts');
const actual = readFileSync(barril, 'utf8').replace(/^export \{\};\s*$/m, '');
writeFileSync(barril, `${actual.trimEnd()}\nexport * from './${nombre}';\n`);

console.log(`✔ ${carpetaNivel}/${nombre} creado y exportado desde @/presentation/components`);
