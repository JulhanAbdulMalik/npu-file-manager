"use client";
// src/components/public/PublicSidebar.tsx
// Compact & Collapsible Fixed Sidebar with Hierarchical Numbering (1., 1.1., 1.1.1.) & #a80063 Identity

import { useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  ChevronRight,
  PanelLeftClose,
  Files,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  stripLeadingNumber,
  buildSubKategoriTree,
  SubKategoriTreeNode,
} from "@/lib/hierarchy";

interface KategoriItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  warna?: string | null;
  ikon?: string | null;
  urutan: number;
  dokumen?: any[];
  subKategori: any[];
  subKategoriTree?: SubKategoriTreeNode[];
}

interface PublicSidebarProps {
  kategoris: KategoriItem[];
  selectedKategoriId: string;
  onSelectKategori: (id: string) => void;
  selectedSubId?: string;
  onSelectSub?: (id: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  stats: {
    totalDokumen: number;
    lengkap: number;
    dalamProses: number;
    belum: number;
    persentaseLengkap: number;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function PublicSidebar({
  kategoris,
  selectedKategoriId,
  onSelectKategori,
  selectedSubId,
  onSelectSub,
  selectedStatus,
  onSelectStatus,
  stats,
  isCollapsed,
  onToggleCollapse,
}: PublicSidebarProps) {
  // Accordion state for expanded categories - Default terbuka diawal
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    kategoris.forEach((k) => {
      initial[k.id] = true;
    });
    return initial;
  });

  function toggleExpand(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setExpandedCats((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }

  // Helper untuk merender subkategori hierarki secara rekursif
  function renderSubTreeNodes(
    nodes: SubKategoriTreeNode[],
    kategoriId: string
  ) {
    return nodes.map((node) => {
      const isSubSelected = selectedKategoriId === kategoriId && selectedSubId === node.id;
      const paddingLeft = node.level === 1 ? "pl-2" : node.level === 2 ? "pl-4" : "pl-6";

      return (
        <div key={node.id} className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onSelectKategori(kategoriId);
              if (onSelectSub) onSelectSub(node.id);
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                onToggleCollapse();
              }
            }}
            className={cn(
              "w-full flex items-center justify-between py-1.5 sm:py-1 pr-2 rounded text-xs sm:text-[11px] transition-colors truncate text-left cursor-pointer min-h-[34px] sm:min-h-[28px]",
              paddingLeft,
              isSubSelected
                ? "text-[#a80063] font-semibold bg-[#fdf2f8]"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
            )}
            title={node.fullLabel}
          >
            <span className="truncate pr-1">
              <span className="font-bold text-[#a80063] mr-1">{node.code}</span>
              {node.cleanName}
            </span>
          </button>

          {/* Render Anak & Anak Lagi dari Sub Kategori */}
          {node.children && node.children.length > 0 && (
            <div className="border-l border-slate-200/70 ml-2 space-y-0.5">
              {renderSubTreeNodes(node.children, kategoriId)}
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 bottom-0 h-screen flex flex-col z-40 bg-white border-r border-slate-200/70 shadow-[1px_0_8px_rgba(0,0,0,0.015)] transition-all duration-300 ease-in-out select-none overflow-x-hidden overflow-y-hidden",
        isCollapsed
          ? "w-[68px] -translate-x-full md:translate-x-0"
          : "w-[250px] translate-x-0 max-md:shadow-2xl"
      )}
    >
      {/* ── Brand Header & Toggle (Identik CDU Portal) ─────────────────────────── */}
      <div
        className={cn(
          "h-14 flex items-center border-b border-slate-100/90 transition-all shrink-0 overflow-hidden",
          isCollapsed ? "px-3 justify-center" : "px-4 justify-between"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0"
          title="NPU FILE MANAGER - Nusa Putra University"
        >
          <div className="w-8 h-8 rounded-lg bg-[#a80063] flex items-center justify-center shadow-sm shadow-[#a80063]/20 shrink-0">
            <FolderOpen size={17} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                NPU <span className="text-[#a80063]">FILE</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                Nusa Putra University
              </p>
            </div>
          )}
        </Link>

        {/* Toggle Collapse Button in Full Mode */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg text-slate-400 hover:text-[#a80063] hover:bg-[#fdf2f8] flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Ciutkan Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* ── Scrollable Navigation Items ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-3.5 scrollbar-thin">
        {/* GROUP 1: KATEGORI */}
        <div className="space-y-1 overflow-hidden">
          {!isCollapsed ? (
            <p className="px-2.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-1 truncate">
              Kategori
            </p>
          ) : (
            <div className="h-px bg-slate-100 my-1.5 mx-1" />
          )}

          {/* Item: Semua Dokumen */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                onSelectKategori("ALL");
                if (onSelectSub) onSelectSub("ALL");
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  onToggleCollapse();
                }
              }}
              title="Semua Dokumen"
              className={cn(
                "w-full flex items-center rounded-lg text-xs transition-all duration-150 relative cursor-pointer overflow-hidden",
                isCollapsed
                  ? "w-10 h-10 mx-auto justify-center p-0 my-0.5"
                  : "gap-2.5 px-2.5 py-2.5 sm:py-2 min-h-[42px] sm:min-h-[36px]",
                selectedKategoriId === "ALL"
                  ? "bg-[#fdf2f8] text-[#a80063] font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              )}
            >
              {selectedKategoriId === "ALL" && !isCollapsed && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#a80063] rounded-r-full" />
              )}

              <Files
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  selectedKategoriId === "ALL" ? "text-[#a80063]" : "text-slate-400"
                )}
              />

              {!isCollapsed && (
                <span className="flex-1 text-left truncate">Dokumen Aplikasi SIAGA</span>
              )}
            </button>
          </div>

          {/* Dynamic Categories dengan Penomoran 1., 2., dst (Bukan Poin Butir) */}
          {kategoris.map((k, katIdx) => {
            const isSelected = selectedKategoriId === k.id;
            const isExpanded = expandedCats[k.id] ?? true;
            const katNumber = `${katIdx + 1}.`;
            const cleanKatName = stripLeadingNumber(k.nama);

            // SubKategori Tree
            const subTree =
              k.subKategoriTree ||
              buildSubKategoriTree(k.subKategori as any, katIdx + 1);

            return (
              <div key={k.id} className="relative overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onSelectKategori(k.id);
                    if (onSelectSub) onSelectSub("ALL");
                    setExpandedCats((prev) => ({ ...prev, [k.id]: !(prev[k.id] ?? true) }));
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      onToggleCollapse();
                    }
                  }}
                  title={`${katNumber} ${cleanKatName}`}
                  className={cn(
                    "w-full flex items-center rounded-lg text-xs transition-all duration-150 relative cursor-pointer overflow-hidden text-left",
                    isCollapsed
                      ? "w-10 h-10 mx-auto justify-center p-0 my-0.5"
                      : "gap-2 px-2.5 py-2.5 sm:py-2 min-h-[42px] sm:min-h-[36px]",
                    isSelected
                      ? "bg-[#fdf2f8] text-[#a80063] font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  )}
                >
                  {isSelected && !isCollapsed && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-[#a80063] rounded-r-full" />
                  )}

                  {/* Penomoran Angka 1. 2. 3. (Gantikan Poin Butir) */}
                  <span
                    className={cn(
                      "font-bold text-xs shrink-0 transition-colors tabular-nums min-w-[16px]",
                      isSelected ? "text-[#a80063]" : "text-slate-500"
                    )}
                  >
                    {katNumber}
                  </span>

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate" title={cleanKatName}>
                        {cleanKatName}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {subTree.length > 0 && (
                          <div
                            onClick={(e) => toggleExpand(k.id, e)}
                            className="p-1 sm:p-0.5 rounded-md hover:bg-slate-200/50 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                          >
                            <ChevronRight
                              size={14}
                              className={cn(
                                "text-slate-400 transition-transform duration-200",
                                isExpanded && "rotate-90 text-[#a80063]"
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </button>

                {/* Sub-Kategori Submenu (Full Mode only) with Hierarchical 1.1., 1.1.1. */}
                {!isCollapsed && subTree.length > 0 && (
                  <div
                    className={`accordion-wrapper ${
                      isExpanded ? "accordion-wrapper-open" : "accordion-wrapper-closed"
                    }`}
                  >
                    <div className="accordion-inner">
                      <div className="mt-0.5 ml-3 pl-2 border-l border-slate-200/80 space-y-0.5 py-1">
                        {renderSubTreeNodes(subTree, k.id)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Card: Kesiapan Dokumen (Identik CDU Portal Semester Card) ──── */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
          <div className="p-2.5 rounded-xl bg-[#fdf2f8] border border-[#fbcfe8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-bold text-[#a80063] uppercase tracking-wider">
                Kesiapan Berkas
              </span>
              <span className="text-xs font-bold text-[#a80063]">
                {stats.persentaseLengkap}%
              </span>
            </div>

            {/* Multi-segment progress bar ala CDU Portal */}
            <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${stats.totalDokumen ? (stats.lengkap / stats.totalDokumen) * 100 : 0}%`,
                }}
                title={`Lengkap: ${stats.lengkap}`}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{
                  width: `${stats.totalDokumen ? (stats.dalamProses / stats.totalDokumen) * 100 : 0}%`,
                }}
                title={`Dalam Proses: ${stats.dalamProses}`}
              />
              <div
                className="bg-slate-300 h-full transition-all duration-500"
                style={{
                  width: `${stats.totalDokumen ? (stats.belum / stats.totalDokumen) * 100 : 0}%`,
                }}
                title={`Belum: ${stats.belum}`}
              />
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-0.5">
              <span className="text-emerald-700 font-semibold">{stats.lengkap} Lengkap</span>
              <span className="text-amber-700 font-semibold">{stats.dalamProses} Proses</span>
              <span className="text-slate-500 font-semibold">{stats.belum} Belum</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-100 flex justify-center">
          <div
            className="w-8 h-8 rounded-lg bg-[#fdf2f8] border border-[#fbcfe8] text-[#a80063] flex items-center justify-center font-bold text-[10px]"
            title={`Kesiapan Dokumen: ${stats.persentaseLengkap}%`}
          >
            {stats.persentaseLengkap}%
          </div>
        </div>
      )}
    </aside>
  );
}
