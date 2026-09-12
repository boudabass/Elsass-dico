-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "type_terme" AS ENUM ('mot', 'expression', 'proverbe', 'toponyme', 'prenom');

-- CreateEnum
CREATE TYPE "role" AS ENUM ('membre', 'admin');

-- CreateEnum
CREATE TYPE "type_source" AS ENUM ('site', 'ouvrage');

-- CreateEnum
CREATE TYPE "aire_dialectale" AS ENUM ('francique_rhenan_lorrain', 'francique_rhenan_meridional', 'bas_alemanique_nord', 'bas_alemanique_sud', 'haut_alemanique');

-- CreateTable
CREATE TABLE "communes" (
    "id" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "codes_postaux" TEXT[],
    "population" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "aire_linguistique" TEXT,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lemmes" (
    "id" TEXT NOT NULL,
    "francais" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "contexte" TEXT NOT NULL DEFAULT '',
    "type" "type_terme" NOT NULL,
    "commune_id" INTEGER,
    "slug" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lemmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes" (
    "id" TEXT NOT NULL,
    "lemme_id" TEXT NOT NULL,
    "forme" TEXT NOT NULL,
    "cle_forme" TEXT NOT NULL,
    "article" TEXT,
    "forme_sans_article" TEXT,
    "cree_par" TEXT,
    "masquee" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temoignages" (
    "id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "source_id" TEXT,
    "attestation_id" TEXT,
    "aire_declaree" "aire_dialectale",
    "membre_id" TEXT,
    "commune_id" INTEGER,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temoignages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "odoo_uid" INTEGER,
    "nom" TEXT,
    "role" "role" NOT NULL DEFAULT 'membre',
    "commune_id" INTEGER,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vu_le" TIMESTAMP(3),

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signalements" (
    "id" TEXT NOT NULL,
    "variante_id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traite_le" TIMESTAMP(3),

    CONSTRAINT "signalements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT,
    "type" "type_source" NOT NULL,
    "annee" INTEGER,
    "licence" TEXT,
    "fiabilite" SMALLINT NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestations" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "francais" TEXT NOT NULL,
    "alsacien" TEXT NOT NULL,
    "graphie_origine" TEXT NOT NULL,
    "type" "type_terme" NOT NULL,
    "contexte" TEXT NOT NULL DEFAULT '',
    "region" TEXT,
    "reference" TEXT,
    "article" TEXT,
    "alsacien_sans_article" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalies_source" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomalies_source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communes_slug_key" ON "communes"("slug");

-- CreateIndex
CREATE INDEX "communes_departement_idx" ON "communes"("departement");

-- CreateIndex
CREATE INDEX "communes_nom_idx" ON "communes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "lemmes_slug_key" ON "lemmes"("slug");

-- CreateIndex
CREATE INDEX "lemmes_cle_idx" ON "lemmes"("cle");

-- CreateIndex
CREATE INDEX "lemmes_type_idx" ON "lemmes"("type");

-- CreateIndex
CREATE UNIQUE INDEX "lemmes_cle_contexte_key" ON "lemmes"("cle", "contexte");

-- CreateIndex
CREATE INDEX "variantes_lemme_id_idx" ON "variantes"("lemme_id");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_lemme_id_cle_forme_key" ON "variantes"("lemme_id", "cle_forme");

-- CreateIndex
CREATE INDEX "temoignages_variante_id_idx" ON "temoignages"("variante_id");

-- CreateIndex
CREATE INDEX "temoignages_commune_id_idx" ON "temoignages"("commune_id");

-- CreateIndex
CREATE UNIQUE INDEX "temoignages_variante_id_membre_id_key" ON "temoignages"("variante_id", "membre_id");

-- CreateIndex
CREATE UNIQUE INDEX "temoignages_variante_id_attestation_id_key" ON "temoignages"("variante_id", "attestation_id");

-- CreateIndex
CREATE UNIQUE INDEX "membres_email_key" ON "membres"("email");

-- CreateIndex
CREATE UNIQUE INDEX "membres_odoo_uid_key" ON "membres"("odoo_uid");

-- CreateIndex
CREATE INDEX "signalements_traite_le_idx" ON "signalements"("traite_le");

-- CreateIndex
CREATE UNIQUE INDEX "sources_code_key" ON "sources"("code");

-- CreateIndex
CREATE INDEX "attestations_source_id_idx" ON "attestations"("source_id");

-- CreateIndex
CREATE INDEX "attestations_reference_idx" ON "attestations"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "attestations_source_id_francais_alsacien_contexte_key" ON "attestations"("source_id", "francais", "alsacien", "contexte");

-- CreateIndex
CREATE INDEX "anomalies_source_reference_idx" ON "anomalies_source"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "anomalies_source_reference_type_key" ON "anomalies_source"("reference", "type");

-- AddForeignKey
ALTER TABLE "lemmes" ADD CONSTRAINT "lemmes_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_lemme_id_fkey" FOREIGN KEY ("lemme_id") REFERENCES "lemmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_cree_par_fkey" FOREIGN KEY ("cree_par") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temoignages" ADD CONSTRAINT "temoignages_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temoignages" ADD CONSTRAINT "temoignages_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temoignages" ADD CONSTRAINT "temoignages_attestation_id_fkey" FOREIGN KEY ("attestation_id") REFERENCES "attestations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temoignages" ADD CONSTRAINT "temoignages_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temoignages" ADD CONSTRAINT "temoignages_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres" ADD CONSTRAINT "membres_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signalements" ADD CONSTRAINT "signalements_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- ============================================================================
-- Ajouté à la main à la migration générée par Prisma.
--
-- Point 2 du doc 20 (« ne se négocie pas ») : un témoignage a SOIT une source
-- écrite, SOIT un membre et sa commune — jamais les deux, jamais aucun. Prisma
-- ne sait pas exprimer un CHECK ; le poser ici en fait une barrière du schéma
-- et non une intention de code. C'est la leçon de la garde `arbitrer_entree()`
-- : ce qui vit dans l'interface n'est pas une garantie.
--
-- Une source ne parle depuis aucun village : la branche écrite ne porte donc
-- ni membre ni commune. Et une attestation ne se rattache qu'à une source,
-- puisqu'elle en vient.
-- ============================================================================

ALTER TABLE "temoignages" ADD CONSTRAINT "chk_temoignage_source_ou_locuteur" CHECK (
  (
    "source_id" IS NOT NULL
    AND "membre_id" IS NULL
    AND "commune_id" IS NULL
  )
  OR
  (
    "membre_id" IS NOT NULL
    AND "commune_id" IS NOT NULL
    AND "source_id" IS NULL
    AND "attestation_id" IS NULL
    -- Une aire dialectale est ce qu'une SOURCE déclare d'elle-même. Un
    -- locuteur dit son village, et c'est plus précis, pas moins : lui coller
    -- une aire par-dessus reviendrait à le ranger dans une case qu'il n'a pas
    -- choisie.
    AND "aire_declaree" IS NULL
  )
);

COMMENT ON CONSTRAINT "chk_temoignage_source_ou_locuteur" ON "temoignages" IS
  'Un témoignage est écrit (source, sans lieu) ou parlé (membre + commune). Les deux blocs ne s''additionnent jamais dans un même chiffre affiché.';

-- La forme publiée est toujours copiée verbatim (règle 1) : une variante sans
-- forme n'existe pas, et `cle_forme` doit rester le reflet de `forme`.
ALTER TABLE "variantes" ADD CONSTRAINT "chk_variante_forme_non_vide" CHECK (
  btrim("forme") <> '' AND btrim("cle_forme") <> ''
);

-- L'article décomposé se reconcatène octet à octet — c'est ce qui fait que la
-- décomposition n'est pas une réécriture (migration 20260903010000).
ALTER TABLE "variantes" ADD CONSTRAINT "chk_variante_article_reconstruction" CHECK (
  ("article" IS NULL AND "forme_sans_article" IS NULL)
  OR (COALESCE("article", '') || COALESCE("forme_sans_article", '') = "forme")
);

ALTER TABLE "attestations" ADD CONSTRAINT "chk_attestation_article_reconstruction" CHECK (
  ("article" IS NULL AND "alsacien_sans_article" IS NULL)
  OR (COALESCE("article", '') || COALESCE("alsacien_sans_article", '') = "alsacien")
);
