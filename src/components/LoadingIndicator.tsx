import { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

type LoadingProps = {
  size?: number;
  className?: string;
  text?: string;
};

/**
 * Standard rotating library logo rosette (continuous smooth rotation).
 */
export function BrandSpinner({ size = 56, className = '' }: LoadingProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      {/* Subtle pulsing outer ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping opacity-25"
        style={{ animationDuration: '2.5s' }}
      />
      {/* Official Brand Logo Rosette rotating continuously */}
      <img
        src="/app-logo.png"
        alt="Loading"
        width={size}
        height={size}
        className="object-contain logo-adaptive relative z-10 animate-spin"
        style={{ width: size, height: size, animationDuration: '2.5s' }}
        draggable={false}
      />
    </div>
  );
}

/**
 * Full page loader used during initial application boot or full view transitions.
 */
export function FullPageLoader({ size = 64, text }: { size?: number; text?: string }) {
  const { t, lang } = useI18n();

  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
      <BrandSpinner size={size} />
      <div className="mt-4 space-y-1">
        <p className="text-xs font-bold text-foreground tracking-wide">
          {text || (lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}
        </p>
        <p className="text-[11px] text-muted-foreground font-medium">
          {t('appNameShort')}
        </p>
      </div>
    </div>
  );
}

/**
 * Clean inline spinner using rotating logo rosette.
 */
export function InlineSpinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/app-logo.png"
      alt="Loading"
      className={`inline-block object-contain animate-spin ${className}`}
      style={{ width: size, height: size, animationDuration: '1.8s' }}
      draggable={false}
    />
  );
}

/**
 * Safe Loading Component with Automatic Timeout:
 * If an operation takes longer than maxTimeoutMs (default: 4.5 seconds),
 * it stops the endless spinner and displays a friendly Error card with a Retry button!
 */
export function LoadingWithTimeout({
  timeoutMs = 4500,
  errorMessage,
  onRetry,
  children,
}: {
  timeoutMs?: number;
  errorMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}) {
  const { lang } = useI18n();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <div className="min-h-[40vh] w-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
          {errorMessage || (lang === 'ar' ? 'استغرق التحميل وقتاً أطول من المتوقع' : 'Loading took longer than expected')}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          {lang === 'ar'
            ? 'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.'
            : 'Please check your connection and try again.'}
        </p>
        {onRetry && (
          <Button
            onClick={() => {
              setTimedOut(false);
              onRetry();
            }}
            className="h-10 px-5 rounded-xl font-bold bg-primary text-primary-foreground gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {children || <FullPageLoader />}
    </>
  );
}

export default BrandSpinner;
