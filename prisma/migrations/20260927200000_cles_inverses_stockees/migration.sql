-- Les clés du sens alsacien → français, stockées (27/09/2026).
--
-- Mesuré après 20260927180000 : l'index trouvait les 5 696 variantes de S en
-- 3 ms, mais recalculer `cle_inverse()` sur chacune en coûtait 570. La
-- fonction ne s'intègre plus à la requête depuis qu'elle garde l'article
-- seul (sous-requête), et chaque appel prend ~100 µs. Écran : 4,2 s pour les
-- lettres de l'A-Z, 1,3 s pour une page de S.
--
-- Colonnes GÉNÉRÉES par Postgres, pas écrites par l'app : elles suivent
-- `cle_forme` à chaque écriture, y compris une forme ajoutée par un membre,
-- sans qu'aucun code n'ait à y penser. Absentes du schéma Prisma exprès : le
-- client n'a jamais à les écrire (Postgres le refuserait), seules les
-- requêtes brutes de formes.ts et carte.ts les lisent.

ALTER TABLE variantes
    ADD COLUMN cle_inv text GENERATED ALWAYS AS (public.cle_inverse(cle_forme)) STORED,
    ADD COLUMN parcours_inv text GENERATED ALWAYS AS (public.parcours_inverse(cle_forme)) STORED;

DROP INDEX IF EXISTS ix_variantes_cle_inverse;
DROP INDEX IF EXISTS ix_variantes_initiale_inverse;

CREATE INDEX ix_variantes_cle_inv ON variantes (cle_inv) WHERE masquee = false;
CREATE INDEX ix_variantes_parcours_inv ON variantes (upper(left(parcours_inv, 1)), parcours_inv) WHERE masquee = false;
