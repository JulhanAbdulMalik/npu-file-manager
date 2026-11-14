/**
 * Helper untuk format penomoran bertingkat (Hierarchical Numbering)
 * Format standar: Kategori (1., 2.), Sub-Kategori (1.1., 1.2.), Anak Sub (1.1.1., 1.1.2.), dst.
 */

export interface RawSubKategori {
  id: string;
  nama: string;
  deskripsi?: string | null;
  urutan: number;
  kategoriId: string;
  parentId?: string | null;
  dokumen?: any[];
  _count?: { dokumen: number };
  children?: RawSubKategori[];
}

export interface SubKategoriTreeNode {
  id: string;
  nama: string;
  cleanName: string;
  code: string; // e.g. "1.1.", "1.1.1."
  fullLabel: string; // e.g. "1.1. Dokumen Institusi"
  deskripsi?: string | null;
  urutan: number;
  kategoriId: string;
  parentId?: string | null;
  level: number; // 1 = direct sub, 2 = anak sub, 3 = cucu sub
  dokumen: any[];
  totalDocCount: number;
  children: SubKategoriTreeNode[];
}

/**
 * Membersihkan angka bawaan di awal string (misal "1. Dokumen Institusi" -> "Dokumen Institusi")
 */
export function stripLeadingNumber(name: string | null | undefined): string {
  if (!name) return "";
  return name.replace(/^(\d+(\.\d+)*[\.\s\-]*)*/, "").trim();
}

/**
 * Membangun struktur tree berurutan dari daftar flat subKategori
 * @param subs Daftar subKategori milik sebuah kategori
 * @param katIndex Nomor urut kategori (1, 2, 3...)
 */
export function buildSubKategoriTree(
  subs: RawSubKategori[],
  katIndex: number
): SubKategoriTreeNode[] {
  // Sort berdasarkan urutan lalu createdAt/id
  const sorted = [...subs].sort((a, b) => a.urutan - b.urutan);

  function buildLevel(
    parentId: string | null,
    parentCode: string,
    level: number
  ): SubKategoriTreeNode[] {
    const directChildren = sorted.filter((s) => (s.parentId || null) === parentId);

    return directChildren.map((item, idx) => {
      const code = `${parentCode}${idx + 1}.`;
      const clean = stripLeadingNumber(item.nama);
      const fullLabel = `${code} ${clean}`;

      const children = buildLevel(item.id, code, level + 1);

      const directDocs = item.dokumen || [];
      const childrenDocsCount = children.reduce(
        (acc, c) => acc + c.totalDocCount,
        0
      );
      const totalDocCount = (item._count?.dokumen ?? directDocs.length) + childrenDocsCount;

      return {
        id: item.id,
        nama: item.nama,
        cleanName: clean,
        code,
        fullLabel,
        deskripsi: item.deskripsi,
        urutan: item.urutan,
        kategoriId: item.kategoriId,
        parentId: item.parentId,
        level,
        dokumen: directDocs,
        totalDocCount,
        children,
      };
    });
  }

  return buildLevel(null, `${katIndex}.`, 1);
}

/**
 * Mengubah tree menjadi list rata berinden untuk pilihan dropdown <select>
 */
export function flattenSubKategoriTree(
  tree: SubKategoriTreeNode[]
): { id: string; label: string; code: string; level: number }[] {
  const result: { id: string; label: string; code: string; level: number }[] = [];

  function traverse(nodes: SubKategoriTreeNode[]) {
    for (const node of nodes) {
      const indent = node.level > 1 ? "  ".repeat(node.level - 1) + "└─ " : "";
      result.push({
        id: node.id,
        label: `${indent}${node.fullLabel}`,
        code: node.code,
        level: node.level,
      });
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}
