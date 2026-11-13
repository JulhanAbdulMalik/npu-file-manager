import { Metadata } from "next";
import { getKategoris } from "@/actions/kategori";
import KategoriManager from "@/components/admin/KategoriManager";

export const metadata: Metadata = {
  title: "Kelola Kategori",
  description: "Struktur Kategori Dokumen Universitas Nusa Putra",
};

export const dynamic = "force-dynamic";

export default async function KategoriPage() {
  const res = await getKategoris();
  const kategoris = res.success && res.data ? (res.data as any) : [];

  return <KategoriManager initialKategoris={kategoris} />;
}
