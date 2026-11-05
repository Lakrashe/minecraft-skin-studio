let cached: boolean | undefined;

/** True when the browser can create a WebGL2 or WebGL context. Result is cached. */
export function isWebGLAvailable(): boolean {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement('canvas');
    cached = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    cached = false;
  }
  return cached;
}
