import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  tabName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PhotoStudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(`PhotoStudio ${this.props.tabName} error:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              משהו השתבש ב{this.props.tabName}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              אירעה שגיאה בלתי צפויה. נסה לרענן את הטאב או לטעון מחדש את העמוד.
            </p>
            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 ml-2" />
                נסה שוב
              </Button>
              <Button onClick={() => window.location.reload()} variant="default">
                רענן עמוד
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 p-4 bg-muted rounded text-xs text-right max-w-full overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
