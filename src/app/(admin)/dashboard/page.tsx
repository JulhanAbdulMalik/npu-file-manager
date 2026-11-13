import { Metadata } from "next";
import { getDashboardStats } from "@/actions/public";
import { getDokumens } from "@/actions/dokumen";
import { auth } from "@/lib/auth";
import DashboardView from "@/components/admin/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard Manajemen Dokumen Universitas Nusa Putra",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [statsRes, docsRes, session] = await Promise.all([
    getDashboardStats(),
    getDokumens(),
    auth(),
  ]);

  const stats =
    statsRes.success && statsRes.data
      ? statsRes.data
      : {
          totalKategori: 0,
          totalSubKategori: 0,
          totalDokumen: 0,
          lengkap: 0,
          dalamProses: 0,
          belum: 0,
          persentaseLengkap: 0,
          perKategori: [],
        };

  const recentDocs = docsRes.success && docsRes.data ? docsRes.data.slice(0, 8) : [];
  const userName = session?.user?.name || "Administrator";

  return <DashboardView stats={stats} recentDocs={recentDocs} userName={userName} />;
}
