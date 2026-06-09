import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function IntroSplash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const id = setTimeout(onDone, 2400);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gradient-hero text-primary-foreground overflow-hidden">
      <div
        className="flex items-center justify-center w-28 h-28 rounded-3xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 shadow-elevated"
        style={{ animation: 'logo-pop 0.9s cubic-bezier(.2,.8,.2,1) both' }}
      >
        <BookOpen className="w-14 h-14" strokeWidth={1.6} />
      </div>
      <h1
        className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight shine-text"
        style={{ animation: 'logo-pop 1.1s 0.2s cubic-bezier(.2,.8,.2,1) both' }}
      >
        {t('appName')}
      </h1>
      <p
        className="mt-2 text-sm opacity-80"
        style={{ animation: 'logo-pop 1.1s 0.45s cubic-bezier(.2,.8,.2,1) both' }}
      >
        {t('tagline')}
      </p>
    </div>
  );
}
