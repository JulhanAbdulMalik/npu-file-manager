"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  createKategori,
  updateKategori,
  deleteKategori,
  createSubKategori,
  updateSubKategori,
  deleteSubKategori,
} from "@/actions/kategori";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  _count?: { dokumen: number };
}

interface Kategori {
  id: string;
  nama: string;
  deskripsi?: string | null;
  warna?: string | null;
  ikon?: string | null;
  urutan: number;
  subKategori: SubKategori[];
}

interface KategoriManagerProps {
  initialKategoris: Kategori[];
}

export default function KategoriManager({ initialKategoris }: KategoriManagerProps) {
  const router = useRouter();
  const [kategoris, setKategoris] = useState<Kategori[]>(initialKategoris);
  const [expandedKats, setExpandedKats] = useState<Record<string, boolean>>(() => {
    // Default open all
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
    data?: Partial<SubKategori>;
  }>({ isOpen: false, mode: "create" });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: "kategori" | "sub";
    id: string;
    nama: string;
  }>({ isOpen: false, type: "kategori", id: "", nama: "" });

  const [loading, setLoading] = useState(false);

  function toggleExpand(id: string) {
    setExpandedKats((prev) => ({ ...prev, [id]: !prev[id] }));
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
        });
        if (res.success) {
          toast.success("Sub-kategori berhasil ditambahkan!");
          setSubModal({ isOpen: false, mode: "create" });
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menambahkan sub-kategori");
        }
      } else if (subModal.data?.id) {
        const res = await updateSubKategori(subModal.data.id, {
          nama,
          deskripsi,
        });
        if (res.success) {
          toast.success("Sub-kategori berhasil diperbarui!");
          setSubModal({ isOpen: false, mode: "create" });
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
          toast.success("Kategori berhasil dihapus!");
          setDeleteConfirm({ isOpen: false, type: "kategori", id: "", nama: "" });
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menghapus kategori");
        }
      } else {
        const res = await deleteSubKategori(deleteConfirm.id);
        if (res.success) {
          toast.success("Sub-kategori berhasil dihapus!");
          setDeleteConfirm({ isOpen: false, type: "kategori", id: "", nama: "" });
          router.refresh();
        } else {
          toast.error(res.error || "Gagal menghapus sub-kategori");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── 1. TOP GREETING & ACTION HEADER ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
            Kelola Kategori & Sub-Kategori
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Atur hierarki struktur kategori & sub-kategori dokumen{" "}
            <span className="font-semibold text-[#a80063]">
              Universitas Nusa Putra
            </span>
          </p>
        </div>

        <button
          onClick={() =>
            setKategoriModal({
              isOpen: true,
              mode: "create",
              data: { warna: "#a80063" },
            })
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-[11px] font-semibold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={13} />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* ── 2. KATEGORI LIST & HIERARCHY ───────────────────────────────── */}
      <div className="space-y-3.5">
        {initialKategoris.map((kat) => {
          const isExpanded = expandedKats[kat.id] ?? true;
          const katColor = kat.warna || "#a80063";
          const totalDocs = kat.subKategori.reduce(
            (sum, s) => sum + (s._count?.dokumen || 0),
            0
          );

          return (
            <div
              key={kat.id}
              className="duralux-card bg-white overflow-hidden"
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
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug">
                      {kat.nama}
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

                  <button
                    onClick={() =>
                      setSubModal({
                        isOpen: true,
                        mode: "create",
                        kategoriId: kat.id,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#fdf2f8] hover:bg-[#fce7f3] text-[#a80063] border border-[#fbcfe8] text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Tambah Sub-Kategori"
                  >
                    <FolderPlus size={12} />
                    <span>Tambah Sub</span>
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
                        nama: kat.nama,
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
                    {kat.subKategori.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Belum ada sub-kategori. Klik tombol &ldquo;Tambah Sub&rdquo; untuk membuat sub-kategori pertama.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="pb-2.5 font-bold w-1/3">Sub-Kategori</th>
                              <th className="pb-2.5 font-bold">Deskripsi</th>
                              <th className="pb-2.5 text-center font-bold w-32">Jumlah Dokumen</th>
                              <th className="pb-2.5 text-right font-bold w-20">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {kat.subKategori.map((sub, sIdx) => (
                              <tr
                                key={sub.id}
                                className="hover:bg-slate-50/70 transition-colors group"
                              >
                                {/* Sub-Kategori Name */}
                                <td className="py-2.5 pr-3">
                                  <div className="flex items-center gap-2">
                                    <FolderOpen
                                      size={14}
                                      style={{ color: katColor }}
                                      className="shrink-0"
                                    />
                                    <span className="font-semibold text-xs text-slate-800">
                                      {sIdx + 1}. {sub.nama}
                                    </span>
                                  </div>
                                </td>

                                {/* Description */}
                                <td className="py-2.5 pr-3 text-slate-400 text-[11px]">
                                  {sub.deskripsi || "—"}
                                </td>

                                {/* Jumlah Dokumen */}
                                <td className="py-2.5 px-2 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                    <FileText size={10} className="text-slate-400" />
                                    <span>{sub._count?.dokumen ?? 0} berkas</span>
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-2.5 pl-2 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        setSubModal({
                                          isOpen: true,
                                          mode: "edit",
                                          kategoriId: kat.id,
                                          data: sub,
                                        })
                                      }
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                      title="Edit Sub-Kategori"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteConfirm({
                                          isOpen: true,
                                          type: "sub",
                                          id: sub.id,
                                          nama: sub.nama,
                                        })
                                      }
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                      title="Hapus Sub-Kategori"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
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

      {/* ── MODAL KATEGORI (CREATE / EDIT) ─────────────────────────────── */}
      {kategoriModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-modal-pop">
            <button
              onClick={() => setKategoriModal({ isOpen: false, mode: "create" })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              {kategoriModal.mode === "create"
                ? "Tambah Kategori Baru"
                : "Edit Kategori"}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Kategori mewakili kelompok atau kegiatan utama dokumen
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
                  defaultValue={kategoriModal.data?.nama || ""}
                  placeholder="Contoh: DOKUMEN KEGIATAN & ARSIP"
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
                  placeholder="Keterangan standar dokumen ini..."
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

      {/* ── MODAL SUB-KATEGORI (CREATE / EDIT) ──────────────────────────── */}
      {subModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-modal-pop">
            <button
              onClick={() => setSubModal({ isOpen: false, mode: "create" })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              {subModal.mode === "create"
                ? "Tambah Sub-Kategori Baru"
                : "Edit Sub-Kategori"}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Sub-kategori mengelompokkan butir dokumen spesifik
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
                  defaultValue={subModal.data?.nama || ""}
                  placeholder="Contoh: Kurikulum & Capaian Pembelajaran"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan
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
              {deleteConfirm.type === "kategori" &&
                " Semua sub-kategori dan dokumen terkait juga akan terdampak."}
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
