-- Les débuts parasites des formes, côté alsacien → français (27/09/2026).
--
-- Vu en vérifiant l'A-Z alsacien : L s'ouvrait sur `l') d'Meschschtuwa`.
-- Mesuré : 23 formes de culture_alsace portent en tête la glose française de
-- l'article (`(le) d'Àrwet`, `'(l') d'Nübba`, `'le) d'r Polizäifilm`), et une
-- dizaine d'autres commencent par de la ponctuation (`(d'r Kengala…`,
-- `) s' Müatter`). Elles se rangeaient sous la lettre de la glose, pas sous
-- celle du mot.
--
-- `forme_inverse` retire désormais, dans l'ordre : la glose `(le)`/`(la)`/
-- `(les)`/`(l')` (reconnue à sa parenthèse FERMANTE, sans quoi `le` ou `la`
-- pourraient être un mot), puis la ponctuation de tête QUAND un article élidé
-- la suit (sinon `(être) brait` deviendrait `être) brait`, une parenthèse
-- orpheline), puis l'article. Même
-- garde que la version précédente : si rien ne reste, la forme est gardée
-- telle quelle. Toujours un fragment contigu de la forme attestée.
--
-- `[)]` et non `\)` : ce serveur ne lit pas l'antislash comme un échappement
-- dans une chaîne SQL (constaté le 27/09 avec `\s`).
--
-- Les colonnes générées `cle_inv` et `parcours_inv` ne se recalculent pas
-- quand leur fonction change : elles ne le font qu'à l'écriture de la ligne.
-- D'où l'UPDATE, limité aux lignes dont la clé change (aucun trigger sur
-- `variantes`).

CREATE OR REPLACE FUNCTION forme_inverse(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
    SELECT CASE WHEN r ~ '[[:alpha:]]' THEN r ELSE $1 END
    FROM (
        SELECT regexp_replace(
            regexp_replace(
                regexp_replace($1, '^[-''.( ]*(le|la|les|l'')[)][[:space:]]*', '', 'i'),
                '^[-.,;:()[:space:]]+(?=[dsz][''’])', '', 'i'
            ),
            '^((d''r|dr''|d''|s''|''s|z''|a''|d’r|dr’|d’|s’|’s|z’|a’)[[:space:]]*|(der|dr|de|die|dia|di|das|dàs|a|à|ä|e|en|ein|eine|ain)[[:space:]]+)',
            '',
            'i'
        ) AS r
    ) x
$$;

UPDATE variantes SET cle_forme = cle_forme
WHERE cle_inv IS DISTINCT FROM public.cle_inverse(cle_forme)
   OR parcours_inv IS DISTINCT FROM public.parcours_inverse(cle_forme);
