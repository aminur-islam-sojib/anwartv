"use client";

import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Search,
  FileText,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  Globe,
} from "lucide-react";

interface Article {
  _id: string;
  title: string;
  category:
    | string
    | {
        _id?: string;
        name?: string;
        slug?: string;
      };
  author?: string;
  date?: string;
}

interface LayoutSlots {
  hero_main: Article | null;
  hero_sidebar_1: Article | null;
  hero_sidebar_2: Article | null;
  politics_featured: Article | null;
  sports_featured: Article | null;
}

function getCategoryLabel(category?: Article["category"]) {
  if (!category) return "N/A";
  if (typeof category === "string") return category;
  return category.name || category.slug || category._id || "N/A";
}

export default function HomepageCurator() {
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // হোমপেজের স্লটসমূহের কারেন্ট স্টেট (প্রাথমিকভাবে সব ফাকা বা null থাকবে)
  const [slots, setSlots] = useState<LayoutSlots>({
    hero_main: null,
    hero_sidebar_1: null,
    hero_sidebar_2: null,
    politics_featured: null,
    sports_featured: null,
  });

  // ১. ব্যাকএন্ড থেকে সম্প্রতি প্রকাশিত সব নিউজ এবং বর্তমান লেআউট কনফিগ লোড করা
  useEffect(() => {
    async function loadDashboardData() {
      try {
        // নোট: আপনার প্রজেক্টের রিয়েল নিউজ এপিআই রুট এখানে ব্যবহার করবেন (যেমন: /api/articles)
        const articlesRes = await fetch("/api/articles?limit=10");
        if (!articlesRes.ok) {
          throw new Error(`articles request failed with ${articlesRes.status}`);
        }
        const articlesData = await articlesRes.json();
        if (articlesData.success) setRecentArticles(articlesData.data);

        // বর্তমানের সেভ করা লেআউট কনফিগ তুলে আনা
        const layoutRes = await fetch("/api/admin/homepage-layout");
        if (!layoutRes.ok) {
          throw new Error(`layout request failed with ${layoutRes.status}`);
        }
        const layoutData = await layoutRes.json();
        if (layoutData.success && layoutData.data) {
          setSlots(layoutData.data);
        }
      } catch (err) {
        console.error("ডেটা লোড করতে ব্যর্থ:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // ২. কোনো স্লটে সংবাদ অ্যাসাইন করার ফাংশন
  const assignArticleToSlot = (
    slotKey: keyof LayoutSlots,
    article: Article,
  ) => {
    setSlots((prev) => ({
      ...prev,
      [slotKey]: article,
    }));
  };

  // ৩. সেভ বাটন ট্রিগার - ব্যাকএন্ড API-তে ডেটা পাঠানো
  const handleSaveLayout = async () => {
    // যেকোনো একটি স্লট খালি থাকলে এডিটরকে অ্যালার্ট দেওয়া
    if (
      !slots.hero_main ||
      !slots.hero_sidebar_1 ||
      !slots.hero_sidebar_2 ||
      !slots.politics_featured ||
      !slots.sports_featured
    ) {
      alert("দয়া করে সবগুলো স্লটে নিউজ সিলেক্ট করুন!");
      return;
    }

    setIsSaving(true);

    // ব্যাকএন্ডের জন্য শুধুমাত্র আইডিগুলোর রিলেশনাল পে-লোড ম্যাপ তৈরি করা
    const payload = {
      userId: "editor_session_id_123", // আপনার Auth সিস্টেম থেকে dynamic userId এখানে বসবে
      slots: {
        hero_main: slots.hero_main._id,
        hero_sidebar_1: slots.hero_sidebar_1._id,
        hero_sidebar_2: slots.hero_sidebar_2._id,
        politics_featured: slots.politics_featured._id,
        sports_featured: slots.sports_featured._id,
      },
    };

    try {
      const response = await fetch("/api/admin/homepage-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("লেআউট সেভ করা যায়নি: " + result.error);
      }
    } catch (err) {
      console.error("অনুরোধ ব্যর্থ হয়েছে:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // সার্চ কুয়েরি অনুযায়ী নিউজ ফিল্টার করা
  const filteredArticles = recentArticles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="text-center py-20 font-bold text-sm">
        ড্যাশবোর্ড লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      {/* হেডার ও গ্লোবাল অ্যাকশন বাটনসমূহ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-1">
            <LayoutGrid className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              লেআউট কনফিগারেশন
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
            হোমপেজ কিউরেশন বোর্ড (Curation Board)
          </h1>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />
            রিসেট
          </button>

          <button
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#cc0000] hover:bg-[#a30000] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer shadow-sm shadow-red-900/10"
          >
            {isSaving ? (
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white animate-bounce" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? "লেআউট লাইভ হয়েছে!" : "লেআউট সেভ করুন"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* বাম কলাম: রিসেন্ট পাবলিশড আর্টিকেল পুল */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                সদ্য প্রকাশিত সংবাদ
              </h2>
            </div>
          </div>

          <div className="relative flex items-center bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-[#cc0000] focus-within:bg-white">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="শিরোনাম খুঁজুন..."
              className="bg-transparent text-xs w-full outline-none text-slate-800 dark:text-zinc-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-145 overflow-y-auto pr-1">
            {filteredArticles.map((article) => (
              <div
                key={article._id}
                className="p-3 border border-slate-100 dark:border-zinc-800/60 bg-slate-50/40 dark:bg-zinc-800/10 hover:bg-slate-50 dark:hover:bg-zinc-800/40 rounded-xl transition-all group flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                      {getCategoryLabel(article.category)}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-200 line-clamp-2 leading-snug group-hover:text-[#cc0000] transition-colors">
                    {article.title}
                  </h3>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-slate-100/80 dark:border-zinc-800/80 pt-2">
                  <button
                    onClick={() => assignArticleToSlot("hero_main", article)}
                    className="px-2 py-0.5 bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded text-[9px] font-semibold cursor-pointer hover:bg-[#cc0000] hover:text-white"
                  >
                    + লিড হিরো
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ডান কলাম: হোমপেজ ভার্চুয়াল স্লটস ব্লুপ্রিন্ট */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>টপ ফোল্ড লেআউট (The Top Fold Grid)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* স্লট ১: মেইন লিড স্টোরি */}
              <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between min-h-55 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-[#cc0000] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-br-xl flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> LEAD STORY
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 leading-snug">
                    {slots.hero_main
                      ? slots.hero_main.title
                      : "কোনো নিউজ সিলেক্ট করা নেই"}
                  </h4>
                </div>

                <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 mt-4 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-[#cc0000] bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">
                    {getCategoryLabel(slots.hero_main?.category)}
                  </span>

                  <select
                    className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-[11px] text-slate-600 dark:text-zinc-300 outline-none w-1/2"
                    value={slots.hero_main?._id || ""}
                    onChange={(e) => {
                      const art = recentArticles.find(
                        (a) => a._id === e.target.value,
                      );
                      if (art) assignArticleToSlot("hero_main", art);
                    }}
                  >
                    <option value="" disabled>
                      নিউজ বেছে নিন...
                    </option>
                    {recentArticles.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* রাইট সাইডবার স্লটস */}
              <div className="flex flex-col gap-4">
                {/* সাইডবার ১ */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between flex-1 text-xs">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block mb-1">
                      SIDEBAR SLOT 1
                    </span>
                    <h5 className="font-bold text-slate-700 dark:text-zinc-200 line-clamp-2 leading-tight">
                      {slots.hero_sidebar_1?.title || "ফাঁকা"}
                    </h5>
                  </div>
                  <select
                    className="mt-2 w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-[10px]"
                    value={slots.hero_sidebar_1?._id || ""}
                    onChange={(e) => {
                      const art = recentArticles.find(
                        (a) => a._id === e.target.value,
                      );
                      if (art) assignArticleToSlot("hero_sidebar_1", art);
                    }}
                  >
                    <option value="" disabled>
                      সিলেক্ট করুন...
                    </option>
                    {recentArticles.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title.substring(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* সাইডবার ২ */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between flex-1 text-xs">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 block mb-1">
                      SIDEBAR SLOT 2
                    </span>
                    <h5 className="font-bold text-slate-700 dark:text-zinc-200 line-clamp-2 leading-tight">
                      {slots.hero_sidebar_2?.title || "ফাঁকা"}
                    </h5>
                  </div>
                  <select
                    className="mt-2 w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-[10px]"
                    value={slots.hero_sidebar_2?._id || ""}
                    onChange={(e) => {
                      const art = recentArticles.find(
                        (a) => a._id === e.target.value,
                      );
                      if (art) assignArticleToSlot("hero_sidebar_2", art);
                    }}
                  >
                    <option value="" disabled>
                      সিলেক্ট করুন...
                    </option>
                    {recentArticles.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title.substring(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* জোন ২: ক্যাটাগরি ফিচার্ড */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-widest">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>ক্যাটাগরি ভিত্তিক ফিচার্ড স্লট</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* রাজনীতি স্লট */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-zinc-300 border-b pb-2">
                  <span className="w-1.5 h-3 bg-blue-600 rounded-sm inline-block" />
                  <span>জাতীয়/রাজনীতি ফিচার্ড</span>
                </div>
                <p className="text-xs font-bold text-slate-600 line-clamp-2">
                  {slots.politics_featured?.title || "ফাঁকা"}
                </p>
                <select
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                  value={slots.politics_featured?._id || ""}
                  onChange={(e) => {
                    const art = recentArticles.find(
                      (a) => a._id === e.target.value,
                    );
                    if (art) assignArticleToSlot("politics_featured", art);
                  }}
                >
                  <option value="" disabled>
                    নিউজ সিলেক্ট করুন...
                  </option>
                  {recentArticles.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.title.substring(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* খেলাধুলা স্লট */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-zinc-300 border-b pb-2">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-sm inline-block" />
                  <span>খেলাধুলা ফিচার্ড</span>
                </div>
                <p className="text-xs font-bold text-slate-600 line-clamp-2">
                  {slots.sports_featured?.title || "ফাঁকা"}
                </p>
                <select
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                  value={slots.sports_featured?._id || ""}
                  onChange={(e) => {
                    const art = recentArticles.find(
                      (a) => a._id === e.target.value,
                    );
                    if (art) assignArticleToSlot("sports_featured", art);
                  }}
                >
                  <option value="" disabled>
                    নিউজ সিলেক্ট করুন...
                  </option>
                  {recentArticles.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.title.substring(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/50 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>লাইভ মেকানিজম:</strong> ড্রপডাউন পরিবর্তন করার পর উপরে
              থাকা "লেআউট সেভ করুন" বাটনে ক্লিক করলে তা সরাসরি Upstash Redis এবং
              Vercel ISR ক্যাশ ইভ্যালিডেশন কমপ্লিট করে হোমপেজ আপডেট করে দেবে।
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
