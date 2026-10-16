import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BooksManager from '@/components/admin/BooksManager';
import StudentsManager from '@/components/admin/StudentsManager';
import BannersManager from '@/components/admin/BannersManager';
import SettingsPanel from '@/components/admin/SettingsPanel';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';
import BorrowRequestsManager from '@/components/admin/BorrowRequestsManager';
import BorrowRecordsManager from '@/components/admin/BorrowRecordsManager';

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const isLocalAdmin = typeof window !== 'undefined' && localStorage.getItem('imthiyaz_admin_session') === '1';
  const hasAccess = isAdmin || isLocalAdmin;

  useEffect(() => {
    if (!loading && !hasAccess) navigate('/admin/login');
  }, [hasAccess, loading, navigate]);

  if (!hasAccess) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t('adminPanel')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('appName')}</p>
        </div>

        <Tabs defaultValue="books" className="space-y-5">
          <TabsList className="flex flex-wrap h-auto p-1.5 rounded-2xl bg-secondary/80 border border-border/70 gap-1">
            <TabsTrigger value="books" className="rounded-xl text-xs font-bold py-2 px-3.5">
              {t('books')}
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-xl text-xs font-bold py-2 px-3.5">
              {t('students')}
            </TabsTrigger>
            <TabsTrigger value="banners" className="rounded-xl text-xs font-bold py-2 px-3.5">
              {t('banners')}
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-xl text-xs font-bold py-2 px-3.5">
              {t('borrowRequests')}
            </TabsTrigger>
            <TabsTrigger value="records" className="rounded-xl text-xs font-bold py-2 px-3.5">
              {t('borrowRecords')}
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-xl text-xs font-bold py-2 px-3.5">
              {t('dashboard')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl text-xs font-bold py-2 px-3.5">
              {t('settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            <BooksManager />
          </TabsContent>
          <TabsContent value="students">
            <StudentsManager />
          </TabsContent>
          <TabsContent value="banners">
            <BannersManager />
          </TabsContent>
          <TabsContent value="requests">
            <BorrowRequestsManager />
          </TabsContent>
          <TabsContent value="records">
            <BorrowRecordsManager />
          </TabsContent>
          <TabsContent value="dashboard">
            <AnalyticsPanel />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
