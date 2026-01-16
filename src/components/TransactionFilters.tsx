import { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, CalendarIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/types/finance';

export interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  type?: TransactionType | 'all';
  minAmount?: number;
  maxAmount?: number;
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

const TransactionFiltersComponent = ({ filters, onFiltersChange }: TransactionFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClearFilters = () => {
    onFiltersChange({
      type: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    });
  };

  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    (filters.type && filters.type !== 'all') || 
    filters.minAmount || 
    filters.maxAmount;

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full justify-between",
          hasActiveFilters && "border-primary text-primary"
        )}
      >
        <div className="flex items-center gap-2">
          <Filter size={16} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Search size={16} />
        </motion.div>
      </Button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 p-4 bg-muted rounded-lg space-y-4"
        >
          {/* Transaction Type */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Transaction Type</Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, type: value as TransactionType | 'all' })
              }
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdraw">Withdraw</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "dd MMM") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "dd MMM") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-2 block">Min Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) => 
                  onFiltersChange({ 
                    ...filters, 
                    minAmount: e.target.value ? Number(e.target.value) : undefined 
                  })
                }
                className="bg-background"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Max Amount (₹)</Label>
              <Input
                type="number"
                placeholder="Any"
                value={filters.maxAmount || ''}
                onChange={(e) => 
                  onFiltersChange({ 
                    ...filters, 
                    maxAmount: e.target.value ? Number(e.target.value) : undefined 
                  })
                }
                className="bg-background"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="w-full text-muted-foreground hover:text-destructive"
            >
              <X size={16} className="mr-2" />
              Clear All Filters
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TransactionFiltersComponent;
