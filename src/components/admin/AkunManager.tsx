"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  ShieldCheck,
  Shield,
  Edit2,
  Trash2,
  KeyRound,
  X,
  AlertCircle,
  Mail,
  User as UserIcon,
  Layers,
} from "lucide-react";
import {
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} from "@/actions/user";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  kategoriId?: string | null;
  createdAt: Date;
  kategori?: {
    id: string;
    nama: string;
    warna?: string | null;
  } | null;
}

interface KategoriItem {
  id: string;
  nama: string;
  warna?: string | null;
}

interface AkunManagerProps {
  initialUsers: UserItem[];
  kategoris: KategoriItem[];
  currentUserId?: string;
}

export default function AkunManager({
  initialUsers,
  kategoris,
  currentUserId,
}: AkunManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);

  // Modals
  const [userModal, setUserModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data?: Partial<UserItem>;
  }>({ isOpen: false, mode: "create" });

  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    user?: UserItem;
  }>({ isOpen: false });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    nama: string;
  }>({ isOpen: false, id: "", nama: "" });

  const [loading, setLoading] = useState(false);

  // Form State for Role & Kategori
  const [formRole, setFormRole] = useState<Role>(Role.ADMIN);
  const [formKategoriId, setFormKategoriId] = useState<string>("");

  function openCreateModal() {
    setUserModal({ isOpen: true, mode: "create" });
    setFormRole(Role.ADMIN);
    setFormKategoriId("");
  }

  function openEditModal(user: UserItem) {
    setUserModal({ isOpen: true, mode: "edit", data: user });
    setFormRole(user.role);
    setFormKategoriId(user.kategoriId || "");
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = (formData.get("password") as string)?.trim();

    if (!name) {
      toast.error("Nama pengguna wajib diisi");
      return;
    }
    if (!email) {
      toast.error("Email wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (userModal.mode === "create") {
        if (!password) {
          toast.error("Password wajib diisi untuk akun baru");
          setLoading(false);
          return;
        }

        const res = await createUser({
          name,
          email,
          password,
          role: formRole,
          kategoriId: formRole === Role.ADMIN && formKategoriId ? formKategoriId : null,
        });

        if (res.success && res.data) {
          toast.success("Akun pengelola berhasil dibuat!");
          setUserModal({ isOpen: false, mode: "create" });
          router.refresh();
        } else {
          toast.error(res.error || "Gagal membuat akun");
        }
      } else if (userModal.data?.id) {
        const res = await updateUser(userModal.data.id, {
          name,
          email,
          password: password || undefined,
          role: formRole,
          kategoriId: formRole === Role.ADMIN && formKategoriId ? formKategoriId : null,
        });

        if (res.success) {
          toast.success("Akun berhasil diperbarui!");
          setUserModal({ isOpen: false, mode: "create" });
          router.refresh();
        } else {
          toast.error(res.error || "Gagal memperbarui akun");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan akun");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModal.user) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newPassword = (formData.get("newPassword") as string).trim();
    const confirmPassword = (formData.get("confirmPassword") as string).trim();

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(passwordModal.user.id, newPassword);
      if (res.success) {
        toast.success("Password berhasil diubah!");
        setPasswordModal({ isOpen: false });
      } else {
        toast.error(res.error || "Gagal mengubah password");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengubah password");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm.id) return;
    setLoading(true);
    try {
      const res = await deleteUser(deleteConfirm.id);
      if (res.success) {
        toast.success("Akun berhasil dihapus!");
        setDeleteConfirm({ isOpen: false, id: "", nama: "" });
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus akun");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menghapus akun");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kelola Akun Pengelola
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hak akses akun Super Administrator dan Administrator
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-bold rounded-xl shadow-xs shadow-[#a80063]/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>+ Tambah Akun Baru</span>
        </button>
      </div>

      {/* ── USERS TABLE ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#a80063]" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">
              Daftar Pengguna Aktif
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Total <strong className="text-slate-800">{initialUsers.length}</strong> akun
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Penugasan Kategori</th>
                <th className="py-3 px-4">Terdaftar</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialUsers.map((user) => {
                const isSuper = user.role === Role.SUPER_ADMIN;
                const isCurrent = user.id === currentUserId;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Nama */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#a80063] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">
                            {user.name}
                            {isCurrent && (
                              <span className="ml-1.5 text-[9.5px] px-1.5 py-0.2 rounded bg-pink-100 text-[#a80063] font-semibold">
                                Anda
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#fdf2f8] text-[#a80063] border border-[#fbcfe8]">
                          <ShieldCheck size={12} />
                          <span>Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Shield size={12} />
                          <span>Administrator</span>
                        </span>
                      )}
                    </td>

                    {/* Kategori assignment */}
                    <td className="py-3.5 px-4">
                      {isSuper ? (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Seluruh Kategori (Penuh)
                        </span>
                      ) : user.kategori ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border truncate max-w-[180px]"
                          style={{
                            backgroundColor: `${user.kategori.warna || "#a80063"}15`,
                            color: user.kategori.warna || "#a80063",
                            borderColor: `${user.kategori.warna || "#a80063"}30`,
                          }}
                        >
                          <Layers size={11} />
                          <span>{user.kategori.nama}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Belum ditentukan
                        </span>
                      )}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() =>
                            setPasswordModal({ isOpen: true, user })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Ubah Password"
                        >
                          <KeyRound size={14} />
                        </button>

                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Akun"
                        >
                          <Edit2 size={14} />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                isOpen: true,
                                id: user.id,
                                nama: user.name,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Akun"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL TAMBAH / EDIT AKUN ─────────────────────────────────────── */}
      {userModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop transition-opacity">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-modal-pop">
            <button
              onClick={() => setUserModal({ isOpen: false, mode: "create" })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {userModal.mode === "create" ? "Tambah Akun Pengelola" : "Edit Akun Pengelola"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atur hak akses akun pengelola sistem NPU File Manager
            </p>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={userModal.data?.name || ""}
                    placeholder="Nama lengkap pengelola"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-[#a80063] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={userModal.data?.email || ""}
                    placeholder="nama@nusaputra.ac.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-[#a80063] outline-none"
                  />
                </div>
              </div>

              {/* Password (wajib jika create, opsional jika edit) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {userModal.mode === "create" ? (
                    <>
                      Password <span className="text-rose-500">*</span>
                    </>
                  ) : (
                    "Ganti Password (Kosongkan jika tidak diubah)"
                  )}
                </label>
                <input
                  name="password"
                  type="password"
                  required={userModal.mode === "create"}
                  placeholder={userModal.mode === "create" ? "Minimal 6 karakter" : "Password baru..."}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-[#a80063] outline-none"
                />
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran (Role Akses) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-[#a80063] outline-none"
                >
                  <option value={Role.ADMIN}>Administrator</option>
                  <option value={Role.SUPER_ADMIN}>Super Administrator (Akses Penuh)</option>
                </select>
              </div>

              {/* Kategori assignment (jika role ADMIN) */}
              {formRole === Role.ADMIN && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penugasan Kategori Tertentu (Opsional)
                  </label>
                  <select
                    value={formKategoriId}
                    onChange={(e) => setFormKategoriId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-[#a80063] outline-none"
                  >
                    <option value="">Semua Kategori</option>
                    {kategoris.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModal({ isOpen: false, mode: "create" })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL UBAH PASSWORD ────────────────────────────────────────── */}
      {passwordModal.isOpen && passwordModal.user && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop transition-opacity">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-modal-pop">
            <button
              onClick={() => setPasswordModal({ isOpen: false })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <KeyRound size={20} />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Ubah Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ubah kata sandi akun &ldquo;<strong>{passwordModal.user.name}</strong>&rdquo;
            </p>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-[#a80063] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 focus:border-[#a80063] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModal({ isOpen: false })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Ubah Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ──────────────────────────────────── */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop transition-opacity">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative text-center animate-modal-pop">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Hapus Akun Pengelola?
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Anda akan menghapus akun &ldquo;<strong className="text-slate-800">{deleteConfirm.nama}</strong>&rdquo;. Pengguna ini tidak akan bisa login lagi ke sistem.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, id: "", nama: "" })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Menghapus..." : "Ya, Hapus Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
