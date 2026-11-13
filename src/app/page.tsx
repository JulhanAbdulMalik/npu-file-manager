import { Metadata } from "next";
import { getPublicPortalData, getDashboardStats } from "@/actions/public";
import { auth } from "@/lib/auth";
import PublicPortalContainer from "@/components/public/PublicPortalContainer";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Dashboard NPU File Manager. Akses terbuka, transparan, dan terstruktur untuk asesmen universitas.",
};

export const dynamic = "force-dynamic";

export default async function PublicPage() {
  const [portalRes, statsRes, session] = await Promise.all([
    getPublicPortalData(),
    getDashboardStats(),
    auth(),
  ]);

  const kategoris = portalRes.success && portalRes.data ? portalRes.data : [];
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
        };

  const isLoggedIn = !!session?.user;

  return (
    <PublicPortalContainer
      initialKategoris={kategoris}
      initialStats={stats}
      isLoggedIn={isLoggedIn}
    />
  );
}
