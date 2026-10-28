import React from 'react';
import { AlertTriangle, RotateCw, ShieldOff } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
          <div className="w-full max-w-md rounded-lg border border-line bg-surface p-7 text-center shadow-xs">
            <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-caution-soft text-caution">
              <AlertTriangle size={20} />
            </span>
            <h1 className="text-[17px] font-bold text-ink">Something went wrong</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              This view hit an unexpected error. Reloading usually fixes it — clearing the session
              cache will also sign you out.
            </p>

            {this.state.error?.message ? (
              <pre className="mt-4 max-h-28 overflow-auto rounded-md border border-line bg-sunken p-3 text-left font-mono text-2xs leading-relaxed text-muted">
                {this.state.error.message}
              </pre>
            ) : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-[13px] font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                <RotateCw size={14} /> Reload page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-body transition-colors hover:bg-sunken hover:text-ink"
              >
                <ShieldOff size={14} /> Clear cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
