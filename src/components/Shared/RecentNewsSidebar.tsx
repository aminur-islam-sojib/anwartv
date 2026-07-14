// app/(public)/components/RecentNewsSidebar.tsx
import Link from "next/link";

interface RecentArticle {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
}

interface RecentNewsSidebarProps {
  articles: RecentArticle[];
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return "এইমাত্র";
  if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ঘণ্টা আগে`;
  
  return new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }).format(date);
}

export default function RecentNewsSidebar({ articles }: RecentNewsSidebarProps) {
  return (
    <aside className="w-full lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-fit sticky top-6">
      <div className="border-b-2 border-[#cc0000] pb-2 mb-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          সর্বশেষ সংবাদ
        </h3>
      </div>

      {articles.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">কোনো সাম্প্রতিক সংবাদ পাওয়া যায়নি।</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {articles.map((article, index) => (
            <div key={article._id} className="py-3 first:pt-0 last:pb-0 group">
              <Link href={`/news/${article.slug}`} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-[#cc0000] group-hover:text-white transition-colors">
                  {index + 1}
                </span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 leading-snug hover:text-[#cc0000] transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400">
                    {formatTimeAgo(article.publishedAt)}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}