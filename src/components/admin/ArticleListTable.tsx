"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Edit, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface IArticleRow {
  _id: string;
  title: string;
  slug: string;
  category: { name: string };
  author: { name: string };
  status: "draft" | "in_review" | "published";
  createdAt: string;
}

export default function ArticleListTable() {
  const [articles, setArticles] = useState<IArticleRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch paginated articles inside the administrative dashboard view context
  const fetchArticles = async (currentPage: number) => {
    setLoading(true);
    try {
      // Fetching all statuses for backend management rather than just published news
      const res = await fetch(
        `/api/articles?page=${currentPage}&limit=10&status=all`,
      );
      const result = await res.json();
      if (result.success) {
        setArticles(result.data);
        setTotalPages(result.meta.totalPages || 1);
      }
    } catch (err) {
      console.error("আর্টিকেল লোড করতে ব্যর্থ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(page);
  }, [page]);

  // Helper function to render localized dynamic status badges styling
  const getStatusBadge = (status: string) => {
    const styles: any = {
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      in_review: "bg-amber-50 text-amber-700 border-amber-200 anim-pulse",
      published: "bg-green-50 text-green-700 border-green-200",
    };
    const labels: any = {
      draft: "ড্রাফট",
      in_review: "রিভিউধীন",
      published: "প্রকাশিত",
    };

    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.draft}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cc0000]"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-bold">
              <th className="p-4 w-[40%]">শিরোনাম</th>
              <th className="p-4">ক্যাটাগরি</th>
              <th className="p-4">লেখক</th>
              <th className="p-4">স্ট্যাটাস</th>
              <th className="p-4 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {articles.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-slate-400 font-medium"
                >
                  কোনো সংবাদ পাওয়া যায়নি।
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article._id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-4 font-semibold text-slate-900 max-w-[300px] truncate">
                    {article.title}
                  </td>
                  <td className="p-4 text-slate-500 font-medium">
                    {article.category?.name || "অনির্ধারিত"}
                  </td>
                  <td className="p-4 text-slate-600 font-medium">
                    {article.author?.name || "সিস্টেম"}
                  </td>
                  <td className="p-4">{getStatusBadge(article.status)}</td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/admin/edit/${article._id}`}
                      className="inline-flex p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <a
                      href={`/news/${article.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Production-grade Pagination controls integration */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">
          পাতা নং {page} (মোট {totalPages} পাতার মধ্যে)
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
