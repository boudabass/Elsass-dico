-- Messages de l'équipe aux membres (07/11/2026). Additive : une table neuve, rien
-- d'existant n'est modifié. Le code de main, qui ne lit pas cette table, continue
-- de tourner sur la base migrée.

-- CreateTable
CREATE TABLE "messages_membre" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "auteur_id" TEXT,
    "texte" TEXT NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lu_le" TIMESTAMP(3),

    CONSTRAINT "messages_membre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_membre_membre_id_idx" ON "messages_membre"("membre_id");

-- AddForeignKey
ALTER TABLE "messages_membre" ADD CONSTRAINT "messages_membre_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_membre" ADD CONSTRAINT "messages_membre_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
