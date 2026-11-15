"use client";
// src/components/layout/Header.tsx
// Compact & Refined Topbar with Plus Jakarta Sans & #a80063 Brand

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Calendar,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Shield,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  let roleLabel = "Administrator";
  let roleBadgeClass = "bg-[#fdf2f8] text-[#a80063] border-[#fbcfe8]";
  let roleSubtextColor = "text-[#a80063]";
  let RoleIcon = Shield;

  if (isSuperAdmin) {
    roleLabel = "Super Administrator";
    roleBadgeClass = "bg-[#fdf2f8] text-[#a80063] border-[#fbcfe8]";
    roleSubtextColor = "text-[#a80063]";
    RoleIcon = ShieldCheck;
  } else {
    roleLabel = "Administrator";
    roleBadgeClass = "bg-blue-50 text-blue-700 border-blue-200";
    roleSubtextColor = "text-blue-600";
    RoleIcon = Shield;
  }

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "NP";

  return (
    <header className="h-14 bg-white border-b border-slate-200/70 px-3 sm:px-4 md:px-5 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.015)]">
      {/* Top Accent Strip in #a80063 */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#a80063]" />

      {/* Left: Sidebar Toggle + Quick Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] border border-slate-200/70 flex items-center justify-center transition-all cursor-pointer shrink-0 min-w-[36px]"
          title={isCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
        >
          <PanelLeft size={16} />
        </button>

        <div className="relative w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari di admin... (Ctrl+K)"
            className="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-lg border border-slate-200/80 focus:border-[#a80063] focus:ring-1 focus:ring-[#a80063]/20 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right: Date & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Date Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-medium text-slate-600">
          <Calendar size={13} className="text-[#a80063]" />
          <span>{dateStr}</span>
        </div>

        {/* User Profile Chip */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-lg border border-slate-200/70 bg-white hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-[#a80063] text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {session?.user?.name ?? "Administrator"}
              </p>
              <p className={cn("text-[10px] font-medium leading-none mt-1", roleSubtextColor)}>
                {roleLabel}
              </p>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {/* Profile Dropdown with Smooth Pop */}
          {showProfileMenu && (
            <div className="absolute top-10 right-0 w-56 bg-white rounded-xl border border-slate-200/90 shadow-xl p-1.5 z-50 animate-modal-pop origin-top-right transition-all">
              <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
                <p className="text-[10px] text-slate-400 font-medium">Masuk sebagai:</p>
                <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                  {session?.user?.email ?? "admin@nusaputra.ac.id"}
                </p>
                <div
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border",
                    roleBadgeClass
                  )}
                >
                  <RoleIcon size={10} />
                  <span>{roleLabel}</span>
                </div>
              </div>

              {/* Kelola Akun (Khusus Super Admin) */}
              {isSuperAdmin && (
                <Link
                  href="/akun"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-[#fdf2f8] hover:text-[#a80063] rounded-lg transition-all mb-0.5 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-[#a80063]" />
                  <span>Kelola Akun</span>
                </Link>
              )}

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
              >
                <LogOut size={14} />
                <span>Keluar Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
