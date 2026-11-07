-- Blocage d'un membre par l'admin (07/11/2026). Additive : une colonne nullable
-- sur `membres`, rien d'autre. Le code de main, qui ne lit pas cette colonne,
-- continue de tourner sur la base migrée.

-- AlterTable
ALTER TABLE "membres" ADD COLUMN     "bloque_le" TIMESTAMP(3);
