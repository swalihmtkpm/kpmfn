import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import Index from './pages/Index';
import BookDetails from './pages/BookDetails';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Browse from './pages/Browse';
import NotFound from './pages/NotFound';
import Catalog from './pages/Catalog';

import IntroSplash from './components/IntroSplash';
import ForcePasswordChange from './components/ForcePasswordChange';
import ScrollManager from './components/ScrollManager';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './lib/i18n';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { dataService } from './lib/dataService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell() {
  const { profile, loading } = useAuth();
  const location = useLocation();

  // Show intro only on root homepage visit on first session
  const [introDone, setIntroDone] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        return true;
      }
      return sessionStorage.getItem('imthiyaz_intro') === '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (introDone) {
      try {
        sessionStorage.setItem('imthiyaz_intro', '1');
      } catch {}
    }
  }, [introDone]);

  // Apply persisted theme on boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem('imthiyaz_theme');
      if (saved === 'dark') document.documentElement.classList.add('dark');
    } catch {}
  }, []);

  // Sync latest cloud data from Lovable Cloud Database (Supabase)
  useEffect(() => {
    dataService.syncFromSupabase().catch(() => {});
  }, []);

  if (!introDone && location.pathname === '/') {
    return <IntroSplash onDone={() => setIntroDone(true)} />;
  }

  if (!loading && profile?.must_change_password) {
    return <ForcePasswordChange />;
  }

  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/browse" element={<Catalog />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
