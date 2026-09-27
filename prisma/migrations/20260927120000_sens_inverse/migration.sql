-- Le dictionnaire dans l'autre sens, alsacien → français (27/09/2026).
--
-- Aucune donnée nouvelle : un index inversé des variantes existantes. Deux
-- fonctions, pour que la recherche, la lettre, le tri et le saut « Aller à un
-- mot » passent tous par la MÊME expression — si l'un s'en écartait, le saut
-- tomberait sur une page qui n'affiche pas la forme (leçon du 24/09 côté
-- français, `cleParcours()`).
--
-- `forme_inverse` retire l'article élidé de tête (`d'r`, `d'`, `s'`, `z'`) :
-- `d'r Lohn` se range sous L, comme un dictionnaire papier. Mesuré le
-- 27/09/2026 : sans ce retrait, D portait 11 003 formes et S 6 199, parce que
-- 14 000 formes de culture_alsace commencent par leur article sans avoir été
-- décomposées. Le résultat est un fragment contigu de la forme attestée,
-- jamais une réécriture (règle 1).
--
-- `cle_inverse` regroupe les formes qu'un lecteur tient pour la même entrée :
-- sans article, sans casse. AVEC les accents : `Barr` et `Bàrr` ne notent pas
-- le même /a/ (ORTHAL), et `unaccent` n'a pas sa place dans une clé de
-- regroupement (correctif du 24/08/2026). `unaccent` n'entre que dans
-- `parcours_inverse`, qui sert à ranger et jamais à fusionner.
--
-- Les appels imbriqués sont préfixés par `public.` : Postgres (17 et plus)
-- construit un index avec un `search_path` restreint à pg_catalog, et un nom
-- nu y est introuvable (« function forme_inverse(text) does not exist »,
-- rencontré en validant cette migration). `immutable_unaccent` s'était déjà
-- protégée de la même façon (20260912140000).

CREATE OR REPLACE FUNCTION forme_inverse(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT regexp_replace($1, '^(d''r|d''|s''|z''|d’r|d’|s’|z’)[[:space:]]*', '', 'i') $$;

CREATE OR REPLACE FUNCTION cle_inverse(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT lower(public.forme_inverse($1)) $$;

CREATE OR REPLACE FUNCTION parcours_inverse(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT regexp_replace(public.immutable_unaccent(public.cle_inverse($1)), '^[^a-z]+', '') $$;

CREATE INDEX IF NOT EXISTS ix_variantes_cle_inverse
    ON variantes (cle_inverse(cle_forme)) WHERE masquee = false;

CREATE INDEX IF NOT EXISTS ix_variantes_initiale_inverse
    ON variantes (upper(left(parcours_inverse(cle_forme), 1))) WHERE masquee = false;
