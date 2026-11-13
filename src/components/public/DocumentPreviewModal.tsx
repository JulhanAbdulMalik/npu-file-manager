"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getDriveEmbedUrl, getDriveDirectDownloadUrl } from "@/lib/drive";

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

  if (!dokumen) return null;

  const fileId = dokumen.driveFileId;
  const embedUrl = fileId ? getDriveEmbedUrl(fileId) : null;
  const directDownloadUrl = fileId ? getDriveDirectDownloadUrl(fileId) : dokumen.linkDrive;

  function handleCopyLink() {
    navigator.clipboard.writeText(dokumen?.linkDrive || window.location.href);
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

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {dokumen.subKategori?.kategori && (
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
              )}
              {dokumen.subKategori && (
                <span className="text-[11px] font-medium text-slate-500">
                  {dokumen.subKategori.nama}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug truncate">
              {dokumen.nama}
            </h2>
            {dokumen.deskripsi && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {dokumen.deskripsi}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Iframe Preview Area */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0 bg-white"
              title={`Pratinjau ${dokumen.nama}`}
              allow="autoplay"
              loading="lazy"
            />
          ) : (
            <div className="p-8 text-center max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Pratinjau Dalam-Browser Tidak Tersedia
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Tautan dokumen ini tidak memiliki ID Google Drive langsung yang dapat disematkan. Anda dapat membukanya langsung di Google Drive.
              </p>
              <a
                href={dokumen.linkDrive}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <ExternalLink size={14} />
                <span>Buka di Google Drive</span>
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
          </div>

          <div className="flex items-center gap-2">
            <a
              href={dokumen.linkDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Buka di Google Drive</span>
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
