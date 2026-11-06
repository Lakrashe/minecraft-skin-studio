/**
 * Proves the architecture boundaries in eslint.config.js reject violations and
 * accept legal imports (PROJECT_RULES §1.1, §1.2; docs/ARCHITECTURE.md §2).
 * Uses existing file paths with in-memory source, so no files are created.
 */
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: process.cwd() });
});

async function boundaryErrors(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? [])
    .filter((m) =>
      ['no-restricted-imports', 'no-restricted-syntax', 'no-restricted-globals'].includes(
        m.ruleId ?? '',
      ),
    )
    .map((m) => m.message);
}

const ENGINE = 'src/engine/index.ts';
const RIG = 'src/rig/index.ts';
const EDITOR = 'src/editor2d/index.ts';
const RENDERER = 'src/renderer3d/webgl.ts';
const FEATURE = 'src/features/home/index.ts';
const RENDER_CORE = 'src/renderer3d/core/player-rig.ts';
const APP = 'src/app/navigation.ts';

describe('engine and rig stay pure', () => {
  it.each([
    ['static UI import', "import { Button } from '@/ui';\nexport const x = Button;"],
    ['React', "import { useState } from 'react';\nexport const x = useState;"],
    ['dynamic renderer import', "export const load = () => import('../renderer3d/webgl');"],
    ['dynamic three import', "export const load = () => import('three');"],
    ['window access', 'export const read = (): string => window.location.href;'],
    ['document access', "export const el = () => document.createElement('canvas');"],
  ])('engine rejects %s', async (_name, code) => {
    expect(await boundaryErrors(ENGINE, code)).not.toEqual([]);
  });

  it('rig rejects browser APIs', async () => {
    expect(
      await boundaryErrors(RIG, 'export const t = () => requestAnimationFrame(() => 0);'),
    ).not.toEqual([]);
  });

  it('engine accepts plain TypeScript and internal imports', async () => {
    expect(
      await boundaryErrors(
        ENGINE,
        "export { x } from './model';\nexport const size = 64 * 64 * 4;\nexport const buf = new Uint8ClampedArray(size);",
      ),
    ).toEqual([]);
  });
});

describe('2D editor and 3D renderer stay separate', () => {
  it('editor2d rejects static and dynamic renderer3d imports', async () => {
    expect(
      await boundaryErrors(EDITOR, "export { LazySceneCanvas } from '../renderer3d';"),
    ).not.toEqual([]);
    expect(
      await boundaryErrors(EDITOR, "export const l = () => import('@/renderer3d');"),
    ).not.toEqual([]);
  });

  it('renderer3d rejects static and dynamic editor2d imports', async () => {
    expect(await boundaryErrors(RENDERER, "export * from '@/editor2d';")).not.toEqual([]);
    expect(
      await boundaryErrors(RENDERER, "export const l = () => import('../editor2d');"),
    ).not.toEqual([]);
  });

  it('editor2d may use engine and platform', async () => {
    expect(
      await boundaryErrors(EDITOR, "export * from '@/engine';\nexport * from '@/platform';"),
    ).toEqual([]);
  });
});

describe('3D rendering core is independent of the UI', () => {
  it('rejects React, React Three Fiber and browser APIs', async () => {
    expect(await boundaryErrors(RENDER_CORE, "export { useState } from 'react';")).not.toEqual([]);
    expect(
      await boundaryErrors(RENDER_CORE, "export { Canvas } from '@react-three/fiber';"),
    ).not.toEqual([]);
    expect(
      await boundaryErrors(RENDER_CORE, "export const l = () => import('@react-three/drei');"),
    ).not.toEqual([]);
    expect(await boundaryErrors(RENDER_CORE, 'export const w = window.innerWidth;')).not.toEqual(
      [],
    );
  });

  it('may use three, the engine and the rig', async () => {
    expect(
      await boundaryErrors(
        RENDER_CORE,
        [
          "export { Group } from 'three';",
          "export * from '@/engine';",
          "export * from '@/rig';",
        ].join('\n'),
      ),
    ).toEqual([]);
  });
});

describe('public entry points', () => {
  it('rejects deep imports into another module', async () => {
    expect(await boundaryErrors(FEATURE, "export { Button } from '@/ui/Button';")).not.toEqual([]);
    expect(
      await boundaryErrors(FEATURE, "export const l = () => import('@/ui/Button');"),
    ).not.toEqual([]);
  });

  it('rejects deep imports into another feature, static and dynamic', async () => {
    expect(
      await boundaryErrors(
        FEATURE,
        "export { SettingsPage } from '@/features/settings/SettingsPage';",
      ),
    ).not.toEqual([]);
    expect(
      await boundaryErrors(
        APP,
        "export const l = () => import('@/features/settings/SettingsPage');",
      ),
    ).not.toEqual([]);
  });

  it('accepts module and feature public entries', async () => {
    expect(
      await boundaryErrors(
        APP,
        "export * from '@/ui';\nexport const l = () => import('@/features/settings');",
      ),
    ).toEqual([]);
  });

  it('features may not import the app shell', async () => {
    expect(await boundaryErrors(FEATURE, "export * from '@/app/navigation';")).not.toEqual([]);
  });
});
