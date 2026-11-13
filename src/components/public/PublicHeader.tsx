"use client";
// src/components/public/PublicHeader.tsx
// Compact, Simple & Modern Topbar (Identik CDU Portal)

import Link from "next/link";
import {
  Search,
  Share2,
  Check,
  Calendar,
  Lock,
  LayoutDashboard,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PublicHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isLoggedIn?: boolean;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function PublicHeader({
  searchQuery,
  onSearchChange,
  isLoggedIn = false,
  onToggleSidebar,
  isSidebarCollapsed = false,
}: PublicHeaderProps) {
  const [copied, setCopied] = useState(false);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      toast.success("Tautan Portal Dokumen berhasil disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200/70 px-3 sm:px-4 md:px-5 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.015)] relative">
      {/* Top Accent Strip in #a80063 (Identik CDU Portal) */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#a80063]" />

      {/* Left: Sidebar Toggle + Quick Search Bar (Identik CDU Portal) */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-md">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] border border-slate-200/70 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          >
            <PanelLeft size={16} />
          </button>
        )}

        <div className="relative w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari dokumen, butir instrumen, SK, eviden... (Ctrl+K)"
            className="w-full pl-8 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-lg border border-slate-200/80 focus:border-[#a80063] focus:ring-1 focus:ring-[#a80063]/20 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Date Indicator, Share & User Profile / Admin Chip */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Date Indicator (CDU Portal Style) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] font-medium text-slate-600">
          <Calendar size={13} className="text-[#a80063]" />
          <span>{dateStr}</span>
        </div>

        {/* Share Button (Compact & Subtle) */}
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/70 bg-white hover:bg-[#fdf2f8] hover:border-[#fbcfe8] text-xs font-medium text-slate-700 transition-all cursor-pointer"
          title="Salin tautan portal publik"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-600" />
              <span className="hidden sm:inline text-emerald-600 font-semibold">Tersalin!</span>
            </>
          ) : (
            <>
              <Share2 size={13} className="text-slate-500" />
              <span className="hidden sm:inline">Bagikan</span>
            </>
          )}
        </button>

        {/* User Profile / Admin Access Chip (Identik CDU Portal Topbar Profile) */}
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-[#fdf2f8] hover:border-[#fbcfe8] transition-all cursor-pointer group"
            title="Buka Dashboard Admin"
          >
            <div className="w-6 h-6 rounded-md bg-[#a80063] text-white font-bold text-[11px] flex items-center justify-center shadow-xs shrink-0">
              <LayoutDashboard size={12} />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-none group-hover:text-[#a80063] transition-colors hidden sm:inline">
              Dashboard
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-[#fdf2f8] hover:border-[#fbcfe8] transition-all cursor-pointer group"
            title="Masuk ke Sistem"
          >
            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 group-hover:bg-[#a80063] group-hover:text-white font-bold text-[11px] flex items-center justify-center transition-colors shrink-0">
              <Lock size={12} />
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-none group-hover:text-[#a80063] transition-colors hidden sm:inline">
              Masuk
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
