import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';
import { Tooltip, TOOLTIP_OPEN_DELAY_MS } from './Tooltip';

const state = () => screen.getByRole('tooltip', { hidden: true }).getAttribute('data-state');

function renderTooltip() {
  render(
    <Tooltip content="Undo">
      <button type="button">Trigger</button>
    </Tooltip>,
  );
  return screen.getByRole('button', { name: 'Trigger' });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Tooltip', () => {
  it('opens on keyboard focus and closes on blur', () => {
    const button = renderTooltip();
    expect(state()).toBe('closed');
    act(() => {
      button.focus();
    });
    expect(state()).toBe('open');
    act(() => {
      button.blur();
    });
    expect(state()).toBe('closed');
  });

  it('is dismissed with Escape while focus stays on the trigger', () => {
    const button = renderTooltip();
    act(() => {
      button.focus();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(state()).toBe('closed');
    expect(document.activeElement).toBe(button);
  });

  it('re-opens after focus leaves and returns', () => {
    const button = renderTooltip();
    act(() => {
      button.focus();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => {
      button.blur();
      button.focus();
    });
    expect(state()).toBe('open');
  });

  it('opens on hover after a delay and stays while the pointer moves onto it', () => {
    vi.useFakeTimers();
    const button = renderTooltip();
    const wrapper = button.parentElement as HTMLElement;
    fireEvent.pointerEnter(wrapper);
    expect(state()).toBe('closed');
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_OPEN_DELAY_MS);
    });
    expect(state()).toBe('open');
    // The bubble is inside the hover area, so entering it does not close the tooltip.
    fireEvent.pointerEnter(screen.getByRole('tooltip'));
    expect(state()).toBe('open');
    fireEvent.pointerLeave(wrapper);
    expect(state()).toBe('closed');
  });

  it('can be dismissed with Escape while hovered, then re-opens on the next hover', () => {
    vi.useFakeTimers();
    const button = renderTooltip();
    const wrapper = button.parentElement as HTMLElement;
    fireEvent.pointerEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_OPEN_DELAY_MS);
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(state()).toBe('closed');
    fireEvent.pointerLeave(wrapper);
    fireEvent.pointerEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(TOOLTIP_OPEN_DELAY_MS);
    });
    expect(state()).toBe('open');
  });

  it('keeps an existing aria-describedby and appends its own id', () => {
    render(
      <>
        <p id="hint">Extra help</p>
        <Tooltip content="Undo">
          <button type="button" aria-describedby="hint">
            Trigger
          </button>
        </Tooltip>
      </>,
    );
    const ids = screen.getByRole('button').getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids[0]).toBe('hint');
    expect(ids[1]).toBe(screen.getByRole('tooltip', { hidden: true }).id);
  });

  it('Escape on a focused trigger inside a dialog closes only the tooltip', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Dialog">
        <Tooltip content="Help">
          <button type="button">Inner</button>
        </Tooltip>
      </Dialog>,
    );
    const inner = screen.getByRole('button', { name: 'Inner' });
    act(() => {
      inner.focus();
    });
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    act(() => {
      inner.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });
});
