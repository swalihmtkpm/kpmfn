export type TransactionType = 'deposit' | 'withdraw' | 'debit';

export interface Transaction {
  id: string;
  siNumber: number;
  type: TransactionType;
  amount: number;
  reason: string;
  date: string;
  userId: string;
  // Debit specific fields
  debitFrom?: string;
  debitTo?: string;
  isDebitCompleted?: boolean;
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
