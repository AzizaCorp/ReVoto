// STD-MENSAJES-COMMIT v0.3 · configuración de referencia ajustada al monorepo de ReVoto.
// Ajustar solo estas tres constantes (y registrarlas en el Plan de CM del proyecto).
const COMPONENTES = ['web', 'contracts', 'pipeline', 'docs', 'infra'];
const ID_PREFIJOS = ['US', 'TSK', 'DEF'];
const COMPONENTE_OBLIGATORIO = true; // monorepo: el alcance siempre lleva componente

const componente = `(${COMPONENTES.join('|')}):`;
const scopeRegex = new RegExp(
  `^${COMPONENTE_OBLIGATORIO ? componente : `(${componente})?`}` +
    `(${ID_PREFIJOS.join('|')})-\\d+$|^(release|deps)$`,
);

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'scope-miwa': ({ scope }) => [
          scopeRegex.test(scope ?? ''),
          `el alcance debe ser componente:ID (${COMPONENTES.join(', ')} · ${ID_PREFIJOS.join(', ')}), release o deps`,
        ],
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'data',
        'perf',
        'refactor',
        'style',
        'test',
        'docs',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-empty': [2, 'never'],
    'scope-case': [0],
    'scope-miwa': [2, 'always'],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'subject-full-stop': [2, 'never', '.'],
  },
};
