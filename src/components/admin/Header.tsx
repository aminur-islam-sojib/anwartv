"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, Menu, Search, LogOut } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  session: Session;
  onMenuClick: () => void;
}

export default function Header({ session, onMenuClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const displayName = session?.user?.name ?? "User";
  const displayRole = session?.user?.role ?? "READER";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-10">
      {/* বাম পাশ: মোবাইল মেনু বাটন এবং সার্চ বার */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        {/* মোবাইল ট্রিগার বাটন (ল্যাপটপ বা বড় স্ক্রিনে হাইড থাকবে) */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* গ্লোবাল নিউজরুম সার্চ ইঞ্জিন */}
        <div className="hidden sm:flex items-center gap-2 bg-muted border border-input focus-within:border-primary focus-within:bg-background rounded-lg px-3 py-1.5 w-full max-w-xs transition-all">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="সংবাদ বা রিপোর্টার খুঁজুন..."
            className="bg-transparent text-sm font-medium w-full outline-none text-foreground placeholder:text-muted-foreground"
          />
          <span className="text-[10px] text-muted-foreground border border-border bg-background px-1.5 py-0.5 rounded shadow-sm font-mono">
            ⌘K
          </span>
        </div>
      </div>

      {/* ডান পাশ: নোটিফিকেশন এবং ড্রপডাউন প্যানেল */}
      <div className="flex items-center gap-4">
        {/* নোটিফিকেশন সিস্টেম বেল */}
        <div className="relative p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full border border-background"></span>
        </div>

        <div className="h-6 w-[1px] bg-border"></div>

        {/* ইউজার অ্যাকশন ড্রপডাউন মেনু */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center font-serif text-xs uppercase">
              {displayName.substring(0, 2)}
            </div>
            <div className="flex flex-col text-left leading-tight hidden sm:flex">
              <span className="text-xs font-semibold text-foreground">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">
                {displayRole.toLowerCase()}
              </span>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* ড্রপডাউন পপওভার লিস্ট */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-20 animate-fadeIn">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  লগ আউট করুন
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
