import { Metadata } from "next";
import { getCachedArticle } from "./newsService";


interface PageProps {
    params: Promise<{ id: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://anwartv.com";
const SITE_NAME = "AnwarTV"; // Replace with your actual publication name


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