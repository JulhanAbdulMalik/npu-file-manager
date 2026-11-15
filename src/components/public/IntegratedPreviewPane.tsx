"use client";
// src/components/public/IntegratedPreviewPane.tsx
// Tab 3: Integrated Document Preview Pane (Identik CDU Portal Styling & Antigravity Multi-Pane)

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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FolderOpen,
  LayoutGrid,
  List,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDriveEmbedUrl,
  getDriveDirectDownloadUrl,
  isDriveFolder,
  extractDriveFileId,
} from "@/lib/drive";
import { cn } from "@/lib/utils";
import DriveFolderExplorer from "./DriveFolderExplorer";

interface IntegratedPreviewPaneProps {
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
  onClose: () => void;
  isClosing?: boolean;
  isMobileModal?: boolean;
}

export default function IntegratedPreviewPane({
  dokumen,
  onClose,
  isClosing = false,
  isMobileModal = false,
}: IntegratedPreviewPaneProps) {
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(80); // Default 80% zoom agar tampilan dokumen luas & pas
  const [folderView, setFolderView] = useState<"grid" | "list">("grid");
  const [activeSubFile, setActiveSubFile] = useState<{ id: string; name: string; linkDrive: string } | null>(null);

  // Reset iframe error & active subfile when switching documents
  useEffect(() => {
    setIframeError(false);
    setActiveSubFile(null);
  }, [dokumen?.id]);

  if (!dokumen) return null;

  const isFolder = isDriveFolder(dokumen.linkDrive);
  const fileId = dokumen.driveFileId || extractDriveFileId(dokumen.linkDrive);

  // Active file being viewed (either direct document or subfile selected inside folder)
  const isViewingSubFile = isFolder && activeSubFile !== null;
  const activeFileId = isViewingSubFile ? activeSubFile.id : fileId;
  const activeEmbedUrl = isViewingSubFile
    ? getDriveEmbedUrl(activeSubFile.id, activeSubFile.linkDrive)
    : fileId
    ? getDriveEmbedUrl(fileId, dokumen.linkDrive, folderView)
    : null;
  const activeDownloadUrl = isViewingSubFile
    ? getDriveDirectDownloadUrl(activeSubFile.id, activeSubFile.linkDrive)
    : fileId
    ? getDriveDirectDownloadUrl(fileId, dokumen.linkDrive)
    : dokumen.linkDrive;
  const activeLinkDrive = isViewingSubFile ? activeSubFile.linkDrive : dokumen.linkDrive;
  const activeDisplayName = isViewingSubFile ? activeSubFile.name : dokumen.nama;

  function handleCopyLink() {
    if (!dokumen) return;
    navigator.clipboard.writeText(activeLinkDrive);
    setCopied(true);
    toast.success("Tautan Google Drive berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  }

  const statusConfig = {
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
  }[dokumen.status];

  return (
    <aside
      id="integrated-preview-pane"
      aria-label="Tab Pratinjau Dokumen"
      className="w-full h-full shrink-0 bg-white border border-slate-200/70 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden"
    >
      {/* Top Accent Stripe in #a80063 */}
      <div className="h-[2px] bg-[#a80063] w-full shrink-0" />

      {/* Mobile Drawer Pill Handle */}
      {isMobileModal && (
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-1.5 shrink-0 sm:hidden" />
      )}

      {/* Pane Header (CDU Portal Header Style) - Shown when viewing file directly */}
      {(!isFolder || isViewingSubFile) && (
        <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          {/* Back to Folder Button (Icon Only di paling kiri) */}
          {isViewingSubFile && (
            <button
              type="button"
              onClick={() => setActiveSubFile(null)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#a80063] bg-[#fdf2f8] hover:bg-[#fce7f3] border border-[#fbcfe8] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
              title={`Kembali ke folder ${dokumen.nama}`}
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
                  {dokumen.nama}
                </span>
              )}
            </div>

            {/* Badges metadata row */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {dokumen.subKategori?.kategori && (
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

              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${statusConfig.bg}`}
              >
                <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
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
              title="Tutup Panel Pratinjau"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Pane Content */}
      <div
        className={cn(
          "flex-1 relative w-full h-full overflow-hidden flex flex-col",
          isFolder && !isViewingSubFile ? "bg-slate-50" : "bg-slate-900"
        )}
      >
        {isFolder && !isViewingSubFile ? (
          <DriveFolderExplorer
            initialFolderId={fileId!}
            initialFolderName={dokumen.nama}
            onOpenFile={(file) => setActiveSubFile(file)}
            onClose={onClose}
            statusBadge={
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-semibold border ${statusConfig.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            }
            kategoriBadge={
              dokumen.subKategori?.kategori ? (
                <span
                  className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide border truncate max-w-[140px]"
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
        ) : activeEmbedUrl && !iframeError ? (
          <iframe
            src={activeEmbedUrl}
            title={activeDisplayName}
            tabIndex={0}
            className="w-full h-full border-0 bg-white block flex-1 transition-all duration-150"
            style={
              zoomLevel !== 100
                ? {
                    width: "100%",
                    height: "100%",
                    zoom: zoomLevel / 100,
                  }
                : {
                    width: "100%",
                    height: "100%",
                  }
            }
            allow="autoplay; fullscreen; clipboard-read; clipboard-write"
            onError={() => setIframeError(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#fdf2f8] text-[#a80063] flex items-center justify-center mb-3">
              {isFolder ? <FolderOpen size={24} /> : <FileText size={24} />}
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
              {isFolder ? "Pratinjau Folder Drive" : "Pratinjau Dalam Aplikasi"}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              {activeFileId
                ? "Jika dokumen atau folder meminta izin akses akun, silakan buka tautan langsung ke Google Drive."
                : "Tautan ini belum memiliki ID Google Drive yang valid."}
            </p>

            <a
              href={activeLinkDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#a80063] text-white text-xs font-semibold rounded-lg hover:bg-[#8c0052] transition-colors shadow-xs"
            >
              <ExternalLink size={13} />
              <span>{isFolder ? "Buka Folder di Google Drive" : "Buka Dokumen di Google Drive"}</span>
            </a>
          </div>
        )}
      </div>

      {/* Pane Footer Toolbar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-slate-200/70 bg-white flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-[#fdf2f8] hover:border-[#fbcfe8] text-xs font-semibold text-slate-700 transition-all cursor-pointer min-h-[36px]"
            title="Salin tautan Google Drive"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-600 font-semibold text-[11px] sm:text-xs">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={13} className="text-slate-400" />
                <span className="text-[11px] sm:text-xs">Salin Link</span>
              </>
            )}
          </button>

          {(!isFolder || isViewingSubFile) && (
            <a
              href={activeDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/70 bg-white hover:bg-[#fdf2f8] hover:border-[#fbcfe8] text-xs font-semibold text-slate-700 transition-all cursor-pointer min-h-[36px]"
              title="Unduh dokumen"
            >
              <Download size={13} className="text-slate-400" />
              <span className="text-[11px] sm:text-xs">Unduh</span>
            </a>
          )}
        </div>

        <a
          href={activeLinkDrive}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer min-h-[36px]"
          title={isFolder && !isViewingSubFile ? "Buka folder di tab Google Drive baru" : "Buka berkas di tab Google Drive baru"}
        >
          <ExternalLink size={13} />
          <span className="text-xs">
            {isFolder && !isViewingSubFile ? "Buka Folder di Drive" : "Buka di Drive"}
          </span>
        </a>
      </div>
    </aside>
  );
}
