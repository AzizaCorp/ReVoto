// ESLint (flat config) del monorepo.
// Además de TypeScript, React y accesibilidad, aquí se hacen cumplir dos reglas de arquitectura:
//   1. DDD: cada capa de apps/web solo depende de las capas interiores (ver ADR-0003).
//   2. Atomic Design: dentro de presentation/components, un nivel solo usa niveles inferiores.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

const carpeta = (nombre) => [`**/${nombre}`, `**/${nombre}/**`];
const regla = (mensaje, ...grupos) => ({ group: grupos.flat(), message: mensaje });
const restringir = (...patrones) => ({
  'no-restricted-imports': ['error', { patterns: patrones }],
});

const SIN_REACT = regla('Esta capa no conoce React.', [
  'react',
  'react-dom',
  'react/**',
  'react-dom/**',
]);
const SIN_CONTRATO = regla(
  'Los DTO del contrato L4 solo se usan en infrastructure; aquí usa el modelo de dominio.',
  ['@revoto/contracts', '@revoto/contracts/**'],
);
const SIN_INFRA = regla(
  'No importes infrastructure: recibe los adaptadores por inyección (main.tsx).',
  carpeta('infrastructure'),
);
const SIN_PRESENTACION = regla(
  'Las capas internas no conocen la presentación.',
  carpeta('presentation'),
);
const SIN_APLICACION = regla(
  'El dominio no depende de casos de uso ni puertos.',
  carpeta('application'),
);

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'apps/web/public/data/**',
      'apps/pipeline/**',
      'design/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // ── DDD: regla de dependencias de apps/web ────────────────────────────────
  {
    files: ['apps/web/src/domain/**/*.ts'],
    rules: {
      ...restringir(SIN_APLICACION, SIN_INFRA, SIN_PRESENTACION, SIN_REACT, SIN_CONTRATO),
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'El dominio es puro: sin E/S.' },
      ],
    },
  },
  {
    files: ['apps/web/src/application/**/*.ts'],
    rules: {
      ...restringir(SIN_INFRA, SIN_PRESENTACION, SIN_REACT, SIN_CONTRATO),
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'La E/S va en un adaptador de infrastructure detrás de un puerto.',
        },
      ],
    },
  },
  {
    files: ['apps/web/src/infrastructure/**/*.ts'],
    rules: restringir(SIN_PRESENTACION, SIN_REACT),
  },
  {
    files: ['apps/web/src/presentation/**/*.{ts,tsx}'],
    rules: {
      ...restringir(SIN_INFRA, SIN_CONTRATO),
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Pide los datos a un caso de uso de application.' },
      ],
    },
  },

  // ── Atomic Design dentro de presentation/components ───────────────────────
  {
    files: ['apps/web/src/presentation/components/**/*.{ts,tsx}'],
    rules: restringir(
      SIN_INFRA,
      SIN_CONTRATO,
      regla(
        'Un componente es presentacional: recibe datos por props, no ejecuta casos de uso ni conoce páginas.',
        carpeta('application'),
        carpeta('pages'),
        carpeta('providers'),
      ),
    ),
  },
  {
    files: ['apps/web/src/presentation/components/atoms/**/*.{ts,tsx}'],
    rules: restringir(
      SIN_INFRA,
      SIN_CONTRATO,
      regla(
        'Un átomo no puede usar moléculas, organismos ni plantillas.',
        carpeta('molecules'),
        carpeta('organisms'),
        carpeta('templates'),
      ),
      regla(
        'Un componente es presentacional.',
        carpeta('application'),
        carpeta('pages'),
        carpeta('providers'),
      ),
    ),
  },
  {
    files: ['apps/web/src/presentation/components/molecules/**/*.{ts,tsx}'],
    rules: restringir(
      SIN_INFRA,
      SIN_CONTRATO,
      regla('Una molécula solo se compone de átomos.', carpeta('organisms'), carpeta('templates')),
      regla(
        'Un componente es presentacional.',
        carpeta('application'),
        carpeta('pages'),
        carpeta('providers'),
      ),
    ),
  },
  {
    files: ['apps/web/src/presentation/components/organisms/**/*.{ts,tsx}'],
    rules: restringir(
      SIN_INFRA,
      SIN_CONTRATO,
      regla('Un organismo no puede usar plantillas.', carpeta('templates')),
      regla(
        'Un componente es presentacional.',
        carpeta('application'),
        carpeta('pages'),
        carpeta('providers'),
      ),
    ),
  },
);
