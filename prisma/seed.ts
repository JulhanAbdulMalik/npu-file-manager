import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Menjalankan pemeriksaan seed database...");

  // 1. Periksa apakah sudah ada akun SUPER_ADMIN di database
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });

  if (existingSuperAdmin) {
    console.log(
      `ℹ️  Akun Super Admin sudah terdaftar di sistem (${existingSuperAdmin.email}).`
    );
    console.log(
      "🔒 Data aman: Tidak ada data dokumen, kategori, atau user yang dihapus/ditimpa."
    );
    return;
  }

  // 2. Jika belum ada Super Admin (misalnya database baru di server), buat dari variabel lingkungan (.env)
  const adminName = process.env.INITIAL_ADMIN_NAME || "Super Administrator";
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@nusaputra.ac.id";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "AdminNpu2026!";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log("✅ Inisialisasi akun Super Admin awal berhasil dibuat:");
  console.log(`   - Nama     : ${superAdmin.name}`);
  console.log(`   - Email    : ${superAdmin.email}`);
  console.log(`   - Role     : ${superAdmin.role}`);
  console.log("💡 Password diambil dengan aman dari environment variable (INITIAL_ADMIN_PASSWORD).");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
