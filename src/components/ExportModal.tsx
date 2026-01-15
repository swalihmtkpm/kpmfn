import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const [fromSi, setFromSi] = useState('');
  const [toSi, setToSi] = useState('');
  const { exportTransactions, getUserTransactions } = useFinance();
  const { toast } = useToast();

  const userTransactions = getUserTransactions();
  const minSi = userTransactions.length > 0 
    ? Math.min(...userTransactions.map(t => t.siNumber || 1)) 
    : 1;
  const maxSi = userTransactions.length > 0 
    ? Math.max(...userTransactions.map(t => t.siNumber || 1)) 
    : 1;

  const handleExport = () => {
    const from = parseInt(fromSi) || minSi;
    const to = parseInt(toSi) || maxSi;

    if (from > to) {
      toast({
        title: 'Invalid range',
        description: 'From number should be less than or equal to To number',
        variant: 'destructive',
      });
      return;
    }

    const transactions = exportTransactions(from, to);

    if (transactions.length === 0) {
      toast({
        title: 'No transactions found',
        description: 'No transactions found in the specified range',
        variant: 'destructive',
      });
      return;
    }

    // Prepare data for Excel
    const excelData = transactions.map(t => ({
      'SI No': t.siNumber,
      'Type': t.type.charAt(0).toUpperCase() + t.type.slice(1),
      'Amount (₹)': t.amount,
      'Reason': t.reason,
      'Date': format(new Date(t.date), 'dd MMM yyyy'),
      'Debit From': t.debitFrom || '-',
      'Debit To': t.debitTo || '-',
      'Status': t.type === 'debit' ? (t.isDebitCompleted ? 'Completed' : 'Pending') : '-',
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // SI No
      { wch: 10 }, // Type
      { wch: 15 }, // Amount
      { wch: 40 }, // Reason
      { wch: 15 }, // Date
      { wch: 20 }, // Debit From
      { wch: 20 }, // Debit To
      { wch: 12 }, // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Generate filename with date range
    const filename = `Koppamee_Transactions_${from}-${to}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    toast({
      title: 'Export successful!',
      description: `${transactions.length} transactions exported to Excel`,
    });

    onClose();
  };

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-card-lg w-[90%] max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-primary text-primary-foreground p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={24} />
                  <h2 className="font-heading font-bold text-xl">Export to Excel</h2>
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
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">
                Select the SI number range to export. Available range: #{minSi} to #{maxSi}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromSi" className="text-foreground font-medium">
                    From SI No.
                  </Label>
                  <Input
                    id="fromSi"
                    type="number"
                    value={fromSi}
                    onChange={(e) => setFromSi(e.target.value)}
                    placeholder={String(minSi)}
                    className="mt-2 h-12 bg-muted border-input"
                    min={minSi}
                    max={maxSi}
                  />
                </div>
                <div>
                  <Label htmlFor="toSi" className="text-foreground font-medium">
                    To SI No.
                  </Label>
                  <Input
                    id="toSi"
                    type="number"
                    value={toSi}
                    onChange={(e) => setToSi(e.target.value)}
                    placeholder={String(maxSi)}
                    className="mt-2 h-12 bg-muted border-input"
                    min={minSi}
                    max={maxSi}
                  />
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={userTransactions.length === 0}
                className="w-full h-12 gradient-primary text-primary-foreground font-semibold gap-2"
              >
                <Download size={18} />
                Export Transactions
              </Button>

              {userTransactions.length === 0 && (
                <p className="text-sm text-center text-muted-foreground">
                  No transactions available to export
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExportModal;
