import { useFinance } from '@/contexts/FinanceContext';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { currentUser } = useFinance();

  if (!currentUser) {
    return <LoginPage />;
  }

  return <Dashboard />;
};

export default Index;
