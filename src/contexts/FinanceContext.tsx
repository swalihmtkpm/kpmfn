import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Transaction, TransactionType } from '@/types/finance';

interface FinanceContextType {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  isDarkMode: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addTransaction: (type: TransactionType, amount: number, reason: string) => boolean;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
  toggleDarkMode: () => void;
  switchUser: (userId: string) => boolean;
  addUser: (username: string, password: string) => boolean;
  getUserTransactions: () => Transaction[];
  hasTransactions: () => boolean;
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
      setTransactions(JSON.parse(savedTransactions));
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

  const addTransaction = (type: TransactionType, amount: number, reason: string): boolean => {
    if (!currentUser) return false;

    if (type === 'withdraw' || type === 'debit') {
      if (currentUser.balance < amount) {
        return false;
      }
    }

    const newTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      type,
      amount,
      reason,
      date: new Date().toISOString(),
      userId: currentUser.id,
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
        changePassword,
        toggleDarkMode,
        switchUser,
        addUser,
        getUserTransactions,
        hasTransactions,
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
