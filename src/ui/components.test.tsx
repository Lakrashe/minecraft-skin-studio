import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { IconButton } from './IconButton';
import { SegmentedControl } from './SegmentedControl';
import { Switch } from './Switch';
import { toast, useToastStore } from './toast/toast-store';
import { Toaster } from './toast/Toaster';

describe('Button', () => {
  it('fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveProperty('disabled', true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });
});

describe('IconButton', () => {
  it('uses its label as accessible name and tooltip', () => {
    render(<IconButton icon="settings" label="Open settings" />);
    const button = screen.getByRole('button', { name: 'Open settings' });
    const tooltipId = button.getAttribute('aria-describedby');
    expect(tooltipId).toBeTruthy();
    expect(screen.getByRole('tooltip', { hidden: true }).id).toBe(tooltipId);
  });
});

describe('SegmentedControl', () => {
  function Harness() {
    const [value, setValue] = useState<'a' | 'b' | 'c'>('a');
    return (
      <SegmentedControl
        label="Mode"
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
        ]}
      />
    );
  }

  it('selects on click and moves with arrow keys (wrapping)', () => {
    render(<Harness />);
    const radio = (name: string) => screen.getByRole('radio', { name });
    expect(radio('A').getAttribute('aria-checked')).toBe('true');

    fireEvent.click(radio('C'));
    expect(radio('C').getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(radio('C'), { key: 'ArrowRight' });
    expect(radio('A').getAttribute('aria-checked')).toBe('true');

    fireEvent.keyDown(radio('A'), { key: 'ArrowLeft' });
    expect(radio('C').getAttribute('aria-checked')).toBe('true');
  });
});

describe('Switch', () => {
  it('toggles aria-checked', () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch label="Grid" checked={on} onChange={setOn} />;
    }
    render(<Harness />);
    const sw = screen.getByRole('switch', { name: 'Grid' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });
});

describe('Dialog', () => {
  it('renders content when open and closes via the close button', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Confirm">
        Body text
      </Dialog>,
    );
    expect(screen.getByText('Body text')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders nothing inside when closed', () => {
    render(
      <Dialog open={false} onClose={() => undefined} title="Hidden">
        Secret
      </Dialog>,
    );
    expect(screen.queryByText('Secret')).toBeNull();
  });
});

describe('toasts', () => {
  beforeEach(() => {
    useToastStore.getState().clear();
  });

  it('shows and auto-dismisses a toast', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast.success('Saved!', { duration: 1000 });
    });
    expect(screen.getByRole('status').textContent).toContain('Saved!');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Saved!')).toBeNull();
    vi.useRealTimers();
  });

  it('keeps errors until dismissed and announces them as alerts', () => {
    render(<Toaster />);
    act(() => {
      toast.error('Failed');
    });
    expect(screen.getByRole('alert').textContent).toContain('Failed');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Failed')).toBeNull();
  });

  it('caps the number of visible toasts', () => {
    for (let i = 0; i < 10; i++) toast.info(`n${String(i)}`);
    expect(useToastStore.getState().toasts).toHaveLength(4);
  });
});
