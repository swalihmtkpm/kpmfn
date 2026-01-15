import { motion } from 'framer-motion';
import { Plus, Minus, CreditCard, IndianRupee } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList = ({ transactions }: TransactionListProps) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <Plus size={18} />;
      case 'withdraw': return <Minus size={18} />;
      case 'debit': return <CreditCard size={18} />;
    }
  };

  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'deposit': return 'transaction-deposit bg-success/10';
      case 'withdraw': return 'transaction-withdraw bg-destructive/10';
      case 'debit': return 'transaction-debit bg-warning/10';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-success text-success-foreground';
      case 'withdraw': return 'bg-destructive text-destructive-foreground';
      case 'debit': return 'bg-warning text-warning-foreground';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-success';
      default: return 'text-destructive';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`p-4 rounded-lg ${getTransactionStyle(transaction.type)} shadow-card`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getIconBg(transaction.type)}`}>
              {getTransactionIcon(transaction.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {transaction.reason}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(transaction.date), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>

            <div className={`flex items-center font-semibold ${getAmountColor(transaction.type)}`}>
              <span className="text-sm mr-0.5">
                {transaction.type === 'deposit' ? '+' : '-'}
              </span>
              <IndianRupee size={14} />
              <span>{transaction.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TransactionList;
