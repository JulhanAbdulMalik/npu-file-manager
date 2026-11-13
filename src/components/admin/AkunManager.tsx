"use client";

import { useState, useMemo } from "react";
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
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import TablePagination from "@/components/common/TablePagination";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  kategoriId?: string | null;
  createdAt: Date | string;
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

type SortColumn = "NAME" | "EMAIL" | "ROLE" | "CREATED_AT";

export default function AkunManager({
  initialUsers,
  kategoris,
  currentUserId,
}: AkunManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);

  // Filters (Identik DokumenManager)
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | Role>("ALL");
  const [filterKategori, setFilterKategori] = useState("ALL");

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>("CREATED_AT");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Counts for pipeline breakdown
  const totalCount = users.length;
  const superCount = useMemo(
    () => users.filter((u) => u.role === Role.SUPER_ADMIN).length,
    [users]
  );
  const adminCount = useMemo(
    () => users.filter((u) => u.role === Role.ADMIN).length,
    [users]
  );

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();

    const filtered = users.filter((user) => {
      // Role Filter
      if (filterRole !== "ALL" && user.role !== filterRole) {
        return false;
      }

      // Kategori Filter
      if (filterKategori !== "ALL") {
        if (user.role === Role.SUPER_ADMIN) {
          // Super admin has full access to all categories
        } else if (user.kategoriId !== filterKategori) {
          return false;
        }
      }

      // Search Query
      if (q) {
        const matchName = user.name.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchKat = user.kategori?.nama.toLowerCase().includes(q) || false;
        if (!matchName && !matchEmail && !matchKat) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case "NAME":
          comparison = a.name.localeCompare(b.name, "id");
          break;
        case "EMAIL":
          comparison = a.email.localeCompare(b.email, "id");
          break;
        case "ROLE":
          comparison = a.role.localeCompare(b.role);
          break;
        case "CREATED_AT":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "ASC" ? comparison : -comparison;
    });

    return filtered;
  }, [users, search, filterRole, filterKategori, sortColumn, sortDir]);

  // Paginated Slice
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortColumn(col);
      setSortDir("ASC");
    }
    setCurrentPage(1);
  }

  function getSortIcon(col: SortColumn) {
    if (sortColumn !== col) {
      return <ArrowUpDown size={12} className="text-slate-300" />;
    }
    return sortDir === "ASC" ? (
      <ArrowUp size={12} className="text-[#a80063]" />
    ) : (
      <ArrowDown size={12} className="text-[#a80063]" />
    );
  }

  // ── SAVE USER HANDLER ──────────────────────────────────────────────
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
          setUsers((prev) => [res.data as any, ...prev]);
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

        if (res.success && res.data) {
          toast.success("Akun berhasil diperbarui!");
          setUsers((prev) =>
            prev.map((u) => (u.id === userModal.data?.id ? (res.data as any) : u))
          );
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

  // ── CHANGE PASSWORD HANDLER ─────────────────────────────────────────
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

  // ── DELETE USER HANDLER ─────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!deleteConfirm.id) return;
    setLoading(true);
    try {
      const res = await deleteUser(deleteConfirm.id);
      if (res.success) {
        toast.success("Akun berhasil dihapus!");
        setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
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
    <div className="space-y-4">
      {/* ── 1. TOP HEADER (Identik CDU Portal Page Header & DokumenManager) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
            Kelola Akun Pengguna
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Hak akses akun Super Administrator dan Administrator{" "}
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
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* ── 2. STANDARDIZED SINGLE-ROW FILTER TOOLBAR (Identik DokumenManager) ── */}
      <div className="bg-white p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Search Box & Segmented Role Filter Tabs */}
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
                placeholder="Cari akun / email..."
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

            {/* Segmented Role Tabs (Identik Status Tabs di DokumenManager) */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setFilterRole("ALL");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterRole === "ALL"
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
                  setFilterRole(Role.SUPER_ADMIN);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterRole === Role.SUPER_ADMIN
                    ? "bg-[#fdf2f8] text-[#a80063] border border-[#fbcfe8] shadow-2xs"
                    : "text-slate-600 hover:text-[#a80063] hover:bg-[#fdf2f8]/50"
                }`}
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck size={11} className="text-[#a80063]" />
                  <span>Super Admin</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#fce7f3] text-[#a80063] font-extrabold">
                  {superCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterRole(Role.ADMIN);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterRole === Role.ADMIN
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                    : "text-slate-600 hover:text-blue-700 hover:bg-blue-50/50"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Shield size={11} className="text-blue-600" />
                  <span>Admin</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-extrabold">
                  {adminCount}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Kategori Filter & Reset (Identik DokumenManager) */}
          <div className="flex items-center gap-2">
            <select
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-[#fbcfe8] cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {kategoris.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>

            {(search || filterRole !== "ALL" || filterKategori !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterRole("ALL");
                  setFilterKategori("ALL");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-[#a80063] hover:bg-[#fdf2f8] rounded-md transition-colors cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw size={12} />
                <span className="text-[11px]">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. STANDARDIZED DATA TABLE (CDU Portal Monitoring Standard) ──── */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              <tr>
                {/* Simple No Column */}
                <th className="py-2.5 px-3 text-center w-12 font-bold">
                  NO
                </th>

                {/* Nama Pengguna */}
                <th
                  onClick={() => handleSort("NAME")}
                  className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Pengguna</span>
                    {getSortIcon("NAME")}
                  </div>
                </th>

                {/* Email Login */}
                <th
                  onClick={() => handleSort("EMAIL")}
                  className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email Login</span>
                    {getSortIcon("EMAIL")}
                  </div>
                </th>

                {/* Peran / Role */}
                <th
                  onClick={() => handleSort("ROLE")}
                  className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/60 transition-colors w-36"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Peran (Role)</span>
                    {getSortIcon("ROLE")}
                  </div>
                </th>

                {/* Penugasan Kategori */}
                <th className="py-2.5 px-3.5 w-48">
                  Penugasan Kategori
                </th>

                {/* Terdaftar */}
                <th
                  onClick={() => handleSort("CREATED_AT")}
                  className="py-2.5 px-3.5 cursor-pointer hover:bg-slate-100/60 transition-colors w-32"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Terdaftar</span>
                    {getSortIcon("CREATED_AT")}
                  </div>
                </th>

                {/* Aksi */}
                <th className="py-2.5 px-3 text-center w-24">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Users size={18} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Tidak ada akun yang sesuai dengan filter
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba ganti kata kunci pencarian atau ubah filter peran & kategori
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const isSuper = user.role === Role.SUPER_ADMIN;
                  const isCurrent = user.id === currentUserId;
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Simple Number */}
                      <td className="py-2.5 px-3 text-center font-medium text-slate-400 text-xs">
                        {rowNumber}
                      </td>

                      {/* Nama Pengguna with Avatar */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#a80063] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-snug truncate">
                              {user.name}
                              {isCurrent && (
                                <span className="ml-1.5 text-[9.5px] px-1.5 py-0.2 rounded-md bg-[#fdf2f8] text-[#a80063] border border-[#fbcfe8] font-bold">
                                  Anda
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email Login */}
                      <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                        {user.email}
                      </td>

                      {/* Role Badge (Identik CDU Portal) */}
                      <td className="py-2.5 px-3.5">
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

                      {/* Penugasan Kategori */}
                      <td className="py-2.5 px-3.5">
                        {isSuper ? (
                          <span className="text-[11px] text-slate-400 font-medium">
                            Seluruh Kategori (Penuh)
                          </span>
                        ) : user.kategori ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border truncate max-w-[190px]"
                            style={{
                              backgroundColor: `${user.kategori.warna || "#a80063"}15`,
                              color: user.kategori.warna || "#a80063",
                              borderColor: `${user.kategori.warna || "#a80063"}30`,
                            }}
                          >
                            <Layers size={11} />
                            <span className="truncate">{user.kategori.nama}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Belum ditentukan
                          </span>
                        )}
                      </td>

                      {/* Terdaftar */}
                      <td className="py-2.5 px-3.5 text-slate-400 text-[11px] font-medium">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Aksi (Simpel Icon-Only ala CDU Portal) */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPasswordModal({ isOpen: true, user })}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Ubah Password"
                          >
                            <KeyRound size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Akun"
                          >
                            <Edit2 size={13} />
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  isOpen: true,
                                  id: user.id,
                                  nama: user.name,
                                })
                              }
                              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. INTEGRATED STANDARDIZED PAGINATION ─────────────────────── */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => setPageSize(size)}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* ── 5. MODAL TAMBAH / EDIT AKUN (Wider max-w-2xl ala DokumenManager) ── */}
      {userModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-opacity overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 animate-modal-pop">
            <button
              onClick={() => setUserModal({ isOpen: false, mode: "create" })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              {userModal.mode === "create" ? "Tambah Akun Pengelola" : "Edit Akun Pengelola"}
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Atur hak akses akun pengelola sistem NPU File Manager
            </p>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={userModal.data?.name || ""}
                    placeholder="Contoh: Julhan Abdul Malik"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Email Akun */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={userModal.data?.email || ""}
                    placeholder="nama@nusaputra.ac.id"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password (wajib jika create, opsional jika edit) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {userModal.mode === "create" ? (
                    <>
                      Password <span className="text-rose-500">*</span>
                    </>
                  ) : (
                    "Ganti Password (Kosongkan jika tidak ingin diubah)"
                  )}
                </label>
                <input
                  name="password"
                  type="password"
                  required={userModal.mode === "create"}
                  placeholder={userModal.mode === "create" ? "Minimal 6 karakter" : "Masukkan password baru..."}
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Role & Penugasan Kategori in 2-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Peran (Role Akses) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as Role)}
                    className="w-full px-2.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer"
                  >
                    <option value={Role.ADMIN}>Administrator</option>
                    <option value={Role.SUPER_ADMIN}>Super Administrator (Akses Penuh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Penugasan Kategori
                  </label>
                  <select
                    value={formRole === Role.SUPER_ADMIN ? "" : formKategoriId}
                    onChange={(e) => setFormKategoriId(e.target.value)}
                    disabled={formRole === Role.SUPER_ADMIN}
                    className="w-full px-2.5 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-100"
                  >
                    {formRole === Role.SUPER_ADMIN ? (
                      <option value="">Seluruh Kategori (Penuh)</option>
                    ) : (
                      <>
                        <option value="">Semua Kategori</option>
                        {kategoris.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.nama}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModal({ isOpen: false, mode: "create" })}
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
                    : userModal.mode === "create"
                    ? "Simpan Akun"
                    : "Perbarui Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. MODAL UBAH PASSWORD ─────────────────────────────────────── */}
      {passwordModal.isOpen && passwordModal.user && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 transition-opacity overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8 animate-modal-pop">
            <button
              onClick={() => setPasswordModal({ isOpen: false })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <KeyRound size={18} />
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
              Ubah Password
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Ubah kata sandi akun &ldquo;<strong>{passwordModal.user.name}</strong>&rdquo;
            </p>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Konfirmasi Password Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2 bg-slate-50 text-xs text-slate-800 rounded-lg border border-slate-200 focus:border-[#a80063] focus:bg-white focus:ring-1 focus:ring-[#a80063]/20 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModal({ isOpen: false })}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-[#a80063] hover:bg-[#8c0052] text-white text-xs font-semibold rounded-lg shadow-xs shadow-[#a80063]/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. MODAL DELETE CONFIRMATION ─────────────────────────────────── */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center animate-modal-pop">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Hapus Akun?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin menghapus akun &ldquo;<strong>{deleteConfirm.nama}</strong>&rdquo;? Tindakan ini tidak dapat dibatalkan.
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
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
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
