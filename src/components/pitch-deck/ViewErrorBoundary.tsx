import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ViewErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ViewErrorBoundaryProps {
  children: React.ReactNode;
}

export class ViewErrorBoundary extends React.Component<
  ViewErrorBoundaryProps,
  ViewErrorBoundaryState
> {
  constructor(props: ViewErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ViewErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('PitchDeck View Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#d4c5b5] text-white p-6">
          <AlertTriangle className="h-16 w-16 text-amber-400 mb-4" />
          <h1 className="text-2xl font-serif mb-2">שגיאה בטעינת המצגת</h1>
          <p className="text-white/70 mb-6 text-center max-w-md">
            אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-[#f5c242] text-[#2d3b3a] rounded-lg font-medium hover:bg-[#f5c242]/90 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            רענן דף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
