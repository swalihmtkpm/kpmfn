import { ReactNode, useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LogOut,
  ShieldCheck,
  Settings as SettingsIcon,
  BookOpen,
  FolderOpen,
  Home,
  Globe,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('imthiyaz_theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('imthiyaz_theme', next);
  };

  const toggleLanguage = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => { tapCount.current = 0; }, 1500);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      navigate('/admin/login');
    }
  };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsOpen]);

  // Desktop header navigation items (Settings removed as requested)
  const headerNavItems = [
    { label: t('home'), path: '/', icon: Home },
    { label: t('catalog'), path: '/catalog', icon: BookOpen },
  ];

  // Mobile bottom navigation items
  const mobileNavItems = [
    { label: t('home'), path: '/', icon: Home },
    { label: t('catalog'), path: '/catalog', icon: BookOpen },
    { label: t('categories'), path: '/browse', icon: FolderOpen },
    { label: t('settingsHeader'), path: '/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.hash;
    return location.pathname === path;
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (path === '/' && location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      {/* Top Header - Clean International Standard Layout */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-3">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLogoTap}
              className="flex items-center gap-2 group select-none focus:outline-none"
              aria-label="logo"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center group-active:scale-95 transition-transform overflow-hidden shadow-sm">
                <img
                  src="/library-logo.png"
                  alt=""
                  className="w-9 h-9 md:w-10 md:h-10 object-contain"
                  draggable={false}
                />
              </div>
              <div className="leading-tight text-start">
                <img
                  src="/library-name.png"
                  alt={t('appName')}
                  className="h-6 md:h-7 object-contain"
                  draggable={false}
                />
                <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1 mt-0.5 font-medium">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>{t('tagline')}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links - Clean & Centered (Settings text removed) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 bg-secondary/70 px-3 py-1.5 rounded-full border border-border/60">
            {headerNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`relative px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? 'text-primary-foreground bg-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Items: Settings Icon with Menu, Admin Controls */}
          <div className="flex items-center gap-2">
            {/* Settings Icon Popover Menu (Dark mode and Language moved here, standalone buttons removed from header) */}
            <div className="relative" ref={settingsRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`w-9 h-9 rounded-xl border transition-all ${
                  settingsOpen ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 hover:bg-accent text-foreground'
                }`}
                title={t('settingsHeader')}
                aria-label="Settings"
              >
                <SettingsIcon className={`w-4 h-4 transition-transform duration-300 ${settingsOpen ? 'rotate-90 text-primary' : ''}`} />
              </Button>

              {/* Settings Dropdown Popover */}
              {settingsOpen && (
                <div className="absolute end-0 mt-2 w-64 bg-card border border-border/80 rounded-2xl shadow-lg p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-xs font-bold text-muted-foreground border-b border-border/60 mb-1 flex items-center justify-between">
                    <span>{t('settingsHeader')}</span>
                    <SettingsIcon className="w-3.5 h-3.5 text-primary" />
                  </div>

                  {/* Dark Mode Toggle inside Settings Menu */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-accent/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
                      <span>{t('theme')}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground">
                      {theme === 'dark' ? t('dark') : t('light')}
                    </span>
                  </button>

                  {/* Language Switcher inside Settings Menu */}
                  <button
                    onClick={() => {
                      toggleLanguage();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-accent/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span>{t('language')}</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-secondary text-primary uppercase">
                      {lang === 'ar' ? 'العربية' : 'English'}
                    </span>
                  </button>

                  <div className="my-1 border-t border-border/60" />

                  {/* Full Settings Page link */}
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors text-start"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span>{t('libraryInfo')}</span>
                  </button>

                  {/* Admin Login shortcut if not logged in */}
                  {!isAdmin && (
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        navigate('/admin/login');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors text-start"
                    >
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>{t('adminLogin')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="gap-1.5 h-9 rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground font-bold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{t('adminPanel')}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="w-9 h-9 rounded-xl text-muted-foreground hover:text-destructive"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-12">
        {children}
      </main>

      {/* Desktop Footer */}
      <footer className="border-t border-border/60 bg-secondary/30 mt-16 hidden md:block">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/library-logo.png" alt="" className="w-6 h-6 object-contain logo-adaptive" />
            <span className="font-semibold text-foreground">{t('appName')}</span>
            <span>—</span>
            <span>{t('tagline')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-primary transition">{t('home')}</Link>
            <Link to="/browse" className="hover:text-primary transition">{t('categories')}</Link>
            <Link to="/settings" className="hover:text-primary transition">{t('settingsHeader')}</Link>
            <span>© {new Date().getFullYear()} {t('appNameShort')}</span>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Glassmorphism Bottom Navigation Bar - Style 3 (Image 3 Inspiration) */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40">
        <div className="bg-background/90 backdrop-blur-xl border border-border/70 shadow-lg rounded-2xl px-2 py-1.5 grid grid-cols-4 gap-1">
          {mobileNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-primary bg-primary/10 font-bold scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground active:scale-95'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 transition-transform ${active ? 'scale-110 text-primary' : ''}`} />
                <span className="text-[10px] leading-tight truncate w-full text-center">
                  {item.label}
                </span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
