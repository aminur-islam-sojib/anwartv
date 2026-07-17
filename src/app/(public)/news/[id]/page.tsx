// app/news/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getCachedArticle } from "@/lib/newsService";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://anwartv.com";
const SITE_NAME = "AnwarTV"; // Replace with your actual publication name

function getCategoryLabel(category: unknown) {
  if (!category) return "অনির্ধারিত";
  if (typeof category === "string") return category;

  if (typeof category === "object") {
    const typedCategory = category as {
      name?: string;
      slug?: string;
      title?: string;
      _id?: { toString?: () => string } | string;
    };

    return (
      typedCategory.name ||
      typedCategory.title ||
      typedCategory.slug ||
      (typeof typedCategory._id === "string"
        ? typedCategory._id
        : typedCategory._id?.toString?.() || "অনির্ধারিত")
    );
  }

  return "অনির্ধারিত";
}

// Strips HTML tags for use in meta descriptions / JSON-LD plain text fields
function stripHtml(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() + "…" : text;
}

async function resolveArticle(id: string) {
  // Defensive decode: guards against any double-encoded links elsewhere
  // in the app (e.g. a stray encodeURIComponent on a <Link href>) still
  // resulting in a correct lookup instead of a false 404.
  const decodedSlug = decodeURIComponent(id);
  return getCachedArticle(decodedSlug);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await resolveArticle(id);

  if (!article) {
    return {
      title: "সংবাদটি পাওয়া যায়নি | " + SITE_NAME,
    };
  }

  const title = article.seo?.metaTitle || article.title;
  const description =
    article.seo?.metaDescription ||
    stripHtml(article.content, 160);
  const ogImage =
    article.seo?.ogImage || article.coverImage?.url || `${SITE_URL}/og-default.jpg`;
  const articleUrl = `${SITE_URL}/news/${article.slug}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords: article.seo?.keywords,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: articleUrl,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
      publishedTime: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : undefined,
      modifiedTime: article.updatedAt
        ? new Date(article.updatedAt).toISOString()
        : undefined,
      locale: "bn_BD",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function NewsDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const article = await resolveArticle(id);

  if (!article) {
    notFound();
  }

  const articleUrl = `${SITE_URL}/news/${article.slug}`;
  const publishedDate = article.publishedAt || article.createdAt;

  // NewsArticle structured data — required for Google News / Top Stories / Discover eligibility.
  // Kept as plain JSON built from real article fields only; nothing fabricated.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    image: article.coverImage?.url ? [article.coverImage.url] : undefined,
    datePublished: publishedDate ? new Date(publishedDate).toISOString() : undefined,
    dateModified: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : undefined,
    author: article.author
      ? {
        "@type": "Person",
        name:
          typeof article.author === "object"
            ? (article.author as { name?: string }).name || SITE_NAME
            : SITE_NAME,
      }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`, // Replace with your actual logo path
      },
    },
    description: article.seo?.metaDescription || stripHtml(article.content, 160),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: getCategoryLabel(article.category),
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 font-sans selection:bg-red-600 selection:text-white">
      {/* Structured data for Google News / Search rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ক্যাটাগরি এবং ব্রেডক্রাম্ব */}
      <div className="mb-4">
        <span className="text-xs font-black text-[#cc0000] uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded">
          {getCategoryLabel(article.category)}
        </span>
      </div>

      {/* সংবাদের মূল শিরোনাম */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
        {article.title}
      </h1>

      {/* পাবলিশ টাইম ও মেটা ডাটা */}
      <div className="flex items-center gap-4 border-y border-slate-100 py-3 mb-8 text-xs text-slate-500">
        <div>
          প্রকাশিত:{" "}
          <time
            dateTime={
              publishedDate ? new Date(publishedDate).toISOString() : undefined
            }
            className="font-bold text-slate-700"
          >
            {new Date(publishedDate || article.createdAt).toLocaleDateString(
              "bn-BD",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            )}
          </time>
        </div>
      </div>

      {/* অপ্টিমাইজড কাভার ইমেজ (ImgBB CDN ফ্রেন্ডলি) */}
      {article.coverImage?.url && (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 mb-8 border border-slate-200/50">
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt || article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      {/* সংবাদের বিস্তারিত মূল বডি (Rich Text Content) */}
      <div
        className="prose prose-slate max-w-none text-slate-800 text-base leading-relaxed md:leading-loose space-y-6 font-normal"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}