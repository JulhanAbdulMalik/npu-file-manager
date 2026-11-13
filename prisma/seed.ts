import { PrismaClient, Role, StatusDok } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper untuk generate Google Drive link dummy yang valid
function dummyDriveUrl(seed: string): { linkDrive: string; driveFileId: string } {
  const hash = Buffer.from(seed).toString("hex").padEnd(33, "a").slice(0, 33);
  const fileId = `1${hash}`;
  return {
    linkDrive: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    driveFileId: fileId,
  };
}

async function main() {
  console.log("🌱 Memulai seeding database NPU File Manager...");

  // 1. Buat User Super Admin
  const hashedSuperPassword = await bcrypt.hash("Admin123!", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@nusaputra.ac.id" },
    update: {
      password: hashedSuperPassword,
      role: Role.SUPER_ADMIN,
    },
    create: {
      name: "Super Administrator",
      email: "superadmin@nusaputra.ac.id",
      password: hashedSuperPassword,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log("✅ Super Admin siap: superadmin@nusaputra.ac.id");

  // 2. Data Kategori & Sub-Kategori Akreditasi Nusa Putra University
  const seedData = [
    {
      nama: "DOKUMEN PERSYARATAN & LEGALITAS",
      deskripsi: "Dokumen legalitas universitas, yayasan, perizinan, dan sarana prasarana institusi.",
      warna: "#a80063",
      ikon: "FileCheck",
      urutan: 1,
      subKategoris: [
        {
          nama: "1. Dokumen Institusi",
          deskripsi: "Dokumen kebijakan dasar dan permohonan akreditasi",
          urutan: 1,
          dokumens: [
            {
              nama: "Surat Permohonan PT Pengusul",
              deskripsi: "Surat pengajuan resmi akreditasi dari Rektor Nusa Putra University",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Surat Pertimbangan Senat Akademik",
              deskripsi: "Persetujuan dan pertimbangan Senat Akademik Universitas",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Rencana Strategis (Renstra) PT 2025-2030",
              deskripsi: "Rencana strategis pengembangan jangka menengah universitas",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Pakta Integritas Pimpinan Universitas",
              deskripsi: "Komitmen pimpinan universitas terhadap mutu akademik",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Dokumen Kebijakan SPMI Universitas",
              deskripsi: "Buku kebijakan Sistem Penjaminan Mutu Internal NPU",
              status: StatusDok.DALAM_PROSES,
            },
          ],
        },
        {
          nama: "2. Sarana & Prasarana",
          deskripsi: "Bukti fisik legalitas lahan, gedung, dan fasilitas pendukung",
          urutan: 2,
          dokumens: [
            {
              nama: "Scan Asli Sertifikat Hak Guna Bangunan",
              deskripsi: "Dokumen legalitas tanah kampus utama Nusa Putra",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Denah & Masterplan Gedung Kampus",
              deskripsi: "Arsitektur denah ruang kelas, laboratorium, dan rektorat",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Foto & Profil Laboratorium Terpadu",
              deskripsi: "Inventarisasi peralatan dan spesifikasi laboratorium",
              status: StatusDok.DALAM_PROSES,
            },
          ],
        },
        {
          nama: "3. Keuangan & Kelayakan",
          deskripsi: "Laporan audit keuangan dan jaminan operasional berkelanjutan",
          urutan: 3,
          dokumens: [
            {
              nama: "Bukti Kepemilikan Dana Operasional",
              deskripsi: "Rekening koran dan dana cadangan pengembangan universitas",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Bank Garansi Badan Penyelenggara",
              deskripsi: "Surat garansi bank dari yayasan pengelola",
              status: StatusDok.DALAM_PROSES,
            },
            {
              nama: "Laporan Keuangan Badan Penyelenggara Teraudit",
              deskripsi: "Hasil audit Kantor Akuntan Publik (KAP) 3 tahun terakhir",
              status: StatusDok.BELUM,
            },
          ],
        },
      ],
    },
    {
      nama: "DOKUMEN APLIKASI EVALUASI (SIAGA/LAM)",
      deskripsi: "Dokumen instrumen evaluasi diri, kurikulum, dan kualifikasi sumber daya dosen.",
      warna: "#0284c7",
      ikon: "FileSpreadsheet",
      urutan: 2,
      subKategoris: [
        {
          nama: "1. Kurikulum",
          deskripsi: "Standar kurikulum berbasis OBE dan capaian pembelajaran",
          urutan: 1,
          dokumens: [
            {
              nama: "1.1 Dokumen Keunggulan & Diferensiasi Program Studi",
              deskripsi: "Karakteristik unik dan distingsi prodi dalam skala internasional",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "1.2 Profil Lulusan & Capaian Pembelajaran Lulusan (CPL)",
              deskripsi: "Pemetaan kompetensi lulusan sesuai standar KKNI level 6",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "1.3 Pemetaan Capaian Pembelajaran Mata Kuliah (CPMK)",
              deskripsi: "Matriks integrasi mata kuliah dengan standar akreditasi",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "1.4 Struktur Kurikulum & Rencana Pembelajaran Semester (RPS)",
              deskripsi: "Bundel lengkap silabus dan RPS seluruh semester",
              status: StatusDok.DALAM_PROSES,
            },
            {
              nama: "1.5 Sarana Prasarana Pembelajaran & LMS",
              deskripsi: "Dokumentasi platform digital learning dan perpustakaan elektronik",
              status: StatusDok.LENGKAP,
            },
          ],
        },
        {
          nama: "2. Sumber Daya Dosen",
          deskripsi: "Kualifikasi akademik, jabatan fungsional, dan rasio dosen",
          urutan: 2,
          dokumens: [
            {
              nama: "2.1 Dokumen Calon Dosen Tetap Program Studi",
              deskripsi: "Ijazah, SK pengangkatan, NIDN, dan sertifikat pendidik dosen",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "2.2 Dokumen Dosen Praktisi & Mitra Industri",
              deskripsi: "Surat komitmen dosen praktisi industri dan asosiasi profesi",
              status: StatusDok.DALAM_PROSES,
            },
            {
              nama: "2.3 Kualifikasi & Sertifikasi Tenaga Kependidikan",
              deskripsi: "Profil laboran, teknisi IT, dan staf administrasi akademik",
              status: StatusDok.LENGKAP,
            },
          ],
        },
        {
          nama: "3. Unit Pengelola Program Studi (UPPS)",
          deskripsi: "Tata pamong, kepemimpinan, dan manajemen operasional unit",
          urutan: 3,
          dokumens: [
            {
              nama: "3.1 Struktur Organisasi & Tata Kerja (OTK) UPPS",
              deskripsi: "Bagan tata kelola dan deskripsi tugas pimpinan fakultas/prodi",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "3.2 Dokumen Siklus PPEPP Penjaminan Mutu (SPMI)",
              deskripsi: "Bukti penetapan, pelaksanaan, evaluasi, pengendalian, peningkatan",
              status: StatusDok.DALAM_PROSES,
            },
            {
              nama: "3.3 Naskah Akademik Pendirian Program Studi",
              deskripsi: "Studi kelayakan dan analisis kebutuhan pasar kerja regional-global",
              status: StatusDok.BELUM,
            },
          ],
        },
      ],
    },
    {
      nama: "DOKUMEN PENDUKUNG & KLINIK",
      deskripsi: "Perjanjian kerjasama strategis, kemitraan institusi, dan evidensi lapangan.",
      warna: "#059669",
      ikon: "FolderHeart",
      urutan: 3,
      subKategoris: [
        {
          nama: "1. Wahana Kerjasama & Institusi Mitra",
          deskripsi: "MoU dan Perjanjian Kerjasama aktif",
          urutan: 1,
          dokumens: [
            {
              nama: "MoU & MoA Kerjasama Industri Mitra Utama",
              deskripsi: "Perjanjian magang MBKM, riset bersama, dan penyerapan lulusan",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Perjanjian Kerjasama Pembelajaran Lapangan",
              deskripsi: "Kerjasama praktikum dan sertifikasi profesi internasional",
              status: StatusDok.LENGKAP,
            },
          ],
        },
        {
          nama: "2. Dokumen Tambahan & Evidensi Lapangan",
          deskripsi: "Galeri dokumentasi, akreditasi sebelumnya, dan suplemen asesmen",
          urutan: 2,
          dokumens: [
            {
              nama: "Dokumentasi Video & Foto Fasilitas Kampus Terpadu",
              deskripsi: "Tur virtual laboratorium, perpustakaan, sport center, dan asrama",
              status: StatusDok.LENGKAP,
            },
            {
              nama: "Denah Rinci & Jalur Evakuasi K3 Gedung",
              deskripsi: "Sertifikasi keselamatan gedung dan standar K3 lingkungan kampus",
              status: StatusDok.DALAM_PROSES,
            },
            {
              nama: "Sertifikat Akreditasi Institusi & BAN-PT Terkini",
              deskripsi: "Salinan SK dan sertifikat peringkat akreditasi universitas",
              status: StatusDok.LENGKAP,
            },
          ],
        },
      ],
    },
  ];

  // Bersihkan data dokumen & kategori lama untuk fresh seed yang bersih
  await prisma.dokumen.deleteMany({});
  await prisma.subKategori.deleteMany({});
  await prisma.kategori.deleteMany({});

  // 3. Masukkan Kategori, SubKategori, dan Dokumen
  let createdKategoriCount = 0;
  let createdSubKategoriCount = 0;
  let createdDokumenCount = 0;
  let firstKategoriId: string | null = null;

  for (const kat of seedData) {
    const kategori = await prisma.kategori.create({
      data: {
        nama: kat.nama,
        deskripsi: kat.deskripsi,
        warna: kat.warna,
        ikon: kat.ikon,
        urutan: kat.urutan,
      },
    });

    if (!firstKategoriId) {
      firstKategoriId = kategori.id;
    }
    createdKategoriCount++;

    for (const sub of kat.subKategoris) {
      const subKategori = await prisma.subKategori.create({
        data: {
          nama: sub.nama,
          deskripsi: sub.deskripsi,
          urutan: sub.urutan,
          kategoriId: kategori.id,
        },
      });
      createdSubKategoriCount++;

      let docUrutan = 1;
      for (const doc of sub.dokumens) {
        const { linkDrive, driveFileId } = dummyDriveUrl(
          `${kategori.id}-${subKategori.id}-${doc.nama}`
        );

        await prisma.dokumen.create({
          data: {
            nama: doc.nama,
            deskripsi: doc.deskripsi,
            linkDrive,
            driveFileId,
            status: doc.status,
            urutan: docUrutan++,
            subKategoriId: subKategori.id,
            uploadedById: superAdmin.id,
          },
        });
        createdDokumenCount++;
      }
    }
  }

  // 4. Buat User Admin SPMI (terikat ke Kategori pertama)
  const hashedAdminPassword = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin.spmi@nusaputra.ac.id" },
    update: {
      password: hashedAdminPassword,
      role: Role.ADMIN,
      kategoriId: firstKategoriId,
    },
    create: {
      name: "Admin Akreditasi SPMI",
      email: "admin.spmi@nusaputra.ac.id",
      password: hashedAdminPassword,
      role: Role.ADMIN,
      kategoriId: firstKategoriId,
    },
  });
  console.log("✅ Admin SPMI siap: admin.spmi@nusaputra.ac.id");

  console.log(
    `🎉 Seeding selesai! Berhasil membuat:\n` +
      `- ${createdKategoriCount} Kategori\n` +
      `- ${createdSubKategoriCount} Sub-Kategori\n` +
      `- ${createdDokumenCount} Dokumen Akreditasi\n` +
      `- 2 User Akun (Super Admin & Admin SPMI)`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
