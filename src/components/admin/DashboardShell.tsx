"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { NAV_CONFIG } from "@/infrastructure/config/nav.config";
import type { NavConfigItem } from "@/infrastructure/config/nav.config";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const role = session?.user?.role;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articleCount, setArticleCount] = useState<number | null>(null);

  // ১. সেশন না থাকলে সরাসরি লগইন পেজে পুশ
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let ignore = false;

    async function fetchArticleCount() {
      try {
        const res = await fetch("/api/articles?page=1&limit=1&status=all");
        const result = await res.json();

        if (!ignore && result.success) {
          setArticleCount(result.meta?.total ?? 0);
        }
      } catch (error) {
        console.error("Failed to load article count:", error);
      }
    }

    fetchArticleCount();

    return () => {
      ignore = true;
    };
  }, [status]);

  // ২. নিউজ পোর্টাল রোল-ভিত্তিক নেভিগেশন ফিল্টারিং
  const navItems = useMemo(() => {
    if (!role || !NAV_CONFIG[role]) return [];

    // আপনার nav.config থেকে সরাসরি কারেন্ট রোলের অ্যারে নিয়ে আসা
    const items = NAV_CONFIG[role];

    // কারেন্ট পাথের উপর ভিত্তি করে active স্টেট ম্যাপ করা
    return items.map((item: NavConfigItem) => ({
      ...item,
      badge:
        item.href === "/admin/articles" && articleCount !== null
          ? String(articleCount)
          : item.badge,
      active:
        item.href === "/admin/dashboard"
          ? pathname === "/admin/dashboard"
          : pathname?.startsWith(item.href),
    }));
  }, [role, pathname, articleCount]);

  // লোডিং স্টেটে ফুল স্ক্রিন ব্ল্যাংক বা আপনার কাস্টম স্পিনার দেখাতে পারেন
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        লোডিং হচ্ছে...
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <div className="min-h-screen">
        {/* মোবাইল ভিউর ওভারলে */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* সাইডবার (রোল ও থিম রেসপন্সিভ) */}
        <div
          className={`
            fixed z-50 inset-y-0 left-0 transform bg-card text-card-foreground border-r border-border transition-transform duration-300
            lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <Sidebar navItems={navItems} user={session.user} />
        </div>

        {/* কন্টেন্ট এরিয়া */}
        <div className="min-h-screen w-full lg:pl-64">
          {/* গ্লোবাল হেডার */}
          <div className="fixed inset-x-0 top-0 z-30 lg:left-64">
            <Header
              session={session}
              onMenuClick={() => setSidebarOpen(true)}
            />
          </div>

          {/* পেজের মূল চিলড্রেন ভিউ */}
          <main className="h-screen overflow-y-auto bg-background pt-16">
            <div className="mx-auto w-full space-y-6 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
