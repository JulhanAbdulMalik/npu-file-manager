import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash("Admin123!", 10)
  await prisma.user.upsert({
    where: { email: "superadmin@nusaputra.ac.id" },
    update: {},
    create: {
      name: "Super Administrator",
      email: "superadmin@nusaputra.ac.id",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  })
  console.log("✅ Seed berhasil: Super Admin dibuat")
}

main().catch(console.error).finally(() => prisma.$disconnect())
