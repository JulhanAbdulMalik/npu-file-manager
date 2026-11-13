/**
 * Helper utility untuk integrasi Google Drive di NPU File Manager
 */

/**
 * Ekstrak File ID dari berbagai format Google Drive / Google Docs URL.
 * Mendukung format:
 * - https://drive.google.com/file/d/{FILE_ID}/view...
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 * - https://docs.google.com/document/d/{FILE_ID}/...
 * - https://docs.google.com/spreadsheets/d/{FILE_ID}/...
 * - https://docs.google.com/presentation/d/{FILE_ID}/...
 * - https://docs.google.com/forms/d/{FILE_ID}/...
 * - https://drive.google.com/drive/folders/{FILE_ID}
 */
export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Pattern 1: /d/{FILE_ID} (paling umum untuk file, doc, spreadsheet, presentation)
  const dPattern = /\/d\/([a-zA-Z0-9_-]{15,})/;
  const dMatch = trimmed.match(dPattern);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // Pattern 2: id={FILE_ID} pada query parameter (?id=... atau &id=...)
  const queryPattern = /[?&]id=([a-zA-Z0-9_-]{15,})/;
  const queryMatch = trimmed.match(queryPattern);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  // Pattern 3: /folders/{FILE_ID}
  const folderPattern = /\/folders\/([a-zA-Z0-9_-]{15,})/;
  const folderMatch = trimmed.match(folderPattern);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // Jika input sudah merupakan ID langsung (panjang minimal 20 karakter alfanumerik)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Buat URL embed preview Google Drive yang aman untuk iframe
 */
export function getDriveEmbedUrl(fileId: string): string {
  if (!fileId) return "";
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Buat URL unduh langsung dari Google Drive
 */
export function getDriveDirectDownloadUrl(fileId: string): string {
  if (!fileId) return "";
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Buat URL tampilan web Google Drive dengan sharing
 */
export function getDriveViewUrl(fileId: string): string {
  if (!fileId) return "";
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}
