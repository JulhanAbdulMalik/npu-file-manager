"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { extractDriveFileId } from "@/lib/drive";
import { StatusDok } from "@prisma/client";

export async function getDokumens(params?: {
  kategoriId?: string;
  subKategoriId?: string;
  search?: string;
  status?: StatusDok;
}) {
  try {
    const where: any = {};

    if (params?.kategoriId && params.kategoriId !== "ALL") {
      where.kategoriId = params.kategoriId;
    }

    if (params?.subKategoriId && params.subKategoriId !== "ALL") {
      if (params.subKategoriId === "DIRECT") {
        where.subKategoriId = null;
      } else {
        where.subKategoriId = params.subKategoriId;
      }
    }

    if (params?.status && (params.status as any) !== "ALL") {
      where.status = params.status;
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { nama: { contains: q, mode: "insensitive" } },
        { deskripsi: { contains: q, mode: "insensitive" } },
      ];
    }

    const dokumens = await prisma.dokumen.findMany({
      where,
      orderBy: [
        { urutan: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            warna: true,
            ikon: true,
            urutan: true,
          },
        },
        subKategori: {
          include: {
            parent: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: dokumens };
  } catch (error: any) {
    console.error("Error in getDokumens:", error);
    return { success: false, error: error.message || "Gagal mengambil data dokumen" };
  }
}

export async function getDokumenById(id: string) {
  try {
    const dokumen = await prisma.dokumen.findUnique({
      where: { id },
      include: {
        kategori: true,
        subKategori: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!dokumen) {
      return { success: false, error: "Dokumen tidak ditemukan" };
    }

    return { success: true, data: dokumen };
  } catch (error: any) {
    console.error("Error in getDokumenById:", error);
    return { success: false, error: error.message || "Gagal mengambil detail dokumen" };
  }
}

export async function createDokumen(data: {
  nama: string;
  deskripsi?: string | null;
  linkDrive: string;
  kategoriId: string;
  subKategoriId?: string | null;
  status?: StatusDok;
  urutan?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    if (!data.nama?.trim()) {
      return { success: false, error: "Nama dokumen wajib diisi" };
    }
    if (!data.linkDrive?.trim()) {
      return { success: false, error: "Tautan Google Drive wajib diisi" };
    }
    if (!data.kategoriId) {
      return { success: false, error: "Kategori wajib dipilih" };
    }

    // Ekstrak driveFileId otomatis dari linkDrive
    const driveFileId = extractDriveFileId(data.linkDrive.trim());

    const cleanSubKategoriId = data.subKategoriId && data.subKategoriId.trim() ? data.subKategoriId.trim() : null;

    let urutan = data.urutan;
    if (urutan === undefined) {
      const lastDoc = await prisma.dokumen.findFirst({
        where: {
          kategoriId: data.kategoriId,
          subKategoriId: cleanSubKategoriId,
        },
        orderBy: { urutan: "desc" },
        select: { urutan: true },
      });
      urutan = (lastDoc?.urutan ?? 0) + 1;
    }

    const dokumen = await prisma.dokumen.create({
      data: {
        nama: data.nama.trim(),
        deskripsi: data.deskripsi?.trim() || null,
        linkDrive: data.linkDrive.trim(),
        driveFileId,
        status: data.status || StatusDok.BELUM,
        urutan,
        kategoriId: data.kategoriId,
        subKategoriId: cleanSubKategoriId,
        uploadedById: session.user.id || null,
      },
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            warna: true,
            ikon: true,
            urutan: true,
          },
        },
        subKategori: {
          include: {
            parent: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/dokumen");
    revalidatePath("/kategori");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, data: dokumen };
  } catch (error: any) {
    console.error("Error in createDokumen:", error);
    return { success: false, error: error.message || "Gagal menambahkan dokumen" };
  }
}

export async function updateDokumen(
  id: string,
  data: {
    nama?: string;
    deskripsi?: string | null;
    linkDrive?: string;
    kategoriId?: string;
    subKategoriId?: string | null;
    status?: StatusDok;
    urutan?: number;
  }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    const updateData: any = {};
    if (data.nama) updateData.nama = data.nama.trim();
    if (data.deskripsi !== undefined) updateData.deskripsi = data.deskripsi?.trim() || null;
    if (data.status) updateData.status = data.status;
    if (data.urutan !== undefined) updateData.urutan = data.urutan;
    if (data.kategoriId) updateData.kategoriId = data.kategoriId;

    if (data.subKategoriId !== undefined) {
      updateData.subKategoriId =
        data.subKategoriId && data.subKategoriId.trim() ? data.subKategoriId.trim() : null;
    }

    if (data.linkDrive) {
      updateData.linkDrive = data.linkDrive.trim();
      updateData.driveFileId = extractDriveFileId(data.linkDrive.trim());
    }

    const updated = await prisma.dokumen.update({
      where: { id },
      data: updateData,
      include: {
        kategori: {
          select: {
            id: true,
            nama: true,
            warna: true,
            ikon: true,
            urutan: true,
          },
        },
        subKategori: {
          include: {
            parent: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/dokumen");
    revalidatePath("/kategori");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateDokumen:", error);
    return { success: false, error: error.message || "Gagal memperbarui dokumen" };
  }
}

export async function deleteDokumen(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    await prisma.dokumen.delete({
      where: { id },
    });

    revalidatePath("/dokumen");
    revalidatePath("/kategori");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteDokumen:", error);
    return { success: false, error: error.message || "Gagal menghapus dokumen" };
  }
}

export async function updateStatusDokumen(
  id: string,
  status: StatusDok
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    const updated = await prisma.dokumen.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/dokumen");
    revalidatePath("/kategori");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateStatusDokumen:", error);
    return { success: false, error: error.message || "Gagal memperbarui status dokumen" };
  }
}

export async function swapDokumenOrder(id1: string, id2: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak: Silakan masuk terlebih dahulu" };
    }

    const [doc1, doc2] = await Promise.all([
      prisma.dokumen.findUnique({ where: { id: id1 }, select: { id: true, urutan: true } }),
      prisma.dokumen.findUnique({ where: { id: id2 }, select: { id: true, urutan: true } }),
    ]);

    if (!doc1 || !doc2) {
      return { success: false, error: "Dokumen tidak ditemukan" };
    }

    let u1 = doc1.urutan;
    let u2 = doc2.urutan;
    if (u1 === u2) {
      u2 = u1 + 1;
    }

    await prisma.$transaction([
      prisma.dokumen.update({
        where: { id: id1 },
        data: { urutan: u2 },
      }),
      prisma.dokumen.update({
        where: { id: id2 },
        data: { urutan: u1 },
      }),
    ]);

    revalidatePath("/dokumen");
    revalidatePath("/kategori");
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error in swapDokumenOrder:", error);
    return { success: false, error: error.message || "Gagal mengubah urutan dokumen" };
  }
}
