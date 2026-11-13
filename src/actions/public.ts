"use server";

import { prisma } from "@/lib/prisma";
import { StatusDok } from "@prisma/client";

/**
 * Mengambil data terstruktur (Kategori -> SubKategori -> Dokumen) untuk Portal Publik
 */
export async function getPublicPortalData(search?: string, kategoriId?: string) {
  try {
    const whereKategori: any = {};
    if (kategoriId) {
      whereKategori.id = kategoriId;
    }

    const docFilter: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      docFilter.OR = [
        { nama: { contains: q, mode: "insensitive" } },
        { deskripsi: { contains: q, mode: "insensitive" } },
      ];
    }

    const kategoris = await prisma.kategori.findMany({
      where: whereKategori,
      orderBy: [
        { urutan: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        subKategori: {
          orderBy: [
            { urutan: "asc" },
            { createdAt: "asc" },
          ],
          include: {
            dokumen: {
              where: docFilter,
              orderBy: [
                { urutan: "asc" },
                { createdAt: "asc" },
              ],
            },
          },
        },
      },
    });

    return { success: true, data: kategoris };
  } catch (error: any) {
    console.error("Error in getPublicPortalData:", error);
    return { success: false, error: error.message || "Gagal mengambil data portal publik" };
  }
}

/**
 * Mengambil statistik dashboard file manager
 */
export async function getDashboardStats() {
  try {
    const [
      totalKategori,
      totalSubKategori,
      totalDokumen,
      lengkapCount,
      prosesCount,
      belumCount,
      kategoriStats,
    ] = await Promise.all([
      prisma.kategori.count(),
      prisma.subKategori.count(),
      prisma.dokumen.count(),
      prisma.dokumen.count({ where: { status: StatusDok.LENGKAP } }),
      prisma.dokumen.count({ where: { status: StatusDok.DALAM_PROSES } }),
      prisma.dokumen.count({ where: { status: StatusDok.BELUM } }),
      prisma.kategori.findMany({
        orderBy: [{ urutan: "asc" }],
        select: {
          id: true,
          nama: true,
          warna: true,
          subKategori: {
            select: {
              id: true,
              dokumen: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const persentaseLengkap =
      totalDokumen > 0 ? Math.round((lengkapCount / totalDokumen) * 1000) / 10 : 0;

    // Hitung per kategori
    const perKategori = kategoriStats.map((k) => {
      let kTotal = 0;
      let kLengkap = 0;
      let kProses = 0;
      let kBelum = 0;

      for (const sub of k.subKategori) {
        for (const doc of sub.dokumen) {
          kTotal++;
          if (doc.status === StatusDok.LENGKAP) kLengkap++;
          else if (doc.status === StatusDok.DALAM_PROSES) kProses++;
          else if (doc.status === StatusDok.BELUM) kBelum++;
        }
      }

      const persentase = kTotal > 0 ? Math.round((kLengkap / kTotal) * 100) : 0;

      return {
        id: k.id,
        nama: k.nama,
        warna: k.warna || "#a80063",
        total: kTotal,
        lengkap: kLengkap,
        dalamProses: kProses,
        belum: kBelum,
        persentase,
      };
    });

    return {
      success: true,
      data: {
        totalKategori,
        totalSubKategori,
        totalDokumen,
        lengkap: lengkapCount,
        dalamProses: prosesCount,
        belum: belumCount,
        persentaseLengkap,
        perKategori,
      },
    };
  } catch (error: any) {
    console.error("Error in getDashboardStats:", error);
    return { success: false, error: error.message || "Gagal mengambil statistik dashboard" };
  }
}
