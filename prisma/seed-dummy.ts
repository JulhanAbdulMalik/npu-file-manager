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
  console.log("🌱 Mengisi Data Dummy dengan Hierarki Bertingkat (1., 1.1., 1.1.1.)...");

  // 1. Pastikan Super Admin Utama ada (Julhan Abdul Malik)
  const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || "julhanadmin123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "julhan@nusaputra.ac.id" },
    update: {
      name: "Julhan Abdul Malik",
      role: Role.SUPER_ADMIN,
    },
    create: {
      name: "Julhan Abdul Malik",
      email: "julhan@nusaputra.ac.id",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✅ Super Admin siap: ${superAdmin.email}`);

  // 2. Bersihkan data dokumen & kategori lama agar bersih dan terhindar dari duplikasi
  await prisma.dokumen.deleteMany({});
  await prisma.subKategori.deleteMany({});
  await prisma.kategori.deleteMany({});

  // ── KATEGORI 1: DOKUMEN PERSYARATAN & LEGALITAS ───────────────────────
  const kat1 = await prisma.kategori.create({
    data: {
      nama: "DOKUMEN PERSYARATAN & LEGALITAS",
      deskripsi: "Dokumen legalitas universitas, yayasan, perizinan, dan sarana prasarana institusi.",
      warna: "#a80063",
      ikon: "FileCheck",
      urutan: 1,
    },
  });

  // Dokumen Langsung di Kategori 1 (Tanpa Sub-Kategori)
  const docKat1Direct = [
    {
      nama: "Statuta Universitas Nusa Putra Terkini",
      deskripsi: "Buku pedoman penyelenggaraan dan tata kelola perguruan tinggi",
      status: StatusDok.LENGKAP,
    },
    {
      nama: "SK Pendirian & Izin Operasional Universitas",
      deskripsi: "Salinan SK Menteri Pendidikan mengenai pendirian dan penyelenggaraan program",
      status: StatusDok.LENGKAP,
    },
  ];

  for (let i = 0; i < docKat1Direct.length; i++) {
    const item = docKat1Direct[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`kat1-direct-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat1.id,
        subKategoriId: null, // Langsung di kategori
        uploadedById: superAdmin.id,
      },
    });
  }

  // Sub 1.1: Dokumen Institusi
  const sub1_1 = await prisma.subKategori.create({
    data: {
      nama: "Dokumen Institusi",
      deskripsi: "Dokumen kebijakan dasar dan permohonan akreditasi",
      urutan: 1,
      kategoriId: kat1.id,
      parentId: null,
    },
  });

  const docs1_1 = [
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
  ];

  for (let i = 0; i < docs1_1.length; i++) {
    const item = docs1_1[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub1_1-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat1.id,
        subKategoriId: sub1_1.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // Anak Sub 1.1.1: Standar Kebijakan Mutu (Anak dari Sub 1.1)
  const sub1_1_1 = await prisma.subKategori.create({
    data: {
      nama: "Standar Kebijakan Mutu",
      deskripsi: "Instrumen penetapan dan pelaksanaan kebijakan penjaminan mutu",
      urutan: 1,
      kategoriId: kat1.id,
      parentId: sub1_1.id, // Anak dari sub 1.1
    },
  });

  const docs1_1_1 = [
    {
      nama: "Buku Kebijakan SPMI Universitas",
      deskripsi: "Dokumen resmi standar mutu internal universitas",
      status: StatusDok.DALAM_PROSES,
    },
    {
      nama: "Manual Mutu & Standar PPEPP",
      deskripsi: "Panduan teknis pelaksanaan siklus mutu PPEPP",
      status: StatusDok.LENGKAP,
    },
  ];

  for (let i = 0; i < docs1_1_1.length; i++) {
    const item = docs1_1_1[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub1_1_1-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat1.id,
        subKategoriId: sub1_1_1.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // Cucu Sub 1.1.1.1: SOP & Panduan Teknis (Anak lagi dari Sub 1.1.1)
  const sub1_1_1_1 = await prisma.subKategori.create({
    data: {
      nama: "SOP & Panduan Teknis",
      deskripsi: "Prosedur operasional baku pelaksanaan audit mutu internal",
      urutan: 1,
      kategoriId: kat1.id,
      parentId: sub1_1_1.id, // Anak lagi
    },
  });

  const docs1_1_1_1 = [
    {
      nama: "SOP Audit Mutu Internal (AMI) Akademik",
      deskripsi: "Prosedur baku verifikasi berkas audit program studi",
      status: StatusDok.LENGKAP,
    },
  ];

  for (let i = 0; i < docs1_1_1_1.length; i++) {
    const item = docs1_1_1_1[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub1_1_1_1-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat1.id,
        subKategoriId: sub1_1_1_1.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // Sub 1.2: Sarana & Prasarana
  const sub1_2 = await prisma.subKategori.create({
    data: {
      nama: "Sarana & Prasarana",
      deskripsi: "Bukti fisik legalitas lahan, gedung, dan fasilitas pendukung",
      urutan: 2,
      kategoriId: kat1.id,
      parentId: null,
    },
  });

  const docs1_2 = [
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
  ];

  for (let i = 0; i < docs1_2.length; i++) {
    const item = docs1_2[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub1_2-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat1.id,
        subKategoriId: sub1_2.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // ── KATEGORI 2: DOKUMEN APLIKASI EVALUASI (SIAGA/LAM) ─────────────────
  const kat2 = await prisma.kategori.create({
    data: {
      nama: "DOKUMEN APLIKASI EVALUASI (SIAGA/LAM)",
      deskripsi: "Dokumen instrumen evaluasi diri, kurikulum, dan kualifikasi sumber daya dosen.",
      warna: "#0284c7",
      ikon: "FileSpreadsheet",
      urutan: 2,
    },
  });

  // Sub 2.1: Kurikulum
  const sub2_1 = await prisma.subKategori.create({
    data: {
      nama: "Kurikulum",
      deskripsi: "Standar kurikulum berbasis OBE dan capaian pembelajaran",
      urutan: 1,
      kategoriId: kat2.id,
      parentId: null,
    },
  });

  const docs2_1 = [
    {
      nama: "Dokumen Keunggulan & Diferensiasi Program Studi",
      deskripsi: "Karakteristik unik dan distingsi prodi dalam skala internasional",
      status: StatusDok.LENGKAP,
    },
    {
      nama: "Profil Lulusan & Capaian Pembelajaran Lulusan (CPL)",
      deskripsi: "Pemetaan kompetensi lulusan sesuai standar KKNI level 6",
      status: StatusDok.LENGKAP,
    },
    {
      nama: "Struktur Kurikulum & Rencana Pembelajaran Semester (RPS)",
      deskripsi: "Bundel lengkap silabus dan RPS seluruh semester",
      status: StatusDok.DALAM_PROSES,
    },
  ];

  for (let i = 0; i < docs2_1.length; i++) {
    const item = docs2_1[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub2_1-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat2.id,
        subKategoriId: sub2_1.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // Sub 2.2: Sumber Daya Dosen
  const sub2_2 = await prisma.subKategori.create({
    data: {
      nama: "Sumber Daya Dosen",
      deskripsi: "Kualifikasi akademik, jabatan fungsional, dan rasio dosen",
      urutan: 2,
      kategoriId: kat2.id,
      parentId: null,
    },
  });

  const docs2_2 = [
    {
      nama: "Dokumen Calon Dosen Tetap Program Studi",
      deskripsi: "Ijazah, SK pengangkatan, NIDN, dan sertifikat pendidik dosen",
      status: StatusDok.LENGKAP,
    },
    {
      nama: "Dokumen Dosen Praktisi & Mitra Industri",
      deskripsi: "Surat komitmen dosen praktisi industri dan asosiasi profesi",
      status: StatusDok.DALAM_PROSES,
    },
  ];

  for (let i = 0; i < docs2_2.length; i++) {
    const item = docs2_2[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub2_2-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat2.id,
        subKategoriId: sub2_2.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // ── KATEGORI 3: DOKUMEN PENDUKUNG & KLINIK ─────────────────────────────
  const kat3 = await prisma.kategori.create({
    data: {
      nama: "DOKUMEN PENDUKUNG & KLINIK",
      deskripsi: "Perjanjian kerjasama strategis, kemitraan institusi, dan evidensi lapangan.",
      warna: "#059669",
      ikon: "FolderHeart",
      urutan: 3,
    },
  });

  // Sub 3.1: Wahana Kerjasama & Institusi Mitra
  const sub3_1 = await prisma.subKategori.create({
    data: {
      nama: "Wahana Kerjasama & Institusi Mitra",
      deskripsi: "MoU dan Perjanjian Kerjasama aktif",
      urutan: 1,
      kategoriId: kat3.id,
      parentId: null,
    },
  });

  const docs3_1 = [
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
  ];

  for (let i = 0; i < docs3_1.length; i++) {
    const item = docs3_1[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub3_1-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat3.id,
        subKategoriId: sub3_1.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // Sub 3.2: Dokumen Tambahan & Evidensi Lapangan
  const sub3_2 = await prisma.subKategori.create({
    data: {
      nama: "Dokumen Tambahan & Evidensi Lapangan",
      deskripsi: "Galeri dokumentasi, akreditasi sebelumnya, dan suplemen asesmen",
      urutan: 2,
      kategoriId: kat3.id,
      parentId: null,
    },
  });

  const docs3_2 = [
    {
      nama: "Dokumentasi Video & Foto Fasilitas Kampus Terpadu",
      deskripsi: "Tur virtual laboratorium, perpustakaan, sport center, dan asrama",
      status: StatusDok.LENGKAP,
    },
    {
      nama: "Sertifikat Akreditasi Institusi & BAN-PT Terkini",
      deskripsi: "Salinan SK dan sertifikat peringkat akreditasi universitas",
      status: StatusDok.LENGKAP,
    },
  ];

  for (let i = 0; i < docs3_2.length; i++) {
    const item = docs3_2[i];
    const { linkDrive, driveFileId } = dummyDriveUrl(`sub3_2-${item.nama}`);
    await prisma.dokumen.create({
      data: {
        nama: item.nama,
        deskripsi: item.deskripsi,
        linkDrive,
        driveFileId,
        status: item.status,
        urutan: i + 1,
        kategoriId: kat3.id,
        subKategoriId: sub3_2.id,
        uploadedById: superAdmin.id,
      },
    });
  }

  // 4. Update Akun Admin SPMI & Evaluasi
  const adminPassword = await bcrypt.hash("julhanadmin123", 10);
  await prisma.user.upsert({
    where: { email: "admin.spmi@nusaputra.ac.id" },
    update: {
      password: adminPassword,
      role: Role.ADMIN,
      kategoriId: kat1.id,
    },
    create: {
      name: "Admin Akreditasi SPMI",
      email: "admin.spmi@nusaputra.ac.id",
      password: adminPassword,
      role: Role.ADMIN,
      kategoriId: kat1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin.evaluasi@nusaputra.ac.id" },
    update: {
      password: adminPassword,
      role: Role.ADMIN,
      kategoriId: kat2.id,
    },
    create: {
      name: "Admin Evaluasi Akademik",
      email: "admin.evaluasi@nusaputra.ac.id",
      password: adminPassword,
      role: Role.ADMIN,
      kategoriId: kat2.id,
    },
  });

  console.log("✅ Seeding Data Dummy Hierarkis Selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat mengisi data dummy:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
