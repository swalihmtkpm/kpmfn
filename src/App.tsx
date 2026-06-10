import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Index from './pages/Index';
import BookDetails from './pages/BookDetails';
import AuthPage from './pages/Auth';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

import IntroSplash from './components/IntroSplash';
import ForcePasswordChange from './components/ForcePasswordChange';
import { LanguageProvider } from './lib/i18n';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient();

function AppShell() {
  const { profile, loading } = useAuth();
  const [introDone, setIntroDone] = useState(
    () => sessionStorage.getItem('imthiyaz_intro') === '1'
  );

  useEffect(() => {
    if (introDone) sessionStorage.setItem('imthiyaz_intro', '1');
  }, [introDone]);

  if (!introDone) return <IntroSplash onDone={() => setIntroDone(true)} />;

  // Force password change blocks the whole app until done
  if (!loading && profile?.must_change_password) return <ForcePasswordChange />;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/book/:id" element={<BookDetails />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
