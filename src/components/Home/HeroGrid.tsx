// app/(public)/components/HeroGrid.tsx
import Image from "next/image";
import Link from "next/link";

interface Article {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: { url: string };
  category?: string | { name?: string; slug?: string; _id?: string };
}

interface HeroGridProps {
  main: Article | null;
  sidebar1: Article | null;
  sidebar2: Article | null;
  getCategoryLabel: (category?: any) => string;
}

export default function HeroGrid({ main, sidebar1, sidebar2, getCategoryLabel }: HeroGridProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ── Main Lead Story Block ── */}
      {main && (
        <article className="lg:col-span-8 group relative flex flex-col space-y-3">
          <Link
            href={`/news/${main.slug}`}
            className="block overflow-hidden rounded-2xl relative aspect-video w-full bg-slate-100"
          >
            <Image
              src={main.coverImage?.url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80"}
              alt={main.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute top-4 left-4 bg-[#cc0000] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
              প্রধান সংবাদ
            </div>
          </Link>

          <div className="space-y-2">
            <span className="text-xs font-black text-[#cc0000] uppercase tracking-wider">
              {getCategoryLabel(main.category)}
            </span>
            <Link href={`/news/${main.slug}`}>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight hover:text-[#cc0000] transition-colors">
                {main.title}
              </h1>
            </Link>
            <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
              {main.excerpt || "সংবাদের বিস্তারিত বিবরণ পড়তে লিংকে ক্লিক করুন..."}
            </p>
          </div>
        </article>
      )}

      {/* ── Sidebar Slots Block ── */}
      <aside className="lg:col-span-4 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-6">
        {sidebar1 && (
          <article className="group flex flex-col space-y-2 border-b lg:border-b border-slate-100 pb-4 lg:pb-4 last:border-0 last:pb-0">
            <Link
              href={`/news/${sidebar1.slug}`}
              className="block overflow-hidden rounded-xl relative aspect-16/10 w-full bg-slate-100"
            >
              <Image
                src={sidebar1.coverImage?.url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"}
                alt={sidebar1.title}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </Link>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase">
                {getCategoryLabel(sidebar1.category)}
              </span>
              <Link href={`/news/${sidebar1.slug}`}>
                <h2 className="text-sm font-extrabold text-slate-800 leading-snug hover:text-[#cc0000] transition-colors line-clamp-2">
                  {sidebar1.title}
                </h2>
              </Link>
            </div>
          </article>
        )}

        {sidebar2 && (
          <article className="group flex flex-col space-y-2 border-b sm:border-0 lg:border-b border-slate-100 pb-4 sm:pb-0 lg:pb-4 last:border-0 last:pb-0">
            <Link
              href={`/news/${sidebar2.slug}`}
              className="block overflow-hidden rounded-xl relative aspect-16/10 w-full bg-slate-100"
            >
              <Image
                src={sidebar2.coverImage?.url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"}
                alt={sidebar2.title}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </Link>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-600 uppercase">
                {getCategoryLabel(sidebar2.category)}
              </span>
              <Link href={`/news/${sidebar2.slug}`}>
                <h2 className="text-sm font-extrabold text-slate-800 leading-snug hover:text-[#cc0000] transition-colors line-clamp-2">
                  {sidebar2.title}
                </h2>
              </Link>
            </div>
          </article>
        )}
      </aside>
    </section>
  );
}