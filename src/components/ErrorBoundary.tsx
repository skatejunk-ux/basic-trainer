// Vangt renderfouten op, zodat de gebruiker nooit een leeg scherm ziet.
import { Component, type ReactNode } from 'react';
import { nl } from '../content/nl';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">{nl.error.title}</h1>
        <p className="mt-2 text-muted">{nl.error.text}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => window.location.reload()}>
          {nl.error.reload}
        </button>
      </div>
    );
  }
}
