-- Notifications du défi du jour (Odoo 930, 09/10/2026). Un abonnement Web Push
-- par téléphone, lié au membre ; supprimé avec lui. Additive : le code de
-- `main` l'ignore tant que la PR n'y est pas.

CREATE TABLE "abonnements_push" (
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "appareil" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dernier_defi" DATE,

    CONSTRAINT "abonnements_push_pkey" PRIMARY KEY ("endpoint")
);

CREATE INDEX "abonnements_push_membre_id_idx" ON "abonnements_push"("membre_id");

ALTER TABLE "abonnements_push" ADD CONSTRAINT "abonnements_push_membre_id_fkey"
  FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
