import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'ar' | 'en';

const dict = {
  ar: {
    appName: 'مكتبة الامتياز',
    appNameShort: 'الامتياز',
    tagline: 'منارة المعرفة والقراءة',
    loading: 'جارٍ التحميل...',
    home: 'الرئيسية',
    books: 'الكتب',
    categories: 'التصنيفات',
    authors: 'المؤلفون',
    publishers: 'دور النشر',
    myBorrows: 'استعاراتي',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    newPassword: 'كلمة المرور الجديدة',
    confirmPassword: 'تأكيد كلمة المرور',
    username: 'اسم المستخدم',
    fullName: 'الاسم الكامل',
    submit: 'إرسال',
    save: 'حفظ',
    cancel: 'إلغاء',
    welcome: 'أهلاً بك',
    noBooksYet: 'لا توجد كتب بعد. سيقوم المسؤول بإضافة الكتب قريباً.',
    searchBooks: 'ابحث في العنوان، المؤلف، الناشر، الرمز أو الوصف...',
    adminLogin: 'تسجيل دخول المسؤول',
    adminPanel: 'لوحة المسؤول',
    forcePwTitle: 'يجب تغيير كلمة المرور',
    forcePwDesc: 'هذه هي المرة الأولى لتسجيل الدخول. الرجاء تعيين كلمة مرور جديدة للمتابعة.',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح',
    passwordMismatch: 'كلمتا المرور غير متطابقتين',
    invalidCreds: 'بيانات الدخول غير صحيحة',
    minChars: 'يجب أن تحتوي على 6 أحرف على الأقل',
    needAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب بالفعل؟',
    forgot: 'نسيت كلمة المرور؟',
    sendReset: 'إرسال رابط إعادة التعيين',
    resetSent: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني',
    backToHome: 'العودة للرئيسية',
    languageSwitch: 'العربية / English',
    notFound: 'الصفحة غير موجودة',
    filters: 'الفلاتر',
    all: 'الكل',
    category: 'التصنيف',
    author: 'المؤلف',
    publisher: 'الناشر',
    sortBy: 'الترتيب',
    defaultSort: 'الأعلى تقييماً ثم الأبجدي',
    clearFilters: 'مسح الفلاتر',
    page: 'صفحة',
    of: 'من',
    previous: 'السابق',
    next: 'التالي',
    bookCode: 'رمز الكتاب',
    siNumber: 'الرقم التسلسلي',
    volume: 'المجلد',
    pages: 'الصفحات',
    description: 'الوصف',
    reviews: 'المراجعات',
    rating: 'التقييم',
    yourRating: 'تقييمك',
    writeReview: 'اكتب مراجعة',
    postReview: 'نشر المراجعة',
    noReviews: 'لا توجد مراجعات بعد. كن أول من يكتب مراجعة!',
    loginToReview: 'سجّل الدخول لإضافة تقييم أو مراجعة.',
    readFullText: 'قراءة النص الكامل',
    showingResults: 'النتائج',
    backToCatalog: 'العودة للكتالوج',
    ratingSaved: 'تم حفظ التقييم',
    reviewSaved: 'تم نشر المراجعة',
  },
  en: {
    appName: 'Makthabathul Imthiyaz',
    appNameShort: 'Imthiyaz',
    tagline: 'A beacon of knowledge and reading',
    loading: 'Loading...',
    home: 'Home',
    books: 'Books',
    categories: 'Categories',
    authors: 'Authors',
    publishers: 'Publishers',
    myBorrows: 'My Borrows',
    login: 'Sign In',
    signup: 'Sign Up',
    logout: 'Sign Out',
    email: 'Email',
    password: 'Password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    username: 'Username',
    fullName: 'Full name',
    submit: 'Submit',
    save: 'Save',
    cancel: 'Cancel',
    welcome: 'Welcome',
    noBooksYet: 'No books yet. The admin will add books soon.',
    searchBooks: 'Search title, author, publisher, code or description...',
    adminLogin: 'Admin Login',
    adminPanel: 'Admin Panel',
    forcePwTitle: 'Password change required',
    forcePwDesc: 'This is your first login. Please set a new password to continue.',
    passwordChanged: 'Password changed successfully',
    passwordMismatch: 'Passwords do not match',
    invalidCreds: 'Invalid login credentials',
    minChars: 'Must be at least 6 characters',
    needAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    forgot: 'Forgot password?',
    sendReset: 'Send reset link',
    resetSent: 'Reset link sent to your email',
    backToHome: 'Back to home',
    languageSwitch: 'العربية / English',
    notFound: 'Page not found',
    filters: 'Filters',
    all: 'All',
    category: 'Category',
    author: 'Author',
    publisher: 'Publisher',
    sortBy: 'Sort by',
    defaultSort: 'Top rated, then A–Z',
    clearFilters: 'Clear filters',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    bookCode: 'Book code',
    siNumber: 'SI number',
    volume: 'Volume',
    pages: 'Pages',
    description: 'Description',
    reviews: 'Reviews',
    rating: 'Rating',
    yourRating: 'Your rating',
    writeReview: 'Write a review',
    postReview: 'Post review',
    noReviews: 'No reviews yet. Be the first to write one!',
    loginToReview: 'Sign in to leave a rating or review.',
    readFullText: 'Read full text',
    showingResults: 'Results',
    backToCatalog: 'Back to catalog',
    ratingSaved: 'Rating saved',
    reviewSaved: 'Review posted',
  },
} as const;

export type TKey = keyof typeof dict['ar'];

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
  dir: 'rtl' | 'ltr';
};

const LangCtx = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('imthiyaz_lang') : null;
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem('imthiyaz_lang', lang);
  }, [lang]);

  const value: Ctx = {
    lang,
    setLang: setLangState,
    t: (k) => dict[lang][k] ?? k,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
  };

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}
