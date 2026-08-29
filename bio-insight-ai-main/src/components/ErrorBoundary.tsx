import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-xl">
            ⚠️
          </div>
          <h1 className="text-xl font-semibold">Something broke on this screen</h1>
          <p className="text-sm text-muted-foreground">
            The error was logged. Try reloading — your work is saved server-side.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
