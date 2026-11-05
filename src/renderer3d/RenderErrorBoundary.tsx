import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  readonly fallback: ReactNode;
  readonly children: ReactNode;
}

interface State {
  readonly failed: boolean;
}

/**
 * Shows the caller's fallback when the 3D renderer fails to start or crashes
 * (context creation refused, driver error, lost GPU), instead of breaking the
 * surrounding page.
 */
export class RenderErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.warn('3D view failed to initialize; showing fallback.', error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
