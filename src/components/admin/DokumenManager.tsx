"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Link as LinkIcon,
  ChevronDown,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import {
  createDokumen,
  updateDokumen,
  deleteDokumen,
  updateStatusDokumen,
} from "@/actions/dokumen";
import { StatusDok } from "@prisma/client";
import { extractDriveFileId } from "@/lib/drive";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import DocumentPreviewDrawer from "@/components/public/DocumentPreviewDrawer";
import TablePagination from "@/components/common/TablePagination";
import {
  stripLeadingNumber,
  buildSubKategoriTree,
  flattenSubKategoriTree,
  SubKategoriTreeNode,
} from "@/lib/hierarchy";

interface DokumenItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  linkDrive: string;
  driveFileId?: string | null;
  status: StatusDok;
  urutan: number;
  kategoriId: string;
  subKategoriId?: string | null;
  kategori?: {
    id: string;
    nama: string;
    warna?: string | null;
    ikon?: string | null;
  };
  subKategori?: {
    id: string;
    nama: string;
    kategoriId: string;
    parent?: {
      id: string;
      nama: string;
    } | null;
  } | null;
}

interface KategoriItem {
  id: string;
  nama: string;
  warna?: string | null;
  urutan: number;
  subKategori: any[];
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

  // Map sub-kategori to hierarchical code & labels
  const subKategoriMap = useMemo(() => {
    const map = new Map<string, { code: string; cleanName: string; fullLabel: string }>();

    kategoris.forEach((k, kIdx) => {
      const tree = buildSubKategoriTree(k.subKategori as any, kIdx + 1);
      const flat = flattenSubKategoriTree(tree);
      flat.forEach((item) => {
        const clean = stripLeadingNumber(item.label.replace(/^.*└─\s*/, ""));
        map.set(item.id, {
          code: item.code,
          cleanName: clean,
          fullLabel: item.label,
        });
      });
    });

    return map;
  }, [kategoris]);

  // Sub-categories available based on selected filter Kategori (Hierarchical)
  const availableFilterSubsFlat = useMemo(() => {
    if (filterKategori === "ALL") return [];
    const foundIdx = kategoris.findIndex((k) => k.id === filterKategori);
    if (foundIdx === -1) return [];
    const found = kategoris[foundIdx];
    const tree = buildSubKategoriTree(found.subKategori as any, foundIdx + 1);
    return flattenSubKategoriTree(tree);
  }, [filterKategori, kategoris]);

  // Sub-categories available inside Modal based on formKategoriId (Hierarchical)
  const availableFormSubsFlat = useMemo(() => {
    if (!formKategoriId) return [];
    const foundIdx = kategoris.findIndex((k) => k.id === formKategoriId);
    if (foundIdx === -1) return [];
    const found = kategoris[foundIdx];
    const tree = buildSubKategoriTree(found.subKategori as any, foundIdx + 1);
    return flattenSubKategoriTree(tree);
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
      if (filterKategori !== "ALL") {
        const docKatId = doc.kategoriId || doc.subKategori?.kategoriId;
        if (docKatId !== filterKategori) return false;
      }

      // Filter Sub-kategori
      if (filterSub !== "ALL") {
        if (filterSub === "DIRECT") {
          if (doc.subKategoriId) return false;
        } else if (doc.subKategoriId !== filterSub) {
          return false;
        }
      }

      // Filter Status
      if (filterStatus !== "ALL" && doc.status !== filterStatus) {
        return false;
      }

      // Filter Search
      if (q) {
        const matchName = doc.nama.toLowerCase().includes(q);
        const matchDesc = doc.deskripsi?.toLowerCase().includes(q) || false;
        const matchSub = doc.subKategori?.nama?.toLowerCase().includes(q) || false;
        const matchKat =
          doc.kategori?.nama?.toLowerCase().includes(q) ||
          doc.subKategori?.parent?.nama?.toLowerCase().includes(q) ||
          false;
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
        const katA = a.kategori?.nama || "";
        const katB = b.kategori?.nama || "";
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
    setFormSubKategoriId(""); // Default: simpan langsung di kategori
    setFormLinkDrive("");
    setModalOpen(true);
  }

  function openEditModal(doc: DokumenItem) {
    setModalMode("edit");
    setEditingDoc(doc);
    const katId = doc.kategoriId || doc.subKategori?.kategoriId || kategoris[0]?.id || "";
    setFormKategoriId(katId);
    setFormSubKategoriId(doc.subKategoriId || "");
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
    const subKategoriId = formSubKategoriId ? formSubKategoriId.trim() : null;

    if (!nama) {
      toast.error("Nama dokumen wajib diisi");
      return;
    }
    if (!formKategoriId) {
      toast.error("Kategori wajib dipilih");
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
          kategoriId: formKategoriId,
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
          kategoriId: formKategoriId,
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
      toast.error("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(docId: string, newStatus: StatusDok) {
    try {
      const res = await updateStatusDokumen(docId, newStatus);
      if (res.success) {
        setDokumens((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
        );
        toast.success("Status dokumen diperbarui");
      } else {
        toast.error(res.error || "Gagal mengubah status");
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  }

  const isFilterActive =
    search.trim() !== "" ||
    filterKategori !== "ALL" ||
    filterSub !== "ALL" ||
    filterStatus !== "ALL";

  function resetAllFilters() {
    setSearch("");
    setFilterKategori("ALL");
    setFilterSub("ALL");
    setFilterStatus("ALL");
    setCurrentPage(1);
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {/* ── 1. HEADER CARD (CDU Portal Standard) ─────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Kelola Dokumen</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap berkas, tautan Google Drive, dan status verifikasi{" "}
            <span className="font-semibold text-[#a80063]">Universitas Nusa Putra</span>
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#a80063] hover:bg-[#8c0052] active:scale-95 text-white text-xs font-semibold shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Tambah Dokumen Baru</span>
        </button>
      </div>

      {/* ── 2. SINGLE-ROW FILTER TOOLBAR (CDU Portal Standard) ───────────── */}
      <div className="bg-white p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Real-time Search Input */}
          <div className="relative w-full sm:w-60 md:w-72">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari dokumen / berkas..."
              className="w-full pl-8 pr-16 py-1.5 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200/80 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-block text-[9.5px] font-medium text-slate-400 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded">
              Ctrl+K
            </kbd>
          </div>

          {/* Segmented Status Tabs */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/70 text-xs">
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                filterStatus === "ALL"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Semua{" "}
              <span className="text-[10px] font-bold text-slate-400 ml-1">
                {totalCount}
              </span>
            </button>
            <button
              onClick={() => {
                setFilterStatus(StatusDok.LENGKAP);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === StatusDok.LENGKAP
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Lengkap</span>
              <span className="text-[10px] font-bold text-emerald-600 ml-0.5">
                {lengkapCount}
              </span>
            </button>
            <button
              onClick={() => {
                setFilterStatus(StatusDok.DALAM_PROSES);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === StatusDok.DALAM_PROSES
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Proses</span>
              <span className="text-[10px] font-bold text-amber-600 ml-0.5">
                {prosesCount}
              </span>
            </button>
            <button
              onClick={() => {
                setFilterStatus(StatusDok.BELUM);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === StatusDok.BELUM
                  ? "bg-white text-slate-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Belum</span>
              <span className="text-[10px] font-bold text-slate-500 ml-0.5">
                {belumCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right Filter Selects */}
        <div className="flex items-center gap-2">
          {/* Dropdown Filter Kategori (1., 2., dst) */}
          <select
            value={filterKategori}
            onChange={(e) => {
              setFilterKategori(e.target.value);
              setFilterSub("ALL");
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 text-xs text-slate-700 rounded-lg border border-slate-200/80 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer font-medium"
          >
            <option value="ALL">Semua Kategori</option>
            {kategoris.map((k, idx) => (
              <option key={k.id} value={k.id}>
                {idx + 1}. {stripLeadingNumber(k.nama)}
              </option>
            ))}
          </select>

          {/* Dropdown Filter Sub-Kategori (Hierarkis) */}
          <select
            value={filterSub}
            onChange={(e) => {
              setFilterSub(e.target.value);
              setCurrentPage(1);
            }}
            disabled={filterKategori === "ALL"}
            className="px-2.5 py-1.5 bg-slate-50 text-xs text-slate-700 rounded-lg border border-slate-200/80 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="ALL">Semua Sub-Kategori</option>
            {filterKategori !== "ALL" && (
              <option value="DIRECT">(Dokumen Langsung di Kategori)</option>
            )}
            {availableFilterSubsFlat.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.label}
              </option>
            ))}
          </select>

          {/* Reset Filters Button */}
          {isFilterActive && (
            <button
              onClick={resetAllFilters}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200/70 transition-colors cursor-pointer"
              title="Reset semua filter"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. DATA TABLE (CDU Portal Standard) ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                {renderSortHeader("NO", "URUTAN", "center", "w-12")}
                {renderSortHeader("NAMA DOKUMEN", "NAMA", "left")}
                {renderSortHeader("KATEGORI & SUB", "KATEGORI", "left", "w-72")}
                <th className="py-2.5 px-3 text-center font-bold w-16">DRIVE</th>
                {renderSortHeader("STATUS", "STATUS", "center", "w-36")}
                <th className="py-2.5 px-3 text-center font-bold w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDokumens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">
                      Tidak ada dokumen yang sesuai dengan filter
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau status filter
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDokumens.map((doc, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const katId = doc.kategoriId || doc.subKategori?.kategoriId;
                  const katIdx = kategoris.findIndex((k) => k.id === katId);
                  const katNum = katIdx !== -1 ? `${katIdx + 1}.` : "";
                  const katName = doc.kategori?.nama || kategoris[katIdx]?.nama || "—";
                  const cleanKatName = stripLeadingNumber(katName);

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Kolom Nomor Simpel & Bersih */}
                      <td className="py-3 px-3 text-center">
                        <span className="text-slate-400 font-medium text-xs tabular-nums">
                          {rowNumber}
                        </span>
                      </td>

                      {/* Nama Dokumen & Deskripsi */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col min-w-0 pr-4">
                          <span
                            onClick={() => setPreviewDoc(doc)}
                            className="font-bold text-xs text-slate-800 hover:text-[#a80063] transition-colors cursor-pointer line-clamp-1 leading-snug"
                            title={doc.nama}
                          >
                            {doc.nama}
                          </span>
                          {doc.deskripsi && (
                            <span
                              className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5"
                              title={doc.deskripsi}
                            >
                              {doc.deskripsi}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kategori & Sub-Kategori Hierarki */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-[11px] text-slate-700 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a80063] shrink-0" />
                            <span>
                              {katNum} {cleanKatName}
                            </span>
                          </span>

                          <div className="mt-0.5">
                            {doc.subKategoriId && subKategoriMap.has(doc.subKategoriId) ? (
                              <span className="text-slate-500 font-medium text-[11px] truncate flex items-center gap-1">
                                <span className="text-[#a80063] font-bold shrink-0">
                                  {subKategoriMap.get(doc.subKategoriId)!.code}
                                </span>
                                <span className="truncate">
                                  {subKategoriMap.get(doc.subKategoriId)!.cleanName}
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium italic text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                (Langsung di Kategori)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Drive Link Icon */}
                      <td className="py-3 px-3 text-center">
                        <a
                          href={doc.linkDrive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-[#a80063] hover:bg-[#fdf2f8] transition-colors"
                          title="Buka di Google Drive"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-3 text-center">
                        <div className="relative inline-block text-left">
                          <select
                            value={doc.status}
                            onChange={(e) =>
                              handleStatusChange(doc.id, e.target.value as StatusDok)
                            }
                            className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border outline-none cursor-pointer transition-all appearance-none pr-6 ${
                              doc.status === StatusDok.LENGKAP
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
                                : doc.status === StatusDok.DALAM_PROSES
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70"
                            }`}
                          >
                            <option value={StatusDok.LENGKAP}>&bull; Lengkap</option>
                            <option value={StatusDok.DALAM_PROSES}>&bull; Dalam Proses</option>
                            <option value={StatusDok.BELUM}>&bull; Belum Lengkap</option>
                          </select>
                          <ChevronDown
                            size={11}
                            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                          />
                        </div>
                      </td>

                      {/* Tombol Aksi Ikon Ringkas */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Preview */}
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-[#a80063] hover:bg-[#fdf2f8] border border-slate-200/70 hover:border-[#fbcfe8] transition-colors cursor-pointer"
                            title="Preview Dokumen"
                          >
                            <Eye size={12} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(doc)}
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-[#a80063] hover:bg-[#fdf2f8] border border-slate-200/70 hover:border-[#fbcfe8] transition-colors cursor-pointer"
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
                ? "Tambahkan berkas baru langsung ke kategori atau ke dalam sub-kategori"
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

              {/* Deskripsi Singkat */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Singkat
                </label>
                <textarea
                  name="deskripsi"
                  rows={2}
                  defaultValue={editingDoc?.deskripsi || ""}
                  placeholder="Catatan tambahan mengenai berkas dokumen ini (opsional)..."
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Kategori & Sub-Kategori (Pilihan Hierarkis) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kategori Utama <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formKategoriId}
                    onChange={(e) => {
                      const newKatId = e.target.value;
                      setFormKategoriId(newKatId);
                      setFormSubKategoriId(""); // Default simpan langsung di kategori
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer font-medium"
                  >
                    {kategoris.map((k, idx) => (
                      <option key={k.id} value={k.id}>
                        {idx + 1}. {stripLeadingNumber(k.nama)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sub-Kategori <span className="text-slate-400 font-normal">(Pilihan Opsional)</span>
                  </label>
                  <select
                    value={formSubKategoriId}
                    onChange={(e) => setFormSubKategoriId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer font-sans"
                  >
                    <option value="">
                      (Tanpa Sub-Kategori — Simpan Langsung di Kategori)
                    </option>
                    {availableFormSubsFlat.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Bisa disimpan langsung di kategori, atau pilih sub-kategori / anak sub-kategori.
                  </p>
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
