"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Link as LinkIcon,
  Check,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  createDokumen,
  updateDokumen,
  deleteDokumen,
} from "@/actions/dokumen";
import { extractDriveFileId } from "@/lib/drive";
import { StatusDok } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import DocumentPreviewDrawer from "@/components/public/DocumentPreviewDrawer";
import TablePagination from "@/components/common/TablePagination";

interface DokumenItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  linkDrive: string;
  driveFileId?: string | null;
  status: StatusDok;
  urutan: number;
  subKategoriId: string;
  subKategori?: {
    id: string;
    nama: string;
    kategoriId: string;
    kategori?: {
      id: string;
      nama: string;
      warna?: string | null;
    };
  };
}

interface KategoriItem {
  id: string;
  nama: string;
  warna?: string | null;
  subKategori: {
    id: string;
    nama: string;
    kategoriId: string;
  }[];
}

interface DokumenManagerProps {
  initialDokumens: DokumenItem[];
  kategoris: KategoriItem[];
}

type SortColumn = "URUTAN" | "NAMA" | "KATEGORI" | "STATUS";

export default function DokumenManager({
  initialDokumens,
  kategoris,
}: DokumenManagerProps) {
  const router = useRouter();
  const [dokumens, setDokumens] = useState<DokumenItem[]>(initialDokumens);

  // Filters
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("ALL");
  const [filterSub, setFilterSub] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | StatusDok>("ALL");

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>("URUTAN");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingDoc, setEditingDoc] = useState<DokumenItem | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    nama: string;
  }>({ isOpen: false, id: "", nama: "" });

  const [loading, setLoading] = useState(false);

  // Modal Form State
  const [formKategoriId, setFormKategoriId] = useState<string>("");
  const [formSubKategoriId, setFormSubKategoriId] = useState<string>("");
  const [formLinkDrive, setFormLinkDrive] = useState<string>("");

  // Real-time extracted Drive File ID
  const detectedDriveId = useMemo(() => {
    return extractDriveFileId(formLinkDrive);
  }, [formLinkDrive]);

  // Sub-categories available based on selected filter Kategori
  const availableFilterSubs = useMemo(() => {
    if (filterKategori === "ALL") return [];
    const found = kategoris.find((k) => k.id === filterKategori);
    return found?.subKategori || [];
  }, [filterKategori, kategoris]);

  // Sub-categories available inside Modal based on formKategoriId
  const availableFormSubs = useMemo(() => {
    if (!formKategoriId) return [];
    const found = kategoris.find((k) => k.id === formKategoriId);
    return found?.subKategori || [];
  }, [formKategoriId, kategoris]);

  // Status counts (Pipeline breakdown)
  const totalCount = dokumens.length;
  const lengkapCount = useMemo(
    () => dokumens.filter((d) => d.status === StatusDok.LENGKAP).length,
    [dokumens]
  );
  const prosesCount = useMemo(
    () => dokumens.filter((d) => d.status === StatusDok.DALAM_PROSES).length,
    [dokumens]
  );
  const belumCount = useMemo(
    () => dokumens.filter((d) => d.status === StatusDok.BELUM).length,
    [dokumens]
  );

  // Filtered documents table
  const filteredDokumens = useMemo(() => {
    const q = search.toLowerCase().trim();

    return dokumens.filter((doc) => {
      // Filter Kategori
      if (
        filterKategori !== "ALL" &&
        doc.subKategori?.kategoriId !== filterKategori
      ) {
        return false;
      }
      // Filter Sub-kategori
      if (filterSub !== "ALL" && doc.subKategoriId !== filterSub) {
        return false;
      }
      // Filter Status
      if (filterStatus !== "ALL" && doc.status !== filterStatus) {
        return false;
      }
      // Filter Search
      if (q) {
        const matchName = doc.nama.toLowerCase().includes(q);
        const matchDesc = doc.deskripsi?.toLowerCase().includes(q) || false;
        const matchSub = doc.subKategori?.nama.toLowerCase().includes(q) || false;
        const matchKat = doc.subKategori?.kategori?.nama.toLowerCase().includes(q) || false;
        if (!matchName && !matchDesc && !matchSub && !matchKat) {
          return false;
        }
      }
      return true;
    });
  }, [dokumens, search, filterKategori, filterSub, filterStatus]);

  // Sorted documents
  const sortedDokumens = useMemo(() => {
    return [...filteredDokumens].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "NAMA") {
        cmp = a.nama.localeCompare(b.nama);
      } else if (sortColumn === "KATEGORI") {
        const katA = a.subKategori?.kategori?.nama || "";
        const katB = b.subKategori?.kategori?.nama || "";
        cmp = katA.localeCompare(katB);
      } else if (sortColumn === "STATUS") {
        cmp = a.status.localeCompare(b.status);
      } else {
        cmp = (a.urutan ?? 0) - (b.urutan ?? 0);
      }
      return sortDir === "ASC" ? cmp : -cmp;
    });
  }, [filteredDokumens, sortColumn, sortDir]);

  // Paginated documents
  const paginatedDokumens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDokumens.slice(start, start + pageSize);
  }, [sortedDokumens, currentPage, pageSize]);

  function handleColumnSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDir(sortDir === "ASC" ? "DESC" : "ASC");
    } else {
      setSortColumn(col);
      setSortDir("ASC");
    }
    setCurrentPage(1);
  }

  function renderSortHeader(
    label: string,
    col: SortColumn,
    align: "left" | "center" = "left",
    extraClass = ""
  ) {
    const isCurrent = sortColumn === col;
    return (
      <th
        onClick={() => handleColumnSort(col)}
        className={`py-2.5 px-3 cursor-pointer select-none transition-colors group hover:bg-slate-100 ${
          align === "center" ? "text-center" : "text-left"
        } ${extraClass}`}
        title={`Klik untuk mengurutkan berdasarkan ${label}`}
      >
        <div
          className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider ${
            isCurrent ? "text-[#a80063]" : "text-slate-700 group-hover:text-slate-900"
          } ${align === "center" ? "justify-center" : ""}`}
        >
          <span>{label}</span>
          {isCurrent ? (
            sortDir === "ASC" ? (
              <ArrowUp size={11} className="text-[#a80063] stroke-[2.5]" />
            ) : (
              <ArrowDown size={11} className="text-[#a80063] stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown
              size={10}
              className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>
      </th>
    );
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingDoc(null);
    const defaultKat = kategoris[0]?.id || "";
    setFormKategoriId(defaultKat);
    const defaultSubs = kategoris[0]?.subKategori || [];
    setFormSubKategoriId(defaultSubs[0]?.id || "");
    setFormLinkDrive("");
    setModalOpen(true);
  }

  function openEditModal(doc: DokumenItem) {
    setModalMode("edit");
    setEditingDoc(doc);
    const katId = doc.subKategori?.kategoriId || kategoris[0]?.id || "";
    setFormKategoriId(katId);
    setFormSubKategoriId(doc.subKategoriId);
    setFormLinkDrive(doc.linkDrive);
    setModalOpen(true);
  }

  async function handleSaveDocument(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const nama = (formData.get("nama") as string).trim();
    const deskripsi = (formData.get("deskripsi") as string).trim();
    const linkDrive = (formData.get("linkDrive") as string).trim();
    const status = formData.get("status") as StatusDok;
    const subKategoriId = formSubKategoriId;

    if (!nama) {
      toast.error("Nama dokumen wajib diisi");
      return;
    }
    if (!subKategoriId) {
      toast.error("Sub-kategori wajib dipilih");
      return;
    }
    if (!linkDrive) {
      toast.error("Tautan Google Drive wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (modalMode === "create") {
        const res = await createDokumen({
          nama,
          deskripsi: deskripsi || null,
          linkDrive,
          subKategoriId,
          status,
        });

        if (res.success && res.data) {
          toast.success("Dokumen berhasil ditambahkan!");
          setModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menambahkan dokumen");
        }
      } else if (editingDoc) {
        const res = await updateDokumen(editingDoc.id, {
          nama,
          deskripsi: deskripsi || null,
          linkDrive,
          subKategoriId,
          status,
        });

        if (res.success) {
          toast.success("Dokumen berhasil diperbarui!");
          setModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Gagal memperbarui dokumen");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan dokumen");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm.id) return;
    setLoading(true);
    try {
      const res = await deleteDokumen(deleteConfirm.id);
      if (res.success) {
        toast.success("Dokumen berhasil dihapus!");
        setDokumens((prev) => prev.filter((d) => d.id !== deleteConfirm.id));
        setDeleteConfirm({ isOpen: false, id: "", nama: "" });
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus dokumen");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus dokumen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── 1. TOP HEADER (Identik CDU Portal Page Header) ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
            Kelola Dokumen
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Daftar lengkap berkas, tautan Google Drive, dan status verifikasi{" "}
            <span className="font-semibold text-[#a80063]">
              Universitas Nusa Putra
            </span>
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-[11px] font-semibold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={13} />
          <span>Tambah Dokumen Baru</span>
        </button>
      </div>

      {/* ── 2. STANDARDIZED SINGLE-ROW FILTER TOOLBAR (CDU Portal Monitoring Style) ── */}
      <div className="bg-white p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Search Box & Segmented Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-48 lg:w-56">
              <Search
                size={13}
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${
                  search ? "text-[#a80063]" : "text-slate-400"
                }`}
              />
              <input
                type="text"
                placeholder="Cari dokumen / berkas..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full pl-7 pr-7 py-1 text-xs rounded-lg border outline-none transition-all ${
                  search
                    ? "bg-[#fdf2f8] border-[#fbcfe8] text-[#a80063] font-medium"
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#fbcfe8]"
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Segmented Status Pipeline Tabs (Identik CDU Portal Monitoring Status Tabs) */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("ALL");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterStatus === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Semua</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-bold">
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterStatus(StatusDok.LENGKAP);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterStatus === StatusDok.LENGKAP
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                    : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Lengkap</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-extrabold">
                  {lengkapCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterStatus(StatusDok.DALAM_PROSES);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterStatus === StatusDok.DALAM_PROSES
                    ? "bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-amber-700 hover:bg-amber-50/50"
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Proses</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
                  {prosesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterStatus(StatusDok.BELUM);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterStatus === StatusDok.BELUM
                    ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
                    : "text-slate-600 hover:text-rose-600 hover:bg-rose-50/50"
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Belum</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-extrabold">
                  {belumCount}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Dropdowns & Reset Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Kategori Filter */}
            <select
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setFilterSub("ALL");
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-[11px] rounded-lg border outline-none cursor-pointer font-medium transition-all max-w-[160px] truncate ${
                filterKategori !== "ALL"
                  ? "bg-[#fdf2f8] border-[#fbcfe8] text-[#a80063] font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Filter Kategori"
            >
              <option value="ALL">Semua Kategori</option>
              {kategoris.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>

            {/* Sub-Kategori Filter */}
            <select
              value={filterSub}
              disabled={filterKategori === "ALL"}
              onChange={(e) => {
                setFilterSub(e.target.value);
                setCurrentPage(1);
              }}
              className={`px-2 py-1 text-[11px] rounded-lg border outline-none cursor-pointer font-medium transition-all max-w-[160px] truncate disabled:opacity-40 ${
                filterSub !== "ALL"
                  ? "bg-[#fdf2f8] border-[#fbcfe8] text-[#a80063] font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              title="Filter Sub-Kategori"
            >
              <option value="ALL">Semua Sub-Kategori</option>
              {availableFilterSubs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nama}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            {(search ||
              filterKategori !== "ALL" ||
              filterSub !== "ALL" ||
              filterStatus !== "ALL" ||
              sortColumn !== "URUTAN" ||
              sortDir !== "ASC") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterKategori("ALL");
                  setFilterSub("ALL");
                  setFilterStatus("ALL");
                  setSortColumn("URUTAN");
                  setSortDir("ASC");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#a80063] bg-[#fdf2f8] border border-[#fbcfe8] hover:bg-[#fce7f3] transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                title="Reset semua filter ke default"
              >
                <RotateCcw size={10} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. STANDARDIZED DATA TABLE (CDU Portal Monitoring Standard) ── */}
      <div className="duralux-card p-0 bg-white overflow-hidden shadow-xs relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px] table-auto">
            <thead>
              <tr className="border-b-2 border-slate-100 text-[10.5px] font-bold uppercase tracking-wider text-slate-700 bg-slate-50">
                <th className="py-2.5 px-3 text-center w-12">No</th>
                {renderSortHeader("Nama Dokumen", "NAMA", "left", "min-w-[260px]")}
                {renderSortHeader("Kategori & Sub", "KATEGORI", "left", "min-w-[200px]")}
                <th className="py-2.5 px-2.5 text-center font-bold text-slate-700 w-16">
                  Drive
                </th>
                {renderSortHeader("Status", "STATUS", "center", "w-36")}
                <th className="py-2.5 px-3 text-center font-bold text-slate-700 w-24">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 text-xs">
              {paginatedDokumens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText size={18} />
                      </div>
                      <p className="font-bold text-slate-700 text-xs">
                        Tidak Ada Dokumen Ditemukan
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Tidak ada berkas yang sesuai dengan kriteria pencarian dan filter saat ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDokumens.map((doc, idx) => {
                  const isOdd = idx % 2 === 1;

                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors border-b border-slate-100/80 ${
                        isOdd ? "bg-slate-50/50" : "bg-white"
                      } hover:bg-[#fdf2f8]/70`}
                    >
                      {/* No */}
                      <td className="py-2.5 px-3 text-center w-12 font-medium text-slate-400 text-xs">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Nama Dokumen */}
                      <td className="py-3 px-3">
                        <p
                          className="font-semibold text-xs text-slate-900 leading-tight line-clamp-1"
                          title={doc.nama}
                        >
                          {doc.nama}
                        </p>
                        {doc.deskripsi && (
                          <p
                            className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1"
                            title={doc.deskripsi}
                          >
                            {doc.deskripsi}
                          </p>
                        )}
                      </td>

                      {/* Kategori & Sub */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                doc.subKategori?.kategori?.warna || "#a80063",
                            }}
                          />
                          <div className="min-w-0">
                            <p
                              className="font-semibold text-xs text-slate-800 leading-tight truncate"
                              title={doc.subKategori?.kategori?.nama || "-"}
                            >
                              {doc.subKategori?.kategori?.nama || "—"}
                            </p>
                            <p
                              className="text-[10px] text-slate-400 font-normal mt-0.5 truncate"
                              title={doc.subKategori?.nama || "-"}
                            >
                              {doc.subKategori?.nama || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tautan Drive (Icon Simpel) */}
                      <td className="py-3 px-2.5 text-center w-16">
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

                      {/* Status Switcher (Interactive) */}
                      <td className="py-3 px-2 text-center w-36 whitespace-nowrap">
                        <StatusBadge
                          status={doc.status}
                          dokumenId={doc.id}
                          allowEdit={true}
                          onStatusUpdated={(newStatus) => {
                            setDokumens((prev) =>
                              prev.map((d) =>
                                d.id === doc.id ? { ...d, status: newStatus } : d
                              )
                            );
                          }}
                        />
                      </td>

                      {/* Aksi Buttons */}
                      <td className="py-3 px-3 text-center w-24">
                        <div className="inline-flex items-center justify-center gap-1">
                          {/* Preview (FileText icon) */}
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-[#a80063] bg-[#fdf2f8] hover:bg-[#fce7f3] border border-[#fbcfe8] transition-colors cursor-pointer"
                            title="Pratinjau Dokumen"
                          >
                            <FileText size={12} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(doc)}
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70 transition-colors cursor-pointer"
                            title="Edit Dokumen"
                          >
                            <Edit2 size={12} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: doc.id,
                                nama: doc.nama,
                              })
                            }
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200 transition-colors cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. TABLE PAGINATION FOOTER (CDU Portal Standard) ───────────── */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredDokumens.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => setPageSize(size)}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* ── MODAL TAMBAH / EDIT DOKUMEN ─────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-opacity overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 animate-modal-pop">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              {modalMode === "create" ? "Tambah Dokumen Baru" : "Edit Dokumen"}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              {modalMode === "create"
                ? "Tambahkan dokumen atau berkas baru ke dalam sistem"
                : "Perbarui informasi dan tautan berkas dokumen"}
            </p>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              {/* Nama Dokumen */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  name="nama"
                  type="text"
                  required
                  defaultValue={editingDoc?.nama || ""}
                  placeholder="Contoh: Rencana Strategis (Renstra) Universitas"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Singkat
                </label>
                <textarea
                  name="deskripsi"
                  rows={3}
                  defaultValue={editingDoc?.deskripsi || ""}
                  placeholder="Catatan tambahan mengenai berkas dokumen ini (opsional)..."
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Kategori & Sub-Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formKategoriId}
                    onChange={(e) => {
                      const newKatId = e.target.value;
                      setFormKategoriId(newKatId);
                      const found = kategoris.find((k) => k.id === newKatId);
                      setFormSubKategoriId(found?.subKategori[0]?.id || "");
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer"
                  >
                    {kategoris.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sub-Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSubKategoriId}
                    onChange={(e) => setFormSubKategoriId(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer"
                  >
                    {availableFormSubs.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tautan Google Drive */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tautan Google Drive <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <LinkIcon
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="linkDrive"
                    type="url"
                    required
                    value={formLinkDrive}
                    onChange={(e) => setFormLinkDrive(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>
                {detectedDriveId && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <Check size={11} />
                    <span>ID Berkas Terdeteksi: {detectedDriveId}</span>
                  </p>
                )}
              </div>

              {/* Status Dokumen */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Status Kesiapan
                </label>
                <select
                  name="status"
                  defaultValue={editingDoc?.status || StatusDok.LENGKAP}
                  className="w-full px-2.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer"
                >
                  <option value={StatusDok.LENGKAP}>Lengkap (Sudah Terverifikasi)</option>
                  <option value={StatusDok.DALAM_PROSES}>Dalam Proses (Review / Revisi)</option>
                  <option value={StatusDok.BELUM}>Belum Lengkap (Perlu Dilengkapi)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading
                    ? "Menyimpan..."
                    : modalMode === "create"
                    ? "Simpan Dokumen"
                    : "Perbarui Dokumen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DELETE CONFIRMATION ──────────────────────────────────── */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center animate-modal-pop">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Hapus Dokumen?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus &ldquo;{deleteConfirm.nama}&rdquo;? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, id: "", nama: "" })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Drawer (Smooth Slide-over) */}
      <DocumentPreviewDrawer
        dokumen={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
