"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import RichTextEditor from "./RichTextEditor";
import {
  Loader2,
  Save,
  Globe,
  ImagePlus,
  X,
  User,
  Users,
  FileText,
  Settings,
} from "lucide-react";
import { getDashboardPath } from "@/lib/dashboardRoutes";

interface ICatalogue {
  _id: string;
  name: string;
  slug: string;
}

interface ArticleFormProps {
  initialData?: any;
}

export default function ArticleForm({ initialData }: ArticleFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<ICatalogue[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Core form states
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [category, setCategory] = useState(
    initialData?.category?._id || initialData?.category || "",
  );

  // Optional Author Fields
  const [author, setAuthor] = useState(initialData?.author || "");
  const [coAuthor, setCoAuthor] = useState(initialData?.coAuthor || "");

  // Image State (URL + Caption)
  const [coverImage, setCoverImage] = useState<{
    url: string;
    caption?: string;
  }>(initialData?.coverImage || { url: "", caption: "" });

  const [status, setStatus] = useState(initialData?.status || "draft");
  const [isBreaking, setIsBreaking] = useState(
    initialData?.isBreaking || false,
  );
  const [isFeatured, setIsFeatured] = useState(
    initialData?.isFeatured || false,
  );
  const [editNote, setEditNote] = useState("");

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const result = await res.json();
        if (result.success) {
          setCategories(result.data);
        }
      } catch (err) {
        console.error("ক্যাটাগরি লোড করতে সমস্যা হয়েছে:", err);
      }
    }
    fetchCategories();
  }, []);

  /**
   * ImgBB API-তে সরাসরি ইমেজ আপলোড করার হ্যান্ডলার
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("ইমেজ সাইজ ৫ মেগাবাইটের কম হতে হবে।");
      return;
    }

    setUploadingImage(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);

    const IMGBB_API_KEY = "e56ddc47b0d4139bc8b631ea8e51bab3";

    try {
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await res.json();

      if (result.success && result.data?.url) {
        setCoverImage((prev) => ({ ...prev, url: result.data.url }));
      } else {
        throw new Error(
          result.error?.message || "ImgBB আপলোড রেসপন্স ইনভ্যালিড।",
        );
      }
    } catch (err: any) {
      setError(
        err.message || "ইমেজ আপলোড করতে ব্যর্থ হয়েছে। এপিআই কি চেক করুন।",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setCoverImage({ url: "", caption: "" });
  };

  // Safe submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!title || !content || !category) {
      setError(
        "অনুগ্রহ করে শিরোনাম, মূল বিষয়বস্তু এবং ক্যাটাগরি সিলেক্ট করুন।",
      );
      setLoading(false);
      return;
    }

    const payload = {
      title,
      content,
      category,
      coverImage,
      status,
      isBreaking,
      isFeatured,
      author, // Optional Field
      coAuthor, // Optional Field
      ...(initialData && { editNote }),
    };

    try {
      const url = initialData
        ? `/api/articles/${initialData._id}`
        : "/api/articles";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "সংবাদটি সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      }

      setSuccess(
        initialData
          ? "আর্টিকেলটি সফলভাবে আপডেট করা হয়েছে!"
          : "নতুন সংবাদ সফলভাবে তৈরি হয়েছে!",
      );
      router.push(getDashboardPath(session?.user?.role));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "একটি কারিগরি ত্রুটি ঘটেছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* নোটিফিকেশন অ্যালার্টস */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl text-sm font-medium animate-in fade-in duration-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-sm font-medium animate-in fade-in duration-200">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* বাম দিকের কলাম: কন্টেন্ট রাইটিং এরিয়া */}
        <div className="lg:col-span-2 space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200/60 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-zinc-800 pb-3 mb-2">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-800 dark:text-zinc-200">
              নিউজ এডিটর
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              সংবাদের মূল শিরোনাম
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:bg-white dark:focus:bg-zinc-900 transition-all text-slate-800 dark:text-zinc-100 text-xl font-bold placeholder:font-normal"
              placeholder="শিরোনাম লিখুন..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* ফিচার্ড কভার ইমেজ সেকশন */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ফিচার্ড কভার ইমেজ
            </label>

            {!coverImage.url ? (
              <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:border-slate-300 transition-all bg-slate-50/30 dark:bg-zinc-800/10">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 text-[#cc0000] animate-spin" />
                  ) : (
                    <>
                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-slate-100 dark:border-zinc-700 mb-3">
                        <ImagePlus className="h-6 w-6 text-slate-500" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-zinc-400 font-semibold">
                        ক্লিক করে ইমেজ আপলোড করুন
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        WebP, JPG, PNG (সর্বোচ্চ ৫ মেগাবাইট)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative w-full h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-inner bg-slate-100 dark:bg-zinc-800">
                  <img
                    src={coverImage.url}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-md backdrop-blur-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#cc0000]"
                  placeholder="ছবির ক্যাপশন বা ফটো ক্রেডিট লিখুন (ঐচ্ছিক)..."
                  value={coverImage.caption}
                  onChange={(e) =>
                    setCoverImage((prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              মূল সংবাদ (বিস্তারিত)
            </label>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700">
              <RichTextEditor content={content} onChange={setContent} />
            </div>
          </div>
        </div>

        {/* ডান দিকের কলাম: পাবলিশিং কনফিগারেশন প্যানেল */}
        <div className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200/60 dark:border-zinc-800 shadow-sm h-fit">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <Settings className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
              পাবলিশিং সেটিংস
            </h3>
          </div>

          {/* ক্যাটাগরি */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
              ক্যাটাগরি নির্বাচন করুন *
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-700 dark:text-zinc-200 font-medium cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">ক্যাটাগরি সিলেক্ট করুন</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* স্ট্যাটাস */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
              আর্টিকেল স্ট্যাটাস
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-700 dark:text-zinc-200 font-medium cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">ড্রাফট (Draft)</option>
              <option value="in_review">পর্যালোচনা (In Review)</option>
              <option value="published">পাবলিশ (Publish)</option>
            </select>
          </div>

          {/* নতুন ফিল্ড: অথর / রিপোর্টার (Optional) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1">
              <User className="h-3 w-3" /> লেখক / রিপোর্টার{" "}
              <span className="text-[10px] font-normal text-slate-400">
                (ঐচ্ছিক)
              </span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-700 dark:text-zinc-200"
              placeholder="লেখকের নাম লিখুন..."
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          {/* নতুন ফিল্ড: কো-অথর (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1">
              <Users className="h-3 w-3" /> সহ-লেখক{" "}
              <span className="text-[10px] font-normal text-slate-400">
                (ঐচ্ছিক)
              </span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-700 dark:text-zinc-200"
              placeholder="সহ-লেখকের নাম (যদি থাকে)..."
              value={coAuthor}
              onChange={(e) => setCoAuthor(e.target.value)}
            />
          </div>

          {/* টগলস/চেকবক্স গ্রুপ */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded-md text-[#cc0000] focus:ring-[#cc0000] border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 transition-colors"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors">
                ব্রেকিং নিউজ (Breaking)
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded-md text-[#cc0000] focus:ring-[#cc0000] border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 transition-colors"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors">
                ফিচার্ড নিউজ (Featured)
              </span>
            </label>
          </div>

          {/* এডিট নোট (শুধুমাত্র এডিট মোডে আসবে) */}
          {initialData && (
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                সম্পাদনা নোট (Edit History Note) *
              </label>
              <textarea
                className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-xs text-slate-700 dark:text-zinc-300"
                rows={3}
                placeholder="কী পরিবর্তন করলেন তা সংক্ষেপে লিখুন..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                required
              />
            </div>
          )}

          {/* সাবমিট বাটন */}
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full mt-2 bg-[#cc0000] hover:bg-[#a30000] active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:pointer-events-none shadow-sm shadow-red-900/10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : initialData ? (
              <>
                <Save className="h-4 w-4" />
                <span>আর্টিকেল আপডেট করুন</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                <span>সংবাদ প্রকাশ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
