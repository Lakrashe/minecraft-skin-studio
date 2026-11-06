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

/** @param {string[]} names regex alternation of names, regex-escaped */
const alternation = (names) =>
  names.map((n) => n.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')).join('|');

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
const THREE_PACKAGES = ['three', 'three/*', '@react-three/*'];
const REACT_AND_THREE = ['react', 'react-dom', 'react-dom/*', ...THREE_PACKAGES];

/** Bare package names for the dynamic-import check (prefix match). */
const packageRoots = (/** @type {string[]} */ patterns) => [
  ...new Set(patterns.map((p) => p.replace(/\/\*$/, ''))),
];

/**
 * Browser APIs the pure engine/rig must not touch (PROJECT_RULES §1.1).
 * tsconfig.engine.json (no DOM lib) is the primary guard; this gives a clear
 * lint message as well.
 */
const BROWSER_GLOBALS = [
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'self',
  'fetch',
  'XMLHttpRequest',
  'Image',
  'ImageData',
  'ImageBitmap',
  'createImageBitmap',
  'HTMLElement',
  'HTMLCanvasElement',
  'HTMLImageElement',
  'OffscreenCanvas',
  'CanvasRenderingContext2D',
  'WebGLRenderingContext',
  'WebGL2RenderingContext',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'FileReader',
  'matchMedia',
].map((name) => ({
  name,
  message: 'Engine and rig are pure TypeScript; browser APIs belong in platform/ adapters.',
}));

/**
 * Builds the import rules for one top-level module.
 * - Modules not in `allowed` may not be imported at all (static or dynamic).
 * - Allowed modules may only be imported through their public entry (`@/x`),
 *   never deep (`@/x/internal`).
 * - `packages` lists npm packages the module must not use.
 *
 * @param {{ files: string[]; own: string; allowed: string[]; message: string; packages?: string[]; noBrowser?: boolean }} options
 */
const boundary = ({ files, own, allowed, message, packages = [], noBrowser = false }) => {
  const forbidden = ALL_MODULES.filter((m) => m !== own && !allowed.includes(m));
  // features/ has one public entry per feature (`@/features/<name>`), handled below.
  const deepTargets = allowed.filter((m) => m !== own && m !== 'features');
  const publicEntryMessage = 'Import other modules only through their public entry (index.ts).';

  /** @type {{ selector: string; message: string }[]} */
  const dynamicImportRules = [];
  if (forbidden.length > 0) {
    dynamicImportRules.push({
      // Matches "@/x", "../x", "../../x/y" … for every forbidden module x.
      selector: `ImportExpression[source.value=/(^|[^\\w-])(${alternation(forbidden)})([^\\w-]|$)/]`,
      message: `${message} (dynamic import)`,
    });
  }
  if (packages.length > 0) {
    dynamicImportRules.push({
      selector: `ImportExpression[source.value=/^(${alternation(packageRoots(packages))})([^\\w-]|$)/]`,
      message: `${message} (framework package, dynamic import)`,
    });
  }
  if (deepTargets.length > 0) {
    dynamicImportRules.push({
      selector: `ImportExpression[source.value=/^@.(${alternation(deepTargets)})[^\\w-].+/]`,
      message: `${publicEntryMessage} (dynamic import)`,
    });
  }
  if (own === 'features' || allowed.includes('features')) {
    dynamicImportRules.push({
      selector: 'ImportExpression[source.value=/^@.features.[\\w-]+[^\\w-].+/]',
      message: 'Import other features only through their index.ts. (dynamic import)',
    });
  }

  return {
    files,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...(forbidden.length > 0 ? [{ group: moduleImportPatterns(forbidden), message }] : []),
            ...(packages.length > 0
              ? [{ group: packages, message: `${message} (framework package)` }]
              : []),
            ...(deepTargets.length > 0
              ? [{ group: deepTargets.map((m) => `@/${m}/**`), message: publicEntryMessage }]
              : []),
            {
              group: ['@/features/*/**'],
              message: 'Import other features only through their index.ts.',
            },
          ],
        },
      ],
      ...(dynamicImportRules.length > 0
        ? { 'no-restricted-syntax': ['error', ...dynamicImportRules] }
        : {}),
      ...(noBrowser ? { 'no-restricted-globals': ['error', ...BROWSER_GLOBALS] } : {}),
    },
  };
};

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
  boundary({
    files: ['src/engine/**'],
    own: 'engine',
    allowed: [],
    message: 'The skin engine is pure TypeScript and imports nothing else from src/.',
    packages: FRAMEWORK_PACKAGES,
    noBrowser: true,
  }),
  boundary({
    files: ['src/rig/**'],
    own: 'rig',
    allowed: [],
    message: 'The rig is pure TypeScript and imports nothing else from src/.',
    packages: FRAMEWORK_PACKAGES,
    noBrowser: true,
  }),
  boundary({
    files: ['src/platform/**'],
    own: 'platform',
    allowed: ['engine'],
    message: 'platform/ may only depend on engine/.',
    packages: REACT_AND_THREE,
  }),
  boundary({
    files: ['src/editor2d/**'],
    own: 'editor2d',
    allowed: ['engine', 'platform'],
    message: 'editor2d/ must never import renderer3d/ or UI modules (docs/ARCHITECTURE.md §2).',
    packages: THREE_PACKAGES,
  }),
  boundary({
    files: ['src/renderer3d/**'],
    own: 'renderer3d',
    allowed: ['engine', 'rig', 'platform'],
    message: 'renderer3d/ must never import editor2d/ or UI modules (docs/ARCHITECTURE.md §2).',
  }),
  // The rendering core is plain Three.js: no React/R3F and no DOM, so it stays
  // independent of any UI and testable in Node (docs/ARCHITECTURE.md §6).
  boundary({
    files: ['src/renderer3d/core/**'],
    own: 'renderer3d',
    allowed: ['engine', 'rig', 'platform'],
    message: 'renderer3d/core is UI-independent: no React, R3F or browser APIs.',
    packages: ['react', 'react-dom', 'react-dom/*', '@react-three/*'],
    noBrowser: true,
  }),
  boundary({
    files: ['src/ui/**'],
    own: 'ui',
    allowed: ['i18n'],
    message: 'ui/ holds design-system primitives only; no business logic imports.',
    packages: THREE_PACKAGES,
  }),
  boundary({
    files: ['src/i18n/**'],
    own: 'i18n',
    allowed: [],
    message: 'i18n/ imports nothing else from src/.',
  }),
  boundary({
    files: ['src/state/**'],
    own: 'state',
    allowed: ['engine', 'rig', 'i18n'],
    message: 'state/ may only depend on engine/, rig/ and i18n/.',
  }),
  boundary({
    files: ['src/services/**'],
    own: 'services',
    allowed: ['engine', 'rig', 'i18n'],
    message: 'services/ may only depend on engine/, rig/ and i18n/.',
  }),
  boundary({
    files: ['src/content/**'],
    own: 'content',
    allowed: ['engine', 'rig'],
    message: 'content/ is shipped data and may only depend on engine/ and rig/.',
  }),
  boundary({
    files: ['src/features/**'],
    own: 'features',
    allowed: ALL_MODULES.filter((m) => m !== 'app'),
    message: 'Features must not import the app shell; the app composes features.',
  }),
  boundary({
    files: ['src/app/**'],
    own: 'app',
    allowed: ALL_MODULES,
    message: 'app/ composes every module through its public entry.',
  }),

  // Tests may use node globals.
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  prettier,
);
