import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionType } from '@/types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
}

const TransactionModal = ({ isOpen, onClose, type }: TransactionModalProps) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const { currentUser, addTransaction } = useFinance();
  const { toast } = useToast();

  const getTypeColor = () => {
    switch (type) {
      case 'deposit': return 'bg-success';
      case 'withdraw': return 'bg-destructive';
      case 'debit': return 'bg-warning';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'deposit': return 'Deposit Money';
      case 'withdraw': return 'Withdraw Money';
      case 'debit': return 'Debit Transaction';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for this transaction',
        variant: 'destructive',
      });
      return;
    }

    const success = addTransaction(type, amountNum, reason.trim());
    
    if (success) {
      toast({
        title: 'Transaction successful!',
        description: `₹${amountNum.toLocaleString('en-IN')} ${type === 'deposit' ? 'added to' : 'deducted from'} your account`,
      });
      setAmount('');
      setReason('');
      onClose();
    } else {
      toast({
        title: 'Transaction failed',
        description: 'Insufficient balance for this transaction',
        variant: 'destructive',
      });
    }
  };

  const insufficientFunds = type !== 'deposit' && parseFloat(amount) > (currentUser?.balance || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-card-lg max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className={`${getTypeColor()} text-primary-foreground p-4 rounded-t-3xl`}>
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-xl">{getTypeLabel()}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <X size={24} />
                </Button>
              </div>
              {type !== 'deposit' && (
                <p className="text-sm opacity-90 mt-1">
                  Available balance: ₹{currentUser?.balance.toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <Label htmlFor="amount" className="text-foreground font-medium">
                  Amount
                </Label>
                <div className="relative mt-2">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <IndianRupee size={20} />
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="h-14 pl-12 text-2xl font-semibold bg-muted border-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                {insufficientFunds && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-destructive mt-2"
                  >
                    <AlertCircle size={16} />
                    <span className="text-sm">Insufficient balance</span>
                  </motion.div>
                )}
              </div>

              <div>
                <Label htmlFor="reason" className="text-foreground font-medium">
                  Reason / Description
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="What's this transaction for?"
                  className="mt-2 min-h-[100px] bg-muted border-input resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={insufficientFunds}
                className={`w-full h-14 ${getTypeColor()} text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {type === 'deposit' ? 'Add Money' : 'Confirm Transaction'}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;
