import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import Layout from '@/components/Layout';
import {
  dataService,
  LeaderboardEntry,
  LeaderboardSnapshot,
  LeaderboardSettings,
  ReadingRecord,
} from '@/lib/dataService';
import { useAuth } from '@/contexts/AuthContext';
import { BrandSpinner } from '@/components/LoadingIndicator';
import {
  Trophy,
  Medal,
  Award,
  Search,
  BookOpen,
  Calendar,
  EyeOff,
  History,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leaderboard() {
  const { t, isRTL } = useLanguage();
  const { isAdmin: isAuthAdmin } = useAuth();
  const isAdmin = isAuthAdmin || dataService.isAdminAuthenticated();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<LeaderboardSettings>({
    is_hidden_from_public: false,
    points_per_10_pages: 4,
    last_updated: new Date().toISOString(),
  });
  const [liveEntries, setLiveEntries] = useState<LeaderboardEntry[]>([]);
  const [snapshots, setSnapshots] = useState<LeaderboardSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('live');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student for breakdown modal
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadData();
    window.addEventListener('imthiyaz_data_updated', loadData);
    return () => window.removeEventListener('imthiyaz_data_updated', loadData);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = dataService.getLeaderboardSettings();
      setSettings(s);

      const entries = dataService.getLeaderboard();
      setLiveEntries(entries);

      const snaps = dataService.getLeaderboardSnapshots();
      setSnapshots(snaps);
    } catch (e) {
      console.error('Failed to load leaderboard data', e);
    } finally {
      setLoading(false);
    }
  };

  // Determine current active entries based on selected snapshot
  const activeEntries = useMemo(() => {
    if (selectedSnapshotId === 'live') {
      return liveEntries;
    }
    const snap = snapshots.find((s) => s.id === selectedSnapshotId);
    return snap ? snap.entries : [];
  }, [selectedSnapshotId, liveEntries, snapshots]);

  // Filtered entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return activeEntries;
    const q = searchQuery.toLowerCase().trim();
    return activeEntries.filter(
      (entry) =>
        entry.student_name.toLowerCase().includes(q) ||
        (entry.student_spr_id && entry.student_spr_id.toLowerCase().includes(q)) ||
        (entry.student_department && entry.student_department.toLowerCase().includes(q))
    );
  }, [activeEntries, searchQuery]);

  const top3 = useMemo(() => {
    if (searchQuery.trim()) return [];
    return activeEntries.slice(0, 3);
  }, [activeEntries, searchQuery]);

  const isHidden = settings.is_hidden_from_public && !isAdmin;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <BrandSpinner size={72} label={t('loading') || 'Loading Leaderboard...'} />
        </div>
      </Layout>
    );
  }

  if (isHidden) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-24 px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <EyeOff className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 font-amiri">
            {isRTL ? 'لوحة المتصدرين غير متاحة حالياً' : 'Leaderboard is Currently Hidden'}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed">
            {isRTL
              ? 'تقوم إدارة المكتبة حالياً بتحديث وتقييم سجلات القراءة. ستكون اللوحة متاحة قريباً.'
              : 'The library administration is currently recalculating reading points. Please check back soon.'}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Admin Hidden Notice */}
          {settings.is_hidden_from_public && isAdmin && (
            <div className="bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-2xl p-4 flex items-center gap-3 text-sm">
              <EyeOff className="w-5 h-5 flex-shrink-0" />
              <span>
                {isRTL
                  ? 'ملاحظة للإدارة: لوحة المتصدرين مخفية حالياً عن الزوار والطلاب ومتاحة لك فقط كمعاينة.'
                  : 'Admin Note: This leaderboard is currently hidden from public visitors and only visible to administrators.'}
              </span>
            </div>
          )}

          {/* Header Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary via-purple-700 to-indigo-900 text-white p-8 sm:p-12 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className={`space-y-3 ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs sm:text-sm font-semibold tracking-wide border border-white/20">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isRTL ? 'منافسة القراءة والمعرفة' : 'Reading Championship & Points'}</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black font-amiri tracking-tight">
                  {isRTL ? 'لوحة متصدري كتبخانة' : 'Kuthbkhana Leaderboard'}
                </h1>
                <p className="text-white/80 max-w-xl text-sm sm:text-base leading-relaxed">
                  {isRTL
                    ? 'احتفاء بأكثر الطلاب والرواد قراءةً وإنجازاً في مكتبة الامتياز. انقر على اسم أي طالب لمعرفة تفاصيل نقاطه.'
                    : 'Celebrating the most dedicated readers of Makthabathul Imthiyaz. Click on any student to view their points breakdown.'}
                </p>
              </div>

              {/* Snapshot / Live Selector */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-medium">
                  <History className="w-4 h-4 text-amber-300" />
                  <span>{isRTL ? 'عرض اللوحة:' : 'Board View:'}</span>
                </div>
                <select
                  value={selectedSnapshotId}
                  onChange={(e) => setSelectedSnapshotId(e.target.value)}
                  className="bg-black/30 text-white border border-white/25 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer w-full sm:w-auto"
                >
                  <option value="live" className="bg-slate-900 text-white">
                    🔥 {isRTL ? 'اللوحة الحية الحالية' : 'Live Current Leaderboard'}
                  </option>
                  {snapshots.map((snap) => (
                    <option key={snap.id} value={snap.id} className="bg-slate-900 text-white">
                      📜 {snap.title} ({new Date(snap.snapshot_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Top 3 Podium (Only when not searching) */}
          {top3.length > 0 && !searchQuery.trim() && (
            <div className="pt-6 pb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground font-amiri mb-8 flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-amber-500 animate-bounce" />
                <span>{isRTL ? 'فرسان القراءة الثلاثة الأوائل' : 'Top 3 Champions'}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
                {/* 2nd Place */}
                {top3[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onClick={() => setSelectedStudent(top3[1])}
                    className="order-2 md:order-1 cursor-pointer group bg-card hover:bg-card/90 rounded-3xl p-6 border-2 border-slate-300 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300" />
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-2xl font-black shadow-inner">
                      🥈
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold mb-2">
                      {isRTL ? 'المركز الثاني' : '2nd Rank'}
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {top3[1].student_name}
                    </h3>
                    {top3[1].student_spr_id && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-mono font-bold">
                        <span>SPR: {top3[1].student_spr_id}</span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-around text-xs text-muted-foreground">
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          {top3[1].total_points}
                        </div>
                        <div>{isRTL ? 'نقطة' : 'Pts'}</div>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          {top3[1].books_read_count}
                        </div>
                        <div>{isRTL ? 'كتب' : 'Books'}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 1st Place (Crown) */}
                {top3[0] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => setSelectedStudent(top3[0])}
                    className="order-1 md:order-2 cursor-pointer group bg-gradient-to-b from-amber-500/10 via-card to-card rounded-3xl p-8 border-2 border-amber-400 dark:border-amber-500/60 shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 text-center relative overflow-hidden md:-translate-y-4"
                  >
                    <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-amber-950 flex items-center justify-center text-3xl font-black shadow-xl ring-4 ring-amber-400/30 animate-pulse">
                      👑
                    </div>
                    <div className="inline-block px-3.5 py-1 rounded-full bg-amber-500 text-amber-950 text-xs font-black mb-2 shadow-sm">
                      {isRTL ? '🥇 بطل القراءة - المركز الأول' : '🥇 1st Place Champion'}
                    </div>
                    <h3 className="font-extrabold text-xl text-foreground group-hover:text-amber-500 transition-colors line-clamp-1">
                      {top3[0].student_name}
                    </h3>
                    {top3[0].student_spr_id && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-black ring-1 ring-amber-500/40">
                        <span>SPR: {top3[0].student_spr_id}</span>
                      </div>
                    )}
                    <div className="mt-5 pt-5 border-t border-amber-500/20 flex items-center justify-around text-xs text-muted-foreground">
                      <div>
                        <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                          {top3[0].total_points}
                        </div>
                        <div className="font-medium">{isRTL ? 'نقطة تميز' : 'Points'}</div>
                      </div>
                      <div className="h-8 w-px bg-amber-500/20" />
                      <div>
                        <div className="text-xl font-black text-foreground">
                          {top3[0].books_read_count}
                        </div>
                        <div className="font-medium">{isRTL ? 'كتاباً مقروءاً' : 'Books'}</div>
                      </div>
                      <div className="h-8 w-px bg-amber-500/20" />
                      <div>
                        <div className="text-xl font-black text-foreground">
                          {top3[0].total_pages_read}
                        </div>
                        <div className="font-medium">{isRTL ? 'صفحة' : 'Pages'}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    onClick={() => setSelectedStudent(top3[2])}
                    className="order-3 cursor-pointer group bg-card hover:bg-card/90 rounded-3xl p-6 border-2 border-amber-700/40 dark:border-amber-700/60 shadow-lg hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700" />
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center text-2xl font-black shadow-inner">
                      🥉
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold mb-2">
                      {isRTL ? 'المركز الثالث' : '3rd Rank'}
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {top3[2].student_name}
                    </h3>
                    {top3[2].student_spr_id && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-mono font-bold">
                        <span>SPR: {top3[2].student_spr_id}</span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-around text-xs text-muted-foreground">
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          {top3[2].total_points}
                        </div>
                        <div>{isRTL ? 'نقطة' : 'Pts'}</div>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div>
                        <div className="text-base font-extrabold text-foreground">
                          {top3[2].books_read_count}
                        </div>
                        <div>{isRTL ? 'كتب' : 'Books'}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Search & Stats Bar */}
          <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${
                  isRTL ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحث باسم الطالب أو رقم SPR...' : 'Search student or SPR ID...'}
                className={`w-full rounded-xl bg-muted/60 border border-border py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                }`}
              />
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <span>
                {isRTL ? 'إجمالي الرواد:' : 'Total Readers:'}{' '}
                <strong className="text-foreground">{activeEntries.length}</strong>
              </span>
              <span>•</span>
              <span>
                {isRTL ? 'معيار التقييم:' : 'Rate:'}{' '}
                <strong className="text-primary">
                  {settings.points_per_10_pages} {isRTL ? 'نقاط لكل 10 صفحات' : 'pts / 10 pages'}
                </strong>
              </span>
            </div>
          </div>

          {/* Full Rankings Table */}
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground font-amiri">
                  {isRTL ? 'جدول الترتيب الكامل' : 'Complete Leaderboard Rankings'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isRTL
                    ? 'انقر على اسم أي طالب لمعرفة تفاصيل الكتب التي قرأها والنقاط التي حصدها'
                    : 'Click any student name to inspect their reading records and points history'}
                </p>
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{isRTL ? 'لا توجد نتائج مطابقة' : 'No matching readers found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-xs text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="py-3.5 px-4 text-center w-16">{isRTL ? 'الرتبة' : 'Rank'}</th>
                      <th className="py-3.5 px-4">{isRTL ? 'الطالب / المستخدم' : 'Student / User'}</th>
                      <th className="py-3.5 px-4 text-center">{isRTL ? 'رقم SPR' : 'SPR ID'}</th>
                      <th className="py-3.5 px-4 text-center">{isRTL ? 'الكتب المقروءة' : 'Books Read'}</th>
                      <th className="py-3.5 px-4 text-center">{isRTL ? 'الصفحات' : 'Pages Read'}</th>
                      <th className="py-3.5 px-4 text-center">{isRTL ? 'إجمالي النقاط' : 'Total Points'}</th>
                      <th className="py-3.5 px-4 text-center w-24">{isRTL ? 'التفاصيل' : 'Breakdown'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEntries.map((entry) => {
                      const isTop1 = entry.rank === 1;
                      const isTop2 = entry.rank === 2;
                      const isTop3 = entry.rank === 3;

                      return (
                        <tr
                          key={entry.student_id}
                          onClick={() => setSelectedStudent(entry)}
                          className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        >
                          {/* Rank */}
                          <td className="py-4 px-4 text-center">
                            {isTop1 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-amber-950 font-black text-sm shadow">
                                1
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm">
                                2
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/60 text-amber-100 font-bold text-sm">
                                3
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-muted-foreground">
                                #{entry.rank}
                              </span>
                            )}
                          </td>

                          {/* Student Name */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                              <span>{entry.student_name}</span>
                              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </div>
                            {(entry.student_department || entry.student_batch) && (
                              <div className="text-xs text-muted-foreground">
                                {[entry.student_department, entry.student_batch].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </td>

                          {/* Highlighted SPR ID */}
                          <td className="py-4 px-4 text-center">
                            {entry.student_spr_id ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono font-extrabold text-xs border border-purple-500/30 shadow-sm">
                                <span>SPR:</span>
                                <span>{entry.student_spr_id}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">—</span>
                            )}
                          </td>

                          {/* Books Count */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold">
                              <BookOpen className="w-3.5 h-3.5 text-primary" />
                              <span>{entry.books_read_count}</span>
                            </span>
                          </td>

                          {/* Total Pages */}
                          <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-muted-foreground">
                            {entry.total_pages_read}
                          </td>

                          {/* Total Points */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary font-black text-sm font-mono border border-primary/20">
                              <Award className="w-4 h-4 text-primary" />
                              <span>{entry.total_points}</span>
                            </span>
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(entry);
                              }}
                              className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all text-xs font-bold"
                            >
                              {isRTL ? 'عرض' : 'View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Score Breakdown Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedStudent && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black text-xl">
                    #{selectedStudent.rank}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold font-amiri">
                      {selectedStudent.student_name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {isRTL ? 'تفاصيل سجلات القراءة والنقاط المحسوبة' : 'Reading records & awarded points breakdown'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Student Summary Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 border border-border text-center">
                  <div className="text-xs text-muted-foreground">{isRTL ? 'رقم SPR' : 'SPR ID'}</div>
                  <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                    {selectedStudent.student_spr_id ? (
                      <span className="text-primary font-black">{selectedStudent.student_spr_id}</span>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 border border-border text-center">
                  <div className="text-xs text-muted-foreground">{isRTL ? 'إجمالي النقاط' : 'Total Points'}</div>
                  <div className="font-mono font-black text-lg text-primary mt-0.5">
                    {selectedStudent.total_points}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 border border-border text-center">
                  <div className="text-xs text-muted-foreground">{isRTL ? 'كتب مكتملة' : 'Books Read'}</div>
                  <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                    {selectedStudent.books_read_count}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 border border-border text-center">
                  <div className="text-xs text-muted-foreground">{isRTL ? 'الصفحات المقروءة' : 'Pages Read'}</div>
                  <div className="font-mono font-bold text-sm text-foreground mt-0.5">
                    {selectedStudent.total_pages_read}
                  </div>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-foreground font-amiri flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>{isRTL ? 'سجل الكتب والنقاط المكتسبة:' : 'Books & Points History:'}</span>
                </h4>

                {selectedStudent.reading_records.length === 0 ? (
                  <div className="p-8 text-center bg-muted/30 rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
                    {isRTL ? 'لا توجد سجلات قراءة مقيمة بعد' : 'No evaluated reading records found yet.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.reading_records.map((rec) => {
                      const isFull = rec.reading_status === 'full_read';
                      const isCustom = rec.reading_status === 'custom_pages';
                      const isNotRead = rec.reading_status === 'not_read';

                      return (
                        <div
                          key={rec.id}
                          className="bg-card rounded-2xl p-4 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              <span>{rec.book_title}</span>
                              {rec.book_code && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  {rec.book_code}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                  isFull
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                    : isCustom
                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {isFull && (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isRTL ? 'قراءة كاملة' : 'Full Read'}</span>
                                  </>
                                )}
                                {isCustom && (
                                  <>
                                    <Info className="w-3 h-3" />
                                    <span>
                                      {isRTL ? `قراءة مخصصة (${rec.pages_read} ص)` : `Custom (${rec.pages_read} p)`}
                                    </span>
                                  </>
                                )}
                                {isNotRead && (
                                  <>
                                    <span>{isRTL ? 'لم تتم القراءة' : 'Not Read'}</span>
                                  </>
                                )}
                              </span>

                              <span>•</span>
                              <span>
                                {isRTL ? 'الصفحات المحتسبة:' : 'Credited Pages:'}{' '}
                                <strong className="text-foreground">{rec.pages_read}</strong>
                              </span>

                              {rec.return_date && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(rec.return_date).toLocaleDateString()}</span>
                                  </span>
                                </>
                              )}
                            </div>

                            {rec.notes && (
                              <div className="text-xs italic text-muted-foreground/80">
                                "{rec.notes}"
                              </div>
                            )}
                          </div>

                          {/* Points pill */}
                          <div className="sm:text-right flex-shrink-0">
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary/10 text-primary font-black font-mono text-base border border-primary/20">
                              <span>+{rec.points_awarded}</span>
                              <span className="text-xs font-normal">{isRTL ? 'نقطة' : 'pts'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
