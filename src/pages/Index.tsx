import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import SplashScreen from '@/components/SplashScreen';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';
import { FinanceProvider } from '@/contexts/FinanceContext';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if splash was already shown this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('koppamee_splash_shown');
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('koppamee_splash_shown', 'true');
    setShowSplash(false);
  };

  const handleAuthSuccess = useCallback((authUser: SupabaseUser, authSession: Session) => {
    setUser(authUser);
    setSession(authSession);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <FinanceProvider userId={user.id} userEmail={user.email || ''}>
      <Dashboard />
    </FinanceProvider>
  );
};

export default Index;
