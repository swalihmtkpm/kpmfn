import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export default function IntroSplash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const id = setTimeout(onDone, 900);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden cursor-pointer select-none transition-opacity duration-300 p-4"
    >
      {/* Rosette Logo continuous rotation with subtle Islamic glow */}
      <div
        className="relative flex items-center justify-center"
        style={{ animation: 'logo-pop 0.9s cubic-bezier(.2,.8,.2,1) both' }}
      >
        <img
          src="/app-logo.png"
          alt={t('appName')}
          className="animate-spin object-contain logo-adaptive"
          style={{ width: 150, height: 150, animationDuration: '4s' }}
          draggable={false}
        />
      </div>

      {/* Exquisite Logo Calligraphy Font */}
      <img
        src="/app-logo-text.png"
        alt={t('appName')}
        className="mt-6 w-[85%] max-w-sm object-contain logo-adaptive drop-shadow-sm"
        style={{ animation: 'logo-pop 1.1s 0.25s cubic-bezier(.2,.8,.2,1) both' }}
        draggable={false}
      />

      <p
        className="mt-3 text-xs sm:text-sm text-muted-foreground font-medium text-center"
        style={{ animation: 'logo-pop 1.1s 0.45s cubic-bezier(.2,.8,.2,1) both' }}
      >
        {t('tagline')}
      </p>
    </div>
  );
}
