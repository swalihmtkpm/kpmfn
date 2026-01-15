import { motion } from 'framer-motion';
import { Plus, Minus, CreditCard, IndianRupee, Check, Circle } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { format } from 'date-fns';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TransactionListProps {
  transactions: Transaction[];
  showDebitComplete?: boolean;
}

const TransactionList = ({ transactions, showDebitComplete = true }: TransactionListProps) => {
  const { markDebitCompleted } = useFinance();
  const { toast } = useToast();

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

  const handleMarkComplete = (transactionId: string) => {
    markDebitCompleted(transactionId);
    toast({
      title: 'Debit marked as completed',
      description: 'The debit transaction has been marked as received.',
    });
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
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${getIconBg(transaction.type)} shrink-0`}>
              {getTransactionIcon(transaction.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  #{transaction.siNumber || 'N/A'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {transaction.type}
                </span>
              </div>
              
              <p className="font-medium text-foreground truncate">
                {transaction.reason}
              </p>
              
              <p className="text-sm text-muted-foreground">
                {format(new Date(transaction.date), 'dd MMM yyyy')}
              </p>

              {/* Debit details */}
              {transaction.type === 'debit' && (transaction.debitFrom || transaction.debitTo) && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {transaction.debitFrom && (
                    <p><span className="font-medium">From:</span> {transaction.debitFrom}</p>
                  )}
                  {transaction.debitTo && (
                    <p><span className="font-medium">To:</span> {transaction.debitTo}</p>
                  )}
                </div>
              )}

              {/* Debit completion status/button */}
              {transaction.type === 'debit' && showDebitComplete && (
                <div className="mt-2">
                  {transaction.isDebitCompleted ? (
                    <div className="flex items-center gap-1.5 text-success text-xs font-medium">
                      <Check size={14} />
                      <span>Payment Received</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkComplete(transaction.id)}
                      className="h-7 text-xs gap-1.5 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                    >
                      <Circle size={12} />
                      Mark as Received
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className={`flex items-center font-semibold ${getAmountColor(transaction.type)} shrink-0`}>
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
