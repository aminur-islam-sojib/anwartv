import Image from "next/image";
import Link from "next/link";

interface Article {
  slug: string;
  title: string;
  coverImage?: { url: string };
}

interface CategoryBucketsProps {
  politics: Article | null;
  sports: Article | null;
}

export default function CategoryBuckets({ politics, sports }: CategoryBucketsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Politics Block */}
      {politics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              জাতীয় ও রাজনীতি
            </h3>
          </div>
          <article className="group space-y-2">
            <Link
              href={`/news/${politics.slug}`}
              className="block overflow-hidden rounded-xl relative aspect-video w-full bg-slate-100"
            >
              <Image
                src={politics.coverImage?.url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"}
                alt={politics.title}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </Link>
            <Link href={`/news/${politics.slug}`}>
              <h4 className="text-base font-black text-slate-800 hover:text-[#cc0000] transition-colors leading-snug">
                {politics.title}
              </h4>
            </Link>
          </article>
        </div>
      )}

      {/* Sports Block */}
      {sports && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              খেলাধুলা
            </h3>
          </div>
          <article className="group space-y-2">
            <Link
              href={`/news/${sports.slug}`}
              className="block overflow-hidden rounded-xl relative aspect-video w-full bg-slate-100"
            >
              <Image
                src={sports.coverImage?.url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"}
                alt={sports.title}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </Link>
            <Link href={`/news/${sports.slug}`}>
              <h4 className="text-base font-black text-slate-800 hover:text-[#cc0000] transition-colors leading-snug">
                {sports.title}
              </h4>
            </Link>
          </article>
        </div>
      )}
    </section>
  );
}