export type TransactionType = 'deposit' | 'withdraw' | 'debit';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  reason: string;
  date: string;
  userId: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  balance: number;
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  transactions: Transaction[];
  isDarkMode: boolean;
}
