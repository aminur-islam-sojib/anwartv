"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import { Loader2, Save, Globe, ImagePlus, X } from "lucide-react";

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
        console.error("ক্যাটাগরি লোড করতে সমস্যা হয়েছে:", err);
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

    // ৫ মেগাবাইটের বেশি বড় ইমেজ ব্লক করার গার্ডরাইল
    if (file.size > 5 * 1024 * 1024) {
      setError("ইমেজ সাইজ ৫ মেগাবাইটের কম হতে হবে।");
      return;
    }

    setUploadingImage(true);
    setError("");

    // ১. ImgBB রিকোয়েস্টের জন্য FormData তৈরি
    const formData = new FormData();
    formData.append("image", file); // ImgBB কি (Key) হিসেবে 'image' প্রত্যাশা করে

    // আপনার অরিজিনাল ImgBB API Key এখানে বসান
    const IMGBB_API_KEY = "e56ddc47b0d4139bc8b631ea8e51bab3";

    try {
      // ২. ImgBB API এন্ডপয়েন্টে POST রিকোয়েস্ট পাঠানো
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData, // কোনো JSON.stringify লাগবে না, সরাসরি বডি পাস হবে
        },
      );

      const result = await res.json();

      // ৩. সফল হলে ডিরেক্ট ডিসপ্লে URL স্টেট-এ সেট করা
      if (result.success && result.data?.url) {
        setCoverImage((prev) => ({ ...prev, url: result.data.url }));
      } else {
        throw new Error(
          result.error?.message || "ImgBB আপলোড রেসপন্স ইনভ্যালিড।",
        );
      }
    } catch (err: any) {
      setError(
        err.message || "ইমেজ আপলোড করতে ব্যর্থ হয়েছে। এপিআই কি চেক করুন।",
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
        "অনুগ্রহ করে শিরোনাম, মূল বিষয়বস্তু এবং ক্যাটাগরি সিলেক্ট করুন।",
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
        throw new Error(data.message || "সংবাদটি সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      }

      setSuccess(
        initialData
          ? "আর্টিকেলটি সফলভাবে আপডেট করা হয়েছে!"
          : "নতুন সংবাদ সফলভাবে তৈরি হয়েছে!",
      );
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "একটি কারিগরি ত্রুটি ঘটেছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-5xl mx-auto p-6 bg-white rounded-xl border border-slate-200 shadow-sm font-sans"
    >
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">
              সংবাদের শিরোনাম
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-slate-800 text-lg font-semibold"
              placeholder="আকর্ষণীয় শিরোনাম লিখুন..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Featured Cover Image Section */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              ফিচার্ড কভার ইমেজ
            </label>

            {!coverImage.url ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 text-[#cc0000] animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 font-medium">
                        ক্লিক করে ইমেজ আপলোড করুন
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        WebP, JPG, PNG (Max 5MB)
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
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                  <img
                    src={coverImage.url}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#cc0000]"
                  placeholder="ছবির ক্যাপশন বা ক্রেডিট লিখুন (ঐচ্ছিক)..."
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

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">
              মূল সংবাদ (বিস্তারিত)
            </label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 bg-slate-50 p-5 rounded-xl border border-slate-200 h-fit">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
            পাবলিশিং সেটিংস
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">
              ক্যাটাগরি নির্বাচন করুন
            </label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-700 font-medium"
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">
              আর্টিকেল স্ট্যাটাস
            </label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-700 font-medium"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">ড্রাফট (Draft)</option>
              <option value="in_review">পর্যালোচনা (In Review)</option>
              <option value="published">পাবলিশ (Publish)</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded text-[#cc0000] focus:ring-[#cc0000] border-slate-300"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
              />
              <span className="text-sm font-semibold text-slate-700">
                ব্রেকিং নিউজ (Breaking)
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded text-[#cc0000] focus:ring-[#cc0000] border-slate-300"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span className="text-sm font-semibold text-slate-700">
                ফিচার্ড নিউজ (Featured)
              </span>
            </label>
          </div>

          {initialData && (
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-600">
                সম্পাদনা নোট (Edit History Note)
              </label>
              <textarea
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-xs text-slate-700"
                rows={3}
                placeholder="কী পরিবর্তন করলেন তা সংক্ষেপে লিখুন..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="w-full mt-4 bg-[#cc0000] hover:bg-[#a30000] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 shadow"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : initialData ? (
              <>
                <Save className="h-4 w-4" />
                <span>আপডেট করুন</span>
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
