import * as XLSX from 'xlsx';

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
};

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
    return newBook;
  }

  deleteBook(id: string): void {
    const list = this.getBooks().filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BOOKS, list);
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
        created_at: new Date().toISOString(),
      });
      added++;
    }
    this.setItem(STORAGE_KEYS.BOOKS, list);
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
    return newStudent;
  }

  deleteStudent(id: string): void {
    const list = this.getStudents().filter((s) => s.id !== id);
    this.setItem(STORAGE_KEYS.STUDENTS, list);
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
    return added;
  }

  updateStudentPassword(studentId: string, newCode: string): boolean {
    const list = this.getStudents();
    const student = list.find((s) => s.id === studentId || s.spr_id === studentId);
    if (!student) return false;
    student.secret_code = newCode.trim();
    this.setItem(STORAGE_KEYS.STUDENTS, list);
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
    return newBanner;
  }

  deleteBanner(id: string): void {
    const list = this.getBanners().filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BANNERS, list);
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
    return newReq;
  }

  updateBorrowRequestStatus(id: string, status: BorrowRequest['status']): void {
    const list = this.getBorrowRequests();
    const item = list.find((r) => r.id === id);
    if (item) {
      item.status = status;
      if (status === 'returned') item.returned_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.REQUESTS, list);

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
      } else if (status === 'returned') {
        const records = this.getBorrowRecords();
        const activeRec = records.find((r) => r.book_id === item.book_id && r.borrower_name === item.requester_name && r.status === 'active');
        if (activeRec) {
          activeRec.status = 'returned';
          activeRec.returned_at = new Date().toISOString();
          this.setItem(STORAGE_KEYS.RECORDS, records);
        }
      }
    }
  }

  getBorrowRecords(): BorrowRecord[] {
    return this.getItem(STORAGE_KEYS.RECORDS, DEFAULT_RECORDS);
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
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Books_Template');
    XLSX.writeFile(wb, 'Books_Bulk_Upload_Template.xlsx');
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
    }
    return { average_rating: avg, ratings_count: count };
  }
}

export const dataService = new DataService();
