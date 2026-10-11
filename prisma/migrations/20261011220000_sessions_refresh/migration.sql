-- Sessions de renouvellement révocables (audit du 11/10/2026). Une ligne par
-- connexion ; le jeton `ed_refresh` en porte l'identifiant. Additive : aucune
-- table ni colonne existante n'est modifiée. Les jetons émis avant n'ont pas de
-- ligne : ils deviennent invalides, et chaque membre se reconnecte une fois.

CREATE TABLE "sessions_refresh" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vu_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_refresh_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessions_refresh_membre_id_idx" ON "sessions_refresh"("membre_id");

ALTER TABLE "sessions_refresh" ADD CONSTRAINT "sessions_refresh_membre_id_fkey"
  FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
