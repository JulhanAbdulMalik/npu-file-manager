import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetDev() {
  if (process.env.NODE_ENV === "production") {
    console.error("⛔ PERINGATAN: Perintah reset-dev dilarang dijalankan pada lingkungan PRODUCTION!");
    process.exit(1);
  }

  console.log("⚠️  Membersihkan seluruh data database (DEVELOPMENT ONLY)...");

  await prisma.dokumen.deleteMany({});
  await prisma.subKategori.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.kategori.deleteMany({});

  const adminName = process.env.INITIAL_ADMIN_NAME || "Julhan Abdul Malik";
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "julhan@nusaputra.ac.id";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "julhanadmin123";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log(`✅ Database lokal berhasil di-reset dengan Super Admin: ${superAdmin.email}`);
}

resetDev()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat reset database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

