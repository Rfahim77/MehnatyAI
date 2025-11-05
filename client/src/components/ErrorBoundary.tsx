import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">
                عذراً، حدث خطأ غير متوقع
              </h1>
              <p className="text-muted-foreground">
                حدث خطأ أثناء تحميل التطبيق. يرجى المحاولة مرة أخرى.
              </p>
              {this.state.error && (
                <details className="w-full text-left">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    تفاصيل الخطأ (للمطورين)
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <div className="flex gap-2 w-full">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  data-testid="button-try-again"
                >
                  حاول مرة أخرى
                </Button>
                <Button
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-go-home"
                >
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
