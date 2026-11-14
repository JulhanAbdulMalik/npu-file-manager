-- AlterTable: add kategoriId to Dokumen, populate from SubKategori, then set NOT NULL
ALTER TABLE "Dokumen" ADD COLUMN "kategoriId" TEXT;

UPDATE "Dokumen" d
SET "kategoriId" = s."kategoriId"
FROM "SubKategori" s
WHERE d."subKategoriId" = s."id";

ALTER TABLE "Dokumen" ALTER COLUMN "kategoriId" SET NOT NULL;
ALTER TABLE "Dokumen" ALTER COLUMN "subKategoriId" DROP NOT NULL;

-- AlterTable: add parentId to SubKategori
ALTER TABLE "SubKategori" ADD COLUMN "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "SubKategori" ADD CONSTRAINT "SubKategori_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "SubKategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dokumen" ADD CONSTRAINT "Dokumen_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "Kategori"("id") ON DELETE CASCADE ON UPDATE CASCADE;
