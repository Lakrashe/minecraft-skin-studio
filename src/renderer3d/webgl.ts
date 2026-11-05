interface ProbeCanvas {
  getContext(contextId: 'webgl2'): WebGL2RenderingContext | null;
}

/**
 * True when a WebGL2 context can be created. Three.js ≥ r163 (we use 0.187)
 * supports WebGL2 only, so WebGL1-only devices count as unsupported.
 * The probe context is released immediately so it does not count against the
 * browser's context limit.
 */
export function detectWebGL2(createCanvas: () => ProbeCanvas): boolean {
  try {
    const gl = createCanvas().getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

let cached: boolean | undefined;

/** Cached `detectWebGL2` for the current document. */
export function isWebGLAvailable(): boolean {
  cached ??= detectWebGL2(() => document.createElement('canvas'));
  return cached;
}
