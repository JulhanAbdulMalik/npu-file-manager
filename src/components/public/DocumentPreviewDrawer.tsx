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
} from "lucide-react";
import { toast } from "sonner";
import { getDriveEmbedUrl, getDriveDirectDownloadUrl } from "@/lib/drive";

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

  if (!dokumen && !isOpen) return null;

  const fileId = dokumen?.driveFileId;
  const embedUrl = fileId ? getDriveEmbedUrl(fileId) : null;
  const directDownloadUrl = fileId
    ? getDriveDirectDownloadUrl(fileId)
    : dokumen?.linkDrive;

  function handleCopyLink() {
    if (!dokumen) return;
    navigator.clipboard.writeText(dokumen.linkDrive);
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

        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 flex-1 animate-fade-in">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {dokumen?.subKategori?.kategori && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border transition-colors"
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
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${statusConfig.bg}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                  />
                  {statusConfig.label}
                </span>
              )}
            </div>

            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
              {dokumen?.nama}
            </h2>

            {dokumen?.subKategori && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Sub-Kategori:{" "}
                <span className="font-semibold text-slate-700">
                  {dokumen.subKategori.nama}
                </span>
              </p>
            )}
          </div>

          {/* Close Button with Smooth Rotation */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 hover:rotate-90 hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0"
            title="Tutup Panel (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body - Iframe Preview with Smooth Content Fade */}
        <div
          key={dokumen?.id || "empty"}
          className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center animate-fade-in"
        >
          {dokumen && embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0 bg-white"
              title={`Pratinjau ${dokumen.nama}`}
              allow="autoplay"
              loading="lazy"
            />
          ) : dokumen ? (
            <div className="p-8 text-center max-w-sm">
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
                href={dokumen.linkDrive}
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

              {directDownloadUrl && (
                <a
                  href={directDownloadUrl}
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
              href={dokumen.linkDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-bold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Buka di Drive</span>
            </a>
          </div>
        )}
      </aside>
    </>
  );
}

