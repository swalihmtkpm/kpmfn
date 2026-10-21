import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export type BookStatus = 'available' | 'missed' | 'borrowed';

export type Book = {
  id: string;
  si_number: number;
  book_code: string;
  title_ar: string;
  title_en: string;
  author_ar: string;
  author_en: string;
  publisher_ar: string;
  publisher_en: string;
  volume: string;
  pages: number;
  category_id: string;
  category_name_ar: string;
  category_name_en: string;
  cover_url: string; // Drive URL or direct image
  status: BookStatus;
  average_rating: number;
  ratings_count: number;
  description_ar?: string;
  description_en?: string;
  created_at: string;
};

export type Student = {
  id: string;
  name: string;
  klass: string;
  spr_id: string; // e.g. SPR0156
  secret_code: string;
  father_name?: string;
  house_name?: string;
  dob?: string;
  created_at: string;
};

export type Banner = {
  id: string;
  type: 'image' | 'video';
  media_url: string; // Drive link or direct media URL
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type BorrowRequest = {
  id: string;
  book_id: string;
  book_title: string;
  student_id?: string;
  requester_name: string;
  requester_type: 'current_student' | 'alumni' | 'other';
  requester_class?: string;
  requester_spr_id?: string;
  requester_phone?: string;
  requester_place?: string;
  requester_address?: string;
  days_requested: number;
  expected_return_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  created_at: string;
  returned_at?: string;
};

export type BorrowRecord = {
  id: string;
  book_id: string;
  book_title: string;
  student_id?: string;
  borrower_name: string;
  student_name?: string;
  student_spr_id?: string;
  borrowed_at: string;
  borrow_date?: string;
  due_at: string;
  returned_at?: string | null;
  return_date?: string | null;
  status: 'active' | 'returned' | 'overdue';
};

export type OverdueRecord = BorrowRecord & {
  days_overdue: number;
  expected_return_date: string;
  student_name: string;
  student_spr_id?: string;
  borrow_date: string;
};

export type Review = {
  id: string;
  book_id: string;
  reviewer_name: string;
  content: string;
  rating?: number;
  created_at: string;
};

export type RatingRecord = {
  id: string;
  book_id: string;
  stars: number;
  rater_name: string;
  created_at: string;
};

export type ReadingStatus = 'full' | 'custom' | 'not_read' | 'full_read' | 'custom_pages';

export type ReadingRecord = {
  id: string;
  borrow_record_id?: string;
  student_id?: string;
  student_name: string;
  student_spr_id?: string;
  book_id: string;
  book_title: string;
  book_pages: number;
  book_code?: string;
  reading_status: ReadingStatus;
  pages_read: number;
  points_awarded: number;
  awarded_at: string;
  valuation_rate_per_10_pages?: number;
  return_date?: string;
  notes?: string;
};

export type LeaderboardSettings = {
  points_per_10_pages: number; // e.g. 4 points per 10 pages read
  is_hidden_from_public: boolean;
  last_updated?: string;
};

export type LeaderboardEntry = {
  rank: number;
  student_id?: string;
  student_name: string;
  student_spr_id?: string;
  student_department?: string;
  student_batch?: string;
  total_points: number;
  books_completed: number;
  books_read_count?: number;
  total_pages_read: number;
  readings: ReadingRecord[];
  reading_records?: ReadingRecord[];
};

export type LeaderboardSnapshot = {
  id: string;
  name: string;
  title: string;
  created_at: string;
  snapshot_date: string;
  entries: LeaderboardEntry[];
};

export type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  slug?: string;
  icon?: string;
  color?: string;
  sort_order: number;
};

/**
 * Converts any Google Drive URL into a direct, high-performance displayable URL.
 * Supports:
 * - https://drive.google.com/file/d/{ID}/view
 * - https://drive.google.com/open?id={ID}
 * - https://drive.google.com/uc?id={ID}
 * - direct URLs
 */
export function convertDriveUrl(url: string | null | undefined, type: 'image' | 'video' = 'image'): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileIdMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    if (type === 'video') {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    // High-speed CDN direct image link
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUUID(val?: string | null): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

const STORAGE_KEYS = {
  BOOKS: 'imthiyaz_books_v3',
  STUDENTS: 'imthiyaz_students_v3',
  BANNERS: 'imthiyaz_banners_v3',
  REQUESTS: 'imthiyaz_borrow_requests_v3',
  RECORDS: 'imthiyaz_borrow_records_v3',
  CATEGORIES: 'imthiyaz_categories_v3',
  REVIEWS: 'imthiyaz_reviews_v3',
  RATINGS: 'imthiyaz_ratings_v3',
  READING_RECORDS: 'imthiyaz_reading_records_v3',
  LEADERBOARD_SETTINGS: 'imthiyaz_leaderboard_settings_v3',
  LEADERBOARD_SNAPSHOTS: 'imthiyaz_leaderboard_snapshots_v3',
};

export const DEFAULT_LEADERBOARD_SETTINGS: LeaderboardSettings = {
  points_per_10_pages: 4,
  is_hidden_from_public: false,
};

export const DEFAULT_READING_RECORDS: ReadingRecord[] = [];
export const DEFAULT_REVIEWS: Review[] = [];

// Seed Categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name_ar: 'الحديث الشريف وعلومه', name_en: 'Hadith & Its Sciences', icon: 'BookOpen', color: '#10b981', sort_order: 1 },
  { id: 'cat-2', name_ar: 'الفقه الشافعي وأصوله', name_en: 'Shafi’i Fiqh & Usul', icon: 'Scale', color: '#6366f1', sort_order: 2 },
  { id: 'cat-3', name_ar: 'التفسير وعلوم القرآن', name_en: 'Tafsir & Quranic Sciences', icon: 'Sparkles', color: '#f59e0b', sort_order: 3 },
  { id: 'cat-4', name_ar: 'السيرة النبوية والتاريخ', name_en: 'Prophetic Biography & History', icon: 'Compass', color: '#8b5cf6', sort_order: 4 },
  { id: 'cat-5', name_ar: 'العقيدة والتصوف', name_en: 'Aqeedah & Tasawwuf', icon: 'Heart', color: '#ec4899', sort_order: 5 },
  { id: 'cat-6', name_ar: 'اللغة العربية وآدابها', name_en: 'Arabic Language & Literature', icon: 'Feather', color: '#06b6d4', sort_order: 6 },
];

// Clean defaults: 0 mock students
export const DEFAULT_STUDENTS: Student[] = [];

// Clean defaults: 0 mock books
export const DEFAULT_BOOKS: Book[] = [];

// Seed Banners (with Drive image / video options)
export const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'ban-1',
    type: 'image',
    media_url: 'https://images.unsplash.com/photo-1507842229451-7f01be7a50d7?auto=format&fit=crop&w=1600&q=80',
    title_ar: 'مكتبة الامتياز الرقمية',
    title_en: 'Makthabathul Imthiyaz Digital Library',
    subtitle_ar: 'منارة المعرفة والقراءة لطلاب وخريجي الامتياز — آلاف المراجع الإسلامية والأكاديمية',
    subtitle_en: 'A beacon of knowledge and reading for Excellence students and alumni',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'ban-2',
    type: 'image',
    media_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80',
    title_ar: '«طلبُ العِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ»',
    title_en: 'Seeking knowledge is an obligation upon every Muslim',
    subtitle_ar: 'تصفح أحدث المراجع والكتب النادرة واستمتع برحلة القراءة الممتعة',
    subtitle_en: 'Explore classical manuscripts and modern reference works',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

// Clean defaults: 0 mock requests
export const DEFAULT_REQUESTS: BorrowRequest[] = [];

// Clean defaults: 0 mock records
export const DEFAULT_RECORDS: BorrowRecord[] = [];

class DataService {
  private getItem<T>(key: string, fallback: T): T {
    try {
      const val = localStorage.getItem(key);
      if (!val) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.notifyChange();
    } catch (e) {
      console.warn('DataService write error:', e);
    }
  }

  notifyChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('imthiyaz_data_updated'));
    }
  }

  isAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('imthiyaz_admin_session') === '1';
    } catch {
      return false;
    }
  }

  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Purge old legacy keys
      const legacyKeys = [
        'imthiyaz_books', 'imthiyaz_students', 'imthiyaz_borrow_requests', 'imthiyaz_borrow_records',
        'imthiyaz_books_v2', 'imthiyaz_students_v2', 'imthiyaz_banners_v2',
        'imthiyaz_borrow_requests_v2', 'imthiyaz_borrow_records_v2',
        'imthiyaz_reading_records_v2', 'imthiyaz_reviews_v2', 'imthiyaz_ratings_v2',
        'imthiyaz_leaderboard_snapshots_v2', 'imthiyaz_leaderboard_settings_v2'
      ];
      for (const k of legacyKeys) {
        try { localStorage.removeItem(k); } catch {}
      }
      this.syncFromSupabase().catch(() => {});

      // Connect to Supabase Realtime database changes
      try {
        supabase
          .channel('public:realtime_library')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            this.syncFromSupabase().catch(() => {});
          })
          .subscribe();
      } catch (e) {
        console.warn('Realtime channel notice:', e);
      }

      // Auto-sync on window focus
      window.addEventListener('focus', () => {
        this.syncFromSupabase().catch(() => {});
      });

      // Background periodic sync every 20 seconds
      setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.syncFromSupabase().catch(() => {});
        }
      }, 20000);
    }
  }

  async checkCloudHealth(): Promise<{
    ready: boolean;
    booksAccessible: boolean;
    studentsAccessible: boolean;
    settingsWritable: boolean;
    reason?: string;
  }> {
    let booksAccessible = false;
    let studentsAccessible = false;
    let settingsWritable = false;

    try {
      const { error: bErr } = await supabase.from('books').select('id').limit(1);
      booksAccessible = !bErr;
    } catch {}

    try {
      const { error: sErr } = await (supabase as any).from('students').select('id').limit(1);
      studentsAccessible = !sErr;
    } catch {}

    try {
      const { error: wErr } = await supabase.from('library_settings').upsert(
        { key: 'cloud_health_ping', value: { ping: Date.now() } },
        { onConflict: 'key' }
      );
      settingsWritable = !wErr;
    } catch {}

    const ready = booksAccessible && studentsAccessible && settingsWritable;
    let reason: string | undefined;
    if (!ready) {
      if (!studentsAccessible) {
        reason = 'Missing tables (public.students / reading_records). SQL migration required.';
      } else if (!settingsWritable) {
        reason = 'RLS policy blocking writes. SQL migration required.';
      }
    }

    return {
      ready,
      booksAccessible,
      studentsAccessible,
      settingsWritable,
      reason,
    };
  }

  clearAllData(): void {
    this.setItem(STORAGE_KEYS.BOOKS, []);
    this.setItem(STORAGE_KEYS.STUDENTS, []);
    this.setItem(STORAGE_KEYS.REQUESTS, []);
    this.setItem(STORAGE_KEYS.RECORDS, []);
    this.setItem(STORAGE_KEYS.READING_RECORDS, []);
    this.setItem(STORAGE_KEYS.REVIEWS, []);
    this.setItem(STORAGE_KEYS.RATINGS, []);
    this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, []);

    // Sync clean slate to permanent cloud settings
    this.syncToCloud('library_books_v3', []);
    this.syncToCloud('library_students_v3', []);
    this.syncToCloud('library_requests_v3', []);
    this.syncToCloud('library_records_v3', []);
    this.syncToCloud('library_reading_records_v3', []);
    this.syncToCloud('library_leaderboard_snapshots_v3', []);

    // Attempt direct delete on Supabase tables
    (async () => {
      try {
        await supabase.from('books').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await (supabase as any).from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('borrow_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('borrow_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await (supabase as any).from('reading_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('clearAllData Supabase delete notice:', e);
      }
    })();

    this.notifyChange();
  }

  private async syncToCloud(cloudKey: string, data: any) {
    try {
      await supabase.from('library_settings').upsert(
        { key: cloudKey, value: data as any },
        { onConflict: 'key' }
      );
    } catch (e) {
      console.warn(`Cloud sync for ${cloudKey} warning:`, e);
    }
  }

  async syncFromSupabase(): Promise<void> {
    if (this.isSyncing || typeof window === 'undefined') return;
    this.isSyncing = true;
    try {
      // 1. Fetch library_settings rows for global configurations & snapshots
      const { data: settingsData } = await supabase.from('library_settings').select('*');
      const settingsMap = new Map<string, any>();
      if (settingsData && settingsData.length > 0) {
        for (const row of settingsData) {
          settingsMap.set(row.key, row.value);
          if (row.key === 'library_leaderboard_settings_v3' && row.value) {
            this.setItem(STORAGE_KEYS.LEADERBOARD_SETTINGS, row.value);
          }
          if (row.key === 'admin_security_config' && row.value?.password_hash) {
            localStorage.setItem('imthiyaz_admin_pw_hash', row.value.password_hash);
          }
        }
      }

      // 2. Fetch permanent categories table
      const { data: remoteCats } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (remoteCats && remoteCats.length > 0) {
        this.setItem(STORAGE_KEYS.CATEGORIES, remoteCats);
      } else {
        const backupCats = settingsMap.get('library_categories_v3');
        if (Array.isArray(backupCats) && backupCats.length > 0) {
          this.setItem(STORAGE_KEYS.CATEGORIES, backupCats);
          for (const c of backupCats) {
            await supabase.from('categories').upsert({
              id: isUUID(c.id) ? c.id : undefined,
              name_ar: c.name_ar,
              name_en: c.name_en || null,
              slug: c.slug || null,
              icon: c.icon || null,
              sort_order: c.sort_order || 1,
            }).catch(() => {});
          }
        }
      }
      const allCategories = this.getCategories();
      const catMap = new Map(allCategories.map((c) => [c.id, c]));

      // 3. Fetch permanent books table
      const { data: remoteBooks } = await supabase.from('books').select('*');
      const backupBooks = settingsMap.get('library_books_v3');
      if (remoteBooks && remoteBooks.length > 0) {
        this.mergeRemoteBooks(remoteBooks, catMap);
      } else if (Array.isArray(backupBooks) && backupBooks.length > 0) {
        // Auto-seed books table from backup
        await this.autoMigrateBooksToTable(backupBooks);
        const { data: refetched } = await supabase.from('books').select('*');
        if (refetched && refetched.length > 0) {
          this.mergeRemoteBooks(refetched, catMap);
        } else {
          this.setItem(STORAGE_KEYS.BOOKS, backupBooks);
        }
      }

      // 4. Fetch permanent students table
      const { data: remoteStudents } = await (supabase as any).from('students').select('*');
      const backupStudents = settingsMap.get('library_students_v3');
      if (remoteStudents && remoteStudents.length > 0) {
        this.setItem(STORAGE_KEYS.STUDENTS, remoteStudents);
        // Also keep library_students_v3 backup fresh
        this.syncToCloud('library_students_v3', remoteStudents);
      } else if (Array.isArray(backupStudents) && backupStudents.length > 0) {
        // Auto-seed students table from backup
        await this.autoMigrateStudentsToTable(backupStudents);
        const { data: refetchedStudents } = await (supabase as any).from('students').select('*');
        if (refetchedStudents && refetchedStudents.length > 0) {
          this.setItem(STORAGE_KEYS.STUDENTS, refetchedStudents);
        } else {
          this.setItem(STORAGE_KEYS.STUDENTS, backupStudents);
        }
      }

      // 5. Fetch permanent borrow_requests table
      const { data: remoteReqs } = await supabase.from('borrow_requests').select('*').order('created_at', { ascending: false });
      const backupReqs = settingsMap.get('library_requests_v3');
      if (remoteReqs && remoteReqs.length > 0) {
        this.setItem(STORAGE_KEYS.REQUESTS, remoteReqs);
      } else if (Array.isArray(backupReqs) && backupReqs.length > 0) {
        this.setItem(STORAGE_KEYS.REQUESTS, backupReqs);
        for (const req of backupReqs) {
          await this.syncBorrowRequestDirect(req).catch(() => {});
        }
      }

      // 6. Fetch permanent borrow_records table
      const { data: remoteRecs } = await supabase.from('borrow_records').select('*').order('borrowed_at', { ascending: false });
      const backupRecs = settingsMap.get('library_records_v3');
      if (remoteRecs && remoteRecs.length > 0) {
        this.setItem(STORAGE_KEYS.RECORDS, remoteRecs);
      } else if (Array.isArray(backupRecs) && backupRecs.length > 0) {
        this.setItem(STORAGE_KEYS.RECORDS, backupRecs);
        for (const rec of backupRecs) {
          await this.syncBorrowRecordDirect(rec).catch(() => {});
        }
      }

      // 7. Fetch permanent reading_records table
      const { data: remoteReadings } = await (supabase as any).from('reading_records').select('*').order('awarded_at', { ascending: false });
      const backupReadings = settingsMap.get('library_reading_records_v3');
      if (remoteReadings && remoteReadings.length > 0) {
        this.setItem(STORAGE_KEYS.READING_RECORDS, remoteReadings);
      } else if (Array.isArray(backupReadings) && backupReadings.length > 0) {
        this.setItem(STORAGE_KEYS.READING_RECORDS, backupReadings);
        for (const r of backupReadings) {
          await this.syncReadingRecordDirect(r).catch(() => {});
        }
      }

      // 8. Fetch permanent advertisements table
      const { data: remoteAds } = await supabase.from('advertisements').select('*').order('sort_order', { ascending: true });
      const backupBanners = settingsMap.get('library_banners_v3');
      if (remoteAds && remoteAds.length > 0) {
        const bMap = new Map(this.getBanners().map((b) => [b.id, b]));
        for (const ad of remoteAds) {
          const mediaUrl = ad.image_path?.startsWith('http')
            ? ad.image_path
            : 'https://images.unsplash.com/photo-1507842229452-94429e2467b7?auto=format&fit=crop&w=1600&q=80';
          bMap.set(ad.id, {
            id: ad.id,
            type: 'image',
            media_url: mediaUrl,
            title_ar: ad.title_ar,
            title_en: ad.title_en || '',
            subtitle_ar: ad.link_url || '',
            subtitle_en: '',
            is_active: ad.is_active,
            sort_order: ad.sort_order,
            created_at: ad.created_at,
          });
        }
        this.setItem(STORAGE_KEYS.BANNERS, Array.from(bMap.values()));
      } else if (Array.isArray(backupBanners) && backupBanners.length > 0) {
        this.setItem(STORAGE_KEYS.BANNERS, backupBanners);
      }

      // 9. Fetch permanent leaderboard_snapshots table
      const { data: remoteSnaps } = await (supabase as any).from('leaderboard_snapshots').select('*').order('created_at', { ascending: false });
      const backupSnaps = settingsMap.get('library_leaderboard_snapshots_v3');
      if (remoteSnaps && remoteSnaps.length > 0) {
        this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, remoteSnaps);
      } else if (Array.isArray(backupSnaps) && backupSnaps.length > 0) {
        this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, backupSnaps);
      }

      // 10. Fetch reviews table
      const { data: rv } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (rv && rv.length > 0) {
        const currentReviews = this.getItem<Review[]>(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
        const map = new Map<string, Review>();
        currentReviews.forEach((r) => map.set(r.id, r));
        rv.forEach((r: any) => {
          map.set(r.id, {
            id: r.id,
            book_id: r.book_id,
            reviewer_name: r.reviewer_name || 'قارئ',
            content: r.content,
            created_at: r.created_at,
          });
        });
        this.setItem(STORAGE_KEYS.REVIEWS, Array.from(map.values()));
      }
    } catch (e) {
      console.warn('Sync from Supabase notice:', e);
    } finally {
      this.isSyncing = false;
      this.notifyChange();
    }
  }

  private async autoMigrateStudentsToTable(students: Student[]): Promise<void> {
    try {
      const rows = students.map((s) => ({
        ...(isUUID(s.id) ? { id: s.id } : {}),
        name: s.name,
        klass: s.klass || '',
        spr_id: s.spr_id,
        secret_code: String(s.secret_code),
        father_name: s.father_name || null,
        house_name: s.house_name || null,
        dob: s.dob || null,
      }));
      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        await (supabase as any).from('students').upsert(chunk, { onConflict: 'spr_id' });
      }
    } catch (e) {
      console.warn('autoMigrateStudentsToTable warning:', e);
    }
  }

  private async autoMigrateBooksToTable(books: Book[]): Promise<void> {
    try {
      const rows = books.map((b) => ({
        ...(isUUID(b.id) ? { id: b.id } : {}),
        book_code: b.book_code,
        title_ar: b.title_ar,
        title_en: b.title_en || null,
        author_name_ar: b.author_ar || null,
        author_name_en: b.author_en || null,
        publisher_name_ar: b.publisher_ar || null,
        publisher_name_en: b.publisher_en || null,
        volume: b.volume || '1',
        pages: b.pages || 0,
        category_id: isUUID(b.category_id) ? b.category_id : null,
        cover_url: b.cover_url || null,
        status: b.status || 'available',
        average_rating: b.average_rating || 5.0,
        ratings_count: b.ratings_count || 1,
        description_ar: b.description_ar || null,
        description_en: b.description_en || null,
      }));
      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        await supabase.from('books').upsert(chunk, { onConflict: 'book_code' });
      }
    } catch (e) {
      console.warn('autoMigrateBooksToTable warning:', e);
    }
  }

  private mergeRemoteBooks(remoteBooks: any[], catMap: Map<string, Category>): void {
    const currentBooks = this.getBooks();
    const map = new Map(currentBooks.map((b) => [b.book_code, b]));
    for (const rb of remoteBooks) {
      const cat = catMap.get(rb.category_id || '');
      const existing = map.get(rb.book_code || '') || currentBooks.find((b) => b.id === rb.id);
      const mapped: Book = {
        id: rb.id,
        si_number: rb.si_number || (existing ? existing.si_number : currentBooks.length + 1),
        book_code: rb.book_code || (existing ? existing.book_code : `KB-${String(currentBooks.length + 1).padStart(3, '0')}`),
        title_ar: rb.title_ar,
        title_en: rb.title_en || '',
        author_ar: (rb as any).author_name_ar || (rb as any).author_ar || existing?.author_ar || '',
        author_en: (rb as any).author_name_en || (rb as any).author_en || existing?.author_en || '',
        publisher_ar: (rb as any).publisher_name_ar || (rb as any).publisher_ar || existing?.publisher_ar || '',
        publisher_en: (rb as any).publisher_name_en || (rb as any).publisher_en || existing?.publisher_en || '',
        volume: rb.volume || existing?.volume || '1',
        pages: Number(rb.pages) || existing?.pages || 0,
        category_id: rb.category_id || existing?.category_id || 'cat-1',
        category_name_ar: cat?.name_ar || existing?.category_name_ar || 'عام',
        category_name_en: cat?.name_en || existing?.category_name_en || 'General',
        cover_url: (rb as any).cover_url || rb.cover_path || existing?.cover_url || '',
        status: ((rb.status as any) || existing?.status || 'available') as BookStatus,
        average_rating: Number(rb.average_rating) || existing?.average_rating || 5.0,
        ratings_count: Number(rb.ratings_count) || existing?.ratings_count || 1,
        description_ar: rb.description_ar || existing?.description_ar || '',
        description_en: rb.description_en || existing?.description_en || '',
        created_at: rb.created_at || existing?.created_at || new Date().toISOString(),
      };
      map.set(mapped.book_code, mapped);
    }
    this.setItem(STORAGE_KEYS.BOOKS, Array.from(map.values()));
  }

  // Categories
  getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  getCategoryBookCounts(): Record<string, number> {
    const books = this.getBooks();
    const counts: Record<string, number> = {};
    for (const b of books) {
      if (b.category_id) {
        counts[b.category_id] = (counts[b.category_id] || 0) + 1;
      }
    }
    return counts;
  }

  // Books
  getBooks(): Book[] {
    return this.getItem(STORAGE_KEYS.BOOKS, DEFAULT_BOOKS);
  }

  getBookById(id: string): Book | undefined {
    if (!id) return undefined;
    const cleanId = decodeURIComponent(id).trim();
    const books = this.getBooks();
    return (
      books.find((b) => b.id === cleanId) ||
      books.find((b) => b.id.toLowerCase() === cleanId.toLowerCase()) ||
      books.find((b) => b.id === cleanId.replace(/\s+/g, '-')) ||
      books.find((b) => b.id.replace(/-/g, ' ') === cleanId.replace(/-/g, ' ')) ||
      books.find((b) => b.book_code?.toLowerCase() === cleanId.toLowerCase()) ||
      books.find((b) => b.si_number?.toString() === cleanId)
    );
  }

  getBookBorrowState(bookId: string): 'borrowed' | 'requested' | 'missed' | 'available' {
    if (!bookId) return 'available';
    const book = this.getBookById(bookId);
    if (book?.status === 'missed') return 'missed';
    if (book?.status === 'borrowed') return 'borrowed';

    const records = this.getBorrowRecords();
    const hasActive = records.some(
      (r) => (r.book_id === bookId || (book && (r.book_id === book.id || r.book_id === book.book_code))) && r.status === 'active'
    );
    if (hasActive) return 'borrowed';

    const requests = this.getBorrowRequests();
    const hasPending = requests.some(
      (r) => (r.book_id === bookId || (book && (r.book_id === book.id || r.book_id === book.book_code))) && r.status === 'pending'
    );
    if (hasPending) return 'requested';

    return 'available';
  }

  saveBook(book: Partial<Book> & { title_ar: string }): Book {
    const list = this.getBooks();
    if (book.id) {
      const idx = list.findIndex((b) => b.id === book.id || (book.book_code && b.book_code === book.book_code));
      if (idx !== -1) {
        const updated = { ...list[idx], ...book };
        list[idx] = updated;
        this.setItem(STORAGE_KEYS.BOOKS, list);
        this.syncToCloud('library_books_v3', list);
        this.syncBookDirectToSupabase(updated);
        return updated;
      }
    }
    const maxSi = list.reduce((max, b) => Math.max(max, b.si_number || 0), 0);
    const newBook: Book = {
      id: isUUID(book.id) ? book.id! : generateUUID(),
      si_number: maxSi + 1,
      book_code: book.book_code || `KB-${String(maxSi + 1).padStart(3, '0')}`,
      title_ar: book.title_ar,
      title_en: book.title_en || '',
      author_ar: book.author_ar || '',
      author_en: book.author_en || '',
      publisher_ar: book.publisher_ar || '',
      publisher_en: book.publisher_en || '',
      volume: book.volume || '1',
      pages: Number(book.pages) || 0,
      category_id: book.category_id || 'cat-1',
      category_name_ar: book.category_name_ar || 'عام',
      category_name_en: book.category_name_en || 'General',
      cover_url: book.cover_url || '',
      status: book.status || 'available',
      average_rating: book.average_rating ?? 5.0,
      ratings_count: book.ratings_count ?? 1,
      description_ar: book.description_ar || '',
      description_en: book.description_en || '',
      created_at: new Date().toISOString(),
    };
    list.unshift(newBook);
    this.setItem(STORAGE_KEYS.BOOKS, list);
    this.syncToCloud('library_books_v3', list);
    this.syncBookDirectToSupabase(newBook);
    return newBook;
  }

  private async syncBookDirectToSupabase(b: Book): Promise<void> {
    try {
      await supabase
        .from('books')
        .upsert(
          {
            id: isUUID(b.id) ? b.id : undefined,
            book_code: b.book_code,
            title_ar: b.title_ar,
            title_en: b.title_en || null,
            author_name_ar: b.author_ar || null,
            author_name_en: b.author_en || null,
            publisher_name_ar: b.publisher_ar || null,
            publisher_name_en: b.publisher_en || null,
            volume: b.volume || '1',
            pages: b.pages || 0,
            category_id: isUUID(b.category_id) ? b.category_id : null,
            cover_url: b.cover_url || null,
            status: b.status || 'available',
            average_rating: b.average_rating || 5.0,
            ratings_count: b.ratings_count || 1,
            description_ar: b.description_ar || null,
            description_en: b.description_en || null,
          },
          { onConflict: 'book_code' }
        );
    } catch (e) {
      console.warn('syncBookDirectToSupabase notice:', e);
    }
  }

  deleteBook(id: string): void {
    const list = this.getBooks().filter((b) => b.id !== id && b.book_code !== id);
    this.setItem(STORAGE_KEYS.BOOKS, list);
    this.syncToCloud('library_books_v3', list);

    (async () => {
      try {
        if (isUUID(id)) {
          await supabase.from('books').delete().eq('id', id);
        }
        await supabase.from('books').delete().eq('book_code', id);
      } catch (e) {
        console.warn('deleteBook Supabase notice:', e);
      }
    })();
  }

  bulkAddBooks(rows: Partial<Book>[]): number {
    const list = this.getBooks();
    let maxSi = list.reduce((max, b) => Math.max(max, b.si_number || 0), 0);
    let added = 0;
    const newBooks: Book[] = [];

    for (const r of rows) {
      if (!r.title_ar?.trim()) continue;
      maxSi++;
      const newBook: Book = {
        id: isUUID(r.id) ? r.id! : generateUUID(),
        si_number: maxSi,
        book_code: r.book_code || `KB-${String(maxSi).padStart(3, '0')}`,
        title_ar: r.title_ar.trim(),
        title_en: r.title_en?.trim() || '',
        author_ar: r.author_ar?.trim() || '',
        author_en: r.author_en?.trim() || '',
        publisher_ar: r.publisher_ar?.trim() || '',
        publisher_en: r.publisher_en?.trim() || '',
        volume: r.volume?.toString() || '1',
        pages: Number(r.pages) || 0,
        category_id: r.category_id || 'cat-1',
        category_name_ar: r.category_name_ar || 'عام',
        category_name_en: r.category_name_en || 'General',
        cover_url: r.cover_url || '',
        status: (r.status === 'missed' ? 'missed' : 'available') as BookStatus,
        average_rating: Number(r.average_rating) || 5.0,
        ratings_count: Number(r.ratings_count) || 1,
        description_ar: r.description_ar?.trim() || '',
        description_en: r.description_en?.trim() || '',
        created_at: new Date().toISOString(),
      };
      list.unshift(newBook);
      newBooks.push(newBook);
      added++;
    }
    this.setItem(STORAGE_KEYS.BOOKS, list);
    this.syncToCloud('library_books_v3', list);

    if (newBooks.length > 0) {
      this.autoMigrateBooksToTable(newBooks).catch(() => {});
    }

    return added;
  }

  // Students
  getStudents(): Student[] {
    return this.getItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
  }

  getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id || s.spr_id === id);
  }

  saveStudent(student: Partial<Student> & { name: string; klass: string; spr_id: string; secret_code: string }): Student {
    const list = this.getStudents();
    if (student.id) {
      const idx = list.findIndex((s) => s.id === student.id || s.spr_id === student.spr_id);
      if (idx !== -1) {
        const updated = { ...list[idx], ...student };
        list[idx] = updated;
        this.setItem(STORAGE_KEYS.STUDENTS, list);
        this.syncToCloud('library_students_v3', list);
        this.syncStudentDirectToSupabase(updated);
        return updated;
      }
    }
    const newStudent: Student = {
      id: isUUID(student.id) ? student.id! : generateUUID(),
      name: student.name.trim(),
      klass: student.klass.trim(),
      spr_id: student.spr_id.trim().toUpperCase(),
      secret_code: student.secret_code.trim(),
      father_name: student.father_name ? student.father_name.trim().toUpperCase().replace(/\s+/g, '') : '',
      house_name: student.house_name ? student.house_name.trim().toUpperCase().replace(/\s+/g, '') : '',
      dob: student.dob ? student.dob.trim() : '',
      created_at: new Date().toISOString(),
    };
    list.unshift(newStudent);
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v3', list);
    this.syncStudentDirectToSupabase(newStudent);
    return newStudent;
  }

  private async syncStudentDirectToSupabase(s: Student): Promise<void> {
    try {
      await (supabase as any)
        .from('students')
        .upsert(
          {
            id: isUUID(s.id) ? s.id : undefined,
            name: s.name,
            klass: s.klass,
            spr_id: s.spr_id,
            secret_code: s.secret_code,
            father_name: s.father_name || null,
            house_name: s.house_name || null,
            dob: s.dob || null,
          },
          { onConflict: 'spr_id' }
        );
    } catch (e) {
      console.warn('syncStudentDirectToSupabase notice:', e);
    }
  }

  deleteStudent(id: string): void {
    const list = this.getStudents().filter((s) => s.id !== id && s.spr_id !== id);
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v3', list);

    (async () => {
      try {
        if (isUUID(id)) {
          await (supabase as any).from('students').delete().eq('id', id);
        }
        await (supabase as any).from('students').delete().eq('spr_id', id);
      } catch (e) {
        console.warn('deleteStudent Supabase notice:', e);
      }
    })();
  }

  bulkAddStudents(rows: Partial<Student>[]): number {
    const list = this.getStudents();
    let added = 0;
    const newStudents: Student[] = [];

    for (const r of rows) {
      if (!r.name?.trim() || !r.spr_id?.trim() || !r.secret_code?.trim()) continue;
      const newStudent: Student = {
        id: isUUID(r.id) ? r.id! : generateUUID(),
        name: r.name.trim(),
        klass: (r.klass || '').trim(),
        spr_id: r.spr_id.trim().toUpperCase(),
        secret_code: String(r.secret_code).trim(),
        father_name: r.father_name ? String(r.father_name).trim().toUpperCase().replace(/\s+/g, '') : '',
        house_name: r.house_name ? String(r.house_name).trim().toUpperCase().replace(/\s+/g, '') : '',
        dob: r.dob ? String(r.dob).trim() : '',
        created_at: new Date().toISOString(),
      };
      list.unshift(newStudent);
      newStudents.push(newStudent);
      added++;
    }
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v3', list);

    if (newStudents.length > 0) {
      this.autoMigrateStudentsToTable(newStudents).catch(() => {});
    }

    return added;
  }

  updateStudentPassword(studentId: string, newCode: string): boolean {
    const list = this.getStudents();
    const student = list.find((s) => s.id === studentId || s.spr_id === studentId);
    if (!student) return false;
    student.secret_code = newCode.trim();
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v3', list);
    this.syncStudentDirectToSupabase(student);
    return true;
  }

  // Banners
  getBanners(): Banner[] {
    return this.getItem(STORAGE_KEYS.BANNERS, DEFAULT_BANNERS);
  }

  saveBanner(banner: Partial<Banner> & { media_url: string }): Banner {
    const list = this.getBanners();
    if (banner.id) {
      const idx = list.findIndex((b) => b.id === banner.id);
      if (idx !== -1) {
        const updated = { ...list[idx], ...banner };
        list[idx] = updated;
        this.setItem(STORAGE_KEYS.BANNERS, list);
        this.syncToCloud('library_banners_v3', list);
        this.syncBannerDirectToSupabase(updated);
        return updated;
      }
    }
    const newBanner: Banner = {
      id: isUUID(banner.id) ? banner.id! : generateUUID(),
      type: banner.type || 'image',
      media_url: banner.media_url.trim(),
      title_ar: banner.title_ar?.trim() || '',
      title_en: banner.title_en?.trim() || '',
      subtitle_ar: banner.subtitle_ar?.trim() || '',
      subtitle_en: banner.subtitle_en?.trim() || '',
      is_active: banner.is_active ?? true,
      sort_order: banner.sort_order ?? list.length + 1,
      created_at: new Date().toISOString(),
    };
    list.push(newBanner);
    this.setItem(STORAGE_KEYS.BANNERS, list);
    this.syncToCloud('library_banners_v3', list);
    this.syncBannerDirectToSupabase(newBanner);
    return newBanner;
  }

  private async syncBannerDirectToSupabase(b: Banner): Promise<void> {
    try {
      await supabase
        .from('advertisements')
        .upsert({
          id: isUUID(b.id) ? b.id : undefined,
          title_ar: b.title_ar || 'إعلان',
          title_en: b.title_en || null,
          image_path: b.media_url,
          link_url: b.subtitle_ar || null,
          is_active: b.is_active,
          sort_order: b.sort_order,
        });
    } catch (e) {
      console.warn('syncBannerDirectToSupabase notice:', e);
    }
  }

  deleteBanner(id: string): void {
    const list = this.getBanners().filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BANNERS, list);
    this.syncToCloud('library_banners_v3', list);

    (async () => {
      try {
        if (isUUID(id)) {
          await supabase.from('advertisements').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('deleteBanner Supabase notice:', e);
      }
    })();
  }

  // Borrow Requests & Records
  getBorrowRequests(): BorrowRequest[] {
    return this.getItem(STORAGE_KEYS.REQUESTS, DEFAULT_REQUESTS);
  }

  addBorrowRequest(req: Omit<BorrowRequest, 'id' | 'created_at' | 'status'>): BorrowRequest {
    const list = this.getBorrowRequests();
    const newReq: BorrowRequest = {
      ...req,
      id: generateUUID(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    list.unshift(newReq);
    this.setItem(STORAGE_KEYS.REQUESTS, list);
    this.syncToCloud('library_requests_v3', list);
    this.syncBorrowRequestDirect(newReq).catch(() => {});
    return newReq;
  }

  private async syncBorrowRequestDirect(req: BorrowRequest): Promise<void> {
    try {
      await (supabase as any).from('borrow_requests').upsert({
        id: isUUID(req.id) ? req.id : undefined,
        book_id: isUUID(req.book_id) ? req.book_id : undefined,
        student_id: req.student_id || req.requester_spr_id,
        requester_name: req.requester_name,
        requester_type: req.requester_type,
        requester_class: req.requester_class,
        requester_spr_id: req.requester_spr_id,
        requester_phone: req.requester_phone,
        requester_place: req.requester_place,
        requester_address: req.requester_address,
        days_requested: req.days_requested,
        expected_return_date: req.expected_return_date,
        status: req.status,
        returned_at: req.returned_at || null,
      });
    } catch (e) {
      console.warn('syncBorrowRequestDirect notice:', e);
    }
  }

  updateBorrowRequestStatus(id: string, status: BorrowRequest['status']): void {
    const list = this.getBorrowRequests();
    const item = list.find((r) => r.id === id);
    if (item) {
      item.status = status;
      if (status === 'returned') item.returned_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.REQUESTS, list);
      this.syncToCloud('library_requests_v3', list);

      (async () => {
        try {
          if (isUUID(id)) {
            await (supabase as any).from('borrow_requests').update({
              status,
              returned_at: status === 'returned' ? new Date().toISOString() : null,
            }).eq('id', id);
          } else {
            await (supabase as any).from('borrow_requests').update({
              status,
              returned_at: status === 'returned' ? new Date().toISOString() : null,
            }).match({ requester_name: item.requester_name, book_title: item.book_title });
          }
        } catch (e) {
          console.warn('updateBorrowRequestDirect notice:', e);
        }
      })();

      // If approved, create active borrow record
      if (status === 'approved') {
        const records = this.getBorrowRecords();
        const newRecord: BorrowRecord = {
          id: generateUUID(),
          book_id: item.book_id,
          book_title: item.book_title,
          student_id: item.student_id,
          borrower_name: item.requester_name,
          borrowed_at: new Date().toISOString(),
          due_at: new Date(Date.now() + (item.days_requested || 7) * 86400000).toISOString(),
          status: 'active',
        };
        records.unshift(newRecord);
        this.setItem(STORAGE_KEYS.RECORDS, records);
        this.syncToCloud('library_records_v3', records);
        this.syncBorrowRecordDirect(newRecord).catch(() => {});
      } else if (status === 'returned') {
        const records = this.getBorrowRecords();
        const activeRec = records.find((r) => (r.book_id === item.book_id || r.book_title === item.book_title) && r.borrower_name === item.requester_name && r.status === 'active');
        if (activeRec) {
          activeRec.status = 'returned';
          activeRec.returned_at = new Date().toISOString();
          this.setItem(STORAGE_KEYS.RECORDS, records);
          this.syncToCloud('library_records_v3', records);

          (async () => {
            try {
              if (isUUID(activeRec.id)) {
                await supabase.from('borrow_records').update({
                  status: 'returned',
                  returned_at: activeRec.returned_at,
                }).eq('id', activeRec.id);
              } else {
                await supabase.from('borrow_records').update({
                  status: 'returned',
                  returned_at: activeRec.returned_at,
                }).match({ borrower_name: activeRec.borrower_name, book_title: activeRec.book_title });
              }
            } catch (e) {
              console.warn('updateBorrowRecordDirect notice:', e);
            }
          })();
        }
      }
    }
  }

  private async syncBorrowRecordDirect(rec: BorrowRecord): Promise<void> {
    try {
      await (supabase as any).from('borrow_records').upsert({
        id: isUUID(rec.id) ? rec.id : undefined,
        book_id: isUUID(rec.book_id) ? rec.book_id : undefined,
        student_id: rec.student_id,
        borrower_name: rec.borrower_name,
        book_title: rec.book_title,
        borrowed_at: rec.borrowed_at,
        due_at: rec.due_at,
        returned_at: rec.returned_at || null,
        status: rec.status,
      });
    } catch (e) {
      console.warn('syncBorrowRecordDirect notice:', e);
    }
  }

  getBorrowRecords(): BorrowRecord[] {
    const records = this.getItem<BorrowRecord[]>(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
    const students = this.getStudents();
    const studentMap = new Map(students.map((s) => [s.id, s]));
    const studentNameMap = new Map(students.map((s) => [s.name, s]));

    return records.map((r) => {
      const student = (r.student_id ? studentMap.get(r.student_id) : undefined) || (r.borrower_name ? studentNameMap.get(r.borrower_name) : undefined);
      return {
        ...r,
        student_name: r.student_name || r.borrower_name || student?.name || '',
        student_spr_id: r.student_spr_id || student?.spr_id,
        borrow_date: r.borrow_date || r.borrowed_at,
        return_date: r.return_date !== undefined ? r.return_date : r.returned_at,
      };
    });
  }

  updateRecordDueDate(id: string, dueAt: string): boolean {
    const records = this.getBorrowRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return false;
    record.due_at = dueAt;
    this.setItem(STORAGE_KEYS.RECORDS, records);
    this.syncToCloud('library_records_v3', records);

    (async () => {
      try {
        if (isUUID(id)) {
          await supabase.from('borrow_records').update({ due_at: dueAt }).eq('id', id);
        }
      } catch (e) {
        console.warn('updateRecordDueDate notice:', e);
      }
    })();
    return true;
  }

  markRecordReturned(id: string): boolean {
    const records = this.getBorrowRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return false;
    record.status = 'returned';
    record.returned_at = new Date().toISOString();
    this.setItem(STORAGE_KEYS.RECORDS, records);
    this.syncToCloud('library_records_v3', records);

    (async () => {
      try {
        if (isUUID(id)) {
          await supabase.from('borrow_records').update({
            status: 'returned',
            returned_at: record.returned_at,
          }).eq('id', id);
        }
      } catch (e) {
        console.warn('markRecordReturned notice:', e);
      }
    })();
    return true;
  }

  // Stats helpers requested:
  // "if admin click on any book name in the admin panels book adding session,how much users borrowed /requested/returned about that book should show."
  getBookStats(bookId: string) {
    const requests = this.getBorrowRequests().filter((r) => r.book_id === bookId);
    const records = this.getBorrowRecords().filter((r) => r.book_id === bookId);

    const requested = requests;
    const borrowed = records.filter((r) => r.status === 'active');
    const returned = records.filter((r) => r.status === 'returned' || r.returned_at);

    return {
      totalRequested: requested.length,
      totalBorrowed: borrowed.length,
      totalReturned: returned.length,
      requestsList: requested,
      borrowedList: borrowed,
      returnedList: returned,
    };
  }

  // "if admin click on any student name in the admin panels student adding session,how much books he borrowed /requested/returned should show."
  getStudentStats(studentIdentifier: string) {
    const requests = this.getBorrowRequests().filter(
      (r) => r.student_id === studentIdentifier || r.requester_spr_id === studentIdentifier || r.requester_name === studentIdentifier
    );
    const records = this.getBorrowRecords().filter(
      (r) => r.student_id === studentIdentifier || r.borrower_name === studentIdentifier
    );

    const requested = requests;
    const borrowed = records.filter((r) => r.status === 'active');
    const returned = records.filter((r) => r.status === 'returned' || r.returned_at);

    return {
      totalRequested: requested.length,
      totalBorrowed: borrowed.length,
      totalReturned: returned.length,
      requestsList: requested,
      borrowedList: borrowed,
      returnedList: returned,
    };
  }

  // Excel Templates Generator
  generateStudentTemplate() {
    const wb = XLSX.utils.book_new();
    const data = [
      ['Student Name', 'Class', 'SPR ID', 'Secret Code', 'Father Name', 'House Name', 'Date of Birth'],
      ['عبد الله بن أحمد الفلاني', 'الصف العاشر (ثانوي)', 'SPR0156', '4589', 'AHMED', 'DARUSSALAM', '2006-04-15'],
      ['محمد زين الدين المليباري', 'الصف الحادي عشر', 'SPR0157', '1234', 'ZAINUDDIN', 'ALHILAL', '2005-08-20'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
    XLSX.writeFile(wb, 'Students_Bulk_Upload_Template.xlsx');
  }

  generateBookTemplate() {
    const wb = XLSX.utils.book_new();
    const data = [
      [
        'Book Name (Arabic)',
        'Book Name (English)',
        'Author (Arabic)',
        'Author (English)',
        'Publisher (Arabic)',
        'Publisher (English)',
        'Book Code',
        'Pages',
        'Volume',
        'Status (available/missed)',
        'Cover Drive URL',
        'Category (Arabic)',
        'Description (Arabic)',
        'Description (English)',
      ],
      [
        'صحيح البخاري',
        'Sahih Al-Bukhari',
        'الإمام البخاري',
        'Imam Al-Bukhari',
        'دار طوق النجاة',
        'Dar Tawq Al-Najat',
        'KB-101',
        '1824',
        '1-4',
        'available',
        'https://drive.google.com/file/d/1example/view',
        'الحديث الشريف وعلومه',
        'أصح كتاب بعد القرآن الكريم، يحتوي على أحاديث نبوية مسندة وصحيحة.',
        'The most authentic Hadith compilation after the Holy Quran.',
      ],
      [
        'كتاب مفقود للتجربة',
        'Sample Missed Book',
        'مؤلف تجريبي',
        'Sample Author',
        'دار النشر',
        'Publisher',
        'KB-102',
        '350',
        '1',
        'missed',
        'https://drive.google.com/file/d/2example/view',
        'الفقه الشافعي وأصوله',
        'كتاب تجريبي في الفقه',
        'Sample jurisprudence manual',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 10 },
      { wch: 8 },
      { wch: 8 },
      { wch: 14 },
      { wch: 35 },
      { wch: 20 },
      { wch: 35 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Books_Template');
    XLSX.writeFile(wb, 'Books_Bulk_Upload_Template.xlsx');
  }

  // Bulk Delete helpers
  bulkDeleteBooks(ids: string[]): void {
    const set = new Set(ids);
    const list = this.getBooks().filter((b) => !set.has(b.id));
    this.setItem(STORAGE_KEYS.BOOKS, list);
    this.syncToCloud('library_books_v3', list);

    (async () => {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const uuidIds = ids.filter((id) => UUID_REGEX.test(id));
        const codeIds = ids.filter((id) => !UUID_REGEX.test(id));
        if (uuidIds.length > 0) {
          await supabase.from('books').delete().in('id', uuidIds);
        }
        if (codeIds.length > 0) {
          await supabase.from('books').delete().in('book_code', codeIds);
        }
      } catch (e) {
        console.warn('bulkDeleteBooks notice:', e);
      }
    })();
  }

  bulkDeleteStudents(ids: string[]): void {
    const set = new Set(ids);
    const list = this.getStudents().filter((s) => !set.has(s.id));
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v3', list);

    (async () => {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const uuidIds = ids.filter((id) => UUID_REGEX.test(id));
        const sprIds = ids.filter((id) => !UUID_REGEX.test(id));
        if (uuidIds.length > 0) {
          await (supabase as any).from('students').delete().in('id', uuidIds);
        }
        if (sprIds.length > 0) {
          await (supabase as any).from('students').delete().in('spr_id', sprIds);
        }
      } catch (e) {
        console.warn('bulkDeleteStudents notice:', e);
      }
    })();
  }

  bulkDeleteBorrowRequests(ids: string[]): void {
    const set = new Set(ids);
    const list = this.getBorrowRequests().filter((r) => !set.has(r.id));
    this.setItem(STORAGE_KEYS.REQUESTS, list);
    this.syncToCloud('library_requests_v3', list);

    (async () => {
      try {
        const uuidIds = ids.filter((id) => isUUID(id));
        if (uuidIds.length > 0) {
          await (supabase as any).from('borrow_requests').delete().in('id', uuidIds);
        }
      } catch (e) {
        console.warn('bulkDeleteBorrowRequests notice:', e);
      }
    })();
  }

  bulkDeleteBorrowRecords(ids: string[]): void {
    const set = new Set(ids);
    const list = this.getBorrowRecords().filter((r) => !set.has(r.id));
    this.setItem(STORAGE_KEYS.RECORDS, list);
    this.syncToCloud('library_records_v3', list);

    (async () => {
      try {
        const uuidIds = ids.filter((id) => isUUID(id));
        if (uuidIds.length > 0) {
          await (supabase as any).from('borrow_records').delete().in('id', uuidIds);
        }
      } catch (e) {
        console.warn('bulkDeleteBorrowRecords notice:', e);
      }
    })();
  }

  // Category Management CRUD
  addCategory(cat: { name_ar: string; name_en?: string; slug?: string; icon?: string; color?: string }): Category {
    const list = this.getCategories();
    const newCat: Category = {
      id: generateUUID(),
      name_ar: cat.name_ar.trim(),
      name_en: cat.name_en?.trim() || cat.name_ar.trim(),
      slug: cat.slug?.trim() || `cat-${Date.now()}`,
      icon: cat.icon || 'BookOpen',
      color: cat.color || '#6366f1',
      sort_order: list.length + 1,
    };
    list.push(newCat);
    this.setItem(STORAGE_KEYS.CATEGORIES, list);
    this.syncToCloud('library_categories_v3', list);

    (async () => {
      try {
        await supabase.from('categories').insert({
          id: newCat.id,
          name_ar: newCat.name_ar,
          name_en: newCat.name_en,
          slug: newCat.slug,
          icon: newCat.icon,
          sort_order: newCat.sort_order,
        });
      } catch (e) {
        console.warn('addCategory Supabase notice:', e);
      }
    })();
    return newCat;
  }

  updateCategory(id: string, cat: Partial<{ name_ar: string; name_en: string; slug: string; icon: string; color: string }>): Category | null {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const updated: Category = { ...list[idx], ...cat };
      list[idx] = updated;
      this.setItem(STORAGE_KEYS.CATEGORIES, list);
      this.syncToCloud('library_categories_v3', list);

      (async () => {
        try {
          if (isUUID(id)) {
            await supabase.from('categories').update({
              name_ar: updated.name_ar,
              name_en: updated.name_en,
              slug: updated.slug,
              icon: updated.icon,
            }).eq('id', id);
          } else {
            await supabase.from('categories').update({
              name_ar: updated.name_ar,
              name_en: updated.name_en,
              slug: updated.slug,
              icon: updated.icon,
            }).eq('name_ar', updated.name_ar);
          }
        } catch (e) {
          console.warn('updateCategory Supabase notice:', e);
        }
      })();
      return updated;
    }
    return null;
  }

  deleteCategory(id: string): void {
    const target = this.getCategories().find((c) => c.id === id);
    const list = this.getCategories().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CATEGORIES, list);
    this.syncToCloud('library_categories_v3', list);

    (async () => {
      try {
        if (isUUID(id)) {
          await supabase.from('categories').delete().eq('id', id);
        }
        if (target) {
          await supabase.from('categories').delete().eq('name_ar', target.name_ar);
          if (target.slug) {
            await supabase.from('categories').delete().eq('slug', target.slug);
          }
        }
      } catch (e) {
        console.warn('deleteCategory Supabase notice:', e);
      }
    })();
  }

  // Leaderboard & Reading Points System
  getLeaderboardSettings(): LeaderboardSettings {
    return this.getItem(STORAGE_KEYS.LEADERBOARD_SETTINGS, DEFAULT_LEADERBOARD_SETTINGS);
  }

  saveLeaderboardSettings(settings: Partial<LeaderboardSettings>): LeaderboardSettings {
    const current = this.getLeaderboardSettings();
    const updated = { ...current, ...settings };
    this.setItem(STORAGE_KEYS.LEADERBOARD_SETTINGS, updated);
    this.syncToCloud('library_leaderboard_settings_v3', updated);

    // If points per 10 pages changed, recalculate all existing reading records
    if (settings.points_per_10_pages !== undefined && settings.points_per_10_pages !== current.points_per_10_pages) {
      this.recalculateAllReadingPoints();
    }
    return updated;
  }

  getReadingRecords(): ReadingRecord[] {
    return this.getItem(STORAGE_KEYS.READING_RECORDS, DEFAULT_READING_RECORDS);
  }

  saveReadingRecord(record: {
    id?: string;
    borrow_record_id?: string;
    student_id?: string;
    student_name: string;
    student_spr_id?: string;
    book_id: string;
    book_title: string;
    book_pages?: number;
    book_total_pages?: number;
    book_code?: string;
    reading_status: ReadingStatus;
    pages_read?: number;
    points_awarded?: number;
    valuation_rate_per_10_pages?: number;
    return_date?: string;
    notes?: string;
  }): ReadingRecord {
    const list = this.getReadingRecords();
    const settings = this.getLeaderboardSettings();
    const ratio = settings.points_per_10_pages / 10;
    const totalBookPages = record.book_pages || record.book_total_pages || 0;

    let pages = 0;
    if (record.reading_status === 'full' || record.reading_status === 'full_read') {
      pages = totalBookPages;
    } else if (record.reading_status === 'custom' || record.reading_status === 'custom_pages') {
      pages = Math.max(0, record.pages_read || 0);
    } else {
      pages = 0;
    }

    const points = record.points_awarded !== undefined ? record.points_awarded : Math.round(pages * ratio);

    // Check if an entry already exists for this borrow record or book+student combo
    const existingIdx = record.borrow_record_id
      ? list.findIndex((r) => r.borrow_record_id === record.borrow_record_id)
      : -1;

    let savedRecord: ReadingRecord;
    if (existingIdx !== -1) {
      savedRecord = {
        ...list[existingIdx],
        ...record,
        id: isUUID(list[existingIdx].id) ? list[existingIdx].id : (isUUID(record.id) ? record.id! : generateUUID()),
        book_pages: totalBookPages,
        pages_read: pages,
        points_awarded: points,
        awarded_at: new Date().toISOString(),
      };
      list[existingIdx] = savedRecord;
    } else {
      savedRecord = {
        id: isUUID(record.id) ? record.id! : generateUUID(),
        ...record,
        book_pages: totalBookPages,
        pages_read: pages,
        points_awarded: points,
        awarded_at: new Date().toISOString(),
      };
      list.unshift(savedRecord);
    }

    this.setItem(STORAGE_KEYS.READING_RECORDS, list);
    this.syncToCloud('library_reading_records_v3', list);
    this.syncReadingRecordDirect(savedRecord).catch(() => {});

    return savedRecord;
  }

  async syncReadingRecordDirect(savedRecord: ReadingRecord): Promise<void> {
    try {
      await (supabase as any).from('reading_records').upsert({
        id: isUUID(savedRecord.id) ? savedRecord.id : undefined,
        student_id: savedRecord.student_id || savedRecord.student_spr_id || savedRecord.student_name,
        student_name: savedRecord.student_name,
        student_spr_id: savedRecord.student_spr_id || null,
        book_id: savedRecord.book_id,
        book_title: savedRecord.book_title,
        book_pages: savedRecord.book_pages,
        reading_status: savedRecord.reading_status,
        pages_read: savedRecord.pages_read,
        points_awarded: savedRecord.points_awarded,
        awarded_at: savedRecord.awarded_at,
        notes: savedRecord.notes || null,
      });
    } catch (e) {
      console.warn('syncReadingRecordDirect notice:', e);
    }
  }

  deleteReadingRecord(id: string): void {
    const list = this.getReadingRecords().filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.READING_RECORDS, list);
    this.syncToCloud('library_reading_records_v3', list);

    (async () => {
      try {
        if (isUUID(id)) {
          await (supabase as any).from('reading_records').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('deleteReadingRecord notice:', e);
      }
    })();
  }

  recalculateAllReadingPoints(): void {
    const list = this.getReadingRecords();
    const settings = this.getLeaderboardSettings();
    const ratio = settings.points_per_10_pages / 10;

    const updated = list.map((r) => {
      let pages = r.pages_read;
      if (r.reading_status === 'full' || r.reading_status === 'full_read') {
        pages = r.book_pages;
      } else if (r.reading_status === 'not_read') {
        pages = 0;
      }
      return {
        ...r,
        pages_read: pages,
        points_awarded: Math.round(pages * ratio),
      };
    });

    this.setItem(STORAGE_KEYS.READING_RECORDS, updated);
    this.syncToCloud('library_reading_records_v3', updated);
  }

  getLeaderboard(snapshotId?: string): LeaderboardEntry[] {
    if (snapshotId) {
      const snapshots = this.getLeaderboardSnapshots();
      const snap = snapshots.find((s) => s.id === snapshotId);
      if (snap) return snap.entries;
    }

    const readings = this.getReadingRecords();
    const students = this.getStudents();
    const studentMap = new Map<string, Student>();
    for (const s of students) {
      if (s.id) studentMap.set(s.id, s);
      if (s.name) studentMap.set(s.name, s);
      if (s.spr_id) studentMap.set(s.spr_id, s);
    }

    // Group by student identifier (SPR ID or name)
    const map = new Map<string, {
      student_id?: string;
      student_name: string;
      student_spr_id?: string;
      student_department?: string;
      student_batch?: string;
      total_points: number;
      books_completed: number;
      total_pages_read: number;
      readings: ReadingRecord[];
    }>();

    for (const r of readings) {
      const matched =
        (r.student_id ? studentMap.get(r.student_id) : undefined) ||
        (r.student_spr_id ? studentMap.get(r.student_spr_id) : undefined) ||
        studentMap.get(r.student_name);
      const spr = r.student_spr_id || matched?.spr_id;
      const key = spr || r.student_name;

      if (!map.has(key)) {
        map.set(key, {
          student_id: r.student_id || matched?.id,
          student_name: r.student_name,
          student_spr_id: spr,
          student_department: matched?.klass || '',
          student_batch: matched?.klass || '',
          total_points: 0,
          books_completed: 0,
          total_pages_read: 0,
          readings: [],
        });
      }

      const item = map.get(key)!;
      item.total_points += r.points_awarded || 0;
      if (
        r.reading_status === 'full' ||
        r.reading_status === 'full_read' ||
        (r.pages_read >= r.book_pages && r.book_pages > 0)
      ) {
        item.books_completed += 1;
      }
      item.total_pages_read += r.pages_read || 0;
      item.readings.push(r);
    }

    const entries: LeaderboardEntry[] = Array.from(map.values())
      .filter((e) => e.total_points > 0 || e.total_pages_read > 0)
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.total_pages_read !== a.total_pages_read) return b.total_pages_read - a.total_pages_read;
        return a.student_name.localeCompare(b.student_name);
      })
      .map((e, idx) => ({
        rank: idx + 1,
        ...e,
        books_read_count: e.books_completed,
        reading_records: e.readings,
      }));

    return entries;
  }

  getLeaderboardSnapshots(): LeaderboardSnapshot[] {
    const list = this.getItem<any[]>(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, []);
    return list.map((s) => ({
      ...s,
      name: s.name || s.title || `Snapshot ${s.id}`,
      title: s.title || s.name || `Snapshot ${s.id}`,
      created_at: s.created_at || s.snapshot_date || new Date().toISOString(),
      snapshot_date: s.snapshot_date || s.created_at || new Date().toISOString(),
      entries: (s.entries || []).map((e: any, idx: number) => ({
        ...e,
        rank: e.rank || idx + 1,
        books_completed: e.books_completed ?? e.books_read_count ?? 0,
        books_read_count: e.books_read_count ?? e.books_completed ?? 0,
        readings: e.readings || e.reading_records || [],
        reading_records: e.reading_records || e.readings || [],
      })),
    }));
  }

  createLeaderboardSnapshot(name: string): LeaderboardSnapshot {
    const list = this.getLeaderboardSnapshots();
    const liveEntries = this.getLeaderboard();
    const title = name.trim() || `تحدي القراءة - ${new Date().toLocaleDateString('ar-SA')}`;
    const snapshot: LeaderboardSnapshot = {
      id: generateUUID(),
      name: title,
      title: title,
      created_at: new Date().toISOString(),
      snapshot_date: new Date().toISOString(),
      entries: liveEntries,
    };
    list.unshift(snapshot);
    this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, list);
    this.syncToCloud('library_leaderboard_snapshots_v3', list);

    (async () => {
      try {
        await (supabase as any).from('leaderboard_snapshots').insert({
          id: snapshot.id,
          name: snapshot.name,
          entries: snapshot.entries,
        });
      } catch (e) {
        console.warn('syncSnapshotDirect notice:', e);
      }
    })();

    return snapshot;
  }

  deleteLeaderboardSnapshot(id: string): void {
    const list = this.getLeaderboardSnapshots().filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, list);
    this.syncToCloud('library_leaderboard_snapshots_v3', list);

    (async () => {
      try {
        if (isUUID(id)) {
          await (supabase as any).from('leaderboard_snapshots').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('deleteSnapshot notice:', e);
      }
    })();
  }

  // Overdue Books helpers
  getOverdueRecords(): OverdueRecord[] {
    const now = new Date();
    const records = this.getBorrowRecords();
    const students = this.getStudents();
    const studentMap = new Map(students.map((s) => [s.id, s]));
    const studentNameMap = new Map(students.map((s) => [s.name, s]));

    return records
      .filter((r) => r.status === 'active' && r.due_at && new Date(r.due_at).getTime() < now.getTime())
      .map((r) => {
        const diffMs = now.getTime() - new Date(r.due_at).getTime();
        const days = Math.max(1, Math.floor(diffMs / 86400000));
        const student = (r.student_id ? studentMap.get(r.student_id) : undefined) || (r.borrower_name ? studentNameMap.get(r.borrower_name) : undefined);
        return {
          ...r,
          student_name: r.student_name || r.borrower_name || student?.name || '',
          student_spr_id: r.student_spr_id || student?.spr_id,
          borrow_date: r.borrow_date || r.borrowed_at,
          expected_return_date: r.due_at,
          days_overdue: days,
        };
      })
      .sort((a, b) => b.days_overdue - a.days_overdue);
  }

  returnOverdueBook(
    recordId: string,
    readingStatus: ReadingStatus,
    customPages?: number,
    notes?: string
  ): boolean {
    const records = this.getBorrowRecords();
    const record = records.find((r) => r.id === recordId);
    if (!record) return false;

    record.status = 'returned';
    record.returned_at = new Date().toISOString();
    this.setItem(STORAGE_KEYS.RECORDS, records);
    this.syncToCloud('library_records_v3', records);

    (async () => {
      try {
        if (isUUID(record.id)) {
          await supabase.from('borrow_records').update({
            status: 'returned',
            returned_at: record.returned_at,
          }).eq('id', record.id);
        }
      } catch (e) {
        console.warn('returnOverdueBook record update notice:', e);
      }
    })();

    // Also update matching borrow request if pending/approved
    const requests = this.getBorrowRequests();
    const req = requests.find((rq) => (rq.book_id === record.book_id || rq.book_title === record.book_title) && (rq.requester_name === record.borrower_name || (record.student_spr_id && rq.requester_spr_id === record.student_spr_id)) && (rq.status === 'approved' || rq.status === 'pending'));
    if (req) {
      req.status = 'returned';
      req.returned_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.REQUESTS, requests);
      this.syncToCloud('library_requests_v3', requests);

      (async () => {
        try {
          if (isUUID(req.id)) {
            await (supabase as any).from('borrow_requests').update({
              status: 'returned',
              returned_at: req.returned_at,
            }).eq('id', req.id);
          }
        } catch (e) {
          console.warn('returnOverdueBook request update notice:', e);
        }
      })();
    }

    const book = this.getBookById(record.book_id);
    const totalPages = book?.pages || 100;
    let pagesRead = 0;
    if (readingStatus === 'full' || readingStatus === 'full_read') {
      pagesRead = totalPages;
    } else if (readingStatus === 'custom' || readingStatus === 'custom_pages') {
      pagesRead = customPages && customPages > 0 ? customPages : 0;
    }

    const student = this.getStudents().find((s) => s.id === record.student_id || s.name === record.borrower_name || (record.student_spr_id && s.spr_id === record.student_spr_id));

    this.saveReadingRecord({
      borrow_record_id: record.id,
      student_id: record.student_id || student?.id,
      student_name: record.borrower_name,
      student_spr_id: student?.spr_id || record.student_spr_id,
      book_id: record.book_id,
      book_title: record.book_title,
      book_pages: totalPages,
      reading_status: readingStatus,
      pages_read: pagesRead,
      notes: notes,
    });

    return true;
  }

  // Reviews & Ratings methods for Book Details post functions
  getReviews(bookId?: string): Review[] {
    const list = this.getItem<Review[]>(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
    if (!bookId) return list;
    return list.filter((r) => r.book_id === bookId);
  }

  addReview(review: Omit<Review, 'id' | 'created_at'>): Review {
    const list = this.getItem<Review[]>(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
    const newRev: Review = {
      ...review,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    list.unshift(newRev);
    this.setItem(STORAGE_KEYS.REVIEWS, list);

    if (isUUID(newRev.book_id)) {
      (async () => {
        try {
          await supabase
            .from('reviews')
            .insert({
              id: newRev.id,
              book_id: newRev.book_id,
              content: newRev.content,
              reviewer_name: newRev.reviewer_name,
            });
        } catch (e) {
          console.warn('addReview Supabase notice:', e);
        }
      })();
    }
    return newRev;
  }

  addRating(bookId: string, stars: number, raterName: string): { average_rating: number; ratings_count: number } {
    const ratings = this.getItem<RatingRecord[]>(STORAGE_KEYS.RATINGS, []);
    const newRat: RatingRecord = {
      id: generateUUID(),
      book_id: bookId,
      stars,
      rater_name: raterName.trim(),
      created_at: new Date().toISOString(),
    };
    ratings.unshift(newRat);
    this.setItem(STORAGE_KEYS.RATINGS, ratings);

    if (isUUID(bookId)) {
      (async () => {
        try {
          await supabase
            .from('ratings')
            .insert({
              id: newRat.id,
              book_id: bookId,
              stars,
              rater_name: raterName.trim(),
            });
        } catch (e) {
          console.warn('addRating Supabase notice:', e);
        }
      })();
    }

    const bookList = this.getBooks();
    const book = bookList.find((b) => b.id === bookId);
    let avg = stars;
    let count = 1;
    if (book) {
      const bookRatings = ratings.filter((r) => r.book_id === bookId);
      count = (book.ratings_count || 0) + 1;
      const totalStars = bookRatings.reduce((sum, r) => sum + r.stars, (book.average_rating || 5) * (book.ratings_count || 1));
      avg = Math.min(5, Math.max(1, Number((totalStars / (bookRatings.length + (book.ratings_count || 1))).toFixed(1))));
      book.average_rating = avg;
      book.ratings_count = count;
      this.setItem(STORAGE_KEYS.BOOKS, bookList);
      this.syncToCloud('library_books_v3', bookList);
    }
    return { average_rating: avg, ratings_count: count };
  }
}

export const dataService = new DataService();
