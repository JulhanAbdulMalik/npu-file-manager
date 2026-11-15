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
  ZoomIn,
  ZoomOut,
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
  const [zoomLevel, setZoomLevel] = useState<number>(80); // Default 80% zoom
  const [folderView, setFolderView] = useState<"grid" | "list">("grid");
  const [activeSubFile, setActiveSubFile] = useState<{ id: string; name: string; linkDrive: string } | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset active subfile & zoom when drawer opens/closes or document changes
  useEffect(() => {
    setActiveSubFile(null);
    setZoomLevel(80);
  }, [dokumen?.id, isOpen]);

  // Kunci scroll halaman latar belakang saat drawer pratinjau aktif
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  if (!dokumen && !isOpen) return null;

  const isFolder = isDriveFolder(dokumen?.linkDrive);
  const fileId = dokumen?.driveFileId || extractDriveFileId(dokumen?.linkDrive);

  // Active file being viewed (either direct document or subfile selected inside folder)
  const isViewingSubFile = isFolder && activeSubFile !== null;
  const activeFileId = isViewingSubFile ? activeSubFile.id : fileId;
  const activeEmbedUrl = isViewingSubFile
    ? getDriveEmbedUrl(activeSubFile.id, activeSubFile.linkDrive)
    : fileId
    ? getDriveEmbedUrl(fileId, dokumen?.linkDrive, folderView)
    : null;
  const activeDownloadUrl = isViewingSubFile
    ? getDriveDirectDownloadUrl(activeSubFile.id, activeSubFile.linkDrive)
    : fileId
    ? getDriveDirectDownloadUrl(fileId, dokumen?.linkDrive)
    : dokumen?.linkDrive;
  const activeLinkDrive = isViewingSubFile
    ? activeSubFile.linkDrive
    : dokumen?.linkDrive || "";
  const activeDisplayName = isViewingSubFile
    ? activeSubFile.name
    : dokumen?.nama || "";

  function handleCopyLink() {
    if (!activeLinkDrive) return;
    navigator.clipboard.writeText(activeLinkDrive);
    setCopied(true);
    toast.success("Tautan Google Drive berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  }

  const statusConfig = dokumen
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
      }[dokumen.status]
    : null;

  return (
    <>
      {/* Backdrop Overlay with Smooth Fade */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ease-out ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Right Slide-over Panel with Smooth Physics Easing */}
      <aside
        aria-label="Panel Pratinjau Dokumen"
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] md:w-[560px] lg:w-[620px] xl:w-[680px] bg-white z-50 shadow-2xl border-l border-slate-200/90 flex flex-col transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
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
                {dokumen?.subKategori?.kategori && (
                  <span
                    className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide border truncate max-w-[150px]"
                    style={{
                      backgroundColor: `${dokumen.subKategori.kategori.warna || "#a80063"}15`,
                      color: dokumen.subKategori.kategori.warna || "#a80063",
                      borderColor: `${dokumen.subKategori.kategori.warna || "#a80063"}30`,
                    }}
                  >
                    {dokumen.subKategori.kategori.nama}
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

            {/* Action Controls: Zoom Controls & Close Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Zoom Controls (Active when previewing an individual file) */}
              {activeEmbedUrl && (
                <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] transition-colors"
                    title="Zoom Out (Perkecil Dokumen)"
                  >
                    <ZoomOut size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel(80)}
                    className="text-[10px] font-semibold text-slate-600 px-1 hover:text-[#a80063] select-none min-w-[32px] text-center"
                    title="Reset Zoom ke 80%"
                  >
                    {zoomLevel}%
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] transition-colors"
                    title="Zoom In (Perbesar Dokumen)"
                  >
                    <ZoomIn size={12} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
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
              initialFolderName={dokumen?.nama}
              onOpenFile={(subFile) => setActiveSubFile(subFile)}
              onClose={onClose}
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
                dokumen?.subKategori?.kategori ? (
                  <span
                    className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide border transition-colors"
                    style={{
                      backgroundColor: `${dokumen.subKategori.kategori.warna || "#a80063"}15`,
                      color: dokumen.subKategori.kategori.warna || "#a80063",
                      borderColor: `${dokumen.subKategori.kategori.warna || "#a80063"}30`,
                    }}
                  >
                    {dokumen.subKategori.kategori.nama}
                  </span>
                ) : null
              }
            />
          ) : activeEmbedUrl ? (
            <iframe
              src={activeEmbedUrl}
              className="w-full h-full border-0 bg-white"
              style={
                zoomLevel !== 100
                  ? { width: "100%", height: "100%", zoom: zoomLevel / 100 }
                  : { width: "100%", height: "100%" }
              }
              title={`Pratinjau ${activeDisplayName}`}
              allow="autoplay; fullscreen; clipboard-read; clipboard-write"
              loading="lazy"
            />
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

