import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee, AlertCircle, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { TransactionType } from '@/types/finance';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
}

const TransactionModal = ({ isOpen, onClose, type }: TransactionModalProps) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [debitFrom, setDebitFrom] = useState('');
  const [debitTo, setDebitTo] = useState('');
  const [debitReturnDate, setDebitReturnDate] = useState<Date | undefined>();
  const { currentUser, addTransaction, getNextSiNumber } = useFinance();
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

    if (!date) {
      toast({
        title: 'Date required',
        description: 'Please select a date for this transaction',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'debit' && (!debitFrom.trim() || !debitTo.trim())) {
      toast({
        title: 'Debit details required',
        description: 'Please provide both "Debit From" and "Debit To" information',
        variant: 'destructive',
      });
      return;
    }

    const debitDetails = type === 'debit' ? {
      debitFrom: debitFrom.trim(),
      debitTo: debitTo.trim(),
      debitReturnDate: debitReturnDate?.toISOString(),
    } : undefined;

    const success = addTransaction(type, amountNum, reason.trim(), date.toISOString(), debitDetails);
    
    if (success) {
      toast({
        title: 'Transaction successful!',
        description: `₹${amountNum.toLocaleString('en-IN')} ${type === 'deposit' ? 'added to' : 'deducted from'} your account`,
      });
      setAmount('');
      setReason('');
      setDate(new Date());
      setDebitFrom('');
      setDebitTo('');
      setDebitReturnDate(undefined);
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
                <div>
                  <h2 className="font-heading font-bold text-xl">{getTypeLabel()}</h2>
                  <p className="text-sm opacity-90 mt-0.5">SI No: #{getNextSiNumber()}</p>
                </div>
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
              {/* Date Picker */}
              <div>
                <Label className="text-foreground font-medium">
                  Transaction Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 mt-2 justify-start text-left font-normal bg-muted border-input",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd MMM yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount */}
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

              {/* Debit From/To fields */}
              {type === 'debit' && (
                <>
                  <div>
                    <Label htmlFor="debitFrom" className="text-foreground font-medium">
                      Debit From (Source)
                    </Label>
                    <Input
                      id="debitFrom"
                      value={debitFrom}
                      onChange={(e) => setDebitFrom(e.target.value)}
                      placeholder="e.g., Savings Account, Cash, etc."
                      className="mt-2 h-12 bg-muted border-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="debitTo" className="text-foreground font-medium">
                      Debit To (Recipient)
                    </Label>
                    <Input
                      id="debitTo"
                      value={debitTo}
                      onChange={(e) => setDebitTo(e.target.value)}
                      placeholder="e.g., Person name, Company, etc."
                      className="mt-2 h-12 bg-muted border-input"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground font-medium">
                      Expected Return Date (Optional)
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 mt-2 justify-start text-left font-normal bg-muted border-input",
                            !debitReturnDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {debitReturnDate ? format(debitReturnDate, "dd MMM yyyy") : <span>Pick return date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={debitReturnDate}
                          onSelect={setDebitReturnDate}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}

              {/* Reason */}
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
