-- Le journal des contributions, en ajout seul.
--
-- Décision de John (24/09/2026) : l'alsacien unifié doit émerger dans le
-- temps, jamais s'imposer, et le projet s'y prépare techniquement. Or la base
-- ne garde que l'état présent : retirer un vote supprime le témoignage,
-- modifier une forme l'écrase. Un village qui quitte une forme pour une autre
-- est précisément le signal d'une convergence, et il se perdait.
--
-- Rien ne lit ce journal à l'écran. Les compteurs restent calculés sur
-- `temoignages`, qui ne change pas. Justification complète dans le schéma
-- (modèle EvenementContribution).

-- CreateEnum
CREATE TYPE "type_evenement" AS ENUM ('pose', 'retrait', 'creation', 'modification');

-- CreateTable
CREATE TABLE "evenements_contribution" (
    "id" TEXT NOT NULL,
    "type" "type_evenement" NOT NULL,
    "variante_id" TEXT NOT NULL,
    "temoignage_id" TEXT,
    "commune_id" INTEGER,
    "membre_id" TEXT,
    "ancienne_forme" TEXT,
    "nouvelle_forme" TEXT,
    "le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evenements_contribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evenements_contribution_variante_id_idx" ON "evenements_contribution"("variante_id");

-- CreateIndex
CREATE INDEX "evenements_contribution_commune_id_le_idx" ON "evenements_contribution"("commune_id", "le");

-- AddForeignKey
ALTER TABLE "evenements_contribution" ADD CONSTRAINT "evenements_contribution_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_contribution" ADD CONSTRAINT "evenements_contribution_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements_contribution" ADD CONSTRAINT "evenements_contribution_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ce que Prisma ne sait pas écrire : la forme de chaque type d'événement.
-- Une pose ou un retrait dit toujours quel témoignage et quel village ; seule
-- une modification porte deux formes. Un journal qu'on ne peut pas relire sans
-- deviner ne sert à rien.
ALTER TABLE "evenements_contribution" ADD CONSTRAINT "chk_evenement_forme" CHECK (
  CASE "type"
    WHEN 'pose'         THEN "temoignage_id" IS NOT NULL AND "ancienne_forme" IS NULL AND "nouvelle_forme" IS NULL
    WHEN 'retrait'      THEN "temoignage_id" IS NOT NULL AND "ancienne_forme" IS NULL AND "nouvelle_forme" IS NULL
    WHEN 'creation'     THEN "temoignage_id" IS NULL AND "ancienne_forme" IS NULL AND "nouvelle_forme" IS NOT NULL
    WHEN 'modification' THEN "temoignage_id" IS NULL AND "ancienne_forme" IS NOT NULL AND "nouvelle_forme" IS NOT NULL
  END
);

-- Rattrapage : ce qui existait avant le journal y entre, daté de sa création.
-- Les créations d'abord : à date égale, elles précèdent la pose de leur
-- auteur. Leur village est celui du témoignage que l'auteur a posé avec elles
-- (même transaction depuis le 15/09), nul s'il l'a retiré depuis.
INSERT INTO "evenements_contribution" ("id", "type", "variante_id", "commune_id", "membre_id", "nouvelle_forme", "le")
SELECT gen_random_uuid()::text, 'creation', v."id",
       (SELECT t."commune_id" FROM "temoignages" t
         WHERE t."variante_id" = v."id" AND t."membre_id" = v."cree_par" LIMIT 1),
       v."cree_par", v."forme", v."cree_le"
FROM "variantes" v
WHERE v."cree_par" IS NOT NULL;

-- Les témoignages parlés, identifiés par leur village (cf. la migration du
-- 24/09 : un témoignage de locuteur peut avoir perdu son membre, jamais son
-- village). Ceux des sources n'y entrent pas : leur date est celle d'un
-- import, pas d'un geste.
INSERT INTO "evenements_contribution" ("id", "type", "variante_id", "temoignage_id", "commune_id", "membre_id", "le")
SELECT gen_random_uuid()::text, 'pose', t."variante_id", t."id", t."commune_id", t."membre_id", t."cree_le"
FROM "temoignages" t
WHERE t."commune_id" IS NOT NULL;
