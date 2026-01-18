import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TransactionType } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';

interface Wallet {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  si_number: number;
  type: TransactionType;
  amount: number;
  reason: string;
  date: string;
  debit_from?: string;
  debit_to?: string;
  debit_return_date?: string;
  is_debit_completed?: boolean;
  created_at: string;
}

// Legacy types for UI compatibility
interface LegacyUser {
  id: string;
  username: string;
  password: string;
  balance: number;
  createdAt: string;
}

interface LegacyTransaction {
  id: string;
  siNumber: number;
  type: TransactionType;
  amount: number;
  reason: string;
  date: string;
  userId: string;
  debitFrom?: string;
  debitTo?: string;
  debitReturnDate?: string;
  isDebitCompleted?: boolean;
}

interface DebitDetails {
  debitFrom: string;
  debitTo: string;
  debitReturnDate?: string;
}

interface FinanceContextType {
  currentUser: LegacyUser | null;
  users: LegacyUser[];
  transactions: LegacyTransaction[];
  isDarkMode: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  addTransaction: (type: TransactionType, amount: number, reason: string, date: string, debitDetails?: DebitDetails) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  toggleDarkMode: () => void;
  switchUser: (userId: string) => boolean;
  addUser: (username: string, password: string) => boolean;
  deleteUser: (userId: string) => boolean;
  getUserTransactions: () => LegacyTransaction[];
  hasTransactions: () => boolean;
  markDebitCompleted: (transactionId: string) => Promise<void>;
  getNextSiNumber: () => number;
  exportTransactions: (fromSi: number, toSi: number) => LegacyTransaction[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinanceProviderProps {
  children: ReactNode;
  userId: string;
  userEmail: string;
}

// Convert DB transaction to legacy format
const toLegacyTransaction = (t: Transaction): LegacyTransaction => ({
  id: t.id,
  siNumber: t.si_number,
  type: t.type,
  amount: Number(t.amount),
  reason: t.reason,
  date: t.date,
  userId: t.user_id,
  debitFrom: t.debit_from,
  debitTo: t.debit_to,
  debitReturnDate: t.debit_return_date,
  isDebitCompleted: t.is_debit_completed,
});

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children, userId, userEmail }) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create legacy user object from wallet
  const currentUser: LegacyUser | null = wallet ? {
    id: wallet.id,
    username: wallet.name,
    password: '',
    balance: Number(wallet.balance),
    createdAt: wallet.created_at,
  } : null;

  // For backwards compatibility - single user mode in cloud
  const users: LegacyUser[] = currentUser ? [currentUser] : [];

  // Fetch or create wallet
  const initializeWallet = useCallback(async () => {
    try {
      // First, try to get existing wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching wallet:', fetchError);
        toast({
          title: 'Error loading wallet',
          description: fetchError.message,
          variant: 'destructive',
        });
        return;
      }

      if (existingWallet) {
        setWallet(existingWallet);
      } else {
        // Create new wallet
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            name: userEmail.split('@')[0] || 'Main Wallet',
            balance: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          toast({
            title: 'Error creating wallet',
            description: createError.message,
            variant: 'destructive',
          });
          return;
        }

        setWallet(newWallet);
      }
    } catch (err) {
      console.error('Wallet initialization error:', err);
    }
  }, [userId, userEmail, toast]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!wallet) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    // Cast the type field to TransactionType
    const typedData = (data || []).map(t => ({
      ...t,
      type: t.type as TransactionType,
    }));
    setTransactions(typedData);
  }, [wallet]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await initializeWallet();
      setLoading(false);
    };
    init();
  }, [initializeWallet]);

  // Fetch transactions when wallet is loaded
  useEffect(() => {
    if (wallet) {
      fetchTransactions();
    }
  }, [wallet, fetchTransactions]);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('koppamee_darkmode');
    if (savedDarkMode) {
      const darkMode = JSON.parse(savedDarkMode);
      setIsDarkMode(darkMode);
      if (darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('koppamee_darkmode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const getNextSiNumber = (): number => {
    if (transactions.length === 0) return 1;
    const maxSi = Math.max(...transactions.map(t => t.si_number || 0));
    return maxSi + 1;
  };

  const addTransaction = async (
    type: TransactionType, 
    amount: number, 
    reason: string, 
    date: string,
    debitDetails?: DebitDetails
  ): Promise<boolean> => {
    if (!wallet) return false;

    if (type === 'withdraw' || type === 'debit') {
      if (Number(wallet.balance) < amount) {
        return false;
      }
    }

    const newBalance = type === 'deposit' 
      ? Number(wallet.balance) + amount 
      : Number(wallet.balance) - amount;

    // Insert transaction
    const { data: newTransaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: userId,
        si_number: getNextSiNumber(),
        type,
        amount,
        reason,
        date,
        ...(type === 'debit' && debitDetails && {
          debit_from: debitDetails.debitFrom,
          debit_to: debitDetails.debitTo,
          debit_return_date: debitDetails.debitReturnDate || null,
          is_debit_completed: false,
        }),
      })
      .select()
      .single();

    if (txnError) {
      console.error('Error adding transaction:', txnError);
      toast({
        title: 'Error adding transaction',
        description: txnError.message,
        variant: 'destructive',
      });
      return false;
    }

    // Update wallet balance
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (walletError) {
      console.error('Error updating balance:', walletError);
      return false;
    }

    setWallet({ ...wallet, balance: newBalance });
    setTransactions(prev => [{
      ...newTransaction,
      type: newTransaction.type as TransactionType,
    }, ...prev]);

    return true;
  };

  const markDebitCompleted = async (transactionId: string) => {
    if (!wallet) return;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || transaction.type !== 'debit' || transaction.is_debit_completed) return;

    const newBalance = Number(wallet.balance) + Number(transaction.amount);

    // Update transaction
    const { error: txnError } = await supabase
      .from('transactions')
      .update({ is_debit_completed: true })
      .eq('id', transactionId);

    if (txnError) {
      console.error('Error marking debit completed:', txnError);
      return;
    }

    // Update wallet balance
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (walletError) {
      console.error('Error updating balance:', walletError);
      return;
    }

    setWallet({ ...wallet, balance: newBalance });
    setTransactions(prev =>
      prev.map(t => t.id === transactionId ? { ...t, is_debit_completed: true } : t)
    );

    toast({
      title: 'Dept received!',
      description: `₹${Number(transaction.amount).toLocaleString('en-IN')} has been added back to your balance.`,
    });
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!wallet) return;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Calculate new balance
    let newBalance = Number(wallet.balance);
    if (transaction.type === 'deposit') {
      newBalance -= Number(transaction.amount);
    } else {
      newBalance += Number(transaction.amount);
    }

    // Delete transaction
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) {
      console.error('Error deleting transaction:', deleteError);
      toast({
        title: 'Error deleting transaction',
        description: deleteError.message,
        variant: 'destructive',
      });
      return;
    }

    // Update wallet balance
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (walletError) {
      console.error('Error updating balance:', walletError);
      return;
    }

    setWallet({ ...wallet, balance: newBalance });
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({
          title: 'Password change failed',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
      return true;
    } catch {
      return false;
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // These are kept for UI compatibility but not fully functional in cloud mode
  const switchUser = (localUserId: string): boolean => {
    return localUserId === wallet?.id;
  };

  const addUser = (username: string, password: string): boolean => {
    toast({
      title: 'Feature not available',
      description: 'Multiple local users are not supported in cloud mode. Create a new account instead.',
      variant: 'destructive',
    });
    return false;
  };

  const deleteUser = (localUserId: string): boolean => {
    return false;
  };

  const getUserTransactions = (): LegacyTransaction[] => {
    return transactions.map(toLegacyTransaction);
  };

  const hasTransactions = (): boolean => {
    return transactions.length > 0;
  };

  const exportTransactions = (fromSi: number, toSi: number): LegacyTransaction[] => {
    return transactions
      .filter(t => t.si_number >= fromSi && t.si_number <= toSi)
      .sort((a, b) => a.si_number - b.si_number)
      .map(toLegacyTransaction);
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users,
        transactions: transactions.map(toLegacyTransaction),
        isDarkMode,
        loading,
        logout,
        addTransaction,
        deleteTransaction,
        changePassword,
        toggleDarkMode,
        switchUser,
        addUser,
        deleteUser,
        getUserTransactions,
        hasTransactions,
        markDebitCompleted,
        getNextSiNumber,
        exportTransactions,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
