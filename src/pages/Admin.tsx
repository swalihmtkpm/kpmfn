import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BooksManager from '@/components/admin/BooksManager';
import TaxonomyManager from '@/components/admin/TaxonomyManager';
import AdsManager from '@/components/admin/AdsManager';
import SettingsPanel from '@/components/admin/SettingsPanel';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !isAdmin) navigate('/'); }, [isAdmin, loading, navigate]);
  if (!isAdmin) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl font-extrabold text-foreground">{t('adminPanel')}</h1>
        <p className="text-sm text-muted-foreground mb-5">{t('appName')}</p>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="dashboard">{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="books">{t('books')}</TabsTrigger>
            <TabsTrigger value="categories">{t('categories')}</TabsTrigger>
            <TabsTrigger value="authors">{t('authors')}</TabsTrigger>
            <TabsTrigger value="publishers">{t('publishers')}</TabsTrigger>
            <TabsTrigger value="ads">{t('advertisements')}</TabsTrigger>
            <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><AnalyticsPanel /></TabsContent>
          <TabsContent value="books"><BooksManager /></TabsContent>
          <TabsContent value="categories"><TaxonomyManager table="categories" /></TabsContent>
          <TabsContent value="authors"><TaxonomyManager table="authors" /></TabsContent>
          <TabsContent value="publishers"><TaxonomyManager table="publishers" /></TabsContent>
          <TabsContent value="ads"><AdsManager /></TabsContent>
          <TabsContent value="settings"><SettingsPanel /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
