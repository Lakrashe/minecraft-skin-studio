import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom does not implement the modal parts of <dialog>.
const dialogProto = HTMLDialogElement.prototype as Partial<
  Pick<HTMLDialogElement, 'showModal' | 'close'>
>;
if (typeof dialogProto.showModal !== 'function') {
  dialogProto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}
if (typeof dialogProto.close !== 'function') {
  dialogProto.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

// jsdom does not implement matchMedia: report "no match" for every query.
const win = window as Partial<Pick<Window, 'matchMedia'>>;
if (typeof win.matchMedia !== 'function') {
  win.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom has no canvas backend; report "no context" quietly (views then skip drawing).
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;

// jsdom does not implement scrolling (used by <ScrollRestoration />).
window.scrollTo = () => undefined;

afterEach(() => {
  cleanup();
  localStorage.clear();
});
