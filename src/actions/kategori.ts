"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getKategoris() {
  try {
    const kategoris = await prisma.kategori.findMany({
      orderBy: [
        { urutan: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dokumen: {
          where: {
            subKategoriId: null,
          },
          orderBy: [
            { urutan: "asc" },
            { createdAt: "asc" },
          ],
        },
        subKategori: {
          orderBy: [
            { urutan: "asc" },
            { createdAt: "asc" },
          ],
          include: {
            _count: {
              select: {
                dokumen: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: kategoris };
  } catch (error: any) {
    console.error("Error in getKategoris:", error);
    return { success: false, error: error.message || "Gagal mengambil data kategori" };
  }
}

export async function createKategori(data: {
  nama: string;
  deskripsi?: string | null;
  warna?: string | null;
  ikon?: string | null;
  urutan?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    if (!data.nama?.trim()) {
      return { success: false, error: "Nama kategori wajib diisi" };
    }

    // Default urutan jika tidak diisi: taruh di paling akhir
    let urutan = data.urutan;
    if (urutan === undefined) {
      const lastKategori = await prisma.kategori.findFirst({
        orderBy: { urutan: "desc" },
        select: { urutan: true },
      });
      urutan = (lastKategori?.urutan ?? 0) + 1;
    }

    const kategori = await prisma.kategori.create({
      data: {
        nama: data.nama.trim(),
        deskripsi: data.deskripsi?.trim() || null,
        warna: data.warna || "#a80063",
        ikon: data.ikon || null,
        urutan,
      },
    });

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    return { success: true, data: kategori };
  } catch (error: any) {
    console.error("Error in createKategori:", error);
    return { success: false, error: error.message || "Gagal menambahkan kategori" };
  }
}

export async function updateKategori(
  id: string,
  data: {
    nama?: string;
    deskripsi?: string | null;
    warna?: string | null;
    ikon?: string | null;
    urutan?: number;
  }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    const updated = await prisma.kategori.update({
      where: { id },
      data: {
        ...(data.nama ? { nama: data.nama.trim() } : {}),
        ...(data.deskripsi !== undefined ? { deskripsi: data.deskripsi?.trim() || null } : {}),
        ...(data.warna !== undefined ? { warna: data.warna || "#a80063" } : {}),
        ...(data.ikon !== undefined ? { ikon: data.ikon || null } : {}),
        ...(data.urutan !== undefined ? { urutan: data.urutan } : {}),
      },
    });

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateKategori:", error);
    return { success: false, error: error.message || "Gagal memperbarui kategori" };
  }
}

export async function deleteKategori(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    // Cascade delete akan otomatis menghapus subKategori dan dokumen di dalamnya
    await prisma.kategori.delete({
      where: { id },
    });

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteKategori:", error);
    return { success: false, error: error.message || "Gagal menghapus kategori" };
  }
}

export async function createSubKategori(data: {
  nama: string;
  deskripsi?: string | null;
  urutan?: number;
  kategoriId: string;
  parentId?: string | null;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    if (!data.nama?.trim()) {
      return { success: false, error: "Nama sub-kategori wajib diisi" };
    }
    if (!data.kategoriId) {
      return { success: false, error: "Kategori ID wajib disertakan" };
    }

    let urutan = data.urutan;
    if (urutan === undefined) {
      const lastSub = await prisma.subKategori.findFirst({
        where: {
          kategoriId: data.kategoriId,
          parentId: data.parentId || null,
        },
        orderBy: { urutan: "desc" },
        select: { urutan: true },
      });
      urutan = (lastSub?.urutan ?? 0) + 1;
    }

    const sub = await prisma.subKategori.create({
      data: {
        nama: data.nama.trim(),
        deskripsi: data.deskripsi?.trim() || null,
        kategoriId: data.kategoriId,
        parentId: data.parentId || null,
        urutan,
      },
    });

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    return { success: true, data: sub };
  } catch (error: any) {
    console.error("Error in createSubKategori:", error);
    return { success: false, error: error.message || "Gagal menambahkan sub-kategori" };
  }
}

export async function updateSubKategori(
  id: string,
  data: {
    nama?: string;
    deskripsi?: string | null;
    urutan?: number;
    kategoriId?: string;
    parentId?: string | null;
  }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    const updated = await prisma.subKategori.update({
      where: { id },
      data: {
        ...(data.nama ? { nama: data.nama.trim() } : {}),
        ...(data.deskripsi !== undefined ? { deskripsi: data.deskripsi?.trim() || null } : {}),
        ...(data.urutan !== undefined ? { urutan: data.urutan } : {}),
        ...(data.kategoriId ? { kategoriId: data.kategoriId } : {}),
        ...(data.parentId !== undefined ? { parentId: data.parentId || null } : {}),
      },
    });

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateSubKategori:", error);
    return { success: false, error: error.message || "Gagal memperbarui sub-kategori" };
  }
}

export async function deleteSubKategori(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    await prisma.subKategori.delete({
      where: { id },
    });

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteSubKategori:", error);
    return { success: false, error: error.message || "Gagal menghapus sub-kategori" };
  }
}

export async function reorderKategori(items: { id: string; urutan: number }[]) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.kategori.update({
          where: { id: item.id },
          data: { urutan: item.urutan },
        })
      )
    );

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in reorderKategori:", error);
    return { success: false, error: error.message || "Gagal mengubah urutan kategori" };
  }
}

export async function swapKategoriOrder(id1: string, id2: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    const [kat1, kat2] = await Promise.all([
      prisma.kategori.findUnique({ where: { id: id1 }, select: { id: true, urutan: true } }),
      prisma.kategori.findUnique({ where: { id: id2 }, select: { id: true, urutan: true } }),
    ]);

    if (!kat1 || !kat2) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    let u1 = kat1.urutan;
    let u2 = kat2.urutan;
    if (u1 === u2) {
      u2 = u1 + 1;
    }

    await prisma.$transaction([
      prisma.kategori.update({
        where: { id: id1 },
        data: { urutan: u2 },
      }),
      prisma.kategori.update({
        where: { id: id2 },
        data: { urutan: u1 },
      }),
    ]);

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in swapKategoriOrder:", error);
    return { success: false, error: error.message || "Gagal mengubah urutan kategori" };
  }
}

export async function swapSubKategoriOrder(id1: string, id2: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    const [sub1, sub2] = await Promise.all([
      prisma.subKategori.findUnique({ where: { id: id1 }, select: { id: true, urutan: true } }),
      prisma.subKategori.findUnique({ where: { id: id2 }, select: { id: true, urutan: true } }),
    ]);

    if (!sub1 || !sub2) {
      return { success: false, error: "Sub-kategori tidak ditemukan" };
    }

    let u1 = sub1.urutan;
    let u2 = sub2.urutan;
    if (u1 === u2) {
      u2 = u1 + 1;
    }

    await prisma.$transaction([
      prisma.subKategori.update({
        where: { id: id1 },
        data: { urutan: u2 },
      }),
      prisma.subKategori.update({
        where: { id: id2 },
        data: { urutan: u1 },
      }),
    ]);

    revalidatePath("/kategori");
    revalidatePath("/dokumen");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in swapSubKategoriOrder:", error);
    return { success: false, error: error.message || "Gagal mengubah urutan sub-kategori" };
  }
}
