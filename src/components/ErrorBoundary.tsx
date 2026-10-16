import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Top-level application Error Boundary.
 * Prevents any unhandled rendering exceptions from crashing the entire DOM
 * into a blank white screen, and provides elegant recovery actions.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Application Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRtl = document.documentElement.dir === 'rtl' || !document.documentElement.dir;

      return (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="min-h-screen bg-background text-foreground flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-xl p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Brand Logo & Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-destructive/10 animate-pulse" />
              <img
                src="/library-logo.png"
                alt="Logo"
                className="w-14 h-14 object-contain relative z-10"
              />
              <div className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md z-20">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {isRtl ? 'عذراً، حدث خطأ غير متوقع' : 'Something went wrong'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isRtl
                  ? 'واجهت الصفحة خطأ غير متوقع أثناء المعالجة. يمكنك محاولة إعادة التحميل أو العودة إلى الصفحة الرئيسية.'
                  : 'The application encountered an unexpected error. You can retry loading or return to the homepage.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <Button
                onClick={this.handleReset}
                className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isRtl ? 'إعادة المحاولة' : 'Try Again'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="h-11 px-6 rounded-xl font-bold border-border/80 hover:bg-accent gap-2"
              >
                <Home className="w-4 h-4" />
                <span>{isRtl ? 'الرئيسية' : 'Back to Home'}</span>
              </Button>
            </div>

            {/* Expandable Technical Details (Non-intrusive) */}
            {this.state.error && (
              <div className="pt-2 border-t border-border/50 text-start">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground py-1 focus:outline-none"
                >
                  <span className="font-semibold">{isRtl ? 'تفاصيل الخطأ التقني' : 'Technical Details'}</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-muted/60 rounded-xl text-[11px] font-mono text-destructive overflow-x-auto whitespace-pre-wrap max-h-48 border border-border/60">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
