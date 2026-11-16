"use server";

/**
 * Server Action untuk mengambil isi Folder Google Drive secara langsung
 * Memungkinkan navigasi folder dan pembukaan file di dalam aplikasi NPU File Manager
 */

export interface DriveFolderItem {
  id: string;
  name: string;
  type: "folder" | "file";
  thumbnail?: string | null;
  lastModified?: string | null;
  linkDrive: string;
}

export interface DriveFolderResult {
  success: boolean;
  folderId?: string;
  folderName?: string;
  items?: DriveFolderItem[];
  error?: string;
}

// In-memory cache sederhana dengan TTL 3 menit
const folderCache = new Map<string, { data: DriveFolderResult; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000;

export async function getDriveFolderContents(folderId: string): Promise<DriveFolderResult> {
  if (!folderId || typeof folderId !== "string") {
    return { success: false, error: "ID Folder tidak valid" };
  }

  const trimmedId = folderId.trim();

  // Cek cache
  const cached = folderCache.get(trimmedId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${trimmedId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Google Drive merespons dengan status ${res.status}. Pastikan folder dibagikan secara publik (Siapa saja yang memiliki link dapat melihat).`,
      };
    }

    const html = await res.text();

    // Ekstrak nama folder dari tag <title>
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const folderName = titleMatch ? titleMatch[1].trim() : "Folder Google Drive";

    const items: DriveFolderItem[] = [];
    const entryRegex =
      /<div class="flip-entry"[^>]*id="entry-([^"]+)"[^>]*>([\s\S]*?)(?=<div class="flip-entry"|<\/div>\s*<\/div>\s*<\/body>)/g;
    let match: RegExpExecArray | null;

    while ((match = entryRegex.exec(html)) !== null) {
      const entryId = match[1];
      const block = match[2];

      const isFolder = block.includes("drive-sprite-folder") || block.includes("/drive/folders/");
      const nameMatch = block.match(/class="flip-entry-title">([^<]+)<\/div>/);
      const name = nameMatch ? nameMatch[1].trim() : "Tanpa Nama";

      const thumbMatch = block.match(/<img src="([^"]+)"/);
      let thumb = thumbMatch ? thumbMatch[1].replace(/&amp;/g, "&") : null;
      if (thumb) {
        // Tingkatkan resolusi thumbnail Google Drive menjadi 500px agar tajam dan jernih di layar High-DPI
        thumb = thumb.replace(/=s\d+/, "=s500").replace(/=w\d+-h\d+/, "=w500-h500");
      } else if (!isFolder) {
        // Fallback resolusi tinggi resmi dari thumbnail Google Drive jika img tag belum tersedia
        thumb = `https://drive.google.com/thumbnail?id=${entryId}&sz=w500`;
      }

      const lastModMatch = block.match(/class="flip-entry-last-modified"><div>([^<]+)<\/div>/);
      const lastModified = lastModMatch ? lastModMatch[1].trim() : null;

      items.push({
        id: entryId,
        name,
        type: isFolder ? "folder" : "file",
        thumbnail: thumb,
        lastModified,
        linkDrive: isFolder
          ? `https://drive.google.com/drive/folders/${entryId}`
          : `https://drive.google.com/file/d/${entryId}/view`,
      });
    }

    // Urutkan: Folder di urutan teratas, kemudian File secara alfabetis
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    const result: DriveFolderResult = {
      success: true,
      folderId: trimmedId,
      folderName,
      items,
    };

    // Simpan ke cache
    folderCache.set(trimmedId, { data: result, timestamp: Date.now() });

    return result;
  } catch (error: any) {
    console.error("Error fetching Google Drive folder:", error);
    return {
      success: false,
      error: error.message || "Gagal mengambil data isi folder Google Drive",
    };
  }
}
