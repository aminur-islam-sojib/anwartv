import {
  LayoutDashboard,
  FileText,
  Clock,
  MessageSquare,
  Users,
  type LucideIcon,
  SquarePen,
  LayoutPanelLeft,
} from "lucide-react";
import { ROLES, type Role } from "@/constant/roles";

export interface NavConfigItem {
  label: string;
  icon: LucideIcon;
  href: string;
  group: string;
  badge?: string;
}

export const NAV_CONFIG = {
  [ROLES.ADMIN]: [
    {
      label: "ড্যাশবোর্ড",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      group: "ওভারভিউ",
    },
    {
      label: "সকল সংবাদ",
      icon: FileText,
      href: "/admin/articles",
      group: "কনটেন্ট",
    },
    {
      label: "ইউজার ও রোলস",
      icon: Users,
      href: "/admin/users",
      group: "সিস্টেম",
    },
    {
      label: "হোমপেজ কিউরেটর",
      icon: LayoutPanelLeft,
      href: "/admin/homepage-curator",
      group: "ওভারভিউ",
    },
    {
      label: "নতুন আর্টিকেল",
      icon: SquarePen,
      href: "/admin/new",
      group: "ওভারভিউ",
    },
  ],
  [ROLES.EDITOR]: [
    {
      label: "ড্যাশবোর্ড",
      icon: LayoutDashboard,
      href: "/editor",
      group: "ওভারভিউ",
    },
    {
      label: "রিভিউ পেন্ডিং",
      icon: Clock,
      href: "/admin/articles?status=in_review",
      group: "কনটেন্ট",
      badge: "5",
    },
    {
      label: "মতামত/কমেন্টস",
      icon: MessageSquare,
      href: "/admin/comments",
      group: "এনগেজমেন্ট",
    },
  ],
  [ROLES.WRITER]: [
    {
      label: "ড্যাশবোর্ড",
      icon: LayoutDashboard,
      href: "/write",
      group: "ওভারভিউ",
    },
    {
      label: "আমার সংবাদ",
      icon: FileText,
      href: "/admin/articles",
      group: "কনটেন্ট",
    },
  ],
  [ROLES.READER]: [
    {
      label: "প্রোফাইল",
      icon: Users,
      href: "/dashboard/profile",
      group: "ইউজার",
    },
  ],
} satisfies Record<Role, NavConfigItem[]>;
