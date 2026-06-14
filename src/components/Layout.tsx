import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, LogOut, ShieldCheck, Settings as SettingsIcon, BookOpen, FolderOpen, Info, Phone, Mail, MapPin, Moon, Sun, FileText, HelpCircle, MessageCircle } from 'lucide-react';
import logoAsset from '@/assets/library-logo.png.asset.json';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Info = {
  name?: string; address?: string; phone?: string; email?: string;
  about_ar?: string; about_en?: string;
};

const CONTACT_PHONE = '9037339492';
const CONTACT_EMAIL = 'mswalihkpm@gmail.com';

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);
  const [info, setInfo] = useState<Info>({});
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (typeof window !== 'undefined' && localStorage.getItem('imthiyaz_theme') === 'dark') ? 'dark' : 'light'
  );
  const [dialog, setDialog] = useState<null | 'tnc' | 'faq' | 'contact' | 'about'>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('library_settings').select('value').eq('key', 'library_info').maybeSingle();
      if (data?.value) setInfo(data.value as Info);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('imthiyaz_theme', theme);
  }, [theme]);

  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => { tapCount.current = 0; }, 3000);
    if (tapCount.current >= 7) {
      tapCount.current = 0;
      navigate('/admin/login');
    }
  };

  const goCatalog = () => {
    if (location.pathname !== '/') navigate('/');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goCategories = () => {
    if (location.pathname !== '/') navigate('/#categories');
    else document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  const about = (lang === 'ar' ? info.about_ar : info.about_en) || '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button onClick={handleLogoTap} className="flex items-center gap-2 group select-none" aria-label="logo">
            <div className="w-11 h-11 rounded-xl bg-white border flex items-center justify-center shadow-soft group-active:scale-95 transition overflow-hidden">
              <img src={logoAsset.url} alt="" className="w-9 h-9 object-contain" draggable={false} />
            </div>
            <div className="leading-tight text-start">
              <div className="font-extrabold text-foreground text-base md:text-lg">{t('appName')}</div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">{t('tagline')}</div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5" aria-label={t('settingsHeader')}>
                  <SettingsIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">{t('settingsHeader')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t('theme')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button size="sm" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="gap-1.5">
                      <Sun className="w-4 h-4" /> {t('light')}
                    </Button>
                    <Button size="sm" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="gap-1.5">
                      <Moon className="w-4 h-4" /> {t('dark')}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t('chooseLanguage')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button size="sm" variant={lang === 'ar' ? 'default' : 'outline'} onClick={() => setLang('ar')}>{t('arabic')}</Button>
                    <Button size="sm" variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')}>{t('english')}</Button>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-1">
                  {(info.name || about) && (
                    <Button size="sm" variant="ghost" className="justify-start gap-1.5" onClick={() => setDialog('about')}>
                      <Info className="w-4 h-4" /> {t('about')}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="justify-start gap-1.5" onClick={() => setDialog('tnc')}>
                    <FileText className="w-4 h-4" /> {t('tnc')}
                  </Button>
                  <Button size="sm" variant="ghost" className="justify-start gap-1.5" onClick={() => setDialog('faq')}>
                    <HelpCircle className="w-4 h-4" /> {t('faq')}
                  </Button>
                  <Button size="sm" variant="ghost" className="justify-start gap-1.5" onClick={() => setDialog('contact')}>
                    <MessageCircle className="w-4 h-4" /> {t('contactUs')}
                  </Button>
                </div>

                <Separator />
                <Button size="sm" variant="ghost" className="w-full justify-start gap-1.5" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
                  <Globe className="w-4 h-4" /> {t('languageSwitch')}
                </Button>
              </PopoverContent>
            </Popover>

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

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog === 'tnc' && t('tnc')}
              {dialog === 'faq' && t('faq')}
              {dialog === 'contact' && t('contactUs')}
              {dialog === 'about' && t('about')}
            </DialogTitle>
          </DialogHeader>
          {dialog === 'tnc' && <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{t('tncBody')}</p>}
          {dialog === 'faq' && <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">{t('faqBody')}</p>}
          {dialog === 'about' && (
            <div className="space-y-2">
              {info.name && <p className="text-base font-semibold text-foreground">{info.name}</p>}
              {about && <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{about}</p>}
            </div>
          )}
          {dialog === 'contact' && (
            <div className="space-y-2 text-sm">
              <a href={`tel:${CONTACT_PHONE}`} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent">
                <Phone className="w-4 h-4 text-primary" /> <span className="font-medium">{CONTACT_PHONE}</span>
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent break-all">
                <Mail className="w-4 h-4 text-primary" /> <span className="font-medium">{CONTACT_EMAIL}</span>
              </a>
              {info.address && (
                <div className="flex items-start gap-2 p-3 rounded-lg border">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" /> <span>{info.address}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
