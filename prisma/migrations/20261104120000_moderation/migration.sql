-- Modération des contributions (04/11/2026). Additive : un nouveau type, une
-- colonne nullable sur `variantes`, une nouvelle table. Aucune table ni colonne
-- existante n'est modifiée, et `type_evenement` ne l'est pas non plus : le code
-- de main, qui partage cette base, continue de tourner tel quel.

-- CreateEnum
CREATE TYPE "type_moderation" AS ENUM ('masquage', 'demasquage', 'retrait_vote', 'validation_defi', 'annulation_validation_defi');

-- AlterTable
ALTER TABLE "variantes" ADD COLUMN     "validee_defi_le" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "moderations" (
    "id" TEXT NOT NULL,
    "type" "type_moderation" NOT NULL,
    "variante_id" TEXT NOT NULL,
    "temoignage_id" TEXT,
    "acteur_id" TEXT,
    "le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderations_variante_id_idx" ON "moderations"("variante_id");

-- CreateIndex
CREATE INDEX "moderations_le_idx" ON "moderations"("le");

-- AddForeignKey
ALTER TABLE "moderations" ADD CONSTRAINT "moderations_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderations" ADD CONSTRAINT "moderations_acteur_id_fkey" FOREIGN KEY ("acteur_id") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
