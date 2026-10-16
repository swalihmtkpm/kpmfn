import { useEffect, useState, useMemo } from 'react';
import { Book, Users, GraduationCap, ClipboardList, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useI18n } from '@/lib/i18n';
import { dataService } from '@/lib/dataService';

export default function AnalyticsPanel() {
  const { t, lang } = useI18n();

  const metrics = useMemo(() => {
    const books = dataService.getBooks();
    const students = dataService.getStudents();
    const requests = dataService.getBorrowRequests();
    const records = dataService.getBorrowRecords();
    const banners = dataService.getBanners();

    const activeBorrows = records.filter((r) => r.status === 'active').length;
    const returnedBorrows = records.filter((r) => r.status === 'returned' || !!r.returned_at).length;
    const pendingRequests = requests.filter((r) => r.status === 'pending').length;

    // Series for chart: 14 days
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(5, 10);
      buckets.set(d, 0);
    }

    records.forEach((r) => {
      const d = String(r.borrowed_at).slice(5, 10);
      if (buckets.has(d)) {
        buckets.set(d, (buckets.get(d) || 0) + 1);
      }
    });

    const chartData = Array.from(buckets, ([day, borrows]) => ({ day, borrows }));

    return {
      totalBooks: books.length,
      totalStudents: students.length,
      pendingRequests,
      activeBorrows,
      returnedBorrows,
      totalBanners: banners.length,
      chartData,
    };
  }, []);

  const cards = [
    { label: t('totalBooks'), value: metrics.totalBooks, icon: Book },
    { label: t('students'), value: metrics.totalStudents, icon: GraduationCap },
    { label: lang === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Requests', value: metrics.pendingRequests, icon: ClipboardList },
    { label: lang === 'ar' ? 'استعارات جارية' : 'Active Borrows', value: metrics.activeBorrows, icon: Users },
    { label: lang === 'ar' ? 'كتب تم إرجاعها' : 'Returned Books', value: metrics.returnedBorrows, icon: RotateCcw },
    { label: t('banners'), value: metrics.totalBanners, icon: ImageIcon },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border rounded-xl p-4 shadow-sm">
            <c.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-extrabold text-foreground">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border rounded-xl p-4">
        <h3 className="font-semibold text-foreground mb-3">{t('borrowActivity')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="borrows" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
