import { Metadata } from "next";
import { getDokumens } from "@/actions/dokumen";
import { getKategoris } from "@/actions/kategori";
import DokumenManager from "@/components/admin/DokumenManager";

export const metadata: Metadata = {
  title: "Kelola Dokumen",
  description: "Daftar Berkas Dokumen Universitas Nusa Putra",
};

export const dynamic = "force-dynamic";

export default async function DokumenPage() {
  const [docsRes, katRes] = await Promise.all([
    getDokumens(),
    getKategoris(),
  ]);

  const dokumens = docsRes.success && docsRes.data ? (docsRes.data as any) : [];
  const kategoris = katRes.success && katRes.data ? (katRes.data as any) : [];

  return <DokumenManager initialDokumens={dokumens} kategoris={kategoris} />;
}
