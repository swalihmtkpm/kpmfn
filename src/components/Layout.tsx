import { ReactNode, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Globe, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);

  // Hidden admin: tap logo 7 times within 3 seconds
  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => { tapCount.current = 0; }, 3000);
    if (tapCount.current >= 7) {
      tapCount.current = 0;
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button
            onClick={handleLogoTap}
            className="flex items-center gap-2 group select-none"
            aria-label="logo"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center shadow-soft group-active:scale-95 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="leading-tight text-start">
              <div className="font-extrabold text-foreground text-base md:text-lg">{t('appName')}</div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">{t('tagline')}</div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="gap-1.5"
              aria-label={t('languageSwitch')}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-semibold">{lang === 'ar' ? 'EN' : 'ع'}</span>
            </Button>

            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('adminPanel')}</span>
              </Button>
            )}

            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')} className="gap-1.5">
                <LogIn className="w-4 h-4" />
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t('appName')}
        </div>
      </footer>
    </div>
  );
}
