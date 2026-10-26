import React from 'react';

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
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-[#12141d] rounded-3xl p-8 border border-slate-200 dark:border-[#222430] shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl font-bold">
              !
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              An unexpected error occurred while loading this view. You can reload or clear your session cache.
            </p>
            {this.state.error?.message && (
              <div className="text-xs bg-slate-100 dark:bg-[#1a1d28] p-3 rounded-xl text-slate-700 dark:text-slate-300 font-mono mb-6 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors shadow-sm"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#1a1d28] text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
              >
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
