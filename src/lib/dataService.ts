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
  borrowed_at: string;
  due_at: string;
  returned_at?: string | null;
  status: 'active' | 'returned' | 'overdue';
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

export type ReadingStatus = 'full' | 'custom' | 'not_read';

export type ReadingRecord = {
  id: string;
  borrow_record_id?: string;
  student_id?: string;
  student_name: string;
  student_spr_id?: string;
  book_id: string;
  book_title: string;
  book_pages: number;
  reading_status: ReadingStatus;
  pages_read: number;
  points_awarded: number;
  awarded_at: string;
  notes?: string;
};

export type LeaderboardSettings = {
  points_per_10_pages: number; // e.g. 4 points per 10 pages read
  is_hidden_from_public: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  student_id?: string;
  student_name: string;
  student_spr_id?: string;
  total_points: number;
  books_completed: number;
  total_pages_read: number;
  readings: ReadingRecord[];
};

export type LeaderboardSnapshot = {
  id: string;
  name: string;
  created_at: string;
  entries: LeaderboardEntry[];
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

const STORAGE_KEYS = {
  BOOKS: 'imthiyaz_books_v2',
  STUDENTS: 'imthiyaz_students_v2',
  BANNERS: 'imthiyaz_banners_v2',
  REQUESTS: 'imthiyaz_borrow_requests_v2',
  RECORDS: 'imthiyaz_borrow_records_v2',
  CATEGORIES: 'imthiyaz_categories_v2',
  REVIEWS: 'imthiyaz_reviews_v2',
  RATINGS: 'imthiyaz_ratings_v2',
  READING_RECORDS: 'imthiyaz_reading_records_v2',
  LEADERBOARD_SETTINGS: 'imthiyaz_leaderboard_settings_v2',
  LEADERBOARD_SNAPSHOTS: 'imthiyaz_leaderboard_snapshots_v2',
};

export const DEFAULT_LEADERBOARD_SETTINGS: LeaderboardSettings = {
  points_per_10_pages: 4,
  is_hidden_from_public: false,
};

export const DEFAULT_READING_RECORDS: ReadingRecord[] = [
  {
    id: 'read-1',
    student_id: 'std-1',
    student_name: 'عبد الله بن أحمد الفلاني',
    student_spr_id: 'SPR0156',
    book_id: 'b0000001-0000-0000-0000-000000000001',
    book_title: 'صحيح البخاري - الجامع الصحيح المختصر',
    book_pages: 1824,
    reading_status: 'full',
    pages_read: 1824,
    points_awarded: 730,
    awarded_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    notes: 'قراءة كاملة ومتقنة',
  },
  {
    id: 'read-2',
    student_id: 'std-1',
    student_name: 'عبد الله بن أحمد الفلاني',
    student_spr_id: 'SPR0156',
    book_id: 'b0000008-0000-0000-0000-000000000008',
    book_title: 'رياض الصالحين من كلام سيد المرسلين',
    book_pages: 680,
    reading_status: 'full',
    pages_read: 680,
    points_awarded: 272,
    awarded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'إتمام كتاب رياض الصالحين',
  },
  {
    id: 'read-3',
    student_id: 'std-2',
    student_name: 'محمد زين الدين المليباري',
    student_spr_id: 'SPR0157',
    book_id: 'b0000009-0000-0000-0000-000000000009',
    book_title: 'فتح المعين بشرح قرة العين بمهمات الدين',
    book_pages: 450,
    reading_status: 'full',
    pages_read: 450,
    points_awarded: 180,
    awarded_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'read-4',
    student_id: 'std-2',
    student_name: 'محمد زين الدين المليباري',
    student_spr_id: 'SPR0157',
    book_id: 'b0000004-0000-0000-0000-000000000004',
    book_title: 'منهاج الطالبين وعمدة المفتين',
    book_pages: 620,
    reading_status: 'custom',
    pages_read: 300,
    points_awarded: 120,
    awarded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'قراءة 300 صفحة من كتاب المعاملات',
  },
  {
    id: 'read-5',
    student_id: 'std-3',
    student_name: 'سالم بن عمر بافضل',
    student_spr_id: 'SPR0158',
    book_id: 'b0000007-0000-0000-0000-000000000007',
    book_title: 'الرحيق المختوم في سيرة النبي المأمون',
    book_pages: 520,
    reading_status: 'full',
    pages_read: 520,
    points_awarded: 208,
    awarded_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    book_id: 'bk-1',
    reviewer_name: 'أحمد بن عبد الله',
    content: 'طبعة محققة رائعة ومضبوطة بالشكل الكامل، لا غنى عنها لأي طالب علم.',
    rating: 5,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'rev-2',
    book_id: 'bk-3',
    reviewer_name: 'محمد الشافعي',
    content: 'من أنفس شروح صحيح البخاري، مفيد جداً في ضبط الألفاظ واستنباط الأحكام الفقهية.',
    rating: 5,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Seed Categories
export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name_ar: 'الحديث الشريف وعلومه', name_en: 'Hadith & Its Sciences', icon: 'BookOpen', sort_order: 1 },
  { id: 'cat-2', name_ar: 'الفقه الشافعي وأصوله', name_en: 'Shafi’i Fiqh & Usul', icon: 'Scale', sort_order: 2 },
  { id: 'cat-3', name_ar: 'التفسير وعلوم القرآن', name_en: 'Tafsir & Quranic Sciences', icon: 'Sparkles', sort_order: 3 },
  { id: 'cat-4', name_ar: 'السيرة النبوية والتاريخ', name_en: 'Prophetic Biography & History', icon: 'Compass', sort_order: 4 },
  { id: 'cat-5', name_ar: 'العقيدة والتصوف', name_en: 'Aqeedah & Tasawwuf', icon: 'Heart', sort_order: 5 },
  { id: 'cat-6', name_ar: 'اللغة العربية وآدابها', name_en: 'Arabic Language & Literature', icon: 'Feather', sort_order: 6 },
];

// Seed Students (including SPR0156 as mentioned in prompt)
export const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: 'عبد الله بن أحمد الفلاني',
    klass: 'الصف العاشر (ثانوي)',
    spr_id: 'SPR0156',
    secret_code: '4589',
    father_name: 'AHMED',
    house_name: 'DARUSSALAM',
    dob: '2006-04-15',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'std-2',
    name: 'محمد زين الدين المليباري',
    klass: 'الصف الحادي عشر (ثانوي)',
    spr_id: 'SPR0157',
    secret_code: '1234',
    father_name: 'ZAINUDDIN',
    house_name: 'ALHILAL',
    dob: '2005-08-20',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'std-3',
    name: 'سالم بن عمر بافضل',
    klass: 'الصف التاسع (متوسط)',
    spr_id: 'SPR0158',
    secret_code: '7788',
    father_name: 'OMAR',
    house_name: 'BAFADHAL',
    dob: '2007-02-10',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'std-4',
    name: 'عمر بن عبد الرحمن العطاس',
    klass: 'الصف الثاني عشر (تخرج)',
    spr_id: 'SPR0159',
    secret_code: '9900',
    father_name: 'ABDULRAHMAN',
    house_name: 'NOOR',
    dob: '2004-11-05',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

// Seed 10+ Books with Arabic & English titles, authors, publishers, volume, code, ratings
export const DEFAULT_BOOKS: Book[] = [
  {
    id: 'bk-1',
    si_number: 1,
    book_code: 'KB-001',
    title_ar: 'صحيح البخاري - الجامع الصحيح المختصر',
    title_en: 'Sahih Al-Bukhari',
    author_ar: 'الإمام محمد بن إسماعيل البخاري',
    author_en: 'Imam Muhammad ibn Ismail al-Bukhari',
    publisher_ar: 'دار طوق النجاة - بيروت',
    publisher_en: 'Dar Tawq Al-Najat',
    volume: '1-4',
    pages: 1824,
    category_id: 'cat-1',
    category_name_ar: 'الحديث الشريف وعلومه',
    category_name_en: 'Hadith & Its Sciences',
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 5.0,
    ratings_count: 28,
    description_ar: 'أصح كتاب بعد كتاب الله عز وجل، يحوي آلاف الأحاديث النبوية الصحيحة المسندة.',
    description_en: 'The most authentic collection of Hadith after the Holy Quran.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-2',
    si_number: 2,
    book_code: 'KB-002',
    title_ar: 'صحيح مسلم - المسند الصحيح',
    title_en: 'Sahih Muslim',
    author_ar: 'الإمام مسلم بن الحجاج النيسابوري',
    author_en: 'Imam Muslim ibn al-Hajjaj',
    publisher_ar: 'دار إحياء التراث العربي',
    publisher_en: 'Dar Ihya al-Turath',
    volume: '1-5',
    pages: 2150,
    category_id: 'cat-1',
    category_name_ar: 'الحديث الشريف وعلومه',
    category_name_en: 'Hadith & Its Sciences',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.9,
    ratings_count: 22,
    description_ar: 'أحد أركان السنة النبوية الشريفة ومن أدق كتب الحديث ترتيباً وصحة.',
    description_en: 'Renowned authentic hadith compilation known for rigorous classification.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-3',
    si_number: 3,
    book_code: 'KB-003',
    title_ar: 'فتح الباري بشرح صحيح البخاري',
    title_en: 'Fath al-Bari Commentary on Sahih al-Bukhari',
    author_ar: 'الحافظ ابن حجر العسقلاني',
    author_en: 'Ibn Hajar al-Asqalani',
    publisher_ar: 'دار المعرفة - بيروت',
    publisher_en: 'Dar al-Ma’rifah',
    volume: '1-13',
    pages: 6540,
    category_id: 'cat-1',
    category_name_ar: 'الحديث الشريف وعلومه',
    category_name_en: 'Hadith & Its Sciences',
    cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.9,
    ratings_count: 19,
    description_ar: 'أعظم شروح صحيح البخاري وأجمعها، موسوعة إسلامية شاملة.',
    description_en: 'Monumental 13-volume commentary on Sahih al-Bukhari.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-4',
    si_number: 4,
    book_code: 'KB-004',
    title_ar: 'منهاج الطالبين وعمدة المفتين',
    title_en: 'Minhaj al-Talibin wa Umdat al-Muftin',
    author_ar: 'الإمام يحيى بن شرف النووي',
    author_en: 'Imam Yahya ibn Sharaf al-Nawawi',
    publisher_ar: 'دار المنهاج - جدة',
    publisher_en: 'Dar al-Minhaj',
    volume: '1',
    pages: 620,
    category_id: 'cat-2',
    category_name_ar: 'الفقه الشافعي وأصوله',
    category_name_en: 'Shafi’i Fiqh & Usul',
    cover_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.8,
    ratings_count: 17,
    description_ar: 'المعتمد الأساسي في الفتوى وتدريس الفقه الشافعي في سائر أقطار العالم الإسلامي.',
    description_en: 'The definitive classical manual of Shafi’i jurisprudence.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-5',
    si_number: 5,
    book_code: 'KB-005',
    title_ar: 'إحياء علوم الدين',
    title_en: 'Ihya Ulum al-Din',
    author_ar: 'حجة الإسلام الإمام أبو حامد الغزالي',
    author_en: 'Imam Abu Hamid al-Ghazali',
    publisher_ar: 'دار ابن حزم - بيروت',
    publisher_en: 'Dar Ibn Hazm',
    volume: '1-4',
    pages: 2480,
    category_id: 'cat-5',
    category_name_ar: 'العقيدة والتصوف',
    category_name_en: 'Aqeedah & Tasawwuf',
    cover_url: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.8,
    ratings_count: 15,
    description_ar: 'تحفة علم السلوك وتزكية النفس، يجمع بين الفقه وبواطن الإيمان والأخلاق.',
    description_en: 'The Revival of the Religious Sciences by Imam Ghazali.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-6',
    si_number: 6,
    book_code: 'KB-006',
    title_ar: 'تفسير القرآن العظيم (تفسير ابن كثير)',
    title_en: 'Tafsir Ibn Kathir',
    author_ar: 'الحافظ عماد الدين إسماعيل بن كثير',
    author_en: 'Ismail ibn Kathir',
    publisher_ar: 'دار طيبة للنشر والتوزيع',
    publisher_en: 'Dar Taybah',
    volume: '1-8',
    pages: 4100,
    category_id: 'cat-3',
    category_name_ar: 'التفسير وعلوم القرآن',
    category_name_en: 'Tafsir & Quranic Sciences',
    cover_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.7,
    ratings_count: 14,
    description_ar: 'أشهر تفاسير القرآن بالمأثور وأوثقها بياناً لآيات الذكر الحكيم.',
    description_en: 'Classic exegesis of the Quran by Ibn Kathir.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-7',
    si_number: 7,
    book_code: 'KB-007',
    title_ar: 'الرحيق المختوم في سيرة النبي المأمون',
    title_en: 'The Sealed Nectar',
    author_ar: 'الشيخ صفي الرحمن المباركفوري',
    author_en: 'Safiur Rahman al-Mubarakpuri',
    publisher_ar: 'دار الهلال - بيروت',
    publisher_en: 'Dar al-Hilal',
    volume: '1',
    pages: 520,
    category_id: 'cat-4',
    category_name_ar: 'السيرة النبوية والتاريخ',
    category_name_en: 'Prophetic Biography & History',
    cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.7,
    ratings_count: 12,
    description_ar: 'الكتاب الحائز على الجائزة الأولى في مسابقة السيرة النبوية العالمية.',
    description_en: 'Award-winning biography of Prophet Muhammad (peace be upon him).',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-8',
    si_number: 8,
    book_code: 'KB-008',
    title_ar: 'رياض الصالحين من كلام سيد المرسلين',
    title_en: 'Riyad as-Salihin',
    author_ar: 'الإمام يحيى بن شرف النووي',
    author_en: 'Imam Yahya ibn Sharaf al-Nawawi',
    publisher_ar: 'دار المنهاج - بيروت',
    publisher_en: 'Dar al-Minhaj',
    volume: '1',
    pages: 680,
    category_id: 'cat-1',
    category_name_ar: 'الحديث الشريف وعلومه',
    category_name_en: 'Hadith & Its Sciences',
    cover_url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.6,
    ratings_count: 10,
    description_ar: 'كتاب جامع للأحاديث الصحيحة في الرقائق والآداب والأذكار وسائر أبواب الخير.',
    description_en: 'The Gardens of the Righteous by Imam an-Nawawi.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-9',
    si_number: 9,
    book_code: 'KB-009',
    title_ar: 'فتح المعين بشرح قرة العين بمهمات الدين',
    title_en: 'Fath al-Muin bi Sharh Qurrat al-Ayn',
    author_ar: 'العلامة زين الدين أحمد بن عبد العزيز المليباري',
    author_en: 'Zainuddin Ahmad al-Malibari',
    publisher_ar: 'دار الفكر - بيروت',
    publisher_en: 'Dar al-Fikr',
    volume: '1',
    pages: 450,
    category_id: 'cat-2',
    category_name_ar: 'الفقه الشافعي وأصوله',
    category_name_en: 'Shafi’i Fiqh & Usul',
    cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
    status: 'available',
    average_rating: 4.6,
    ratings_count: 9,
    description_ar: 'المرجع الفقهي الشافعي الأبرز الذي درسه طلاب العلم عبر القرون.',
    description_en: 'Famous classic manual in Shafi’i jurisprudence by Sheikh Zainuddin.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bk-10',
    si_number: 10,
    book_code: 'KB-010',
    title_ar: 'مخطوطة النحو الوافي - نسخة نادرة',
    title_en: 'Al-Nahw Al-Wafi Rare Manuscript',
    author_ar: 'عباس حسن النحوي',
    author_en: 'Abbas Hasan',
    publisher_ar: 'دار المعارف - القاهرة',
    publisher_en: 'Dar al-Maarif',
    volume: '1',
    pages: 580,
    category_id: 'cat-6',
    category_name_ar: 'اللغة العربية وآدابها',
    category_name_en: 'Arabic Language & Literature',
    cover_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
    status: 'missed', // MISSED BOOK to showcase red shading!
    average_rating: 4.5,
    ratings_count: 8,
    description_ar: 'كتاب في قواعد النحو العربي. تم الإبلاغ عن فقدان هذه النسخة من القاعة الرئيسية.',
    description_en: 'Arabic grammar text. Reported missed from main hall.',
    created_at: new Date().toISOString(),
  },
];

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

// Seed Borrow Records & Requests
export const DEFAULT_REQUESTS: BorrowRequest[] = [
  {
    id: 'req-1',
    book_id: 'bk-1',
    book_title: 'صحيح البخاري - الجامع الصحيح المختصر',
    student_id: 'std-1',
    requester_name: 'عبد الله بن أحمد الفلاني',
    requester_type: 'current_student',
    requester_class: 'الصف العاشر (ثانوي)',
    requester_spr_id: 'SPR0156',
    days_requested: 7,
    expected_return_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'approved',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'req-2',
    book_id: 'bk-4',
    book_title: 'منهاج الطالبين وعمدة المفتين',
    student_id: 'std-2',
    requester_name: 'محمد زين الدين المليباري',
    requester_type: 'current_student',
    requester_class: 'الصف الحادي عشر (ثانوي)',
    requester_spr_id: 'SPR0157',
    days_requested: 14,
    expected_return_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'req-3',
    book_id: 'bk-2',
    book_title: 'صحيح مسلم - المسند الصحيح',
    student_id: 'std-1',
    requester_name: 'عبد الله بن أحمد الفلاني',
    requester_type: 'current_student',
    requester_class: 'الصف العاشر (ثانوي)',
    requester_spr_id: 'SPR0156',
    days_requested: 10,
    expected_return_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    status: 'returned',
    returned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export const DEFAULT_RECORDS: BorrowRecord[] = [
  {
    id: 'rec-1',
    book_id: 'bk-1',
    book_title: 'صحيح البخاري - الجامع الصحيح المختصر',
    student_id: 'std-1',
    borrower_name: 'عبد الله بن أحمد الفلاني',
    borrowed_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    due_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: 'active',
  },
  {
    id: 'rec-2',
    book_id: 'bk-2',
    book_title: 'صحيح مسلم - المسند الصحيح',
    student_id: 'std-1',
    borrower_name: 'عبد الله بن أحمد الفلاني',
    borrowed_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    due_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    returned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'returned',
  },
];

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
    } catch (e) {
      console.warn('DataService write error:', e);
    }
  }

  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.syncFromSupabase().catch(() => {});
    }
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
      // 1. Synchronize persistent cloud settings and backups from library_settings
      const { data: settingsData } = await supabase.from('library_settings').select('*');
      if (settingsData && settingsData.length > 0) {
        for (const row of settingsData) {
          if (row.key === 'library_books_v2' && Array.isArray(row.value) && row.value.length > 0) {
            this.setItem(STORAGE_KEYS.BOOKS, row.value);
          }
          if (row.key === 'library_students_v2' && Array.isArray(row.value) && row.value.length > 0) {
            this.setItem(STORAGE_KEYS.STUDENTS, row.value);
          }
          if (row.key === 'library_banners_v2' && Array.isArray(row.value) && row.value.length > 0) {
            this.setItem(STORAGE_KEYS.BANNERS, row.value);
          }
          if (row.key === 'library_records_v2' && Array.isArray(row.value) && row.value.length > 0) {
            this.setItem(STORAGE_KEYS.RECORDS, row.value);
          }
          if (row.key === 'library_requests_v2' && Array.isArray(row.value) && row.value.length > 0) {
            this.setItem(STORAGE_KEYS.REQUESTS, row.value);
          }
          if (row.key === 'library_reading_records' && Array.isArray(row.value) && row.value.length > 0) {
            this.setItem(STORAGE_KEYS.READING_RECORDS, row.value);
          }
          if (row.key === 'library_leaderboard_settings' && row.value) {
            this.setItem(STORAGE_KEYS.LEADERBOARD_SETTINGS, row.value);
          }
          if (row.key === 'library_leaderboard_snapshots' && Array.isArray(row.value)) {
            this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, row.value);
          }
        }
      }

      // 2. Fetch remote categories
      const { data: remoteCats } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (remoteCats && remoteCats.length > 0) {
        this.setItem(STORAGE_KEYS.CATEGORIES, remoteCats);
      }
      const allCategories = this.getCategories();
      const catMap = new Map(allCategories.map((c) => [c.id, c]));

      // 3. Fetch remote books from the books table if populated
      const { data: remoteBooks } = await supabase.from('books').select('*');
      if (remoteBooks && remoteBooks.length > 0) {
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
            category_id: rb.category_id || existing?.category_id || 'c0000001-0000-0000-0000-000000000001',
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

      // 4. Fetch remote advertisements and preserve them
      const { data: remoteAds } = await supabase.from('advertisements').select('*').order('sort_order', { ascending: true });
      if (remoteAds && remoteAds.length > 0) {
        const currentBanners = this.getBanners();
        const bMap = new Map(currentBanners.map((b) => [b.id, b]));
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
      }

      // 5. Fetch remote students (admin gets full table, public gets directory)
      try {
        const { data: remoteStudents } = await supabase.from('students').select('*');
        if (remoteStudents && remoteStudents.length > 0) {
          this.setItem(STORAGE_KEYS.STUDENTS, remoteStudents);
        } else {
          const { data: dirStudents } = await supabase.from('students_directory').select('*');
          if (dirStudents && dirStudents.length > 0) {
            const current = this.getStudents();
            const map = new Map(current.map((s) => [s.spr_id, s]));
            const merged = dirStudents.map((ds: any) => ({
              id: ds.id,
              name: ds.name,
              klass: ds.klass,
              spr_id: ds.spr_id,
              secret_code: map.get(ds.spr_id)?.secret_code || '',
              father_name: map.get(ds.spr_id)?.father_name || '',
              house_name: map.get(ds.spr_id)?.house_name || '',
              dob: map.get(ds.spr_id)?.dob || '',
              created_at: ds.created_at || new Date().toISOString(),
            }));
            this.setItem(STORAGE_KEYS.STUDENTS, merged);
          }
        }
      } catch {}

      // 6. Fetch remote reviews and ratings
      const { data: rv } = await supabase.from('reviews').select('*');
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
    }
  }

  // Categories
  getCategories() {
    return this.getItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
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

  saveBook(book: Partial<Book> & { title_ar: string }): Book {
    const list = this.getBooks();
    if (book.id) {
      const idx = list.findIndex((b) => b.id === book.id);
      if (idx !== -1) {
        const updated = { ...list[idx], ...book };
        list[idx] = updated;
        this.setItem(STORAGE_KEYS.BOOKS, list);
        this.syncToCloud('library_books_v2', list);
        this.syncBookDirectToSupabase(updated);
        return updated;
      }
    }
    const maxSi = list.reduce((max, b) => Math.max(max, b.si_number || 0), 0);
    const newBook: Book = {
      id: book.id || `bk-${Date.now()}`,
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
    this.syncToCloud('library_books_v2', list);
    this.syncBookDirectToSupabase(newBook);
    return newBook;
  }

  private async syncBookDirectToSupabase(b: Book): Promise<void> {
    try {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      await supabase
        .from('books')
        .upsert(
          {
            id: UUID_REGEX.test(b.id) ? b.id : undefined,
            book_code: b.book_code,
            title_ar: b.title_ar,
            title_en: b.title_en || null,
            author_name_ar: b.author_ar || null,
            author_name_en: b.author_en || null,
            publisher_name_ar: b.publisher_ar || null,
            publisher_name_en: b.publisher_en || null,
            volume: b.volume || '1',
            pages: b.pages || 0,
            category_id: UUID_REGEX.test(b.category_id) ? b.category_id : null,
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
    const list = this.getBooks().filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BOOKS, list);
    this.syncToCloud('library_books_v2', list);

    (async () => {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_REGEX.test(id)) {
          await supabase.from('books').delete().eq('id', id);
        } else {
          await supabase.from('books').delete().eq('book_code', id);
        }
      } catch (e) {
        console.warn('deleteBook Supabase notice:', e);
      }
    })();
  }

  bulkAddBooks(rows: Partial<Book>[]): number {
    const list = this.getBooks();
    let maxSi = list.reduce((max, b) => Math.max(max, b.si_number || 0), 0);
    let added = 0;

    for (const r of rows) {
      if (!r.title_ar?.trim()) continue;
      maxSi++;
      list.unshift({
        id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
      });
      added++;
    }
    this.setItem(STORAGE_KEYS.BOOKS, list);
    this.syncToCloud('library_books_v2', list);
    return added;
  }

  // Students
  getStudents(): Student[] {
    return this.getItem(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
  }

  getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id);
  }

  saveStudent(student: Partial<Student> & { name: string; klass: string; spr_id: string; secret_code: string }): Student {
    const list = this.getStudents();
    if (student.id) {
      const idx = list.findIndex((s) => s.id === student.id);
      if (idx !== -1) {
        const updated = { ...list[idx], ...student };
        list[idx] = updated;
        this.setItem(STORAGE_KEYS.STUDENTS, list);
        this.syncToCloud('library_students_v2', list);
        this.syncStudentDirectToSupabase(updated);
        return updated;
      }
    }
    const newStudent: Student = {
      id: student.id || `std-${Date.now()}`,
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
    this.syncToCloud('library_students_v2', list);
    this.syncStudentDirectToSupabase(newStudent);
    return newStudent;
  }

  private async syncStudentDirectToSupabase(s: Student): Promise<void> {
    try {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      await supabase
        .from('students')
        .upsert(
          {
            id: UUID_REGEX.test(s.id) ? s.id : undefined,
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
    const list = this.getStudents().filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v2', list);

    (async () => {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_REGEX.test(id)) {
          await supabase.from('students').delete().eq('id', id);
        } else {
          await supabase.from('students').delete().eq('spr_id', id);
        }
      } catch (e) {
        console.warn('deleteStudent Supabase notice:', e);
      }
    })();
  }

  bulkAddStudents(rows: Partial<Student>[]): number {
    const list = this.getStudents();
    let added = 0;
    for (const r of rows) {
      if (!r.name?.trim() || !r.spr_id?.trim() || !r.secret_code?.trim()) continue;
      list.unshift({
        id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: r.name.trim(),
        klass: (r.klass || '').trim(),
        spr_id: r.spr_id.trim().toUpperCase(),
        secret_code: String(r.secret_code).trim(),
        father_name: r.father_name ? String(r.father_name).trim().toUpperCase().replace(/\s+/g, '') : '',
        house_name: r.house_name ? String(r.house_name).trim().toUpperCase().replace(/\s+/g, '') : '',
        dob: r.dob ? String(r.dob).trim() : '',
        created_at: new Date().toISOString(),
      });
      added++;
    }
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v2', list);
    return added;
  }

  updateStudentPassword(studentId: string, newCode: string): boolean {
    const list = this.getStudents();
    const student = list.find((s) => s.id === studentId || s.spr_id === studentId);
    if (!student) return false;
    student.secret_code = newCode.trim();
    this.setItem(STORAGE_KEYS.STUDENTS, list);
    this.syncToCloud('library_students_v2', list);
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
        this.syncToCloud('library_banners_v2', list);
        this.syncBannerDirectToSupabase(updated);
        return updated;
      }
    }
    const newBanner: Banner = {
      id: banner.id || `ban-${Date.now()}`,
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
    this.syncToCloud('library_banners_v2', list);
    this.syncBannerDirectToSupabase(newBanner);
    return newBanner;
  }

  private async syncBannerDirectToSupabase(b: Banner): Promise<void> {
    try {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      await supabase
        .from('advertisements')
        .upsert({
          id: UUID_REGEX.test(b.id) ? b.id : undefined,
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
    this.syncToCloud('library_banners_v2', list);

    (async () => {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_REGEX.test(id)) {
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
      id: `req-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    list.unshift(newReq);
    this.setItem(STORAGE_KEYS.REQUESTS, list);
    this.syncToCloud('library_requests_v2', list);
    return newReq;
  }

  updateBorrowRequestStatus(id: string, status: BorrowRequest['status']): void {
    const list = this.getBorrowRequests();
    const item = list.find((r) => r.id === id);
    if (item) {
      item.status = status;
      if (status === 'returned') item.returned_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.REQUESTS, list);
      this.syncToCloud('library_requests_v2', list);

      // If approved, create active borrow record
      if (status === 'approved') {
        const records = this.getBorrowRecords();
        records.unshift({
          id: `rec-${Date.now()}`,
          book_id: item.book_id,
          book_title: item.book_title,
          student_id: item.student_id,
          borrower_name: item.requester_name,
          borrowed_at: new Date().toISOString(),
          due_at: new Date(Date.now() + (item.days_requested || 7) * 86400000).toISOString(),
          status: 'active',
        });
        this.setItem(STORAGE_KEYS.RECORDS, records);
        this.syncToCloud('library_records_v2', records);
      } else if (status === 'returned') {
        const records = this.getBorrowRecords();
        const activeRec = records.find((r) => r.book_id === item.book_id && r.borrower_name === item.requester_name && r.status === 'active');
        if (activeRec) {
          activeRec.status = 'returned';
          activeRec.returned_at = new Date().toISOString();
          this.setItem(STORAGE_KEYS.RECORDS, records);
          this.syncToCloud('library_records_v2', records);
        }
      }
    }
  }

  getBorrowRecords(): BorrowRecord[] {
    return this.getItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
  }

  updateRecordDueDate(id: string, dueAt: string): boolean {
    const records = this.getBorrowRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return false;
    record.due_at = dueAt;
    this.setItem(STORAGE_KEYS.RECORDS, records);
    return true;
  }

  markRecordReturned(id: string): boolean {
    const records = this.getBorrowRecords();
    const record = records.find((item) => item.id === id);
    if (!record) return false;
    record.status = 'returned';
    record.returned_at = new Date().toISOString();
    this.setItem(STORAGE_KEYS.RECORDS, records);
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
    this.syncToCloud('library_books_v2', list);

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
    this.syncToCloud('library_students_v2', list);

    (async () => {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const uuidIds = ids.filter((id) => UUID_REGEX.test(id));
        const sprIds = ids.filter((id) => !UUID_REGEX.test(id));
        if (uuidIds.length > 0) {
          await supabase.from('students').delete().in('id', uuidIds);
        }
        if (sprIds.length > 0) {
          await supabase.from('students').delete().in('spr_id', sprIds);
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
    this.syncToCloud('library_requests_v2', list);
  }

  bulkDeleteBorrowRecords(ids: string[]): void {
    const set = new Set(ids);
    const list = this.getBorrowRecords().filter((r) => !set.has(r.id));
    this.setItem(STORAGE_KEYS.RECORDS, list);
    this.syncToCloud('library_records_v2', list);
  }

  // Category Management CRUD
  addCategory(cat: { name_ar: string; name_en?: string; slug?: string; icon?: string }) {
    const list = this.getCategories();
    const newCat = {
      id: `cat-${Date.now()}`,
      name_ar: cat.name_ar.trim(),
      name_en: cat.name_en?.trim() || cat.name_ar.trim(),
      slug: cat.slug?.trim() || `cat-${Date.now()}`,
      icon: cat.icon || 'BookOpen',
      sort_order: list.length + 1,
    };
    list.push(newCat);
    this.setItem(STORAGE_KEYS.CATEGORIES, list);
    this.syncToCloud('library_categories_v2', list);

    (async () => {
      try {
        await supabase.from('categories').insert({
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

  updateCategory(id: string, cat: Partial<{ name_ar: string; name_en: string; slug: string; icon: string }>) {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const updated = { ...list[idx], ...cat };
      list[idx] = updated;
      this.setItem(STORAGE_KEYS.CATEGORIES, list);
      this.syncToCloud('library_categories_v2', list);

      (async () => {
        try {
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (UUID_REGEX.test(id)) {
            await supabase.from('categories').update({
              name_ar: updated.name_ar,
              name_en: updated.name_en,
              slug: updated.slug,
              icon: updated.icon,
            }).eq('id', id);
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
    const list = this.getCategories().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CATEGORIES, list);
    this.syncToCloud('library_categories_v2', list);

    (async () => {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_REGEX.test(id)) {
          await supabase.from('categories').delete().eq('id', id);
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
    this.syncToCloud('library_leaderboard_settings', updated);

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
    borrow_record_id?: string;
    student_id?: string;
    student_name: string;
    student_spr_id?: string;
    book_id: string;
    book_title: string;
    book_pages: number;
    reading_status: ReadingStatus;
    pages_read?: number;
    notes?: string;
  }): ReadingRecord {
    const list = this.getReadingRecords();
    const settings = this.getLeaderboardSettings();
    const ratio = settings.points_per_10_pages / 10;

    let pages = 0;
    if (record.reading_status === 'full') {
      pages = record.book_pages || 0;
    } else if (record.reading_status === 'custom') {
      pages = Math.max(0, record.pages_read || 0);
    } else {
      pages = 0;
    }

    const points = Math.round(pages * ratio);

    // Check if an entry already exists for this borrow record or book+student combo
    const existingIdx = record.borrow_record_id
      ? list.findIndex((r) => r.borrow_record_id === record.borrow_record_id)
      : -1;

    let savedRecord: ReadingRecord;
    if (existingIdx !== -1) {
      savedRecord = {
        ...list[existingIdx],
        ...record,
        pages_read: pages,
        points_awarded: points,
        awarded_at: new Date().toISOString(),
      };
      list[existingIdx] = savedRecord;
    } else {
      savedRecord = {
        id: `read-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...record,
        pages_read: pages,
        points_awarded: points,
        awarded_at: new Date().toISOString(),
      };
      list.unshift(savedRecord);
    }

    this.setItem(STORAGE_KEYS.READING_RECORDS, list);
    this.syncToCloud('library_reading_records', list);
    return savedRecord;
  }

  deleteReadingRecord(id: string): void {
    const list = this.getReadingRecords().filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.READING_RECORDS, list);
    this.syncToCloud('library_reading_records', list);
  }

  recalculateAllReadingPoints(): void {
    const list = this.getReadingRecords();
    const settings = this.getLeaderboardSettings();
    const ratio = settings.points_per_10_pages / 10;

    const updated = list.map((r) => {
      let pages = r.pages_read;
      if (r.reading_status === 'full') {
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
    this.syncToCloud('library_reading_records', updated);
  }

  getLeaderboard(snapshotId?: string): LeaderboardEntry[] {
    if (snapshotId) {
      const snapshots = this.getLeaderboardSnapshots();
      const snap = snapshots.find((s) => s.id === snapshotId);
      if (snap) return snap.entries;
    }

    const readings = this.getReadingRecords();
    const students = this.getStudents();
    const studentMap = new Map(students.map((s) => [s.name, s]));
    students.forEach((s) => {
      if (s.id) studentMap.set(s.id, s);
      if (s.spr_id) studentMap.set(s.spr_id, s);
    });

    // Group by student identifier (SPR ID or name)
    const map = new Map<string, {
      student_id?: string;
      student_name: string;
      student_spr_id?: string;
      total_points: number;
      books_completed: number;
      total_pages_read: number;
      readings: ReadingRecord[];
    }>();

    for (const r of readings) {
      const matched = studentMap.get(r.student_name) || (r.student_id ? studentMap.get(r.student_id) : undefined);
      const spr = r.student_spr_id || matched?.spr_id;
      const key = spr || r.student_name;

      if (!map.has(key)) {
        map.set(key, {
          student_id: r.student_id || matched?.id,
          student_name: r.student_name,
          student_spr_id: spr,
          total_points: 0,
          books_completed: 0,
          total_pages_read: 0,
          readings: [],
        });
      }

      const item = map.get(key)!;
      item.total_points += r.points_awarded || 0;
      if (r.reading_status === 'full' || (r.pages_read >= r.book_pages && r.book_pages > 0)) {
        item.books_completed += 1;
      }
      item.total_pages_read += r.pages_read || 0;
      item.readings.push(r);
    }

    const entries = Array.from(map.values())
      .filter((e) => e.total_points > 0 || e.total_pages_read > 0)
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.total_pages_read !== a.total_pages_read) return b.total_pages_read - a.total_pages_read;
        return a.student_name.localeCompare(b.student_name);
      })
      .map((e, idx) => ({
        rank: idx + 1,
        ...e,
      }));

    return entries;
  }

  getLeaderboardSnapshots(): LeaderboardSnapshot[] {
    return this.getItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, []);
  }

  createLeaderboardSnapshot(name: string): LeaderboardSnapshot {
    const list = this.getLeaderboardSnapshots();
    const liveEntries = this.getLeaderboard();
    const snapshot: LeaderboardSnapshot = {
      id: `snap-${Date.now()}`,
      name: name.trim() || `تحدي القراءة - ${new Date().toLocaleDateString('ar-SA')}`,
      created_at: new Date().toISOString(),
      entries: liveEntries,
    };
    list.unshift(snapshot);
    this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, list);
    this.syncToCloud('library_leaderboard_snapshots', list);
    return snapshot;
  }

  deleteLeaderboardSnapshot(id: string): void {
    const list = this.getLeaderboardSnapshots().filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.LEADERBOARD_SNAPSHOTS, list);
    this.syncToCloud('library_leaderboard_snapshots', list);
  }

  // Overdue Books helpers
  getOverdueRecords(): (BorrowRecord & { days_overdue: number })[] {
    const now = new Date();
    const records = this.getBorrowRecords();
    return records
      .filter((r) => r.status === 'active' && r.due_at && new Date(r.due_at).getTime() < now.getTime())
      .map((r) => {
        const diffMs = now.getTime() - new Date(r.due_at).getTime();
        const days = Math.max(1, Math.floor(diffMs / 86400000));
        return {
          ...r,
          days_overdue: days,
        };
      })
      .sort((a, b) => b.days_overdue - a.days_overdue);
  }

  returnOverdueBook(recordId: string, readingStatus: ReadingStatus, customPages?: number): boolean {
    const records = this.getBorrowRecords();
    const record = records.find((r) => r.id === recordId);
    if (!record) return false;

    record.status = 'returned';
    record.returned_at = new Date().toISOString();
    this.setItem(STORAGE_KEYS.RECORDS, records);
    this.syncToCloud('library_records_v2', records);

    // Also update matching borrow request if pending/approved
    const requests = this.getBorrowRequests();
    const req = requests.find((rq) => rq.book_id === record.book_id && rq.requester_name === record.borrower_name && rq.status === 'approved');
    if (req) {
      req.status = 'returned';
      req.returned_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.REQUESTS, requests);
      this.syncToCloud('library_requests_v2', requests);
    }

    const book = this.getBookById(record.book_id);
    const totalPages = book?.pages || 100;
    let pagesRead = 0;
    if (readingStatus === 'full') {
      pagesRead = totalPages;
    } else if (readingStatus === 'custom') {
      pagesRead = customPages && customPages > 0 ? customPages : 0;
    }

    const student = this.getStudents().find((s) => s.id === record.student_id || s.name === record.borrower_name);

    this.saveReadingRecord({
      borrow_record_id: record.id,
      student_id: record.student_id || student?.id,
      student_name: record.borrower_name,
      student_spr_id: student?.spr_id,
      book_id: record.book_id,
      book_title: record.book_title,
      book_pages: totalPages,
      reading_status: readingStatus,
      pages_read: pagesRead,
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
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newRev);
    this.setItem(STORAGE_KEYS.REVIEWS, list);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(newRev.book_id)) {
      (async () => {
        try {
          await supabase
            .from('reviews')
            .insert({
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
    ratings.unshift({
      id: `rat-${Date.now()}`,
      book_id: bookId,
      stars,
      rater_name: raterName.trim(),
      created_at: new Date().toISOString(),
    });
    this.setItem(STORAGE_KEYS.RATINGS, ratings);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(bookId)) {
      (async () => {
        try {
          await supabase
            .from('ratings')
            .insert({
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
      this.syncToCloud('library_books_v2', bookList);
    }
    return { average_rating: avg, ratings_count: count };
  }
}

export const dataService = new DataService();
