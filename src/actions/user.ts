"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function getUsers() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return { success: false, error: "Akses khusus Super Administrator" };
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        kategoriId: true,
        createdAt: true,
        updatedAt: true,
        kategori: {
          select: {
            id: true,
            nama: true,
            warna: true,
          },
        },
      },
    });

    return { success: true, data: users };
  } catch (error: any) {
    console.error("Error in getUsers:", error);
    return { success: false, error: error.message || "Gagal mengambil data akun" };
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  role?: Role;
  kategoriId?: string | null;
}) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return { success: false, error: "Akses khusus Super Administrator" };
    }

    if (!data.name?.trim()) {
      return { success: false, error: "Nama pengguna wajib diisi" };
    }
    if (!data.email?.trim()) {
      return { success: false, error: "Email wajib diisi" };
    }

    const emailTrimmed = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (existing) {
      return { success: false, error: "Email sudah terdaftar dalam sistem" };
    }

    const rawPassword = data.password?.trim() || "Admin123!";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: emailTrimmed,
        password: hashedPassword,
        role: data.role || Role.ADMIN,
        kategoriId: data.kategoriId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        kategoriId: true,
        createdAt: true,
      },
    });

    revalidatePath("/akun");
    return { success: true, data: user };
  } catch (error: any) {
    console.error("Error in createUser:", error);
    return { success: false, error: error.message || "Gagal membuat akun baru" };
  }
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    kategoriId?: string | null;
  }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return { success: false, error: "Akses khusus Super Administrator" };
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();

    if (data.email) {
      const emailTrimmed = data.email.trim().toLowerCase();
      // Pastikan email tidak bentrok dengan user lain
      const existing = await prisma.user.findFirst({
        where: { email: emailTrimmed, NOT: { id } },
      });
      if (existing) {
        return { success: false, error: "Email sudah digunakan oleh pengguna lain" };
      }
      updateData.email = emailTrimmed;
    }

    if (data.role) updateData.role = data.role;
    if (data.kategoriId !== undefined) updateData.kategoriId = data.kategoriId || null;

    if (data.password && data.password.trim()) {
      updateData.password = await bcrypt.hash(data.password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        kategoriId: true,
        updatedAt: true,
      },
    });

    revalidatePath("/akun");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in updateUser:", error);
    return { success: false, error: error.message || "Gagal memperbarui akun" };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
      return { success: false, error: "Akses khusus Super Administrator" };
    }

    // Jangan izinkan super admin menghapus dirinya sendiri
    if (session.user.id === id) {
      return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri" };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/akun");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteUser:", error);
    return { success: false, error: error.message || "Gagal menghapus akun" };
  }
}

export async function changePassword(id: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Akses ditolak" };
    }

    // Hanya Super Admin atau pemilik akun yang boleh ganti password
    if ((session.user as any).role !== "SUPER_ADMIN" && session.user.id !== id) {
      return { success: false, error: "Anda tidak memiliki izin mengubah password akun ini" };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password baru minimal 6 karakter" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error in changePassword:", error);
    return { success: false, error: error.message || "Gagal mengubah password" };
  }
}
