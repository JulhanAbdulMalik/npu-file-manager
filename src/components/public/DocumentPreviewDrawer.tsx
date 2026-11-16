"use client";

import { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Share2,
  FolderOpen,
  LayoutGrid,
  List,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDriveEmbedUrl,
  getDriveDirectDownloadUrl,
  isDriveFolder,
  extractDriveFileId,
} from "@/lib/drive";
import DriveFolderExplorer from "./DriveFolderExplorer";

interface DocumentPreviewDrawerProps {
  dokumen: {
    id: string;
    nama: string;
    deskripsi?: string | null;
    linkDrive: string;
    driveFileId?: string | null;
    status: "LENGKAP" | "DALAM_PROSES" | "BELUM";
    subKategori?: {
      nama: string;
      kategori?: {
        nama: string;
        warna?: string | null;
      };
    };
    kategori?: {
      nama: string;
      warna?: string | null;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentPreviewDrawer({
  dokumen,
  isOpen,
  onClose,
}: DocumentPreviewDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Toggle setengah layar vs maksimal layar
  const [folderView, setFolderView] = useState<"grid" | "list">("grid");
  const [activeSubFile, setActiveSubFile] = useState<{ id: string; name: string; linkDrive: string } | null>(null);

  // Smooth entrance & exit animation states
  const [activeDoc, setActiveDoc] = useState(dokumen);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [animateOpen, setAnimateOpen] = useState(false);
  const [isFullyOpen, setIsFullyOpen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Synchronize smooth transitions with isOpen & dokumen props
  useEffect(() => {
    if (isOpen && dokumen) {
      setActiveDoc(dokumen);
      setIsMounted(true);
      const timer = setTimeout(() => {
        setAnimateOpen(true);
      }, 25);
      const openTimer = setTimeout(() => {
        setIsFullyOpen(true);
      }, 380);
      return () => {
        clearTimeout(timer);
        clearTimeout(openTimer);
      };
    } else {
      setIsFullyOpen(false);
      setAnimateOpen(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setActiveDoc(null);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, dokumen]);

  // Smooth close action (triggers slide-out before unmounting)
  function handleClose() {
    setIsFullyOpen(false);
    setAnimateOpen(false);
    setTimeout(() => {
      onClose();
    }, 320);
  }

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Reset active subfile & expanded when drawer opens or document changes
  useEffect(() => {
    setActiveSubFile(null);
    setIsExpanded(false);
  }, [dokumen?.id, isOpen]);

  // Kunci scroll halaman latar belakang saat drawer pratinjau aktif
  useEffect(() => {
    if (isMounted) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isMounted]);

  const currentDoc = activeDoc || dokumen;
  const isFolder = currentDoc ? isDriveFolder(currentDoc.linkDrive) : false;
  const fileId = currentDoc
    ? currentDoc.driveFileId || extractDriveFileId(currentDoc.linkDrive)
    : null;

  // Active file being viewed (either direct document or subfile selected inside folder)
  const isViewingSubFile = isFolder && activeSubFile !== null;
  const activeFileId = isViewingSubFile ? activeSubFile.id : fileId;
  const activeEmbedUrl = currentDoc
    ? isViewingSubFile
      ? getDriveEmbedUrl(activeSubFile.id, activeSubFile.linkDrive)
      : fileId
      ? getDriveEmbedUrl(fileId, currentDoc.linkDrive, folderView)
      : null
    : null;
  const activeDownloadUrl = currentDoc
    ? isViewingSubFile
      ? getDriveDirectDownloadUrl(activeSubFile.id, activeSubFile.linkDrive)
      : fileId
      ? getDriveDirectDownloadUrl(fileId, currentDoc.linkDrive)
      : currentDoc.linkDrive
    : "";
  const activeLinkDrive = currentDoc
    ? isViewingSubFile
      ? activeSubFile.linkDrive
      : currentDoc.linkDrive || ""
    : "";
  const activeDisplayName = currentDoc
    ? isViewingSubFile
      ? activeSubFile.name
      : currentDoc.nama || ""
    : "";

  // Reset loading state when the active file/embed URL changes (Hook dipanggil tanpa conditional)
  useEffect(() => {
    if (activeEmbedUrl) {
      setIsIframeLoading(true);
    }
  }, [activeEmbedUrl]);

  // Early returns diletakkan SETELAH semua Hooks terpanggil (Rules of Hooks compliant)
  if (!isMounted && !isOpen) return null;
  if (!currentDoc) return null;

  function handleCopyLink() {
    if (!activeLinkDrive) return;
    navigator.clipboard.writeText(activeLinkDrive);
    setCopied(true);
    toast.success("Tautan Google Drive berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  }

  const statusConfig = currentDoc
    ? {
        LENGKAP: {
          label: "Lengkap",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
        },
        DALAM_PROSES: {
          label: "Dalam Proses",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
        },
        BELUM: {
          label: "Belum Lengkap",
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400",
        },
      }[currentDoc.status]
    : null;

  return (
    <>
      {/* Backdrop Overlay with Smooth Fade */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ease-in-out ${
          animateOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Right Slide-over Panel with Smooth Physics Easing */}
      <aside
        aria-label="Panel Pratinjau Dokumen"
        style={isFullyOpen ? { transform: "none" } : undefined}
        className={`fixed top-0 right-0 h-full w-full sm:w-[560px] md:w-[680px] ${
          isExpanded
            ? "lg:w-[85vw] xl:w-[85vw] 2xl:w-[85vw]"
            : "lg:w-1/2 xl:w-1/2 2xl:w-1/2"
        } bg-white z-50 shadow-2xl border-l border-slate-200/90 flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          animateOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Top Accent Stripe */}
        <div className="h-1 bg-[#a80063] w-full shrink-0" />

        {/* Drawer Header - Shown when viewing file directly */}
        {(!isFolder || isViewingSubFile) && (
          <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            {/* Back to Folder Button (Icon Only di paling kiri) */}
            {isViewingSubFile && (
              <button
                type="button"
                onClick={() => setActiveSubFile(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#a80063] bg-[#fdf2f8] hover:bg-[#fce7f3] border border-[#fbcfe8] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                title={`Kembali ke folder ${dokumen?.nama}`}
                aria-label="Kembali ke folder"
              >
                <ArrowLeft size={15} />
              </button>
            )}

            <div className="min-w-0 flex-1">
              {/* Title & Origin Folder inline */}
              <div className="flex items-center gap-1.5 min-w-0">
                <h2
                  className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug truncate"
                  title={activeDisplayName}
                >
                  {activeDisplayName}
                </h2>
                {isViewingSubFile && (
                  <span className="text-[10px] text-[#a80063] font-semibold shrink-0 bg-[#fdf2f8] border border-[#fbcfe8] px-1.5 py-0.2 rounded truncate max-w-[160px]">
                    {dokumen?.nama}
                  </span>
                )}
              </div>

              {/* Badges metadata row */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {(dokumen?.subKategori?.kategori || dokumen?.kategori) && (
                  <span
                    className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide border truncate max-w-[150px]"
                    style={{
                      backgroundColor: `${(dokumen.subKategori?.kategori?.warna || dokumen.kategori?.warna) || "#a80063"}15`,
                      color: (dokumen.subKategori?.kategori?.warna || dokumen.kategori?.warna) || "#a80063",
                      borderColor: `${(dokumen.subKategori?.kategori?.warna || dokumen.kategori?.warna) || "#a80063"}30`,
                    }}
                  >
                    {dokumen.subKategori?.kategori?.nama || dokumen.kategori?.nama}
                  </span>
                )}

                {statusConfig && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${statusConfig.bg}`}
                  >
                    <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </span>
                )}
              </div>
            </div>

            {/* Action Controls: Maximize & Close Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="hidden lg:flex w-8 h-8 sm:w-7 sm:h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/70 items-center justify-center transition-all cursor-pointer"
                title={isExpanded ? "Kembalikan ke Ukuran Setengah Layar" : "Perlebar ke Maksimal (85% Layar)"}
                aria-label={isExpanded ? "Ukuran Setengah Layar" : "Perlebar Layar"}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center transition-all cursor-pointer"
                title="Tutup Panel Pratinjau (Esc)"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body - Folder Explorer or Iframe Preview */}
        <div
          key={`${activeFileId || "empty"}`}
          className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col animate-fade-in"
        >
          {isFolder && !isViewingSubFile ? (
            <DriveFolderExplorer
              initialFolderId={fileId!}
              initialFolderName={currentDoc.nama}
              onOpenFile={(subFile) => setActiveSubFile(subFile)}
              onClose={handleClose}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded((prev) => !prev)}
              statusBadge={
                statusConfig ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-semibold border transition-colors ${statusConfig.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    {statusConfig.label}
                  </span>
                ) : null
              }
              kategoriBadge={
                (currentDoc.subKategori?.kategori || currentDoc.kategori) ? (
                  <span
                    className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide border transition-colors"
                    style={{
                      backgroundColor: `${(currentDoc.subKategori?.kategori?.warna || currentDoc.kategori?.warna) || "#a80063"}15`,
                      color: (currentDoc.subKategori?.kategori?.warna || currentDoc.kategori?.warna) || "#a80063",
                      borderColor: `${(currentDoc.subKategori?.kategori?.warna || currentDoc.kategori?.warna) || "#a80063"}30`,
                    }}
                  >
                    {currentDoc.subKategori?.kategori?.nama || currentDoc.kategori?.nama}
                  </span>
                ) : null
              }
            />
          ) : activeEmbedUrl ? (
            <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-100 select-none">
              {/* Clean & Minimalist Loading State */}
              {isIframeLoading && (
                <div className="absolute inset-0 z-20 bg-slate-50/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 select-none pointer-events-none animate-fade-in">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-[#a80063] animate-spin" />
                  <p className="text-xs font-semibold text-slate-600 tracking-wide">
                    Memuat dokumen...
                  </p>
                </div>
              )}

              <iframe
                src={activeEmbedUrl}
                className="w-full h-full border-0 bg-white block"
                title={`Pratinjau ${activeDisplayName}`}
                allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                loading="lazy"
                onLoad={() => setIsIframeLoading(false)}
              />
            </div>
          ) : dokumen ? (
            <div className="p-8 text-center max-w-sm m-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Pratinjau Dalam-Browser Terbatas
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Tautan dokumen ini memerlukan akses langsung ke Google Drive.
              </p>
              <a
                href={activeLinkDrive}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <ExternalLink size={13} />
                <span>Buka di Google Drive</span>
              </a>
            </div>
          ) : null}
        </div>

        {/* Drawer Footer Actions */}
        {dokumen && (
          <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-slate-400" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>

              {(!isFolder || isViewingSubFile) && activeDownloadUrl && (
                <a
                  href={activeDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Download size={13} className="text-slate-400" />
                  <span>Unduh</span>
                </a>
              )}
            </div>

            <a
              href={activeLinkDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-bold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer"
              title="Buka langsung di Google Drive"
            >
              <ExternalLink size={13} />
              <span>{isFolder && !isViewingSubFile ? "Buka Folder di Drive" : "Buka di Tab Baru"}</span>
            </a>
          </div>
        )}
      </aside>
    </>
  );
}

