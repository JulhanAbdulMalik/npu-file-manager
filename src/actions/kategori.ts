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
        where: { kategoriId: data.kategoriId },
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
    return { success: true };
  } catch (error: any) {
    console.error("Error in reorderKategori:", error);
    return { success: false, error: error.message || "Gagal mengubah urutan kategori" };
  }
}
