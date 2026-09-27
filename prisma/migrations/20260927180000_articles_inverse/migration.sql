-- L'article ne compte pas, côté alsacien comme côté français (27/09/2026,
-- décision de John : « on ne compte pas le, la, les pour le français »).
--
-- La version du matin ne retirait que l'article élidé (`d'r`, `d'`, `s'`,
-- `z'`). Mesuré le même jour : `de` ouvre encore 1 219 formes, `a` 153, `en`
-- 152, `e` 23, plus des variantes rares (`à`, `a’`, `ein`, `eine`, `dr'`).
-- L'A-Z alsacien s'ouvrait sur `a Äbmägerungskür mache`.
--
-- Deux règles :
--   * un article en toutes lettres ne se retire que suivi d'une espace
--     (`de Lohn` → `Lohn`, mais `dewäga` reste sous D) ;
--   * un article SEUL reste un mot (décision de John) : si rien ne reste
--     après le retrait, la forme est gardée telle quelle. Sept formes sont
--     dans ce cas (`d'`, `s'`, `d'r`, `de`, `dia`, `dàs`, `en`).
--
-- Un seul article est retiré, le premier : dans `en a Kurva geh`, `en` est
-- une préposition (« dans ») et `a` l'article, et un second retrait
-- enlèverait un mot qui compte. `en` reste ambigu (article ou préposition
-- selon le parler) ; retiré quand il ouvre la forme, c'est le cas le plus
-- courant. Le résultat reste un fragment
-- contigu de la forme attestée, jamais une réécriture (règle 1).
--
-- `cle_inverse` et `parcours_inverse` appellent `forme_inverse` : elles
-- suivent sans changer, mais les deux index en stockent les valeurs, d'où le
-- REINDEX.

CREATE OR REPLACE FUNCTION forme_inverse(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
    SELECT CASE WHEN r ~ '[[:alpha:]]' THEN r ELSE $1 END
    FROM (
        SELECT regexp_replace(
            $1,
            '^((d''r|dr''|d''|s''|''s|z''|a''|d’r|dr’|d’|s’|’s|z’|a’)[[:space:]]*|(der|dr|de|die|dia|di|das|dàs|a|à|ä|e|en|ein|eine|ain)[[:space:]]+)',
            '',
            'i'
        ) AS r
    ) x
$$;

REINDEX INDEX ix_variantes_cle_inverse;
REINDEX INDEX ix_variantes_initiale_inverse;
