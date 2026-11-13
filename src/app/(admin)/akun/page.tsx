import { Metadata } from "next";
import { getUsers } from "@/actions/user";
import { getKategoris } from "@/actions/kategori";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AkunManager from "@/components/admin/AkunManager";

export const metadata: Metadata = {
  title: "Kelola Akun",
  description: "Manajemen Hak Akses Akun Administrator & Super Administrator",
};

export const dynamic = "force-dynamic";

export default async function AkunPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [usersRes, katRes] = await Promise.all([
    getUsers(),
    getKategoris(),
  ]);

  const users = usersRes.success && usersRes.data ? (usersRes.data as any) : [];
  const kategoris = katRes.success && katRes.data ? (katRes.data as any) : [];

  return (
    <AkunManager
      initialUsers={users}
      kategoris={kategoris}
      currentUserId={session.user.id}
    />
  );
}
