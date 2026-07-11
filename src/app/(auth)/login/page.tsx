"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2 } from "lucide-react";
import { getDashboardPath } from "@/lib/dashboardRoutes";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // NextAuth-এর Credentials প্রোভাইডার ব্যবহার করে সাইন-ইন
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        // ভুল ইমেইল বা পাসওয়ার্ডের ক্ষেত্রে এরর হ্যান্ডলিং
        throw new Error("ভুল ইমেইল অথবা পাসওয়ার্ড! আবার চেষ্টা করুন।");
      }

      const session = await getSession();

      router.push(getDashboardPath(session?.user?.role));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "লগইন করার সময় একটি সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200"
      >
        {/* Header Section - Deep Crimson News Anchor Palette */}
        <div className="bg-[#4A0404] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <Image
              src="/anwartv-logo.jpg"
              alt="Anwar TV Logo"
              width={120}
              height={120}
              className="object-contain mb-4 drop-shadow-md"
              priority
            />
            <h1 className="text-2xl font-bold text-white tracking-wide">
              পোর্টালে লগইন করুন
            </h1>
            <p className="text-[#FFE0EB] mt-2 text-sm">
              অ্যাডমিন প্যানেলে প্রবেশ করতে আপনার তথ্য দিন।
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-50 text-[#cc0000] p-3 rounded-lg text-sm mb-6 border border-red-200 font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#334155]">
                ইমেইল ঠিকানা
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent transition-all text-[#334155]"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#334155]">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent transition-all text-[#334155]"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-[#cc0000] hover:bg-[#a30000] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>লগইন করুন</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            নতুন অ্যাকাউন্ট প্রয়োজন?{" "}
            <a
              href="/register"
              className="text-[#cc0000] font-semibold hover:underline"
            >
              এখানে নিবন্ধন করুন
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
