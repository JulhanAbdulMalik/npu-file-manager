"use client";

import { useState, useEffect } from "react";
import {
  FolderOpen,
  Folder,
  FileText,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  ExternalLink,
  Eye,
  AlertCircle,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { getDriveFolderContents, DriveFolderItem } from "@/actions/driveFolder";
import { cn } from "@/lib/utils";

interface DriveFolderExplorerProps {
  initialFolderId: string;
  initialFolderName?: string;
  onOpenFile: (file: { id: string; name: string; linkDrive: string }) => void;
  onClose?: () => void;
  statusBadge?: React.ReactNode;
  kategoriBadge?: React.ReactNode;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function DriveFolderExplorer({
  initialFolderId,
  initialFolderName = "Folder Google Drive",
  onOpenFile,
  onClose,
  statusBadge,
  kategoriBadge,
  className,
  isExpanded,
  onToggleExpand,
}: DriveFolderExplorerProps) {
  // Folder navigation history stack: [{ id, name }, ...]
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([
    { id: initialFolderId, name: initialFolderName },
  ]);

  const [items, setItems] = useState<DriveFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, boolean>>({});

  const currentFolder = folderHistory[folderHistory.length - 1];

  // Fetch folder contents when currentFolder changes
  useEffect(() => {
    let isCancelled = false;

    async function loadFolder() {
      setLoading(true);
      setError(null);

      try {
        const res = await getDriveFolderContents(currentFolder.id);
        if (isCancelled) return;

        if (res.success && res.items) {
          setItems(res.items);
          // If title found on root and initial name was generic, update it
          if (folderHistory.length === 1 && res.folderName && res.folderName !== "Google Drive") {
            setFolderHistory([{ id: currentFolder.id, name: res.folderName }]);
          }
        } else {
          setError(res.error || "Gagal memuat isi folder Google Drive.");
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Terjadi kesalahan saat memuat isi folder.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadFolder();

    return () => {
      isCancelled = true;
    };
  }, [currentFolder.id]);

  // Navigate deeper into subfolder
  function handleOpenFolder(folder: DriveFolderItem) {
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  // Go back to previous folder
  function handleGoBack() {
    if (folderHistory.length > 1) {
      setFolderHistory((prev) => prev.slice(0, prev.length - 1));
    }
  }

  // Jump to specific breadcrumb
  function handleJumpBreadcrumb(idx: number) {
    setFolderHistory((prev) => prev.slice(0, idx + 1));
  }

  function handleRefresh() {
    setLoading(true);
    getDriveFolderContents(currentFolder.id).then((res) => {
      if (res.success && res.items) setItems(res.items);
      setLoading(false);
    });
  }

  return (
    <div className={cn("flex flex-col h-full bg-slate-50 select-none overflow-hidden", className)}>
      {/* ── Top Header Row: Back Button, Breadcrumbs, View Switcher & Close (Sejajar) ── */}
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0">
        {/* Left: Back Button + Breadcrumbs + Badges */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
          {folderHistory.length > 1 && (
            <button
              type="button"
              onClick={handleGoBack}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-[#fdf2f8] hover:text-[#a80063] hover:border-[#fbcfe8] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Kembali ke folder sebelumnya"
              aria-label="Kembali ke folder sebelumnya"
            >
              <ArrowLeft size={14} />
            </button>
          )}

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1 text-xs font-bold text-slate-800 truncate">
            {folderHistory.map((f, idx) => {
              const isLast = idx === folderHistory.length - 1;
              return (
                <div key={f.id + idx} className="flex items-center gap-1 shrink-0">
                  {idx > 0 && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                  {isLast ? (
                    <span className="text-slate-900 font-extrabold flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[280px]">
                      <FolderOpen size={14} className="text-[#a80063] shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJumpBreadcrumb(idx)}
                      className="text-slate-500 hover:text-[#a80063] hover:underline cursor-pointer truncate max-w-[120px] font-semibold"
                      title={`Buka folder ${f.name}`}
                    >
                      {f.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional Badges (Kategori & Status) */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 shrink-0">
            {kategoriBadge}
            {statusBadge}
            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#fdf2f8] text-[#a80063] border border-[#fbcfe8]">
              {items.length} Item
            </span>
          </div>
        </div>

        {/* Right Tools: View Mode Switcher, Refresh & Close Preview (Sejajar) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1 sm:p-1.5 rounded text-xs transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-white text-[#a80063] shadow-2xs font-bold"
                  : "text-slate-400 hover:text-slate-700"
              )}
              title="Tampilan Kotak Kompak (Grid)"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1 sm:p-1.5 rounded text-xs transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-white text-[#a80063] shadow-2xs font-bold"
                  : "text-slate-400 hover:text-slate-700"
              )}
              title="Tampilan Daftar (List)"
            >
              <ListIcon size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-[#a80063] hover:bg-[#fdf2f8] border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
            title="Muat Ulang Folder"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="hidden lg:flex w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/80 items-center justify-center transition-all cursor-pointer"
              title={isExpanded ? "Kembalikan ke Ukuran Setengah Layar" : "Perlebar ke Maksimal (85% Layar)"}
              aria-label={isExpanded ? "Ukuran Setengah Layar" : "Perlebar Layar"}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer"
              title="Tutup Panel Pratinjau"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content Area: Files & Folders ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-100/60">
        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col items-center justify-center animate-pulse gap-2 h-28"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="w-3/4 h-2.5 rounded bg-slate-200" />
                <div className="w-1/2 h-2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Tidak Dapat Membuka Folder
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">
              {error}
            </p>
            <a
              href={`https://drive.google.com/drive/folders/${currentFolder.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#a80063] text-white text-xs font-semibold rounded-lg hover:bg-[#8c0052] transition-colors"
            >
              <ExternalLink size={13} />
              <span>Buka di Google Drive</span>
            </a>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <FolderOpen size={36} className="text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Folder ini kosong</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Belum ada berkas atau subfolder di dalamnya.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRID VIEW (COMPACT 5 COLUMNS) ────────────────────────────── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {items.map((item) => {
              const isFolder = item.type === "folder";

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isFolder) {
                      handleOpenFolder(item);
                    } else {
                      onOpenFile({ id: item.id, name: item.name, linkDrive: item.linkDrive });
                    }
                  }}
                  className={cn(
                    "group relative bg-white rounded-xl border p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-150 cursor-pointer hover:shadow-md hover:translate-y-[-1px]",
                    isFolder
                      ? "border-purple-200/90 hover:border-[#a80063] bg-gradient-to-b from-purple-50/20 to-white"
                      : "border-slate-200/80 hover:border-[#a80063]"
                  )}
                  title={item.name}
                >
                  {/* Top Thumbnail / Icon Area */}
                  <div className="w-full aspect-[4/3] rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-2 relative group-hover:bg-[#fdf2f8]/40 transition-colors">
                    {isFolder ? (
                      <div className="flex flex-col items-center justify-center gap-1 text-[#a80063]">
                        <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-[#a80063] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Folder size={22} className="fill-[#a80063]/20" />
                        </div>
                        <span className="text-[9px] font-bold text-[#a80063] tracking-wide uppercase">
                          Folder
                        </span>
                      </div>
                    ) : item.thumbnail && !failedThumbnails[item.id] ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                        loading="lazy"
                        onError={() => {
                          setFailedThumbnails((prev) => ({ ...prev, [item.id]: true }));
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText size={26} className="text-rose-500 mb-0.5" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          Dokumen
                        </span>
                      </div>
                    )}

                    {/* Hover Action Badge */}
                    <div className="absolute inset-0 bg-[#a80063]/85 text-white flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-[10.5px] font-bold shadow-xs">
                      {isFolder ? (
                        <>
                          <FolderOpen size={13} />
                          <span>Masuk</span>
                        </>
                      ) : (
                        <>
                          <Eye size={13} />
                          <span>Buka</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="min-w-0">
                    <h5
                      className={cn(
                        "text-[11px] font-semibold line-clamp-2 leading-snug group-hover:text-[#a80063] transition-colors",
                        isFolder ? "text-slate-900 font-bold" : "text-slate-800"
                      )}
                    >
                      {item.name}
                    </h5>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                      {/* <span>{item.lastModified || "Google Drive"}</span> */}

                      <span>Drive</span>

                      {isFolder ? (
                        <span className="font-bold text-[#a80063]">&rarr;</span>
                      ) : (
                        <span className="text-slate-400 font-medium">Pratinjau</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW (COMPACT TABLE ROWS) ────────────────────────────── */
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
            {items.map((item) => {
              const isFolder = item.type === "folder";

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isFolder) {
                      handleOpenFolder(item);
                    } else {
                      onOpenFile({ id: item.id, name: item.name, linkDrive: item.linkDrive });
                    }
                  }}
                  className={cn(
                    "px-3 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group",
                    isFolder ? "bg-purple-50/10" : ""
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isFolder
                          ? "bg-purple-100 text-[#a80063]"
                          : "bg-rose-50 text-rose-600"
                      )}
                    >
                      {isFolder ? (
                        <Folder size={14} className="fill-[#a80063]/20" />
                      ) : (
                        <FileText size={14} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs truncate group-hover:text-[#a80063] transition-colors leading-snug",
                          isFolder ? "font-bold text-slate-900" : "font-medium text-slate-800"
                        )}
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      {/* {item.lastModified && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Diperbarui: {item.lastModified}
                        </p>
                      )} */}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[9.5px] font-bold",
                        isFolder
                          ? "bg-purple-100/70 text-[#a80063]"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {isFolder ? "Folder" : "File"}
                    </span>

                    <button
                      type="button"
                      className="px-2 py-1 rounded-md text-[10.5px] font-semibold text-white bg-[#a80063] group-hover:bg-[#8c0052] transition-colors shadow-2xs"
                    >
                      {isFolder ? "Buka" : "Lihat"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
