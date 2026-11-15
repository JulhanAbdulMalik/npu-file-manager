"use client";
// src/components/public/PublicBanner.tsx
// Compact Greeting Card dengan Filter Status Dropdown Simpel & Rapi (Identik CDU Portal)

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Layers, ChevronDown, ChevronsUp, ChevronsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicBannerProps {
  activeCategoryName?: string;
  totalDocs?: number;
  stats?: {
    totalDokumen: number;
    lengkap: number;
    dalamProses: number;
    belum: number;
    persentaseLengkap: number;
  };
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
  isAllCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
}

export default function PublicBanner({
  activeCategoryName = "Semua Dokumen",
  totalDocs = 0,
  stats,
  selectedStatus = "ALL",
  onSelectStatus,
  isAllCollapsed = false,
  onToggleCollapseAll,
}: PublicBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusOptions = [
    { id: "ALL", label: "Semua Status", count: stats?.totalDokumen ?? 0 },
    { id: "LENGKAP", label: "Lengkap", count: stats?.lengkap ?? 0 },
    { id: "DALAM_PROSES", label: "Dalam Proses", count: stats?.dalamProses ?? 0 },
    { id: "BELUM", label: "Belum Lengkap", count: stats?.belum ?? 0 },
  ];

  const currentOption =
    statusOptions.find((opt) => opt.id === selectedStatus) || statusOptions[0];

  return (
    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      {/* Left: Clean Heading & Subtitle (Identik CDU Portal Greeting) */}
      <div>
        <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
          Evaluasi Lapangan Fakultas Kedokteran dan Ilmu Kesehatan
        </h1>
        <p className="text-[11.5px] sm:text-xs text-slate-500 font-normal mt-1">
          Universitas Nusa Putra &bull; Fokus tampilan:{" "}
          <span className="font-semibold text-[#a80063]">
            {activeCategoryName}
          </span>
        </p>
      </div>

      {/* Right: Dropdown Filter Status & Tombol Toggle Kategori (Seiras & Simpel) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-start sm:self-auto shrink-0 w-full sm:w-auto">
        {/* Tombol Toggle Buka / Tutup Semua Kategori (Seiras dengan Filter Status) */}
        {onToggleCollapseAll && (
          <button
            type="button"
            onClick={onToggleCollapseAll}
            className="h-8.5 sm:h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-[#fbcfe8] rounded-lg text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            title={isAllCollapsed ? "Buka semua kategori dokumen" : "Tutup semua kategori dokumen"}
          >
            {isAllCollapsed ? (
              <>
                <ChevronsDown size={14} className="text-[#a80063]" />
                <span>Buka</span>
              </>
            ) : (
              <>
                <ChevronsUp size={14} className="text-slate-400" />
                <span>Tutup</span>
              </>
            )}
          </button>
        )}

        {/* Dropdown Filter Status (Tanpa Icon, Rapi & Elegan) */}
        {onSelectStatus && stats && (
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8.5 sm:h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-[#fbcfe8] rounded-lg text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
              title="Filter status dokumen"
            >
              <span>
                {currentOption.label} ({currentOption.count})
              </span>
              <ChevronDown
                size={13}
                className={cn(
                  "text-slate-400 transition-transform duration-200",
                  isOpen && "rotate-180 text-[#a80063]"
                )}
              />
            </button>

            {/* Popup Menu */}
            {isOpen && (
              <div className="absolute top-full mt-1.5 left-0 sm:left-auto sm:right-0 w-52 bg-white rounded-xl border border-slate-200/90 shadow-xl p-1 z-50 animate-fade-in">
                {statusOptions.map((opt) => {
                  const isSelected = selectedStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSelectStatus(opt.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left min-h-[36px] sm:min-h-0",
                        isSelected
                          ? "bg-[#fdf2f8] text-[#a80063] font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      )}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded font-bold",
                          isSelected
                            ? "bg-[#a80063]/10 text-[#a80063]"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dokumen Terdaftar Pill */}
        <div className="inline-flex items-center gap-1.5 h-8.5 sm:h-8 px-2.5 rounded-lg bg-[#fdf2f8] border border-[#fbcfe8] text-[11px] font-semibold text-[#a80063] shrink-0">
          <Layers size={13} className="text-[#a80063]" />
          <span>{totalDocs} Terdaftar</span>
        </div>

        {/* Kesiapan Pill */}
        {stats && (
          <div className="inline-flex items-center gap-1.5 h-8.5 sm:h-8 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 shrink-0">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>{stats.persentaseLengkap}% Siap</span>
          </div>
        )}
      </div>
    </div>
  );
}
