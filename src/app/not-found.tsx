import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative">
          <h1 className="text-9xl font-black text-slate-100 select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-[#cc0000] bg-white px-4 py-1 border border-slate-200 rounded-lg shadow-sm">
              পৃষ্ঠাটি পাওয়া যায়নি
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            দুঃখিত, অনুরোধ করা পাতাটি খুঁজে পাওয়া যায়নি।
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            হতে পারে লিংকটি পরিবর্তন করা হয়েছে অথবা টাইপ করতে কোনো ভুল হয়েছে। নিচের লিংকগুলো ব্যবহার করে মূল সাইটে ফিরে যেতে পারেন।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#4A0404] hover:bg-[#cc0000] text-white rounded-xl text-sm font-bold shadow-md transition-all duration-200"
          >
            <Home className="h-4 w-4" />
            প্রচ্ছদে ফিরে যান
          </Link>
          <Link
            href="/articles"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold shadow-sm transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            সব খবর দেখুন
          </Link>
        </div>
      </div>
    </main>
  );
}
