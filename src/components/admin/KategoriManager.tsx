"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  FolderPlus,
  FileText,
  AlertCircle,
  X,
  Check,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  createKategori,
  updateKategori,
  deleteKategori,
  createSubKategori,
  updateSubKategori,
  deleteSubKategori,
  getKategoris,
  swapKategoriOrder,
  swapSubKategoriOrder,
} from "@/actions/kategori";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  stripLeadingNumber,
  buildSubKategoriTree,
  flattenSubKategoriTree,
  SubKategoriTreeNode,
} from "@/lib/hierarchy";

const COLOR_PRESETS = [
  "#a80063", // Nusa Putra Magenta / Ruby
  "#0284c7", // Sky Blue
  "#059669", // Emerald Green
  "#d97706", // Amber Orange
  "#7c3aed", // Violet
  "#e11d48", // Rose Red
  "#475569", // Slate
];

interface SubKategori {
  id: string;
  nama: string;
  deskripsi?: string | null;
  urutan: number;
  kategoriId: string;
  parentId?: string | null;
  _count?: { dokumen: number };
}

interface Kategori {
  id: string;
  nama: string;
  deskripsi?: string | null;
  warna?: string | null;
  ikon?: string | null;
  urutan: number;
  dokumen?: any[];
  subKategori: SubKategori[];
}

interface KategoriManagerProps {
  initialKategoris: Kategori[];
}

export default function KategoriManager({ initialKategoris }: KategoriManagerProps) {
  const router = useRouter();
  const [kategoris, setKategoris] = useState<Kategori[]>(initialKategoris);
  const [expandedKats, setExpandedKats] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    initialKategoris.forEach((k) => (state[k.id] = true));
    return state;
  });

  // Modal States
  const [kategoriModal, setKategoriModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data?: Partial<Kategori>;
  }>({ isOpen: false, mode: "create" });

  const [subModal, setSubModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    kategoriId?: string;
    parentId?: string | null;
    parentName?: string | null;
    data?: Partial<SubKategori>;
  }>({ isOpen: false, mode: "create" });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "kategori" | "sub";
    id: string;
    nama: string;
  }>({ isOpen: false, type: "kategori", id: "", nama: "" });

  const [loading, setLoading] = useState(false);

  // Sync state if initial props change
  useEffect(() => {
    setKategoris(initialKategoris);
  }, [initialKategoris]);

  function toggleExpand(id: string) {
    setExpandedKats((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ── REORDERING HANDLERS ─────────────────────────────────────────────
  async function handleMoveKategori(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= kategoris.length) return;

    const katCurrent = kategoris[index];
    const katTarget = kategoris[targetIndex];

    // Optimistic swap in local array
    const updated = [...kategoris];
    updated[index] = katTarget;
    updated[targetIndex] = katCurrent;
    setKategoris(updated);

    try {
      const res = await swapKategoriOrder(katCurrent.id, katTarget.id);
      if (res.success) {
        toast.success("Urutan kategori berhasil dipindahkan");
        const ref = await getKategoris();
        if (ref.success && ref.data) setKategoris(ref.data as any);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memindahkan urutan kategori");
        const ref = await getKategoris();
        if (ref.success && ref.data) setKategoris(ref.data as any);
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memindahkan urutan kategori");
      const ref = await getKategoris();
      if (ref.success && ref.data) setKategoris(ref.data as any);
    }
  }

  async function handleMoveSubKategori(
    siblings: SubKategoriTreeNode[],
    index: number,
    direction: -1 | 1
  ) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const subCurrent = siblings[index];
    const subTarget = siblings[targetIndex];

    try {
      const res = await swapSubKategoriOrder(subCurrent.id, subTarget.id);
      if (res.success) {
        toast.success("Urutan sub-kategori berhasil dipindahkan");
        const ref = await getKategoris();
        if (ref.success && ref.data) setKategoris(ref.data as any);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memindahkan urutan sub-kategori");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memindahkan urutan sub-kategori");
    }
  }

  // ── KATEGORI HANDLERS ───────────────────────────────────────────────
  async function handleSaveKategori(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const nama = (formData.get("nama") as string).trim();
    const deskripsi = (formData.get("deskripsi") as string).trim();
    const warna = formData.get("warna") as string;

    if (!nama) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (kategoriModal.mode === "create") {
        const res = await createKategori({
          nama,
          deskripsi,
          warna,
        });
        if (res.success && res.data) {
          toast.success("Kategori berhasil dibuat!");
          setKategoriModal({ isOpen: false, mode: "create" });
          const ref = await getKategoris();
          if (ref.success && ref.data) setKategoris(ref.data as any);
          router.refresh();
        } else {
          toast.error(res.error || "Gagal membuat kategori");
        }
      } else if (kategoriModal.data?.id) {
        const res = await updateKategori(kategoriModal.data.id, {
          nama,
          deskripsi,
          warna,
        });
        if (res.success) {
          toast.success("Kategori berhasil diperbarui!");
          setKategoriModal({ isOpen: false, mode: "create" });
          const ref = await getKategoris();
          if (ref.success && ref.data) setKategoris(ref.data as any);
          router.refresh();
        } else {
          toast.error(res.error || "Gagal memperbarui kategori");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  // ── SUB-KATEGORI HANDLERS ───────────────────────────────────────────
  async function handleSaveSub(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const nama = (formData.get("nama") as string).trim();
    const deskripsi = (formData.get("deskripsi") as string).trim();
    const parentIdVal = (formData.get("parentId") as string)?.trim() || null;

    if (!nama) {
      toast.error("Nama sub-kategori wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (subModal.mode === "create" && subModal.kategoriId) {
        const res = await createSubKategori({
          nama,
          deskripsi,
          kategoriId: subModal.kategoriId,
          parentId: parentIdVal,
        });
        if (res.success) {
          toast.success("Sub-kategori berhasil ditambahkan!");
          setSubModal({ isOpen: false, mode: "create" });
          const ref = await getKategoris();
          if (ref.success && ref.data) setKategoris(ref.data as any);
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menambahkan sub-kategori");
        }
      } else if (subModal.data?.id) {
        const res = await updateSubKategori(subModal.data.id, {
          nama,
          deskripsi,
          parentId: parentIdVal,
        });
        if (res.success) {
          toast.success("Sub-kategori berhasil diperbarui!");
          setSubModal({ isOpen: false, mode: "create" });
          const ref = await getKategoris();
          if (ref.success && ref.data) setKategoris(ref.data as any);
          router.refresh();
        } else {
          toast.error(res.error || "Gagal memperbarui sub-kategori");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  // ── DELETE CONFIRMATION ─────────────────────────────────────────────
  async function handleConfirmDelete() {
    setLoading(true);
    try {
      if (deleteConfirm.type === "kategori") {
        const res = await deleteKategori(deleteConfirm.id);
        if (res.success) {
          toast.success("Kategori berhasil dihapus");
          setKategoris((prev) => prev.filter((k) => k.id !== deleteConfirm.id));
          setDeleteConfirm({ isOpen: false, type: "kategori", id: "", nama: "" });
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menghapus kategori");
        }
      } else {
        const res = await deleteSubKategori(deleteConfirm.id);
        if (res.success) {
          toast.success("Sub-kategori berhasil dihapus");
          setDeleteConfirm({ isOpen: false, type: "sub", id: "", nama: "" });
          const ref = await getKategoris();
          if (ref.success && ref.data) setKategoris(ref.data as any);
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menghapus sub-kategori");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus");
    } finally {
      setLoading(false);
    }
  }

  // Pilihan Parent untuk modal sub-kategori berdasarkan kategori yang aktif
  const availableParentOptions = useMemo(() => {
    if (!subModal.kategoriId) return [];
    const foundIdx = kategoris.findIndex((k) => k.id === subModal.kategoriId);
    if (foundIdx === -1) return [];
    const kat = kategoris[foundIdx];
    const tree = buildSubKategoriTree(kat.subKategori as any, foundIdx + 1);
    const flat = flattenSubKategoriTree(tree);
    // Jika sedang edit, jangan tampilkan diri sendiri sebagai opsi parent
    return flat.filter((opt) => opt.id !== subModal.data?.id);
  }, [subModal.kategoriId, subModal.data?.id, kategoris]);

  // Render Sub-Kategori Table Row (Rekursif untuk Tree View)
  function renderSubCategoryRows(
    nodes: SubKategoriTreeNode[],
    kat: Kategori,
    katColor: string
  ): React.ReactNode {
    return nodes.map((node, nodeIdx) => {
      const indentClass =
        node.level === 1
          ? ""
          : node.level === 2
          ? "pl-6 sm:pl-8 border-l-2 border-slate-200"
          : "pl-10 sm:pl-14 border-l-2 border-slate-300";

      return (
        <React.Fragment key={node.id}>
          <tr className="hover:bg-slate-50/80 transition-colors group">
            {/* Sub-Kategori Name & Code */}
            <td className={`py-2.5 pr-3 ${indentClass}`}>
              <div className="flex items-center gap-2">
                <FolderOpen
                  size={14}
                  style={{ color: katColor }}
                  className="shrink-0"
                />
                <span className="font-bold text-xs text-[#a80063] tabular-nums shrink-0">
                  {node.code}
                </span>
                <span className="font-semibold text-xs text-slate-800">
                  {node.cleanName}
                </span>
              </div>
            </td>

            {/* Description */}
            <td className="py-2.5 pr-3 text-slate-400 text-[11px]">
              {node.deskripsi || "—"}
            </td>

            {/* Jumlah Dokumen */}
            <td className="py-2.5 px-2 text-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                <FileText size={10} className="text-slate-400" />
                <span>{node.totalDocCount} Dokumen</span>
              </span>
            </td>

            {/* Aksi */}
            <td className="py-2.5 pl-2 pr-1 text-right">
              <div className="flex items-center justify-end gap-1">
                {/* Pindahkan Urutan Sub-Kategori (Up / Down) */}
                <div className="flex items-center border border-slate-200/80 rounded bg-white overflow-hidden shadow-2xs mr-1">
                  <button
                    type="button"
                    disabled={nodeIdx === 0}
                    onClick={() => handleMoveSubKategori(nodes, nodeIdx, -1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Pindahkan ke Atas"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <div className="w-px h-3 bg-slate-200" />
                  <button
                    type="button"
                    disabled={nodeIdx === nodes.length - 1}
                    onClick={() => handleMoveSubKategori(nodes, nodeIdx, 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Pindahkan ke Bawah"
                  >
                    <ArrowDown size={11} />
                  </button>
                </div>

                {/* Tambah Anak Sub-Kategori */}
                <button
                  type="button"
                  onClick={() =>
                    setSubModal({
                      isOpen: true,
                      mode: "create",
                      kategoriId: kat.id,
                      parentId: node.id,
                      parentName: node.fullLabel,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10.5px] font-semibold text-[#a80063] bg-[#fdf2f8] hover:bg-[#fce7f3] border border-[#fbcfe8] transition-colors cursor-pointer min-h-[30px]"
                  title={`Tambah Anak Sub di bawah "${node.cleanName}"`}
                >
                  <FolderPlus size={12} />
                  <span className="hidden sm:inline">+ Anak</span>
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() =>
                    setSubModal({
                      isOpen: true,
                      mode: "edit",
                      kategoriId: kat.id,
                      parentId: node.parentId,
                      data: node,
                    })
                  }
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                  title="Edit Sub-Kategori"
                >
                  <Edit2 size={12} />
                </button>

                {/* Hapus */}
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: true,
                      type: "sub",
                      id: node.id,
                      nama: `${node.code} ${node.cleanName}`,
                    })
                  }
                  className="w-7 h-7 sm:w-6 sm:h-6 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Hapus Sub-Kategori"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </td>
          </tr>

          {/* Render Recursive Children (Anak & Anak Lagi) */}
          {node.children &&
            node.children.length > 0 &&
            renderSubCategoryRows(node.children, kat, katColor)}
        </React.Fragment>
      );
    });
  }

  return (
    <div className="space-y-4 w-full">
      {/* ── HEADER CARD ──────────────────────────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Kelola Kategori &amp; Sub-Kategori</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur hierarki penomoran (1., 1.1., 1.1.1.), struktur kategori, sub-kategori bertingkat, dan urutan tampilan{" "}
            <span className="font-semibold text-[#a80063]">Universitas Nusa Putra</span>
          </p>
        </div>

        <button
          onClick={() =>
            setKategoriModal({
              isOpen: true,
              mode: "create",
            })
          }
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#a80063] hover:bg-[#8c0052] active:scale-95 text-white text-xs font-semibold shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* ── EMPTY STATE ─────────────────────────────────────────────────── */}
      {kategoris.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/70">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#a80063] flex items-center justify-center mx-auto mb-3">
            <Layers size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Belum Ada Kategori Dokumen
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
            Mulai dengan menambahkan kategori utama untuk pengelompokan berkas.
          </p>
          <button
            onClick={() =>
              setKategoriModal({
                isOpen: true,
                mode: "create",
              })
            }
            className="px-4 py-2 bg-[#a80063] text-white text-xs font-semibold rounded-xl hover:bg-[#8c0052] transition-colors cursor-pointer"
          >
            Tambah Kategori Pertama
          </button>
        </div>
      )}

      {/* ── LIST KATEGORI CARDS DENGAN PENOMORAN 1., 2., DST ───────────────── */}
      <div className="space-y-4">
        {kategoris.map((kat, katIdx) => {
          const katColor = kat.warna || "#a80063";
          const isExpanded = expandedKats[kat.id];
          const katNumber = `${katIdx + 1}.`;
          const cleanKatName = stripLeadingNumber(kat.nama);

          // SubKategori Tree
          const subTree = buildSubKategoriTree(kat.subKategori as any, katIdx + 1);

          // Hitung total dokumen
          const directDocsCount = kat.dokumen?.length || 0;
          const totalDocs =
            directDocsCount +
            kat.subKategori.reduce(
              (acc, s) => acc + (s._count?.dokumen ?? 0),
              0
            );

          return (
            <div
              key={kat.id}
              className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-all"
            >
              {/* Category Header Row */}
              <div
                className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100"
                style={{ backgroundColor: `${katColor}08` }}
              >
                <div
                  onClick={() => toggleExpand(kat.id)}
                  className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-[200px]"
                >
                  <button className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                    <ChevronRight
                      size={16}
                      className={`transition-transform duration-200 ease-out transform ${
                        isExpanded ? "rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>

                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs text-xs font-bold"
                    style={{ backgroundColor: katColor }}
                  >
                    <Layers size={14} />
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug flex items-center gap-1.5">
                      <span className="text-[#a80063] font-extrabold tabular-nums">
                        {katNumber}
                      </span>
                      <span>{cleanKatName}</span>
                    </h3>
                    {kat.deskripsi && (
                      <p className="text-[10.5px] text-slate-400 line-clamp-1 font-normal">
                        {kat.deskripsi}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Badges & Actions */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${katColor}12`,
                      color: katColor,
                      borderColor: `${katColor}30`,
                    }}
                  >
                    {kat.subKategori.length} Sub &bull; {totalDocs} Dokumen
                  </span>

                  {/* Urutkan Kategori (Move Up / Down) */}
                  <div className="flex items-center border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-2xs mr-1">
                    <button
                      type="button"
                      disabled={katIdx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveKategori(katIdx, -1);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Pindahkan Kategori ke Atas"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    <button
                      type="button"
                      disabled={katIdx === kategoris.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveKategori(katIdx, 1);
                      }}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Pindahkan Kategori ke Bawah"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  {/* Tambah Sub-Kategori Tingkat Utama */}
                  <button
                    onClick={() =>
                      setSubModal({
                        isOpen: true,
                        mode: "create",
                        kategoriId: kat.id,
                        parentId: null,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#fdf2f8] hover:bg-[#fce7f3] text-[#a80063] border border-[#fbcfe8] text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Tambah Sub-Kategori Utama"
                  >
                    <FolderPlus size={12} />
                    <span>+ Sub</span>
                  </button>

                  <button
                    onClick={() =>
                      setKategoriModal({
                        isOpen: true,
                        mode: "edit",
                        data: kat,
                      })
                    }
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                    title="Edit Kategori"
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        type: "kategori",
                        id: kat.id,
                        nama: `${katNumber} ${cleanKatName}`,
                      })
                    }
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Hapus Kategori"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Sub-Kategori Table Area with Smooth CSS Grid Accordion */}
              <div
                className={`accordion-wrapper ${
                  isExpanded
                    ? "accordion-wrapper-open"
                    : "accordion-wrapper-closed"
                }`}
              >
                <div className="accordion-inner">
                  <div className="p-3 sm:p-4">
                    {/* Info Dokumen Langsung di Kategori (Jika Ada) */}
                    {directDocsCount > 0 && (
                      <div className="mb-3 px-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <FileText size={14} className="text-[#a80063]" />
                          <span className="font-semibold text-slate-800">
                            Dokumen Langsung di Kategori:
                          </span>
                          <span className="text-slate-500">
                            {directDocsCount} berkas tersimpan langsung tanpa sub-kategori
                          </span>
                        </div>
                      </div>
                    )}

                    {kat.subKategori.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Belum ada sub-kategori. Klik tombol &ldquo;+ Sub&rdquo; untuk membuat sub-kategori pertama (1.1.).
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="pb-2.5 font-bold w-2/5">Sub-Kategori &amp; Hierarki</th>
                              <th className="pb-2.5 font-bold">Deskripsi</th>
                              <th className="pb-2.5 text-center font-bold w-32">Jumlah Dokumen</th>
                              <th className="pb-2.5 text-right font-bold w-28">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {renderSubCategoryRows(subTree, kat, katColor)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL KATEGORI (CREATE / EDIT) ──────────────────────────────── */}
      {kategoriModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-modal-pop">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

            <button
              onClick={() =>
                setKategoriModal({ isOpen: false, mode: "create" })
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 sm:p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              {kategoriModal.mode === "create"
                ? "Tambah Kategori Baru"
                : "Edit Kategori"}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Kategori menjadi payung utama penomoran tingkat 1 (1., 2., dst)
            </p>

            <form onSubmit={handleSaveKategori} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  name="nama"
                  type="text"
                  required
                  defaultValue={stripLeadingNumber(kategoriModal.data?.nama || "")}
                  placeholder="Contoh: DOKUMEN PERSYARATAN & LEGALITAS"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  name="deskripsi"
                  rows={2}
                  defaultValue={kategoriModal.data?.deskripsi || ""}
                  placeholder="Keterangan kategori dokumen ini..."
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Warna Label Kategori
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <label key={c} className="cursor-pointer relative">
                      <input
                        type="radio"
                        name="warna"
                        value={c}
                        defaultChecked={
                          (kategoriModal.data?.warna || "#a80063") === c
                        }
                        className="sr-only peer"
                      />
                      <div
                        className="w-7 h-7 rounded-full border-2 border-white shadow-xs peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-slate-900 transition-all flex items-center justify-center"
                        style={{ backgroundColor: c }}
                      >
                        <Check
                          size={12}
                          className="text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setKategoriModal({ isOpen: false, mode: "create" })
                  }
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL SUB-KATEGORI (CREATE / EDIT DENGAN DUKUNGAN ANAK SUB) ─── */}
      {subModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-modal-pop">
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0" />

            <button
              onClick={() => setSubModal({ isOpen: false, mode: "create" })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 sm:p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              {subModal.mode === "create"
                ? subModal.parentId
                  ? "Tambah Anak Sub-Kategori"
                  : "Tambah Sub-Kategori Baru"
                : "Edit Sub-Kategori"}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              {subModal.parentName
                ? `Ditambahkan di bawah: ${subModal.parentName}`
                : "Sub-kategori mendukung penomoran otomatis bertingkat (1.1., 1.1.1., dst)"}
            </p>

            <form onSubmit={handleSaveSub} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Sub-Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  name="nama"
                  type="text"
                  required
                  defaultValue={stripLeadingNumber(subModal.data?.nama || "")}
                  placeholder="Contoh: Kurikulum & Capaian Pembelajaran"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Induk Sub-Kategori (Pilihan Opsional: Jadikan Anak atau Tingkat Utama) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Induk Sub-Kategori (Pilihan Opsional)
                </label>
                <select
                  name="parentId"
                  defaultValue={subModal.parentId || ""}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer font-sans"
                >
                  <option value="">(Tingkat Utama — Langsung di Bawah Kategori)</option>
                  {availableParentOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kosongkan jika ini adalah sub-kategori utama (1.1.), atau pilih induk jika ingin dijadikan anak sub-kategori (1.1.1.).
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Singkat
                </label>
                <textarea
                  name="deskripsi"
                  rows={2}
                  defaultValue={subModal.data?.deskripsi || ""}
                  placeholder="Catatan butir instrumen ini (opsional)..."
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubModal({ isOpen: false, mode: "create" })}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Menyimpan..." : "Simpan Sub-Kategori"}
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
              Hapus {deleteConfirm.type === "kategori" ? "Kategori" : "Sub-Kategori"}?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus &ldquo;{deleteConfirm.nama}&rdquo;?
              {deleteConfirm.type === "kategori"
                ? " Semua sub-kategori, anak sub-kategori, dan dokumen terkait juga akan terhapus."
                : " Anak sub-kategori dan dokumen di dalamnya juga akan terdampak."}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, type: "kategori", id: "", nama: "" })
                }
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
    </div>
  );
}
