-- Supprimer un membre ne supprime plus ses témoignages : ils restent, anonymes.
--
-- Promis par les CGU (article 9) et la politique de confidentialité, publiées
-- les 23 et 24/09/2026 : « Vos contributions restent dans le dictionnaire sous
-- forme anonyme : la forme et le village demeurent, sans plus aucun lien avec
-- vous. » Jusqu'ici, la suppression d'un membre effaçait en cascade ses
-- témoignages, et avec eux des villages que personne d'autre ne portait.
--
-- Deux changements, et seulement deux :
--   1. la clé étrangère passe de CASCADE à SET NULL : le témoignage garde sa
--      variante et sa commune, il perd son membre ;
--   2. le CHECK accepte un témoignage de locuteur sans membre. Ce qui fait un
--      témoignage parlé, c'est son village ; le membre n'en était que l'auteur.
--
-- Les variantes créées par un membre étaient déjà en SET NULL (`cree_par`).
-- Les signalements restent en CASCADE : ce sont des messages, pas des
-- contributions au dictionnaire, et leur motif est un texte libre qui peut
-- contenir des données personnelles.

ALTER TABLE "temoignages" DROP CONSTRAINT "temoignages_membre_id_fkey";
ALTER TABLE "temoignages" ADD CONSTRAINT "temoignages_membre_id_fkey"
  FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "temoignages" DROP CONSTRAINT "chk_temoignage_source_ou_locuteur";
ALTER TABLE "temoignages" ADD CONSTRAINT "chk_temoignage_source_ou_locuteur" CHECK (
  (
    "source_id" IS NOT NULL
    AND "membre_id" IS NULL
    AND "commune_id" IS NULL
  )
  OR
  (
    -- Un locuteur, identifié ou anonymisé : son village suffit.
    "commune_id" IS NOT NULL
    AND "source_id" IS NULL
    AND "attestation_id" IS NULL
    -- Une aire dialectale est ce qu'une SOURCE déclare d'elle-même. Un
    -- locuteur dit son village, et c'est plus précis, pas moins.
    AND "aire_declaree" IS NULL
  )
);

COMMENT ON CONSTRAINT "chk_temoignage_source_ou_locuteur" ON "temoignages" IS
  'Un témoignage est écrit (source, sans lieu) ou parlé (commune, avec ou sans membre : sans, c''est un membre parti, anonymisé). Les deux blocs ne s''additionnent jamais dans un même chiffre affiché.';
