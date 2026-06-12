import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe, LogOut, ShieldCheck, Settings as SettingsIcon, BookOpen, FolderOpen, Sparkles, Info, Phone, Mail, MapPin } from 'lucide-react';
import logoAsset from '@/assets/library-logo.png.asset.json';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Info = {
  name?: string; address?: string; phone?: string; email?: string;
  about_ar?: string; about_en?: string;
};

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);
  const [info, setInfo] = useState<Info>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('library_settings').select('value').eq('key', 'library_info').maybeSingle();
      if (data?.value) setInfo(data.value as Info);
    })();
  }, []);

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
  const openAI = () => window.dispatchEvent(new Event('open-library-assistant'));

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
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t('chooseLanguage')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button size="sm" variant={lang === 'ar' ? 'default' : 'outline'} onClick={() => setLang('ar')}>{t('arabic')}</Button>
                    <Button size="sm" variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')}>{t('english')}</Button>
                  </div>
                </div>
                {(info.name || about) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> {t('about')}</p>
                      {info.name && <p className="text-sm font-semibold">{info.name}</p>}
                      {about && <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">{about}</p>}
                    </div>
                  </>
                )}
                {(info.phone || info.email || info.address) && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{t('contact')}</p>
                      {info.address && <p className="text-xs flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />{info.address}</p>}
                      {info.phone && <a href={`tel:${info.phone}`} className="text-xs flex items-center gap-1.5 hover:text-primary"><Phone className="w-3 h-3" />{info.phone}</a>}
                      {info.email && <a href={`mailto:${info.email}`} className="text-xs flex items-center gap-1.5 hover:text-primary break-all"><Mail className="w-3 h-3" />{info.email}</a>}
                    </div>
                  </>
                )}
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
        <div className="grid grid-cols-3">
          <button onClick={goCatalog} className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-foreground active:bg-accent">
            <BookOpen className="w-5 h-5" />
            {t('catalog')}
          </button>
          <button onClick={goCategories} className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-foreground active:bg-accent">
            <FolderOpen className="w-5 h-5" />
            {t('categories')}
          </button>
          <button onClick={openAI} className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-primary active:bg-accent">
            <Sparkles className="w-5 h-5" />
            {t('aiAssistant')}
          </button>
        </div>
      </nav>
    </div>
  );
}
