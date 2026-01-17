import { motion } from 'framer-motion';
import { Plus, Minus, HandCoins, IndianRupee, CheckCircle2, Circle, Trash2, CalendarClock } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { format } from 'date-fns';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TransactionListProps {
  transactions: Transaction[];
  showDebitComplete?: boolean;
  showDelete?: boolean;
}

const TransactionList = ({ transactions, showDebitComplete = true, showDelete = true }: TransactionListProps) => {
  const { markDebitCompleted, deleteTransaction } = useFinance();
  const { toast } = useToast();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <Plus size={18} />;
      case 'withdraw': return <Minus size={18} />;
      case 'debit': return <HandCoins size={18} />;
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

  const handleMarkComplete = (transactionId: string, amount: number) => {
    markDebitCompleted(transactionId);
    toast({
      title: 'Dept marked as received',
      description: `₹${amount.toLocaleString('en-IN')} has been added back to your balance.`,
    });
  };

  const handleDelete = (transactionId: string, type: string, amount: number) => {
    deleteTransaction(transactionId);
    toast({
      title: 'Transaction deleted',
      description: `₹${amount.toLocaleString('en-IN')} ${type === 'deposit' ? 'removed from' : 'restored to'} your balance`,
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
                  {transaction.type === 'debit' ? 'Dept' : transaction.type}
                </span>
              </div>
              
              <p className="font-medium text-foreground truncate">
                {transaction.reason}
              </p>
              
              <p className="text-sm text-muted-foreground">
                {format(new Date(transaction.date), 'dd MMM yyyy')}
              </p>

              {/* Dept details */}
              {transaction.type === 'debit' && (transaction.debitFrom || transaction.debitTo) && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {transaction.debitFrom && (
                    <p><span className="font-medium">Lender:</span> {transaction.debitFrom}</p>
                  )}
                  {transaction.debitTo && (
                    <p><span className="font-medium">Borrower:</span> {transaction.debitTo}</p>
                  )}
                  {transaction.debitReturnDate && (
                    <p className="flex items-center gap-1 text-warning">
                      <CalendarClock size={12} />
                      <span className="font-medium">Return by:</span> {format(new Date(transaction.debitReturnDate), 'dd MMM yyyy')}
                    </p>
                  )}
                </div>
              )}

              {/* Dept completion status/button */}
              {transaction.type === 'debit' && showDebitComplete && (
                <div className="mt-2">
                  {transaction.isDebitCompleted ? (
                    <div className="flex items-center gap-1.5 text-success text-xs font-medium">
                      <CheckCircle2 size={14} />
                      <span>Dept Received ✓</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkComplete(transaction.id, transaction.amount)}
                      className="h-7 text-xs gap-1.5 border-success text-success hover:bg-success hover:text-success-foreground"
                    >
                      <Circle size={12} />
                      Mark as Received
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className={`flex items-center font-semibold ${getAmountColor(transaction.type)}`}>
                <span className="text-sm mr-0.5">
                  {transaction.type === 'deposit' ? '+' : '-'}
                </span>
                <IndianRupee size={14} />
                <span>{transaction.amount.toLocaleString('en-IN')}</span>
              </div>

              {showDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this transaction? This will{' '}
                        {transaction.type === 'deposit' ? 'remove' : 'restore'}{' '}
                        ₹{transaction.amount.toLocaleString('en-IN')}{' '}
                        {transaction.type === 'deposit' ? 'from' : 'to'} your balance.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(transaction.id, transaction.type, transaction.amount)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TransactionList;