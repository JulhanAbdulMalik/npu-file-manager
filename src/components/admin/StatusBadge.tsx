"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { StatusDok } from "@prisma/client";
import { updateStatusDokumen } from "@/actions/dokumen";
import { toast } from "sonner";

interface StatusBadgeProps {
  status: StatusDok;
  dokumenId?: string;
  allowEdit?: boolean;
  onStatusUpdated?: (newStatus: StatusDok) => void;
}

export default function StatusBadge({
  status: initialStatus,
  dokumenId,
  allowEdit = false,
  onStatusUpdated,
}: StatusBadgeProps) {
  const [status, setStatus] = useState<StatusDok>(initialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const config = {
    [StatusDok.LENGKAP]: {
      label: "Lengkap",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },
    [StatusDok.DALAM_PROSES]: {
      label: "Dalam Proses",
      bg: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70",
      dot: "bg-amber-500",
      icon: Clock,
    },
    [StatusDok.BELUM]: {
      label: "Belum Lengkap",
      bg: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70",
      dot: "bg-slate-400",
      icon: AlertCircle,
    },
  }[status];

  const Icon = config.icon;

  async function handleSelect(newStatus: StatusDok) {
    if (!dokumenId || newStatus === status) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setStatus(newStatus);
    setIsOpen(false);

    try {
      const res = await updateStatusDokumen(dokumenId, newStatus);
      if (res.success) {
        toast.success(`Status dokumen diubah menjadi ${newStatus}`);
        onStatusUpdated?.(newStatus);
      } else {
        setStatus(initialStatus);
        toast.error(res.error || "Gagal mengubah status dokumen");
      }
    } catch {
      setStatus(initialStatus);
      toast.error("Terjadi kesalahan sistem saat mengubah status");
    } finally {
      setLoading(false);
    }
  }

  if (!allowEdit || !dokumenId) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${config.bg} ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
        title="Klik untuk mengubah status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
        <ChevronDown
          size={11}
          className={`opacity-70 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            className="absolute left-0 top-7 z-50 w-36 bg-white rounded-xl shadow-xl border border-slate-200/90 p-1 animate-modal-pop origin-top-left transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleSelect(StatusDok.LENGKAP)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors text-left font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Lengkap</span>
            </button>
            <button
              onClick={() => handleSelect(StatusDok.DALAM_PROSES)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded-lg transition-colors text-left font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Dalam Proses</span>
            </button>
            <button
              onClick={() => handleSelect(StatusDok.BELUM)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Belum Lengkap</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
