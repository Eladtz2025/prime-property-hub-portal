import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface SlideEditorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface SlideEditorErrorBoundaryProps {
  children: React.ReactNode;
  slideType?: string;
  slideId?: string;
  onReset?: () => void;
}

export class SlideEditorErrorBoundary extends React.Component<
  SlideEditorErrorBoundaryProps,
  SlideEditorErrorBoundaryState
> {
  constructor(props: SlideEditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SlideEditorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('SlideEditor Error:', {
      slideType: this.props.slideType,
      slideId: this.props.slideId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <AlertTriangle className="h-5 w-5" />
              שגיאה בטעינת הסלייד
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              אירעה שגיאה בטעינת עורך הסלייד. ייתכן שהנתונים במבנה לא תקין.
            </p>
            
            <div className="bg-muted/50 p-3 rounded-md space-y-1 text-xs">
              <p><strong>סוג סלייד:</strong> {this.props.slideType || 'לא ידוע'}</p>
              <p><strong>מזהה:</strong> {this.props.slideId || 'לא ידוע'}</p>
              {this.state.error && (
                <p className="text-destructive"><strong>שגיאה:</strong> {this.state.error.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={this.resetError} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 ml-2" />
                נסה שוב
              </Button>
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">פרטים טכניים</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
