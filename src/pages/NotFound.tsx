import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import { Home, BookOpen, Search, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404: User navigated to non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
            <span className="font-serif text-5xl sm:text-6xl font-black text-primary tracking-tighter">404</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg border-2 border-background">
            <Search className="w-5 h-5" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
          الصفحة غير موجودة · Page Not Found
        </h1>
        <p className="max-w-md text-sm sm:text-base text-muted-foreground mb-8">
          عذراً، الرابط الذي تحاول الوصول إليه غير متوفر أو تم نقله. يمكنك العودة للصفحة الرئيسية أو تصفح المكتبة.
          <br />
          <span className="text-xs sm:text-sm text-muted-foreground/80 mt-1 block">
            The page you requested could not be found. You can return home or browse our catalog.
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية · Home</span>
          </Link>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border border-border text-foreground text-sm font-semibold hover:bg-muted shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>تصفح الفهرس · Browse Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        <div className="mt-12 text-xs text-muted-foreground/60 font-mono">
          Path: {location.pathname}
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
