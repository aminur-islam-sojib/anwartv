// app/(public)/category/[[...slug]]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import Article from "@/Model/Article";
import Category from "@/Model/Category";

interface CategoryPageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ page?: string }>;
}

// ক্যাশড ডাটা ফেচিং ইঞ্জিন
const getCategoryData = unstable_cache(
  async (slugArray: string[], page: number = 1, limit: number = 12) => {
    await connectDB();

    if (!slugArray || slugArray.length === 0) return null;

    // অ্যারের শেষ এলিমেন্টটিই হলো আমাদের টার্গেটেড ক্যাটাগরি/সাব-ক্যাটাগরি স্ল্যাগ
    const targetSlug = slugArray[slugArray.length - 1];
    
    // টার্গেট ক্যাটাগরি ডাটা তুলে আনা
    const currentCategory = await Category.findOne({ slug: targetSlug }).lean();
    if (!currentCategory) return null;

    const skip = (page - 1) * limit;
    let queryFilter: any = { status: "published" };

    // যদি এটি সাব-ক্যাটাগরি হয় (parent ফিল্ডে অন্য আইডি আছে)
    if ((currentCategory as any).parent) {
      queryFilter.category = currentCategory._id;
    } else {
      // যদি এটি মেইন ক্যাটাগরি হয়, তবে এই ক্যাটাগরি এবং এর আন্ডারে থাকা সব সাব-ক্যাটাগরির নিউজও একসাথে দেখাবো
      const subCategories = await Category.find({ parent: currentCategory._id }).select("_id").lean();
      const subCategoryIds = subCategories.map(sub => sub._id);
      
      // মেইন ক্যাটাগরি আইডি + সব সাব-ক্যাটাগরি আইডির নিউজ একসাথে কুয়েরি
      queryFilter.category = { $in: [currentCategory._id, ...subCategoryIds] };
    }

    // অপ্টিমাইজড কুয়েরি (শুধুমাত্র প্রয়োজনীয় ফিল্ড ফিল্টার করে)
    const articles = await Article.find(queryFilter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title slug excerpt coverImage publishedAt")
      .lean();

    const totalArticles = await Article.countDocuments(queryFilter);

    return {
      categoryName: (currentCategory as any).name,
      isSubCategory: !!(currentCategory as any).parent,
      articles: JSON.parse(JSON.stringify(articles)),
      totalPages: Math.ceil(totalArticles / limit),
      currentPage: page
    };
  },
  ["production-multilevel-category-cache"],
  {
    revalidate: 60, // ৬০ সেকেন্ড এজ ক্যাশিং (ISR)
    tags: ["articles", "categories"]
  }
);

export const dynamicParams = true;

export default async function MultiLevelCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sParams = await searchParams;
  const currentPage = Number(sParams.page) || 1;

  // যদি কেউ শুধু /category রুট-এ হিট করে
  if (!slug || slug.length === 0) {
    notFound();
  }

  const data = await getCategoryData(slug, currentPage);

  if (!data) {
    notFound();
  }

  // পেজিনেশন ইউআরএল তৈরি করার জন্য কারেন্ট পাথ ট্র্যাকিং
  const basePath = `/category/${slug.join("/")}`;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 font-sans">
      {/* ক্যাটাগরি নাম ও ব্রেডক্রাম্ব */}
      <div className="border-b-4 border-[#cc0000] pb-2 mb-8 flex items-baseline gap-2">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900">
          {data.categoryName}
        </h1>
        {data.isSubCategory && (
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            (উপ-ক্যাটাগরি)
          </span>
        )}
      </div>

      {/* নিউজ গ্রিড */}
      {data.articles.length === 0 ? (
        <p className="text-slate-500 text-center py-12">এই মুহূর্তে কোনো সংবাদ পাওয়া যায়নি।</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.articles.map((article: any) => (
            <article key={article._id} className="group flex flex-col space-y-3 bg-white border border-slate-100 p-3 rounded-xl shadow-sm transition-all hover:shadow-md">
              {article.coverImage?.url && (
                <Link href={`/news/${article.slug}`} className="block overflow-hidden rounded-lg relative aspect-[16/10] w-full bg-slate-50">
                  <Image
                    src={article.coverImage.url}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </Link>
              )}
              <div className="flex flex-col flex-1 justify-between space-y-2">
                <Link href={`/news/${article.slug}`}>
                  <h2 className="text-base font-bold text-slate-900 leading-snug hover:text-[#cc0000] transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                </Link>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {article.excerpt || "বিস্তারিত সংবাদটি পড়তে এখানে ক্লিক করুন..."}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ডাইনামিক পেজিনেশন */}
      {data.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          {currentPage > 1 && (
            <Link href={`${basePath}?page=${currentPage - 1}`} className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-slate-50">
              পূর্ববর্তী
            </Link>
          )}
          <span className="text-sm text-slate-600 font-medium">
            পৃষ্ঠা {currentPage} / {data.totalPages}
          </span>
          {currentPage < data.totalPages && (
            <Link href={`${basePath}?page=${currentPage + 1}`} className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-slate-50">
              পরবর্তী
            </Link>
          )}
        </div>
      )}
    </main>
  );
}