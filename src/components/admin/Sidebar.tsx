"use client";

import Link from "next/link";
import { User } from "next-auth";
import type { NavConfigItem } from "@/infrastructure/config/nav.config";

interface NavItem extends NavConfigItem {
  active: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  user: User;
}

export default function Sidebar({ navItems, user }: SidebarProps) {
  const displayName = user?.name ?? "User";
  const displayRole = user?.role ?? "READER";

  // গ্রুপ অনুযায়ী মেনু আইটেমগুলোকে সাজানো
  const menuGroups = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const groupName = item.group || "প্রধান মেনু";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(item);
    return acc;
  }, {});

  return (
    <aside className="w-64 h-screen flex flex-col bg-card text-card-foreground">
      {/* লোগো ও ব্র্যান্ডিং */}
      <div className="flex items-center gap-3 p-5 border-b border-border h-16 shrink-0">
        <div className="w-8 h-8 rounded border border-primary flex items-center justify-center font-serif font-bold text-primary bg-primary/10">
          নিউজ
        </div>
        <div className="flex flex-col whitespace-nowrap">
          <span className="font-serif font-bold text-base tracking-wide">
            The Desk
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest -mt-0.5">
            Newsroom Engine
          </span>
        </div>
      </div>

      {/* নেভিগেশন লিংকসমূহ (স্ক্রোলযোগ্য) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {Object.keys(menuGroups).map((groupName) => (
          <div key={groupName} className="space-y-1">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase px-3 pb-1">
              {groupName}
            </p>
            {menuGroups[groupName].map((item: NavItem, idx: number) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative font-medium ${
                    item.active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                      item.active
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>

                  {/* নোটিফিকেশন/কাউন্ট ব্যাজ */}
                  {item.badge && (
                    <span
                      className={`ml-auto font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        item.active
                          ? "bg-primary-foreground text-primary"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ফুটার প্রোফাইল সেকশন */}
      <div className="p-3 border-t border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center font-serif text-sm uppercase">
            {displayName.substring(0, 2)}
          </div>
          <div className="flex flex-col whitespace-nowrap overflow-hidden">
            <span className="text-xs font-semibold text-left truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground text-left capitalize">
              {displayRole.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
