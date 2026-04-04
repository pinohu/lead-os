import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/utils/logger";
import { captureReactError } from "@/utils/errorTracking";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    // Send to production error tracking
    captureReactError(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-destructive" />
                <h1 className="text-2xl font-bold text-foreground">
                  Something Went Wrong
                </h1>
                <p className="text-muted-foreground">
                  We're sorry, but something unexpected happened. Please try refreshing the page or returning to the home page.
                </p>
                {this.state.error && (
                  <details className="text-left w-full p-4 bg-muted rounded-lg text-sm">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Error Details
                    </summary>
                    <code className="text-destructive break-all">
                      {this.state.error.message}
                    </code>
                  </details>
                )}
                <div className="flex gap-4 w-full">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    Refresh Page
                  </Button>
                  <Button
                    onClick={this.handleReset}
                    className="flex-1"
                  >
                    Go Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
