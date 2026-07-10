"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
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
      // 1. Create user account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // Handle un-successful API validations explicitly
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "নিবন্ধন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        );
      }

      // 2. Authenticate the freshly created user session
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (signInResult?.error) {
        throw new Error(
          "অ্যাকাউন্ট তৈরি হয়েছে, কিন্তু স্বয়ংক্রিয় লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে লগইন পেজে যান।",
        );
      }

      // 3. Perfect clean redirection to Bangla admin dashboard
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "একটি অজানা ত্রুটি ঘটেছে।");
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
              নতুন অ্যাকাউন্ট তৈরি করুন
            </h1>
            <p className="text-[#FFE0EB] mt-2 text-sm">
              জনগণের কণ্ঠস্বর। যুক্ত থাকুন সর্বশেষ সংবাদের সাথে।
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
                পূর্ণ নাম
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent transition-all text-[#334155]"
                  placeholder="আপনার নাম লিখুন"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

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
                  minLength={6}
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
                <span>অ্যাকাউন্ট তৈরি করুন</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
            <a
              href="/login"
              className="text-[#cc0000] font-semibold hover:underline"
            >
              লগইন করুন
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
