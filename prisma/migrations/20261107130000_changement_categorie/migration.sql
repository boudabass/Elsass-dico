-- Retrait de la catégorie « insulte » par l'admin (07/11/2026). Additive : une
-- table neuve, aucune colonne ni valeur d'enum existante n'est touchée. Le code
-- de main, qui ne lit pas cette table, continue de tourner sur la base migrée.

-- CreateTable
CREATE TABLE "changements_categorie" (
    "id" TEXT NOT NULL,
    "lemme_id" TEXT NOT NULL,
    "ancien_contexte" TEXT NOT NULL,
    "nouveau_contexte" TEXT NOT NULL,
    "acteur_id" TEXT,
    "le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "changements_categorie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "changements_categorie_lemme_id_idx" ON "changements_categorie"("lemme_id");

-- CreateIndex
CREATE INDEX "changements_categorie_le_idx" ON "changements_categorie"("le");

-- AddForeignKey
ALTER TABLE "changements_categorie" ADD CONSTRAINT "changements_categorie_lemme_id_fkey" FOREIGN KEY ("lemme_id") REFERENCES "lemmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "changements_categorie" ADD CONSTRAINT "changements_categorie_acteur_id_fkey" FOREIGN KEY ("acteur_id") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
