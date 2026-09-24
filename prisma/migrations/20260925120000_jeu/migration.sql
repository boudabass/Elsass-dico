-- Le jeu « Quel village dit ça ? » (brief validé par John le 25/09/2026).
--
-- Une ligne par partie, membres seulement. Rien ici ne touche au
-- dictionnaire : aucune forme, aucun témoignage, aucun village n'y est écrit.
-- Justification complète dans le schéma (modèle PartieJeu).

-- CreateEnum
CREATE TYPE "mode_jeu" AS ENUM ('jour', 'libre');

-- CreateTable
CREATE TABLE "parties_jeu" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "mode" "mode_jeu" NOT NULL,
    "jour" DATE,
    "manches" JSONB NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "finie" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parties_jeu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parties_jeu_membre_id_jour_key" ON "parties_jeu"("membre_id", "jour");

-- CreateIndex
CREATE INDEX "parties_jeu_membre_id_mode_idx" ON "parties_jeu"("membre_id", "mode");

-- AddForeignKey
ALTER TABLE "parties_jeu" ADD CONSTRAINT "parties_jeu_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ce que Prisma ne sait pas écrire : seul le défi du jour porte une date.
-- Une partie libre datée entrerait en collision avec le défi du même jour.
ALTER TABLE "parties_jeu" ADD CONSTRAINT "chk_partie_jour" CHECK (
  ("mode" = 'jour') = ("jour" IS NOT NULL)
);
