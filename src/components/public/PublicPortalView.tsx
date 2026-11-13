"use client";
// src/components/public/PublicPortalView.tsx
// Document Grid ala UPI dengan 5 Kolom per Baris, Collapsible per Kategori, & Icon Dokumen Saja

import { useState, useMemo } from "react";
import {
  Layers,
  FolderOpen,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DokumenItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  linkDrive: string;
  driveFileId?: string | null;
  status: "LENGKAP" | "DALAM_PROSES" | "BELUM";
  urutan: number;
}

interface SubKategoriItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  urutan: number;
  dokumen: DokumenItem[];
}

interface KategoriItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  warna?: string | null;
  ikon?: string | null;
  urutan: number;
  subKategori: SubKategoriItem[];
}

interface PublicPortalViewProps {
  kategoris: KategoriItem[];
  selectedKategoriId: string;
  selectedSubId: string;
  selectedStatus: string;
  searchQuery: string;
  activeDocumentId?: string | null;
  isSplitView?: boolean;
  onSelectDocument: (doc: any) => void;
  onResetFilters: () => void;
  expandedKats?: Record<string, boolean>;
  onToggleExpandKat?: (id: string, e?: React.MouseEvent) => void;
}

export default function PublicPortalView({
  kategoris,
  selectedKategoriId,
  selectedSubId,
  selectedStatus,
  searchQuery,
  activeDocumentId,
  isSplitView = false,
  onSelectDocument,
  onResetFilters,
  expandedKats: propExpandedKats,
  onToggleExpandKat: propOnToggleExpandKat,
}: PublicPortalViewProps) {
  // Accordion state per Kategori di Halaman Utama (Default terbuka semua)
  const [localExpandedKats, setLocalExpandedKats] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    kategoris.forEach((k) => {
      initial[k.id] = true;
    });
    return initial;
  });

  const expandedKats = propExpandedKats ?? localExpandedKats;

  function toggleExpandKat(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (propOnToggleExpandKat) {
      propOnToggleExpandKat(id, e);
    } else {
      setLocalExpandedKats((prev) => ({
        ...prev,
        [id]: !(prev[id] ?? true),
      }));
    }
  }

  // Filter Categories, Subcategories, and Documents
  const filteredKategoris = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return kategoris
      .filter((k) => {
        if (selectedKategoriId !== "ALL" && k.id !== selectedKategoriId) {
          return false;
        }
        return true;
      })
      .map((k) => {
        const filteredSubs = k.subKategori
          .filter((sub) => {
            if (selectedSubId !== "ALL" && sub.id !== selectedSubId) {
              return false;
            }
            return true;
          })
          .map((sub) => {
            const filteredDocs = sub.dokumen.filter((doc) => {
              // Filter Status
              if (selectedStatus !== "ALL" && doc.status !== selectedStatus) {
                return false;
              }
              // Filter Search query
              if (q) {
                const matchName = doc.nama.toLowerCase().includes(q);
                const matchDesc = doc.deskripsi?.toLowerCase().includes(q) || false;
                const matchSub = sub.nama.toLowerCase().includes(q);
                const matchKat = k.nama.toLowerCase().includes(q);
                if (!matchName && !matchDesc && !matchSub && !matchKat) {
                  return false;
                }
              }
              return true;
            });

            return {
              ...sub,
              dokumen: filteredDocs,
            };
          })
          .filter((sub) => sub.dokumen.length > 0);

        return {
          ...k,
          subKategori: filteredSubs,
        };
      })
      .filter((k) => k.subKategori.length > 0);
  }, [kategoris, selectedKategoriId, selectedSubId, selectedStatus, searchQuery]);

  // Total visible documents
  const totalVisibleDocs = useMemo(() => {
    return filteredKategoris.reduce((acc, k) => {
      return (
        acc +
        k.subKategori.reduce((sAcc, sub) => sAcc + sub.dokumen.length, 0)
      );
    }, 0);
  }, [filteredKategoris]);

  function getStatusStyle(status: "LENGKAP" | "DALAM_PROSES" | "BELUM") {
    switch (status) {
      case "LENGKAP":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          label: "Lengkap",
          icon: CheckCircle2,
        };
      case "DALAM_PROSES":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          label: "Proses",
          icon: Clock,
        };
      case "BELUM":
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400",
          label: "Belum",
          icon: AlertCircle,
        };
    }
  }

  return (
    <div className="space-y-4">
      {/* Search status notification if active */}
      {searchQuery && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#fdf2f8] border border-[#fbcfe8] rounded-xl text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-[#a80063]" />
            <span>
              Menampilkan hasil pencarian untuk &quot;<span className="font-bold text-[#a80063]">{searchQuery}</span>&quot; ({totalVisibleDocs} dokumen)
            </span>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-[#a80063] hover:underline cursor-pointer"
          >
            Hapus Pencarian
          </button>
        </div>
      )}

      {/* ── EMPTY STATE ─────────────────────────────────────────────────── */}
      {filteredKategoris.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-2xl bg-[#fdf2f8] text-[#a80063] flex items-center justify-center mx-auto mb-3">
            <FolderOpen size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Tidak Ada Dokumen yang Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Tidak ada dokumen yang sesuai dengan kategori atau filter status yang dipilih saat ini.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 bg-[#a80063] text-white text-xs font-semibold rounded-xl hover:bg-[#8c0052] transition-colors cursor-pointer"
          >
            Tampilkan Semua Dokumen
          </button>
        </div>
      )}

      {/* ── KATEGORI BOXES (COLLAPSIBLE PER KATEGORI ALA /kategori) ─────── */}
      <div className="space-y-4">
        {filteredKategoris.map((kategori) => {
          const kategoriColor = kategori.warna || "#a80063";
          const isExpanded = expandedKats[kategori.id] ?? true;
          const catDocCount = kategori.subKategori.reduce(
            (acc, s) => acc + s.dokumen.length,
            0
          );

          return (
            <div
              key={kategori.id}
              className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-all"
            >
              {/* Category Header with Toggle Click (Sama Persis Halaman /kategori) */}
              <div
                onClick={() => toggleExpandKat(kategori.id)}
                className="px-4 sm:px-5 py-3 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors hover:bg-slate-50/60"
                style={{
                  backgroundColor: `${kategoriColor}08`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  {/* Chevron Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleExpandKat(kategori.id, e)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
                    title={isExpanded ? "Sembunyikan Sub Kategori" : "Tampilkan Sub Kategori"}
                  >
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-200 ease-out transform ${
                        isExpanded ? "rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>

                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs font-bold text-xs"
                    style={{ backgroundColor: kategoriColor }}
                  >
                    <Layers size={14} />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                      {kategori.nama}
                    </h2>
                    {kategori.deskripsi && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {kategori.deskripsi}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${kategoriColor}15`,
                    color: kategoriColor,
                    borderColor: `${kategoriColor}30`,
                  }}
                >
                  {catDocCount} Dokumen
                </span>
              </div>

              {/* Sub-Kategori Sections with Smooth Accordion */}
              <div
                className={`accordion-wrapper ${
                  isExpanded ? "accordion-wrapper-open" : "accordion-wrapper-closed"
                }`}
              >
                <div className="accordion-inner">
                  <div className="p-3 sm:p-4 md:p-5 space-y-4">
                    {kategori.subKategori.map((sub, subIdx) => (
                      <div key={sub.id} className="space-y-2.5">
                        {/* Sub-kategori heading with clean numbering 1, 2, 3 without bullet dot */}
                        <div className="flex items-center gap-1.5 border-b border-slate-100/90 pb-1.5">
                          <span className="text-xs font-bold text-[#a80063]">
                            {subIdx + 1}.
                          </span>
                          <h3 className="text-xs font-bold text-slate-800">
                            {sub.nama.replace(/^\d+[\.\s\-]+\s*/, "")}
                          </h3>
                          {sub.deskripsi && (
                            <span className="text-[10.5px] text-slate-400 hidden sm:inline">
                              -{sub.deskripsi}
                            </span>
                          )}
                          <span className="ml-auto text-[10.5px] font-semibold text-slate-400">
                            {sub.dokumen.length} Dokumen
                          </span>
                        </div>

                        {/* Grid Document Cards: 5 Kolom per Baris */}
                        <div
                          className={`grid gap-2 sm:gap-2.5 transition-all duration-300 ${
                            isSplitView
                              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
                              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                          }`}
                        >
                          {sub.dokumen.map((doc, docIdx) => {
                            const statusStyle = getStatusStyle(doc.status);
                            const isCurrentActive = activeDocumentId === doc.id;

                            return (
                              <div
                                key={doc.id}
                                onClick={() =>
                                  onSelectDocument({
                                    ...doc,
                                    subKategori: {
                                      nama: sub.nama,
                                      kategori: {
                                        nama: kategori.nama,
                                        warna: kategoriColor,
                                      },
                                    },
                                  })
                                }
                                className={`group p-2.5 sm:p-3 rounded-xl border bg-white cursor-pointer flex flex-col justify-between relative transition-all duration-150 ${
                                  isCurrentActive
                                    ? "border-[#a80063] bg-[#fdf2f8]/40 ring-1 ring-[#a80063]/30 shadow-xs"
                                    : "border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.02)] hover:border-[#fbcfe8] hover:bg-[#fdf2f8]/20 hover:shadow-[0_4px_14px_-2px_rgba(168,0,99,0.05)]"
                                }`}
                              >
                                {/* Top row: Number & Status Badge */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {doc.urutan || docIdx + 1}
                                  </span>

                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${statusStyle.bg}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                                    />
                                    <span>{statusStyle.label}</span>
                                  </span>
                                </div>

                                {/* Document Title */}
                                <h4
                                  className={`text-xs font-semibold leading-snug line-clamp-2 mb-2 transition-colors ${
                                    isCurrentActive
                                      ? "text-[#a80063]"
                                      : "text-slate-800 group-hover:text-[#a80063]"
                                  }`}
                                  title={doc.nama}
                                >
                                  {doc.nama}
                                </h4>

                                {/* Footer hint: Icon Dokumen Saja (Tanpa tulisan 'Pratinjau' & Tanpa Icon Mata) */}
                                <div className="pt-1.5 border-t border-slate-100/90 flex items-center justify-between text-[10px] text-slate-400 gap-1">
                                  <span className="truncate flex-1 text-[9.5px] pr-1">
                                    {doc.deskripsi || "Berkas Dokumen"}
                                  </span>
                                  <span
                                    title="Buka Dokumen"
                                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all ${
                                      isCurrentActive
                                        ? "bg-[#a80063] text-white shadow-xs"
                                        : "bg-slate-100 text-slate-500 group-hover:bg-[#fdf2f8] group-hover:text-[#a80063] group-hover:border group-hover:border-[#fbcfe8]"
                                    }`}
                                  >
                                    <FileText size={12} strokeWidth={2.2} />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
