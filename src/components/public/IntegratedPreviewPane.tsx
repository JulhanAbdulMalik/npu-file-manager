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
} from "lucide-react";
import { toast } from "sonner";
import { getDriveEmbedUrl, getDriveDirectDownloadUrl } from "@/lib/drive";
import { cn } from "@/lib/utils";

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
}

export default function IntegratedPreviewPane({
  dokumen,
  onClose,
  isClosing = false,
}: IntegratedPreviewPaneProps) {
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(80); // Default 80% zoom out agar dokumen tidak langsung tampak terlalu besar

  // Reset iframe error when switching documents
  useEffect(() => {
    setIframeError(false);
  }, [dokumen?.id]);

  if (!dokumen) return null;

  const fileId = dokumen.driveFileId;
  const embedUrl = fileId ? getDriveEmbedUrl(fileId) : null;
  const directDownloadUrl = fileId
    ? getDriveDirectDownloadUrl(fileId)
    : dokumen.linkDrive;

  function handleCopyLink() {
    if (!dokumen) return;
    navigator.clipboard.writeText(dokumen.linkDrive);
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

      {/* Pane Header (CDU Portal Header Style) */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb Tags */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            {dokumen.subKategori?.kategori && (
              <span
                className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wide border truncate max-w-[200px]"
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
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-semibold border ${statusConfig.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>

          {/* Document Title */}
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
            {dokumen.nama}
          </h2>

          {dokumen.subKategori?.nama && (
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              Sub-Kategori: {dokumen.subKategori.nama}
            </p>
          )}
        </div>

        {/* Action Controls & Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom Controls */}
          {embedUrl && (
            <div className="flex items-center gap-0.5 bg-white border border-slate-200/80 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] transition-colors"
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
                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] transition-colors"
                title="Zoom In (Perbesar Dokumen)"
              >
                <ZoomIn size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-center transition-all cursor-pointer"
            title="Tutup Panel Pratinjau"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Pane Content: Google Drive Embed Iframe dengan Tampilan Penuh (Full Viewport) & Zoom 80% */}
      <div className="flex-1 bg-slate-900 relative w-full h-full overflow-hidden flex flex-col">
        {embedUrl && !iframeError ? (
          <iframe
            src={embedUrl}
            title={dokumen.nama}
            className="w-full h-full border-0 bg-white block flex-1 transition-all duration-150"
            style={{
              width: "100%",
              height: "100%",
              zoom: zoomLevel / 100,
            }}
            allow="autoplay"
            onError={() => setIframeError(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#fdf2f8] text-[#a80063] flex items-center justify-center mb-3">
              <FileText size={24} />
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Pratinjau Dalam Aplikasi
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              {fileId
                ? "Jika dokumen meminta izin akses atau format belum didukung pratinjau, silakan buka tautan langsung ke Google Drive."
                : "Dokumen ini belum memiliki ID file Google Drive yang valid."}
            </p>

            <a
              href={dokumen.linkDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#a80063] text-white text-xs font-semibold rounded-lg hover:bg-[#8c0052] transition-colors shadow-xs"
            >
              <ExternalLink size={13} />
              <span>Buka Dokumen di Google Drive</span>
            </a>
          </div>
        )}
      </div>

      {/* Pane Footer Toolbar */}
      <div className="px-3 sm:px-4 py-2.5 border-t border-slate-200/70 bg-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/70 bg-white hover:bg-[#fdf2f8] hover:border-[#fbcfe8] text-xs font-medium text-slate-700 transition-all cursor-pointer"
            title="Salin tautan Google Drive"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600 font-semibold text-[11px]">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={12} className="text-slate-400" />
                <span className="text-[11px]">Salin Link</span>
              </>
            )}
          </button>

          <a
            href={directDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/70 bg-white hover:bg-[#fdf2f8] hover:border-[#fbcfe8] text-xs font-medium text-slate-700 transition-all cursor-pointer"
            title="Unduh dokumen"
          >
            <Download size={12} className="text-slate-400" />
            <span className="text-[11px]">Unduh</span>
          </a>
        </div>

        <a
          href={dokumen.linkDrive}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <ExternalLink size={12} />
          <span className="text-[11px]">Buka di Drive</span>
        </a>
      </div>
    </aside>
  );
}
