"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Search, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // বাংলা তারিখ ফরম্যাট করার জন্য ইফেক্ট
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(new Date().toLocaleDateString("bn-BD", options));
  }, []);

  // মূল ক্যাটাগরি মেনু আইটেমসমূহ
  const navItems = [
    { name: "প্রচ্ছদ", href: "/" },
    { name: "জাতীয়", href: "/category/national" },
    { name: "রাজনীতি", href: "/category/politics" },
    { name: "আন্তর্জাতিক", href: "/category/international" },
    { name: "খেলাধুলা", href: "/category/sports" },
    { name: "বিনোদন", href: "/category/entertainment" },
    { name: "প্রযুক্তি", href: "/category/technology" },
  ];

  return (
    <header className="w-full bg-white font-sans">
      {/* লেয়ার ১: টপ বার (তারিখ ও ব্রেকিং এলিমেন্ট) */}
      <div className="bg-slate-50 text-xs text-slate-600 py-2 px-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>{currentDate || "লোডিং..."}</div>
          <div className="hidden md:flex items-center space-x-2">
            <span className="bg-[#cc0000] text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
              ব্রেকিং
            </span>
            <p className="text-slate-700 truncate max-w-md">
              সর্বশেষ সংবাদের আপডেট এখানে নিয়মিত দেখতে পাবেন...
            </p>
          </div>
        </div>
      </div>

      {/* লেয়ার ২: মেইন বার (ব্র্যান্ডিং ও ইউজার কন্ট্রোল) */}
      <div className="bg-[#4A0404] text-white px-4 shadow-md relative z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* মোবাইল মেনু বাটন */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-slate-300 focus:outline-none"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* লোগো */}
          <Link href="/" className="flex items-center">
            <Image
              src="/anwartv-logo.jpg"
              alt="Anwar TV Logo"
              width={140}
              height={50}
              className="object-contain drop-shadow-md w-20"
              priority
            />
          </Link>

          {/* সার্চ ও ইউজার অ্যাকশন কন্ট্রোল */}
          <div className="flex items-center space-x-4">
            {/* সার্চ আইকন */}
            <button className="p-2 hover:bg-black/20 rounded-full transition-colors">
              <Search className="h-5 w-5 text-white" />
            </button>

            {/* প্রোফাইল ড্রপডাউন (NextAuth সেশন ভিত্তিক) */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-black/30 transition-colors focus:outline-none"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{session.user?.name}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 text-slate-800 border border-slate-200 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500">
                      পদবি: {(session.user as any).role || "রাইটার"}
                    </div>
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2 text-slate-500" />
                      ড্যাশবোর্ড
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      লগআউট
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-[#cc0000] hover:bg-[#a30000] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow"
              >
                লগইন
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* লেয়ার ৩: ডাইনামিক নেভিগেশন বার (ডেস্কটপ এবং মোবাইল রেসপনসিভ) */}
      <nav className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        {/* ডেস্কটপ মেনু */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 justify-start items-center space-x-1 font-medium text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-3 hover:text-[#cc0000] hover:bg-slate-50 border-b-2 border-transparent hover:border-[#cc0000] transition-all text-base font-semibold"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* মোবাইল অ্যাকোর্ডিয়ন মেনু */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 py-2 px-4 space-y-1 shadow-inner">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2.5 rounded-md text-slate-700 hover:bg-slate-50 hover:text-[#cc0000] font-semibold transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
