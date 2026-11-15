"use client";

import { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  FileText,
  AlertCircle,
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

interface DocumentPreviewModalProps {
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
}

export default function DocumentPreviewModal({
  dokumen,
  onClose,
}: DocumentPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(80); // Default 80% zoom
  const [folderView, setFolderView] = useState<"grid" | "list">("grid");
  const [activeSubFile, setActiveSubFile] = useState<{ id: string; name: string; linkDrive: string } | null>(null);

  // Reset active subfile & zoom when document changes
  useEffect(() => {
    setActiveSubFile(null);
    setZoomLevel(80);
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
  const directDownloadUrl = isViewingSubFile
    ? getDriveDirectDownloadUrl(activeSubFile.id, activeSubFile.linkDrive)
    : fileId
    ? getDriveDirectDownloadUrl(fileId, dokumen.linkDrive)
    : dokumen.linkDrive;
  const activeLinkDrive = isViewingSubFile ? activeSubFile.linkDrive : dokumen.linkDrive;
  const activeDisplayName = isViewingSubFile ? activeSubFile.name : dokumen.nama;

  function handleCopyLink() {
    navigator.clipboard.writeText(activeLinkDrive || window.location.href);
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] max-h-[820px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Accent */}
        <div className="h-1 bg-[#a80063] w-full" />

        {/* Modal Header - Shown when viewing file directly */}
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
                title="Tutup (Esc)"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Body / Folder Explorer or Iframe Preview Area */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          {isFolder && !isViewingSubFile ? (
            <DriveFolderExplorer
              initialFolderId={fileId!}
              initialFolderName={dokumen.nama}
              onOpenFile={(subFile) => setActiveSubFile(subFile)}
              onClose={onClose}
              statusBadge={
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>
              }
              kategoriBadge={
                dokumen.subKategori?.kategori ? (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border"
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
          ) : (
            <div className="p-8 text-center max-w-md m-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                {isFolder ? <FolderOpen size={28} /> : <AlertCircle size={28} />}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {isFolder ? "Pratinjau Folder Google Drive" : "Pratinjau Dalam-Browser Tidak Tersedia"}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {isFolder
                  ? "Jika folder meminta verifikasi hak akses, silakan buka langsung di Google Drive."
                  : "Tautan dokumen ini tidak memiliki ID Google Drive langsung yang dapat disematkan. Anda dapat membukanya langsung di Google Drive."}
              </p>
              <a
                href={activeLinkDrive}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <ExternalLink size={14} />
                <span>{isFolder ? "Buka Folder di Google Drive" : "Buka di Google Drive"}</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-slate-400" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>

            {(!isFolder || isViewingSubFile) && (
              <a
                href={directDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                <Download size={13} className="text-slate-400" />
                <span>Unduh File</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activeLinkDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>{isFolder && !isViewingSubFile ? "Buka Folder di Drive" : "Buka di Google Drive"}</span>
            </a>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
