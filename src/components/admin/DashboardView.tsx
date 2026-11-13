"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Plus,
  ExternalLink,
  FileText,
  ChevronRight,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import DocumentPreviewDrawer from "@/components/public/DocumentPreviewDrawer";
import { StatusDok } from "@prisma/client";

interface DetailItem {
  label: string;
  value: string | number;
  color?: "blue" | "emerald" | "violet" | "rose" | "amber" | "slate" | "pink" | "maroon";
}

interface SegmentItem {
  label?: string;
  value: number;
  color?: string;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200/60",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  violet: "bg-violet-50 text-violet-700 border-violet-200/60",
  rose: "bg-rose-50 text-rose-700 border-rose-200/60",
  amber: "bg-amber-50 text-amber-700 border-amber-200/60",
  slate: "bg-slate-50 text-slate-600 border-slate-200/60",
  pink: "bg-pink-50 text-pink-700 border-pink-200/60",
  maroon: "bg-[#a80063]/10 text-[#a80063] border-[#a80063]/25",
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trendText?: string;
  isPositive?: boolean;
  trendColor?: "emerald" | "amber" | "rose" | "maroon";
  details?: DetailItem[];
  progress?: number;
  progressColor?: string;
  valueColor?: string;
  segments?: SegmentItem[];
}

function MetricCard({
  title,
  value,
  subtitle,
  trendText,
  isPositive = true,
  trendColor = "emerald",
  details,
  progress,
  progressColor = "bg-emerald-500",
  valueColor = "text-slate-900",
  segments,
}: MetricCardProps) {
  const trendBg =
    trendColor === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-200/60"
      : trendColor === "rose"
      ? "bg-rose-50 text-rose-700 border-rose-200/60"
      : trendColor === "maroon"
      ? "bg-[#fdf2f8] text-[#a80063] border-[#fbcfe8]"
      : "bg-emerald-50 text-emerald-700 border-emerald-200/60";

  return (
    <div className="duralux-card p-3.5 flex flex-col justify-between bg-white relative overflow-hidden group">
      <div>
        {/* Top Details */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          {trendText && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold border ${trendBg}`}
            >
              {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>{trendText}</span>
            </span>
          )}
        </div>

        {/* Big Number */}
        <div className="flex items-baseline gap-2">
          <h3 className={`text-2xl font-bold tracking-tight leading-none ${valueColor}`}>
            {value}
          </h3>
        </div>

        {/* Subtitle */}
        <p className="text-[10.5px] text-slate-400 font-normal mt-1 line-clamp-1">
          {subtitle}
        </p>

        {/* Single Progress Bar (if provided) */}
        {progress !== undefined && (
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {/* Multi-segment Indicator Bar (if provided) */}
        {segments && segments.length > 0 && (
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2 flex">
            {(() => {
              const totalSeg = segments.reduce((acc, s) => acc + (s.value || 0), 0);
              if (totalSeg === 0) {
                return <div className="h-full w-full bg-slate-200/70 rounded-full" />;
              }
              return segments.map((seg, idx) => {
                if (seg.value <= 0) return null;
                const pct = (seg.value / totalSeg) * 100;
                return (
                  <div
                    key={idx}
                    className={`h-full ${seg.color || "bg-slate-400"} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                    title={`${seg.label || ""}: ${seg.value} (${Math.round(pct)}%)`}
                  />
                );
              });
            })()}
          </div>
        )}

        {/* Details Breakdown Pills */}
        {details && details.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {details.map((d, i) => {
              const cls = colorMap[d.color || "slate"] || colorMap["slate"];
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${cls}`}
                >
                  {d.label}: {d.value}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardViewProps {
  stats: {
    totalKategori: number;
    totalSubKategori: number;
    totalDokumen: number;
    lengkap: number;
    dalamProses: number;
    belum: number;
    persentaseLengkap: number;
    perKategori: {
      id: string;
      nama: string;
      warna: string;
      total: number;
      lengkap: number;
      dalamProses: number;
      belum: number;
      persentase: number;
    }[];
  };
  recentDocs: any[];
  userName?: string;
}

export default function DashboardView({
  stats,
  recentDocs,
  userName = "Administrator",
}: DashboardViewProps) {
  const [activePreviewDoc, setActivePreviewDoc] = useState<any | null>(null);
  const [docsList, setDocsList] = useState(recentDocs);

  function handleStatusUpdated(docId: string, newStatus: StatusDok) {
    setDocsList((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
    );
  }

  return (
    <div className="space-y-4">
      {/* ── 1. Top Greeting & Action Controls ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
            Selamat Datang, {userName}! 👋
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Berikut ringkasan kesiapan dokumen & berkas kegiatan{" "}
            <span className="font-semibold text-[#a80063]">
              Universitas Nusa Putra
            </span>
          </p>
        </div>

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <ExternalLink size={12} className="text-[#a80063]" />
            <span>Portal Publik</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Top 4 Metric Cards (Identical to CDU Portal SparklineCard) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Dokumen */}
        <MetricCard
          title="Total Dokumen"
          value={stats.totalDokumen}
          subtitle={`${stats.totalKategori} Kategori • ${stats.totalSubKategori} Sub-Kategori`}
          trendText="Target Eviden"
          isPositive={true}
          trendColor="emerald"
          segments={[
            { label: "Lengkap", value: stats.lengkap, color: "bg-[#10b981]" },
            { label: "Proses", value: stats.dalamProses, color: "bg-[#f59e0b]" },
            { label: "Belum", value: stats.belum, color: "bg-[#ef4444]" },
          ]}
          details={[
            { label: "Lengkap", value: stats.lengkap, color: "emerald" },
            { label: "Proses", value: stats.dalamProses, color: "amber" },
            { label: "Belum", value: stats.belum, color: "rose" },
          ]}
        />

        {/* Card 2: Dokumen Lengkap */}
        <MetricCard
          title="Dokumen Lengkap"
          value={`${stats.persentaseLengkap}%`}
          valueColor="text-[#10b981]"
          subtitle={`${stats.lengkap} dari ${stats.totalDokumen} berkas telah terverifikasi`}
          trendText="Terverifikasi"
          isPositive={true}
          trendColor="emerald"
          progress={stats.persentaseLengkap}
          progressColor="bg-[#10b981]"
          details={[
            { label: "Selesai", value: stats.lengkap, color: "emerald" },
            {
              label: "Kurang",
              value: Math.max(0, stats.totalDokumen - stats.lengkap),
              color: "rose",
            },
            { label: "Target", value: "100%", color: "slate" },
          ]}
        />

        {/* Card 3: Dalam Proses */}
        <MetricCard
          title="Dalam Proses"
          value={`${stats.dalamProses} Berkas`}
          valueColor="text-slate-900"
          subtitle="Menunggu kelengkapan dokumen atau revisi berkas"
          trendText="Review / Draft"
          isPositive={true}
          trendColor="amber"
          progress={
            stats.totalDokumen > 0
              ? (stats.dalamProses / stats.totalDokumen) * 100
              : 0
          }
          progressColor="bg-[#f59e0b]"
          details={[
            { label: "Perlu Cek", value: stats.dalamProses, color: "amber" },
            { label: "Prioritas", value: "Tinggi", color: "maroon" },
          ]}
        />

        {/* Card 4: Belum Lengkap */}
        <MetricCard
          title="Belum Lengkap"
          value={`${stats.belum} Berkas`}
          valueColor={stats.belum > 0 ? "text-rose-600" : "text-slate-900"}
          subtitle="Belum diunggah atau belum ada tautan eviden"
          trendText={stats.belum > 0 ? `${stats.belum} Perlu Dicek` : "Terpenuhi"}
          isPositive={stats.belum === 0}
          trendColor="rose"
          progress={
            stats.totalDokumen > 0 ? (stats.belum / stats.totalDokumen) * 100 : 0
          }
          progressColor="bg-[#ef4444]"
          details={[
            { label: "Perhatian", value: stats.belum, color: "rose" },
            {
              label: "Tersedia",
              value: stats.lengkap + stats.dalamProses,
              color: "emerald",
            },
          ]}
        />
      </div>

      {/* ── 3. Row 2: Tabel Monitoring (Kiri) & Capaian Kategori (Kanan) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* KIRI: Status Monitoring Dokumen Terkini */}
        <div className="lg:col-span-7 xl:col-span-8 duralux-card bg-white p-4 sm:p-5 flex flex-col justify-between h-full">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Status Monitoring Dokumen Terkini
                </h3>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Daftar dokumen & berkas kegiatan terkini dengan aksi cepat ubah status
                </p>
              </div>
              <Link
                href="/dokumen"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a80063] hover:text-[#8c0052] transition-colors shrink-0"
              >
                <span>Lihat Semua</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-2.5 font-bold w-15 text-center">Kode</th>
                    <th className="pb-2.5 font-bold pr-3">Nama Dokumen</th>
                    <th className="pb-2.5 font-bold pr-3">Kategori & Sub</th>
                    <th className="pb-2.5 text-center font-bold w-14">Drive</th>
                    <th className="pb-2.5 text-center font-bold w-32">Status</th>
                    <th className="pb-2.5 text-center font-bold w-14">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {docsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                        Belum ada dokumen yang terdaftar. Silakan tambahkan dokumen eviden baru.
                      </td>
                    </tr>
                  ) : (
                    docsList.map((doc, idx) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* No */}
                        <td className="py-2.5 px-2 text-center w-10 font-medium text-slate-400 text-xs">
                          {idx + 1}
                        </td>

                        {/* Nama Dokumen */}
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-xs text-slate-900 leading-tight line-clamp-1" title={doc.nama}>
                            {doc.nama}
                          </p>
                          {doc.deskripsi && (
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1" title={doc.deskripsi}>
                              {doc.deskripsi}
                            </p>
                          )}
                        </td>

                        {/* Kategori & Sub */}
                        <td className="py-2.5 pr-3">
                          <p className="font-medium text-xs text-slate-700 leading-tight line-clamp-1" title={doc.subKategori?.kategori?.nama || "-"}>
                            {doc.subKategori?.kategori?.nama || "-"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1" title={doc.subKategori?.nama || "-"}>
                            {doc.subKategori?.nama || "-"}
                          </p>
                        </td>

                        {/* Status Switcher (Interactive) */}
                        <td className="py-2.5 px-2 text-center w-32 whitespace-nowrap">
                          <StatusBadge
                            status={doc.status}
                            dokumenId={doc.id}
                            allowEdit={true}
                            onStatusUpdated={(newStatus) =>
                              handleStatusUpdated(doc.id, newStatus)
                            }
                          />
                        </td>

                        {/* Tautan Drive (Hanya Icon, Simpel) */}
                        <td className="py-2.5 px-1.5 text-center w-14">
                          {doc.linkDrive ? (
                            <a
                              href={doc.linkDrive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] border border-slate-200/70 hover:border-[#fbcfe8] transition-colors"
                              title="Buka Google Drive"
                            >
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>

                        {/* Aksi Preview Button (Hanya Icon Dokumen, Tanpa Teks, Tanpa Icon Mata) */}
                        <td className="py-2.5 px-1.5 text-center w-14">
                          <button
                            onClick={() => setActivePreviewDoc(doc)}
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[#a80063] bg-[#fdf2f8] hover:bg-[#fce7f3] border border-[#fbcfe8] transition-colors cursor-pointer"
                            title="Pratinjau Dokumen"
                          >
                            <FileText size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KANAN: Capaian Kesiapan per Kategori */}
        <div className="lg:col-span-5 xl:col-span-4 duralux-card bg-white p-4 sm:p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Capaian Kesiapan per Kategori
                </h3>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Tingkat kelengkapan berkas per kategori
                </p>
              </div>
              <Link
                href="/kategori"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a80063] hover:text-[#8c0052] transition-colors shrink-0"
              >
                <span>Detail</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="space-y-3">
              {stats.perKategori.map((k) => (
                <div
                  key={k.id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate" title={k.nama}>
                        {k.nama}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs shrink-0">
                      <span className="text-[10.5px] text-slate-400">
                        <strong className="text-slate-700">{k.lengkap}</strong>/{k.total} Dokumen
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-full font-bold text-[10px]"
                        style={{
                          backgroundColor: `${k.warna}15`,
                          color: k.warna,
                        }}
                      >
                        {k.persentase}%
                      </span>
                    </div>
                  </div>

                  {/* Single Smooth Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: k.warna,
                        width: `${k.persentase}%`,
                      }}
                    />
                  </div>

                  {/* Status Breakdown Pills */}
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 font-medium">
                        {k.lengkap} Lengkap
                      </span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-slate-600 font-medium">
                        {k.dalamProses} Proses
                      </span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="text-slate-600 font-medium">
                        {k.belum} Belum
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Drawer (Smooth Slide-over) */}
      <DocumentPreviewDrawer
        dokumen={activePreviewDoc}
        isOpen={!!activePreviewDoc}
        onClose={() => setActivePreviewDoc(null)}
      />
    </div>
  );
}
