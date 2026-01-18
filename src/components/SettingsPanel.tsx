import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Moon, 
  Sun, 
  Lock, 
  History, 
  Users, 
  ChevronRight,
  UserPlus,
  Check,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import TransactionList from './TransactionList';
import ExportModal from './ExportModal';
import TransactionFiltersComponent, { TransactionFilters } from './TransactionFilters';
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

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsView = 'main' | 'password' | 'history' | 'users';

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const [view, setView] = useState<SettingsView>('main');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({ type: 'all' });
  
  const { 
    isDarkMode, 
    toggleDarkMode, 
    changePassword, 
    getUserTransactions,
    users,
    currentUser,
    switchUser,
    addUser,
    deleteUser
  } = useFinance();
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setView('main');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername.trim() || !newUserPassword.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const success = addUser(newUsername.trim(), newUserPassword);
    if (success) {
      toast({
        title: 'User added!',
        description: `User "${newUsername}" has been created`,
      });
      setNewUsername('');
      setNewUserPassword('');
    } else {
      toast({
        title: 'Username exists',
        description: 'Please choose a different username',
        variant: 'destructive',
      });
    }
  };

  const handleSwitchUser = (userId: string) => {
    if (userId === currentUser?.id) return;
    
    switchUser(userId);
    toast({
      title: 'User switched!',
      description: 'You are now logged in as a different user',
    });
    onClose();
  };

  const handleDeleteUser = (userId: string, username: string) => {
    const success = deleteUser(userId);
    if (success) {
      toast({
        title: 'User deleted',
        description: `User "${username}" and all their data have been removed`,
      });
    } else {
      toast({
        title: 'Cannot delete user',
        description: 'You cannot delete the current user or the last remaining user',
        variant: 'destructive',
      });
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'password':
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setView('main')}>
                <ChevronRight className="rotate-180" size={20} />
              </Button>
              <h3 className="font-heading font-semibold text-lg">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="oldPass">Current Password</Label>
                <Input
                  id="oldPass"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-2 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="newPass">New Password</Label>
                <Input
                  id="newPass"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="confirmPass">Confirm New Password</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 bg-muted"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                Update Password
              </Button>
            </form>
          </motion.div>
        );

      case 'history':
        const allTransactions = getUserTransactions();
        
        // Apply filters
        const filteredTransactions = allTransactions.filter(transaction => {
          // Type filter
          if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
            return false;
          }
          
          // Date range filter
          const transactionDate = new Date(transaction.date);
          if (filters.dateFrom && transactionDate < filters.dateFrom) {
            return false;
          }
          if (filters.dateTo) {
            const endOfDay = new Date(filters.dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            if (transactionDate > endOfDay) {
              return false;
            }
          }
          
          // Amount range filter
          if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
            return false;
          }
          if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
            return false;
          }
          
          return true;
        });
        
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setView('main')}>
                <ChevronRight className="rotate-180" size={20} />
              </Button>
              <h3 className="font-heading font-semibold text-lg">Transaction History</h3>
            </div>

            <TransactionFiltersComponent filters={filters} onFiltersChange={setFilters} />
            
            <div className="text-sm text-muted-foreground mb-3">
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
            </div>

            <TransactionList transactions={filteredTransactions} />
          </motion.div>
        );

      case 'users':
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setView('main')}>
                <ChevronRight className="rotate-180" size={20} />
              </Button>
              <h3 className="font-heading font-semibold text-lg">Switch User</h3>
            </div>

            {/* User List */}
            <div className="space-y-2 mb-6">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg flex items-center justify-between transition-colors ${
                    user.id === currentUser?.id 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <button
                    onClick={() => handleSwitchUser(user.id)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Balance: ₹{user.balance.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {user.id === currentUser?.id && (
                      <Check className="text-primary" size={20} />
                    )}
                    {user.id !== currentUser?.id && users.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{user.username}"? 
                              This will permanently remove all their transactions and data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.username)}
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
              ))}
            </div>

            {/* Add New User */}
            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <UserPlus size={18} />
                Add New User
              </h4>
              <form onSubmit={handleAddUser} className="space-y-3">
                <Input
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-muted"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="bg-muted"
                />
                <Button type="submit" className="w-full bg-success hover:bg-success/90 text-success-foreground">
                  Add User
                </Button>
              </form>
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                <span className="font-medium">Dark Mode</span>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>

            {/* Menu Items */}
            <button
              onClick={() => setView('password')}
              className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock size={20} />
                <span className="font-medium">Change Password</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>

            <button
              onClick={() => setView('history')}
              className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <History size={20} />
                <span className="font-medium">Transaction History</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} />
                <span className="font-medium">Export to Excel</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>

            <button
              onClick={() => setView('users')}
              className="w-full flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users size={20} />
                <span className="font-medium">Switch User</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </button>
          </motion.div>
        );
    }
  };

  return (
    <>
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

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card z-50 shadow-card-lg overflow-auto"
            >
              {/* Header */}
              <div className="gradient-primary text-primary-foreground p-4 flex items-center justify-between">
                <h2 className="font-heading font-bold text-xl">Settings</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <X size={24} />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4">
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
};

export default SettingsPanel;
