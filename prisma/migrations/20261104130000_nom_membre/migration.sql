-- Nom confirmé par le membre (04/11/2026, étape 2 « gérer les contributions »).
-- Additive uniquement : une colonne nullable et une table neuve. Le code de main,
-- qui ne lit ni n'écrit ces deux éléments, continue de tourner sur la base migrée.

-- AlterTable
ALTER TABLE "membres" ADD COLUMN     "nom_confirme_le" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "noms_membre" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "noms_membre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "noms_membre_membre_id_idx" ON "noms_membre"("membre_id");

-- AddForeignKey
ALTER TABLE "noms_membre" ADD CONSTRAINT "noms_membre_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
