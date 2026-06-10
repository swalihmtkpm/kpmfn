import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import logoAsset from '@/assets/library-logo.png.asset.json';

export default function IntroSplash({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    const id = setTimeout(onDone, 2600);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden">
      <div
        className="relative flex items-center justify-center"
        style={{ animation: 'logo-pop 0.9s cubic-bezier(.2,.8,.2,1) both' }}
      >
        <img
          src={logoAsset.url}
          alt={t('appName')}
          className="animate-spin-ccw"
          style={{ width: 140, height: 140 }}
          draggable={false}
        />
      </div>
      <h1
        className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight text-primary"
        style={{ animation: 'logo-pop 1.1s 0.25s cubic-bezier(.2,.8,.2,1) both' }}
      >
        {t('appName')}
      </h1>
      <p
        className="mt-2 text-sm text-muted-foreground"
        style={{ animation: 'logo-pop 1.1s 0.5s cubic-bezier(.2,.8,.2,1) both' }}
      >
        {t('tagline')}
      </p>
    </div>
  );
}
