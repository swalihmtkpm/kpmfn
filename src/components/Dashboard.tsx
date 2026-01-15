import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  CreditCard, 
  Settings, 
  LogOut,
  Wallet,
  TrendingUp,
  TrendingDown,
  IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceContext';
import TransactionModal from './TransactionModal';
import TransactionList from './TransactionList';
import SettingsPanel from './SettingsPanel';
import koppameeLogo from '@/assets/koppamee-logo.png';

const Dashboard = () => {
  const { currentUser, logout, hasTransactions, getUserTransactions } = useFinance();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw' | 'debit'>('deposit');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const userTransactions = getUserTransactions();
  const hasAnyTransactions = hasTransactions();

  const openTransactionModal = (type: 'deposit' | 'withdraw' | 'debit') => {
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };

  const getTotalDeposits = () => {
    return userTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalWithdrawals = () => {
    return userTransactions
      .filter(t => t.type === 'withdraw' || t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="gradient-primary text-primary-foreground p-4"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={koppameeLogo} alt="Logo" className="w-12 h-12 rounded-full bg-card" />
            <div>
              <h1 className="font-heading font-bold text-lg">Koppamee Finance</h1>
              <p className="text-sm opacity-80">Hello, {currentUser?.username}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Settings size={22} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut size={22} />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto p-4 pb-24">
        {/* Balance Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="balance-card p-6 text-primary-foreground mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} className="opacity-80" />
            <span className="text-sm opacity-80">Current Balance</span>
          </div>
          <div className="flex items-center gap-1">
            <IndianRupee size={32} />
            <span className="text-4xl font-heading font-bold">
              {currentUser?.balance.toLocaleString('en-IN') || '0'}
            </span>
          </div>

          {hasAnyTransactions && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-primary-foreground/20">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-success" />
                <div>
                  <p className="text-xs opacity-70">Income</p>
                  <p className="font-semibold">₹{getTotalDeposits().toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown size={16} className="text-destructive" />
                <div>
                  <p className="text-xs opacity-70">Expenses</p>
                  <p className="font-semibold">₹{getTotalWithdrawals().toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          {!hasAnyTransactions ? (
            // First time - only show deposit
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Welcome! Start by adding your first deposit.
              </p>
              <Button
                onClick={() => openTransactionModal('deposit')}
                className="w-full h-14 gradient-gold text-secondary-foreground font-semibold text-lg shadow-gold hover:opacity-90 transition-opacity"
              >
                <Plus className="mr-2" size={24} />
                Make First Deposit
              </Button>
            </div>
          ) : (
            // Show all transaction options
            <div className="grid grid-cols-3 gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => openTransactionModal('deposit')}
                  className="w-full h-20 flex-col gap-2 bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Plus size={24} />
                  <span className="text-sm font-medium">Deposit</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => openTransactionModal('withdraw')}
                  className="w-full h-20 flex-col gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Minus size={24} />
                  <span className="text-sm font-medium">Withdraw</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => openTransactionModal('debit')}
                  className="w-full h-20 flex-col gap-2 bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  <CreditCard size={24} />
                  <span className="text-sm font-medium">Debit</span>
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <AnimatePresence>
          {hasAnyTransactions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg text-foreground">
                  Recent Transactions
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-muted-foreground"
                >
                  View All
                </Button>
              </div>
              <TransactionList transactions={userTransactions.slice(0, 5)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        type={transactionType}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
