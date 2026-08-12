import { ReactNode, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ShieldCheck, Settings as SettingsIcon, BookOpen, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);

  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => { tapCount.current = 0; }, 1500);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      navigate('/admin/login');
    }
  };

  const goCatalog = () => {
    if (location.pathname !== '/') navigate('/');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goCategories = () => navigate('/browse');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={handleLogoTap} className="flex items-center gap-2 group select-none" aria-label="logo">
            <div className="w-11 h-11 rounded-xl bg-transparent flex items-center justify-center group-active:scale-95 transition overflow-hidden">
              <img src="/library-logo.png" alt="" className="w-10 h-10 object-contain logo-adaptive" draggable={false} />
            </div>
            <div className="leading-tight text-start">
              <img src="/library-name.png" alt={t('appName')} className="h-6 md:h-7 object-contain logo-adaptive" draggable={false} />
              <div className="text-[11px] text-muted-foreground hidden sm:block mt-0.5">{t('tagline')}</div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => navigate('/browse')} className="gap-1.5 hidden sm:inline-flex">
              <FolderOpen className="w-4 h-4" /><span className="text-xs font-semibold">{t('browseCategories')}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="gap-1.5">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">{t('settingsHeader')}</span>
            </Button>

            {isAdmin && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-1.5">
                  <ShieldCheck className="w-4 h-4" /><span className="hidden sm:inline">{t('adminPanel')}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      <footer className="border-t mt-12 hidden md:block">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('appName')}
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t">
        <div className="grid grid-cols-2">
          <button onClick={goCatalog} className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-foreground active:bg-accent">
            <BookOpen className="w-5 h-5" />
            {t('catalog')}
          </button>
          <button onClick={goCategories} className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-foreground active:bg-accent">
            <FolderOpen className="w-5 h-5" />
            {t('categories')}
          </button>
        </div>
      </nav>
    </div>
  );
}
