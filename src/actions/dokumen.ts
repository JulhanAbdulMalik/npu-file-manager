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

    if (params?.subKategoriId) {
      where.subKategoriId = params.subKategoriId;
    } else if (params?.kategoriId) {
      where.subKategori = {
        kategoriId: params.kategoriId,
      };
    }

    if (params?.status) {
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
        subKategori: {
          include: {
            kategori: {
              select: {
                id: true,
                nama: true,
                warna: true,
                ikon: true,
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
        subKategori: {
          include: {
            kategori: true,
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
  subKategoriId: string;
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
    if (!data.subKategoriId) {
      return { success: false, error: "Sub-Kategori wajib dipilih" };
    }

    // Ekstrak driveFileId otomatis dari linkDrive
    const driveFileId = extractDriveFileId(data.linkDrive.trim());

    let urutan = data.urutan;
    if (urutan === undefined) {
      const lastDoc = await prisma.dokumen.findFirst({
        where: { subKategoriId: data.subKategoriId },
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
        subKategoriId: data.subKategoriId,
        uploadedById: session.user.id || null,
      },
    });

    revalidatePath("/dokumen");
    revalidatePath("/kategori");
    revalidatePath("/");
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
    subKategoriId?: string;
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
    if (data.subKategoriId) updateData.subKategoriId = data.subKategoriId;

    if (data.linkDrive) {
      updateData.linkDrive = data.linkDrive.trim();
      updateData.driveFileId = extractDriveFileId(data.linkDrive.trim());
    }

    const updated = await prisma.dokumen.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dokumen");
    revalidatePath("/kategori");
    revalidatePath("/");
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
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateStatusDokumen:", error);
    return { success: false, error: error.message || "Gagal memperbarui status dokumen" };
  }
}
