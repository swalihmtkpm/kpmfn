import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Transaction, TransactionType } from '@/types/finance';

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
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addTransaction: (type: TransactionType, amount: number, reason: string, date: string, debitDetails?: DebitDetails) => boolean;
  deleteTransaction: (transactionId: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
  toggleDarkMode: () => void;
  switchUser: (userId: string) => boolean;
  addUser: (username: string, password: string) => boolean;
  getUserTransactions: () => Transaction[];
  hasTransactions: () => boolean;
  markDebitCompleted: (transactionId: string) => void;
  getNextSiNumber: () => number;
  exportTransactions: (fromSi: number, toSi: number) => Transaction[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_USERS: User[] = [
  {
    id: 'user_1',
    username: 'mskpm',
    password: '159357',
    balance: 0,
    createdAt: new Date().toISOString(),
  },
];

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('koppamee_users');
    const savedTransactions = localStorage.getItem('koppamee_transactions');
    const savedDarkMode = localStorage.getItem('koppamee_darkmode');
    const savedCurrentUserId = localStorage.getItem('koppamee_current_user');

    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
      
      if (savedCurrentUserId) {
        const user = parsedUsers.find((u: User) => u.id === savedCurrentUserId);
        if (user) {
          setCurrentUser(user);
        }
      }
    } else {
      setUsers(DEFAULT_USERS);
      localStorage.setItem('koppamee_users', JSON.stringify(DEFAULT_USERS));
    }

    if (savedTransactions) {
      const parsedTransactions: Transaction[] = JSON.parse(savedTransactions);
      
      // Migrate existing transactions without SI numbers
      let needsMigration = parsedTransactions.some(t => !t.siNumber);
      if (needsMigration) {
        // Group transactions by userId and assign SI numbers
        const userTransactionCounters: { [userId: string]: number } = {};
        
        // Sort by date to assign SI numbers in chronological order
        const sortedTransactions = [...parsedTransactions].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        const migratedTransactions = sortedTransactions.map(t => {
          if (!t.siNumber) {
            if (!userTransactionCounters[t.userId]) {
              // Find max existing SI for this user
              const existingSiNumbers = parsedTransactions
                .filter(tr => tr.userId === t.userId && tr.siNumber)
                .map(tr => tr.siNumber);
              userTransactionCounters[t.userId] = existingSiNumbers.length > 0 
                ? Math.max(...existingSiNumbers) 
                : 0;
            }
            userTransactionCounters[t.userId]++;
            return { ...t, siNumber: userTransactionCounters[t.userId] };
          }
          return t;
        });
        
        setTransactions(migratedTransactions);
        localStorage.setItem('koppamee_transactions', JSON.stringify(migratedTransactions));
      } else {
        setTransactions(parsedTransactions);
      }
    }

    if (savedDarkMode) {
      const darkMode = JSON.parse(savedDarkMode);
      setIsDarkMode(darkMode);
      if (darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Save users to localStorage
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('koppamee_users', JSON.stringify(users));
    }
  }, [users]);

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem('koppamee_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('koppamee_darkmode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('koppamee_current_user', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('koppamee_current_user');
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

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    if (!currentUser || currentUser.password !== oldPassword) return false;

    const updatedUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedUser);
    setUsers(prevUsers =>
      prevUsers.map(u => u.id === currentUser.id ? updatedUser : u)
    );
    return true;
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const switchUser = (userId: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('koppamee_current_user', user.id);
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
        login,
        logout,
        addTransaction,
        deleteTransaction,
        changePassword,
        toggleDarkMode,
        switchUser,
        addUser,
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
