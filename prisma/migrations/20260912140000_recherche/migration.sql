-- Recherche floue — ce que les RPC Supabase faisaient et que Prisma seul ne
-- fait pas. Écrit à la main : Prisma ne modélise ni les extensions ni les index
-- d'expression, et une migration générée ne les reproduirait donc jamais.
--
-- ATTENTION à la distinction, elle a déjà coûté un correctif (24/08/2026) :
-- `unaccent` a sa place dans la RECHERCHE — chercher « epreuve » doit trouver
-- « épreuve » — et nulle part ailleurs. Dans une clé d'identité, il fusionnait
-- `sur`/`sûr`, `ville`/`Villé`, `comte`/`comté`. La clé d'un lemme
-- (`lemmes.cle`) reste `lower(btrim(francais))`, sans unaccent : ce fichier n'y
-- touche pas.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- `unaccent()` est déclarée STABLE et non IMMUTABLE — son dictionnaire peut
-- être rechargé — ce qui la rend inutilisable dans un index. Le wrapper fige le
-- dictionnaire par son `regdictionary`, ce qui autorise l'indexation.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- GIN trigramme : c'est ce qui rend un `LIKE '%...%'` utilisable sur 25 864
-- lemmes et 41 646 variantes. Sans index, chacun de ces deux motifs impose un
-- parcours complet — sur un VPS déjà sujet à la saturation CPU (audit du
-- 30/08/2026), une recherche par frappe au clavier le ferait sentir.
CREATE INDEX IF NOT EXISTS ix_lemmes_cle_trgm
    ON lemmes USING gin (immutable_unaccent(cle) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_variantes_forme_trgm
    ON variantes USING gin (immutable_unaccent(lower(forme)) gin_trgm_ops);

-- Parcours alphabétique (écran « Dictionnaire A-Z ») : la première lettre du
-- lemme, désaccentuée pour que `Écureuil` se range sous E et non dans une
-- vingt-septième case.
CREATE INDEX IF NOT EXISTS ix_lemmes_initiale
    ON lemmes (left(immutable_unaccent(cle), 1));
