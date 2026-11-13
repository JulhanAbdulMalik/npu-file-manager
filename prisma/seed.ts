import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Membersihkan seluruh data database...");

  // 1. Hapus semua data dokumen, sub-kategori, kategori, dan user lama
  await prisma.dokumen.deleteMany({});
  await prisma.subKategori.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.kategori.deleteMany({});

  console.log("✅ Seluruh data dokumen, sub-kategori, dan kategori telah dikosongkan.");

  // 2. Buat satu-satunya akun default Superadmin untuk deployment
  const hashedPassword = await bcrypt.hash("julhanadmin123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: "Julhan Abdul Malik",
      email: "julhan@nusaputra.ac.id",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log("✅ Akun Superadmin berhasil dibuat:");
  console.log(`   - Nama     : ${superAdmin.name}`);
  console.log(`   - Username : ${superAdmin.email}`);
  console.log(`   - Role     : ${superAdmin.role}`);
  console.log("   - Password : julhanadmin123");
  console.log("🎉 Database bersih dan siap untuk deployment!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
