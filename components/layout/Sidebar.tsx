// components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Briefcase, Calendar, Users,
  Sparkles, LogOut, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/applications",label: "Applications", icon: Briefcase       },
  { href: "/interviews",  label: "Interviews",   icon: Calendar        },
  { href: "/contacts",    label: "Contacts",     icon: Users           },
  { href: "/stats",       label: "Analytics",    icon: TrendingUp      },
  { href: "/ai",          label: "AI Assistant", icon: Sparkles        },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const initials = (session?.user?.name ?? "J").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-neutral-200 bg-white md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-neutral-100">
        <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-neutral-900">JobFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn("nav-link", pathname.startsWith(href) && "active")}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-neutral-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{session?.user?.name}</p>
            <p className="text-xs text-neutral-400 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-link w-full text-neutral-400 hover:text-red-500"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
