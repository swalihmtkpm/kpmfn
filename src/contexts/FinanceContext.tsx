import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Transaction, TransactionType } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';

interface DebitDetails {
  debitFrom: string;
  debitTo: string;
  debitReturnDate?: string;
}

interface FinanceContextType {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  isDarkMode: boolean;
  logout: () => Promise<void>;
  addTransaction: (type: TransactionType, amount: number, reason: string, date: string, debitDetails?: DebitDetails) => boolean;
  deleteTransaction: (transactionId: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  toggleDarkMode: () => void;
  switchUser: (userId: string) => boolean;
  addUser: (username: string, password: string) => boolean;
  deleteUser: (userId: string) => boolean;
  getUserTransactions: () => Transaction[];
  hasTransactions: () => boolean;
  markDebitCompleted: (transactionId: string) => void;
  getNextSiNumber: () => number;
  exportTransactions: (fromSi: number, toSi: number) => Transaction[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

interface FinanceProviderProps {
  children: ReactNode;
  userId: string;
  userEmail: string;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children, userId, userEmail }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize user data from localStorage (scoped by userId)
  useEffect(() => {
    const storageKey = `koppamee_data_${userId}`;
    const savedData = localStorage.getItem(storageKey);
    const savedDarkMode = localStorage.getItem('koppamee_darkmode');

    if (savedData) {
      const { users: savedUsers, transactions: savedTransactions, currentUserId } = JSON.parse(savedData);
      setUsers(savedUsers);
      setTransactions(savedTransactions || []);
      
      if (currentUserId) {
        const user = savedUsers.find((u: User) => u.id === currentUserId);
        if (user) {
          setCurrentUser(user);
        } else if (savedUsers.length > 0) {
          setCurrentUser(savedUsers[0]);
        }
      } else if (savedUsers.length > 0) {
        setCurrentUser(savedUsers[0]);
      }
    } else {
      // Create default user for new account
      const defaultUser: User = {
        id: `user_${Date.now()}`,
        username: userEmail.split('@')[0] || 'User',
        password: '',
        balance: 0,
        createdAt: new Date().toISOString(),
      };
      setUsers([defaultUser]);
      setCurrentUser(defaultUser);
    }

    if (savedDarkMode) {
      const darkMode = JSON.parse(savedDarkMode);
      setIsDarkMode(darkMode);
      if (darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, [userId, userEmail]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (users.length > 0) {
      const storageKey = `koppamee_data_${userId}`;
      const data = {
        users,
        transactions,
        currentUserId: currentUser?.id,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [users, transactions, currentUser, userId]);

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
    if (!currentUser) return 1;
    const userTransactions = transactions.filter(t => t.userId === currentUser.id);
    if (userTransactions.length === 0) return 1;
    const maxSi = Math.max(...userTransactions.map(t => t.siNumber || 0));
    return maxSi + 1;
  };

  const addTransaction = (
    type: TransactionType, 
    amount: number, 
    reason: string, 
    date: string,
    debitDetails?: DebitDetails
  ): boolean => {
    if (!currentUser) return false;

    if (type === 'withdraw' || type === 'debit') {
      if (currentUser.balance < amount) {
        return false;
      }
    }

    const newTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      siNumber: getNextSiNumber(),
      type,
      amount,
      reason,
      date,
      userId: currentUser.id,
      ...(type === 'debit' && debitDetails && {
        debitFrom: debitDetails.debitFrom,
        debitTo: debitDetails.debitTo,
        isDebitCompleted: false,
        debitReturnDate: debitDetails.debitReturnDate,
      }),
    };

    const newBalance = type === 'deposit' 
      ? currentUser.balance + amount 
      : currentUser.balance - amount;

    const updatedUser = { ...currentUser, balance: newBalance };
    setCurrentUser(updatedUser);
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === currentUser.id ? updatedUser : u)
    );
    setTransactions(prev => [newTransaction, ...prev]);

    return true;
  };

  const markDebitCompleted = (transactionId: string) => {
    if (!currentUser) return;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || transaction.type !== 'debit' || transaction.isDebitCompleted) return;

    // Add the dept amount back to balance when marked as received
    const newBalance = currentUser.balance + transaction.amount;
    const updatedUser = { ...currentUser, balance: newBalance };
    
    setCurrentUser(updatedUser);
    setUsers(prevUsers =>
      prevUsers.map(u => u.id === currentUser.id ? updatedUser : u)
    );

    setTransactions(prev =>
      prev.map(t => 
        t.id === transactionId ? { ...t, isDebitCompleted: true } : t
      )
    );
  };

  const deleteTransaction = (transactionId: string) => {
    if (!currentUser) return;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || transaction.userId !== currentUser.id) return;

    // Adjust balance based on transaction type
    let newBalance = currentUser.balance;
    if (transaction.type === 'deposit') {
      newBalance -= transaction.amount;
    } else {
      newBalance += transaction.amount;
    }

    // Update user balance
    const updatedUser = { ...currentUser, balance: newBalance };
    setCurrentUser(updatedUser);
    setUsers(prevUsers =>
      prevUsers.map(u => u.id === currentUser.id ? updatedUser : u)
    );

    // Remove transaction
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

  const switchUser = (localUserId: string): boolean => {
    const user = users.find(u => u.id === localUserId);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const addUser = (username: string, password: string): boolean => {
    if (users.some(u => u.username === username)) return false;

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      password,
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    return true;
  };

  const deleteUser = (localUserId: string): boolean => {
    // Can't delete current user or if only one user remains
    if (localUserId === currentUser?.id || users.length <= 1) return false;

    // Remove user
    setUsers(prev => prev.filter(u => u.id !== localUserId));
    
    // Remove user's transactions
    setTransactions(prev => prev.filter(t => t.userId !== localUserId));
    
    return true;
  };

  const getUserTransactions = (): Transaction[] => {
    if (!currentUser) return [];
    return transactions.filter(t => t.userId === currentUser.id);
  };

  const hasTransactions = (): boolean => {
    if (!currentUser) return false;
    return transactions.some(t => t.userId === currentUser.id);
  };

  const exportTransactions = (fromSi: number, toSi: number): Transaction[] => {
    if (!currentUser) return [];
    return transactions
      .filter(t => t.userId === currentUser.id && t.siNumber >= fromSi && t.siNumber <= toSi)
      .sort((a, b) => a.siNumber - b.siNumber);
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users,
        transactions,
        isDarkMode,
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
