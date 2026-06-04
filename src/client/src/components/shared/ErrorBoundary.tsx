import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-danger)]">Something went wrong</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{this.state.error.message}</p>
            <button
              className="mt-2 rounded-[var(--radius-sm)] bg-[var(--color-danger)] px-3 py-1 text-sm text-white"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
