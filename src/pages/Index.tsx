import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFinance } from '@/contexts/FinanceContext';
import SplashScreen from '@/components/SplashScreen';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { currentUser } = useFinance();
  const [showSplash, setShowSplash] = useState(true);

  // Check if splash was already shown this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('koppamee_splash_shown');
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('koppamee_splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <Dashboard />;
};

export default Index;
