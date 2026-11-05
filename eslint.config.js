// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Module boundaries — see docs/ARCHITECTURE.md §2.
 * Each entry lists the top-level `src/` modules a folder must NOT import.
 */
const ALL_MODULES = [
  'engine',
  'rig',
  'platform',
  'editor2d',
  'renderer3d',
  'ui',
  'state',
  'services',
  'features',
  'app',
  'i18n',
  'content',
];

/** @param {string[]} names */
const moduleImportPatterns = (names) =>
  names.flatMap((name) => [`@/${name}`, `@/${name}/**`, `**/${name}`, `**/${name}/**`]);

/** @param {string[]} allowed */
const onlyAllow = (allowed) => ALL_MODULES.filter((m) => !allowed.includes(m));

const FRAMEWORK_PACKAGES = [
  'react',
  'react-dom',
  'react-dom/*',
  'react-router',
  'zustand',
  'zustand/*',
  'three',
  'three/*',
  '@react-three/*',
];

/**
 * @param {string[]} files
 * @param {string[]} forbiddenModules
 * @param {string[]} [forbiddenPackages]
 * @param {string} message
 */
const boundary = (files, forbiddenModules, message, forbiddenPackages = []) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          { group: moduleImportPatterns(forbiddenModules), message },
          ...(forbiddenPackages.length > 0
            ? [{ group: forbiddenPackages, message: `${message} (framework package)` }]
            : []),
          {
            group: ['@/features/*/**'],
            message: 'Import other features only through their index.ts.',
          },
        ],
      },
    ],
  },
});

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules', 'playwright-report', 'test-results', 'public'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['*.config.{js,ts}', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  // ---- Architecture boundaries ------------------------------------------
  boundary(
    ['src/engine/**'],
    onlyAllow(['engine']),
    'The skin engine is pure TypeScript and imports nothing else from src/.',
    FRAMEWORK_PACKAGES,
  ),
  boundary(
    ['src/rig/**'],
    onlyAllow(['rig']),
    'The rig is pure TypeScript and imports nothing else from src/.',
    FRAMEWORK_PACKAGES,
  ),
  boundary(
    ['src/platform/**'],
    onlyAllow(['platform', 'engine']),
    'platform/ may only depend on engine/.',
    ['react', 'react-dom', 'react-dom/*', 'three', 'three/*', '@react-three/*'],
  ),
  boundary(
    ['src/editor2d/**'],
    onlyAllow(['editor2d', 'engine', 'platform']),
    'editor2d/ must never import renderer3d/ or UI modules (docs/ARCHITECTURE.md §2).',
    ['three', 'three/*', '@react-three/*'],
  ),
  boundary(
    ['src/renderer3d/**'],
    onlyAllow(['renderer3d', 'engine', 'rig', 'platform']),
    'renderer3d/ must never import editor2d/ or UI modules (docs/ARCHITECTURE.md §2).',
  ),
  boundary(
    ['src/ui/**'],
    onlyAllow(['ui', 'i18n']),
    'ui/ holds design-system primitives only; no business logic imports.',
    ['three', 'three/*', '@react-three/*'],
  ),
  boundary(['src/i18n/**'], onlyAllow(['i18n']), 'i18n/ imports nothing else from src/.'),
  boundary(
    ['src/state/**', 'src/services/**'],
    onlyAllow(['state', 'services', 'engine', 'rig', 'i18n']),
    'state/ and services/ may only depend on engine/, rig/ and i18n/.',
  ),
  boundary(
    ['src/features/**'],
    ['app'],
    'Features must not import the app shell; the app composes features.',
  ),

  // Tests may use node globals.
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  prettier,
);
