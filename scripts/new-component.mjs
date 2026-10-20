#!/usr/bin/env node
// Atomic Design component generator for apps/web (code in English, UI copy in Spanish).
// Usage: npm run ui:nuevo -- <atom|molecule|organism|template> <PascalCaseName>
// The Spanish level names (atomo, molecula, organismo, plantilla) are still accepted.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEVELS = {
  atom: 'atoms',
  molecule: 'molecules',
  organism: 'organisms',
  template: 'templates',
  atomo: 'atoms',
  molecula: 'molecules',
  organismo: 'organisms',
  plantilla: 'templates',
};

const [levelArg, name] = process.argv.slice(2);
const levelFolder = LEVELS[levelArg];

if (!levelFolder || !name) {
  console.error('Usage: npm run ui:nuevo -- <atom|molecule|organism|template> <PascalCaseName>');
  process.exit(1);
}
if (!/^[A-Z][A-Za-z0-9]+$/.test(name)) {
  console.error(
    `"${name}" must be PascalCase, in English, without accents or spaces (e.g. TerritoryChip).`,
  );
  process.exit(1);
}

const root = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'apps',
  'web',
  'src',
  'presentation',
  'components',
  levelFolder,
);
const target = join(root, name);
if (existsSync(target)) {
  console.error(`${target} already exists`);
  process.exit(1);
}
mkdirSync(target, { recursive: true });

const className = name.charAt(0).toLowerCase() + name.slice(1);

writeFileSync(
  join(target, `${name}.tsx`),
  `import type { ReactNode } from 'react';
import styles from './${name}.module.css';

export interface ${name}Props {
  children?: ReactNode;
}

/** TODO: describe the purpose, the wireframe (W-NN) and the requirement it covers. */
export function ${name}({ children }: ${name}Props) {
  return <div className={styles.${className}}>{children}</div>;
}
`,
);

writeFileSync(
  join(target, `${name}.module.css`),
  `/* Only tokens from presentation/styles/tokens.css: no literal values. */
.${className} {
  font-family: var(--rv-font);
}
`,
);

writeFileSync(
  join(target, `${name}.test.tsx`),
  `import { render, screen } from '@testing-library/react';
import { ${name} } from './${name}';

describe('${name}', () => {
  it('renders its content', () => {
    render(<${name}>contenido</${name}>);
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });
});
`,
);

writeFileSync(join(target, 'index.ts'), `export * from './${name}';\n`);

const barrel = join(root, 'index.ts');
const current = readFileSync(barrel, 'utf8').replace(/^export \{\};\s*$/m, '');
writeFileSync(barrel, `${current.trimEnd()}\nexport * from './${name}';\n`);

console.log(`✔ ${levelFolder}/${name} created and exported from @/presentation/components`);
