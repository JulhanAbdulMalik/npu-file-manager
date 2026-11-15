"use client";
// src/components/public/PublicPortalView.tsx
// Document Grid dengan Penomoran Bertingkat (1., 1.1., 1.1.1.) & Dukungan Dokumen Langsung di Kategori

import React, { useState, useMemo } from "react";
import {
  Layers,
  FolderOpen,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  stripLeadingNumber,
  buildSubKategoriTree,
  SubKategoriTreeNode,
} from "@/lib/hierarchy";
import { isDriveFolder } from "@/lib/drive";

interface DokumenItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  linkDrive: string;
  driveFileId?: string | null;
  status: "LENGKAP" | "DALAM_PROSES" | "BELUM";
  urutan: number;
  kategoriId?: string;
  subKategoriId?: string | null;
}

interface KategoriItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  warna?: string | null;
  ikon?: string | null;
  urutan: number;
  dokumen?: DokumenItem[];
  subKategori: any[];
  subKategoriTree?: SubKategoriTreeNode[];
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
  // Accordion state per Kategori di Halaman Utama (Default terbuka semua diawal)
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
      .map((k, katIdx) => {
        // Gunakan nomor urut asli kategori dari daftar keseluruhan
        const origIdx = kategoris.findIndex((orig) => orig.id === k.id);
        const katIndex = origIdx !== -1 ? origIdx + 1 : (k as any).katIndex || katIdx + 1;
        const subTree =
          k.subKategoriTree ||
          buildSubKategoriTree(k.subKategori as any, katIndex);

        // Filter dokumen langsung di kategori
        const directDocs = (k.dokumen || []).filter((doc) => {
          if (selectedSubId !== "ALL" && selectedSubId !== "DIRECT") {
            return false;
          }
          if (selectedStatus !== "ALL" && doc.status !== selectedStatus) {
            return false;
          }
          if (q) {
            const matchName = doc.nama.toLowerCase().includes(q);
            const matchDesc = doc.deskripsi?.toLowerCase().includes(q) || false;
            const matchKat = k.nama.toLowerCase().includes(q);
            if (!matchName && !matchDesc && !matchKat) return false;
          }
          return true;
        });

        // Filter dokumen di sub-kategori (rekursif)
        function filterTree(nodes: SubKategoriTreeNode[]): SubKategoriTreeNode[] {
          return nodes
            .map((node) => {
              const isSelectedSub =
                selectedSubId === "ALL" || selectedSubId === node.id;

              const filteredDocs = isSelectedSub
                ? (node.dokumen || []).filter((doc) => {
                    if (selectedStatus !== "ALL" && doc.status !== selectedStatus) {
                      return false;
                    }
                    if (q) {
                      const matchName = doc.nama.toLowerCase().includes(q);
                      const matchDesc = doc.deskripsi?.toLowerCase().includes(q) || false;
                      const matchSub = node.nama.toLowerCase().includes(q);
                      const matchKat = k.nama.toLowerCase().includes(q);
                      if (!matchName && !matchDesc && !matchSub && !matchKat) return false;
                    }
                    return true;
                  })
                : [];

              const filteredChildren = filterTree(node.children || []);

              return {
                ...node,
                dokumen: filteredDocs,
                children: filteredChildren,
              };
            })
            .filter((node) => node.dokumen.length > 0 || (node.children && node.children.length > 0));
        }

        const filteredSubTree = filterTree(subTree);

        return {
          ...k,
          katIndex,
          cleanName: stripLeadingNumber(k.nama),
          directDocs,
          filteredSubTree,
        };
      })
      .filter((k) => {
        if (selectedKategoriId !== "ALL" && k.id !== selectedKategoriId) {
          return false;
        }
        return k.directDocs.length > 0 || k.filteredSubTree.length > 0;
      });
  }, [kategoris, selectedKategoriId, selectedSubId, selectedStatus, searchQuery]);

  // Total visible documents
  const totalVisibleDocs = useMemo(() => {
    function countNodeDocs(nodes: SubKategoriTreeNode[]): number {
      return nodes.reduce(
        (acc, n) => acc + (n.dokumen?.length || 0) + countNodeDocs(n.children || []),
        0
      );
    }

    return filteredKategoris.reduce((acc, k) => {
      return acc + k.directDocs.length + countNodeDocs(k.filteredSubTree);
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

  // Komponen untuk merender sekumpulan kartu dokumen dalam grid 2 kolom di mobile, 5 kolom di desktop
  function renderDocumentCards(docs: DokumenItem[]) {
    return (
      <div
        className={`grid gap-2 sm:gap-2.5 transition-all duration-300 ${
          isSplitView
            ? "grid-cols-2 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        }`}
      >
        {docs.map((doc, docIdx) => {
          const statusStyle = getStatusStyle(doc.status);
          const isCurrentActive = activeDocumentId === doc.id;

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className={cn(
                "group relative bg-white rounded-xl border p-2 sm:p-2.5 md:p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none active:scale-[0.99]",
                isCurrentActive
                  ? "border-[#a80063] ring-2 ring-[#a80063]/15 shadow-md bg-[#fdf2f8]/30"
                  : "border-slate-200/80 hover:border-[#a80063]/50 hover:shadow-md hover:translate-y-[-1px]"
              )}
            >
              {/* Header Card: Nomor & Status Badge */}
              <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
                <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md bg-slate-100 group-hover:bg-[#fdf2f8] group-hover:text-[#a80063] text-slate-500 text-[9.5px] sm:text-[10px] font-bold flex items-center justify-center transition-colors shrink-0">
                  {docIdx + 1}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9.5px] font-semibold border truncate shrink-0",
                    statusStyle.bg
                  )}
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusStyle.dot)}
                  />
                  <span>{statusStyle.label}</span>
                </span>
              </div>

              {/* Title & Deskripsi */}
              <div className="mb-2 min-w-0 flex-1">
                <h4
                  className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-[#a80063] line-clamp-2 leading-snug transition-colors"
                  title={doc.nama}
                >
                  {doc.nama}
                </h4>
                {doc.deskripsi && (
                  <p
                    className="text-[9.5px] sm:text-[10px] text-slate-400 line-clamp-1 mt-0.5 sm:mt-1 leading-normal"
                    title={doc.deskripsi}
                  >
                    {doc.deskripsi}
                  </p>
                )}
              </div>

              {/* Footer Card: Ikon Berkas & Status Preview + Direct Drive Link */}
              <div className="pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px] sm:text-[10px] text-slate-400 mt-auto">
                <span className="flex items-center gap-1 font-semibold text-[#a80063] sm:text-slate-400 sm:group-hover:text-[#a80063] transition-colors">
                  {isDriveFolder(doc.linkDrive) ? (
                    <>
                      <FolderOpen size={11} className="shrink-0 text-[#a80063]" />
                      <span className="text-[#a80063]">Folder</span>
                    </>
                  ) : (
                    <>
                      <FileText size={11} className="shrink-0" />
                      <span>Preview</span>
                    </>
                  )}
                </span>
                <a
                  href={doc.linkDrive}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-0.5 font-medium text-slate-500 hover:text-[#a80063] p-0.5 -m-0.5 rounded hover:bg-slate-50 transition-colors"
                  title={isDriveFolder(doc.linkDrive) ? "Buka folder di Google Drive" : "Buka langsung di Google Drive"}
                >
                  <ExternalLink size={10} className="shrink-0" />
                  <span>Drive</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Render rekursif SubKategori Nodes
  function renderSubCategoryNode(node: SubKategoriTreeNode) {
    const hasDocs = node.dokumen && node.dokumen.length > 0;
    const hasChildren = node.children && node.children.length > 0;

    if (!hasDocs && !hasChildren) return null;

    return (
      <div key={node.id} className="space-y-2.5">
        {/* Sub-kategori heading with hierarchical numbering 1.1., 1.1.1. */}
        <div className="flex items-center gap-1.5 border-b border-slate-100/90 pb-1.5">
          <span className="text-xs font-bold text-[#a80063]">
            {node.code}
          </span>
          <h3 className="text-xs font-bold text-slate-800">
            {node.cleanName}
          </h3>
          {node.deskripsi && (
            <span className="text-[10.5px] text-slate-400 hidden sm:inline">
              -{node.deskripsi}
            </span>
          )}
          <span className="ml-auto text-[10.5px] font-semibold text-slate-400">
            {node.dokumen.length} Dokumen
          </span>
        </div>

        {/* Grid Document Cards */}
        {hasDocs && renderDocumentCards(node.dokumen)}

        {/* Nested Children (Anak & Anak Lagi dari Sub Kategori) */}
        {hasChildren && (
          <div className="mt-3 pl-3 sm:pl-4 border-l-2 border-slate-200/80 space-y-4">
            {node.children.map((childNode) => renderSubCategoryNode(childNode))}
          </div>
        )}
      </div>
    );
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
          const katNumber = `${kategori.katIndex}.`;
          const catDocCount =
            kategori.directDocs.length +
            kategori.filteredSubTree.reduce(
              (acc, s) => acc + s.totalDocCount,
              0
            );

          return (
            <div
              key={kategori.id}
              className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-all"
            >
              {/* Category Header with Toggle Click (Penomoran 1., 2., 3.) */}
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
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span className="text-[#a80063] font-extrabold">{katNumber}</span>
                      <span>{kategori.cleanName}</span>
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
                  <div className="p-3 sm:p-4 md:p-5 space-y-5">
                    {/* 1. Bagian Dokumen Langsung di Kategori (Jika Ada) */}
                    {kategori.directDocs.length > 0 && (
                      <div className="space-y-2.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-1.5">
                          <span className="text-xs font-bold text-[#a80063]">
                            {katNumber}
                          </span>
                          <h3 className="text-xs font-bold text-slate-800">
                            Dokumen Utama Kategori
                          </h3>
                          <span className="ml-auto text-[10.5px] font-semibold text-slate-400">
                            {kategori.directDocs.length} Dokumen
                          </span>
                        </div>
                        {renderDocumentCards(kategori.directDocs)}
                      </div>
                    )}

                    {/* 2. Bagian Sub-Kategori & Anak-Anaknya */}
                    {kategori.filteredSubTree.map((subNode) =>
                      renderSubCategoryNode(subNode)
                    )}
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
