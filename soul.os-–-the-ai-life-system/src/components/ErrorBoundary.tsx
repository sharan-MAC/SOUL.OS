import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-400" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">System Interruption</h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              SOUL.OS encountered an unexpected state. Your data is safe, but the interface needs a reset.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-xl font-bold mx-auto transition-all"
            >
              <RefreshCw size={20} />
              Re-initialize System
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-black/40 rounded-lg text-left text-xs text-red-300 overflow-auto max-h-40 scrollbar-hide">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
