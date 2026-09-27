-- Des articles restaient en tête des listes côté alsacien (27/09/2026,
-- retour de John : « les listes commencent toutes par des articles »).
--
-- Relevé des six premières formes de chaque lettre après 20260927220000 :
--   * D s'ouvrait sur `d" Sippschàft`, `d"r Brechtsärschtàtter`, `d&R…`,
--     S sur `s"Schribteschel`, Z sur `Z´ärzäzung` : l'article élidé écrit
--     avec une autre apostrophe (guillemet droit, accent aigu, `&` ou `©`
--     d'un encodage abîmé à la source) ;
--   * R s'ouvrait sur `r Àschpruch`, `'r Krais`, S sur `s Gwàggerla`, D sur
--     `d …` : l'article sans son apostrophe ;
--   * A sur `a Kurva geh` (`en a Kurva geh`), E sur `e Gàshàhna` : deux mots
--     en tête, dont seul le premier était retiré ;
--   * L sur `l'Àmpär`, `la Poliklinik` : un article français recopié par la
--     source dans la forme alsacienne ;
--   * et des variantes plus rares : `s-Moos` (trait d'union pour
--     apostrophe), `d( Mineràliasàmmlung`, `a-n-aigna` (l'article et sa
--     liaison `-n-`), `'d'r) d'r Bargfiahrer` (glose alsacienne entre
--     parenthèses), `/ s'Blättertaigchtekla`.
--
-- Ne sont PAS des articles, et restent donc en tête : `z` (« zu »), `f'r`
-- (« für »), `g'` et `b'` (préfixes verbaux), `t'haim` (« daheim »).
--
-- La règle devient : jusqu'à DEUX articles retirés en tête, élidés avec
-- n'importe laquelle de ces apostrophes, ou en toutes lettres suivis d'une
-- espace. Même garde qu'avant : un article seul reste un mot, et si rien ne
-- reste, la forme est gardée telle quelle. Le résultat est toujours un
-- fragment contigu de la forme attestée (règle 1).
--
-- Les colonnes générées se recalculent par l'UPDATE, limité aux lignes dont
-- la clé change (cf. 20260927220000).

CREATE OR REPLACE FUNCTION forme_inverse(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
    SELECT CASE WHEN r ~ '[[:alpha:]]' THEN r ELSE $1 END
    FROM (
        SELECT regexp_replace(regexp_replace(
            regexp_replace(
                regexp_replace($1, '^[-''.( ]*(le|la|les|l''|d''r|d''|s'')[)][[:space:]]*', '', 'i'),
                '^[-.,;:()/[:space:]]+(?=[dsz][''’])', '', 'i'
            ),
            '^((d[''’"‘´`&©(-]r|dr[''’"‘´`&©(-]|d[''’"‘´`&©(-]|s[''’"‘´`&©(-]|[''’"‘´`&©(-]s|z[''’"‘´`&©(-]|a[''’"‘´`&©(-]|l[''’"‘´`&©(-]|[''’"‘´`&©(-]r)[[:space:]]*|(der|dr|de|die|dia|di|das|dàs|d|s|r|a|à|ä|e|en|ein|eine|ain|la|le|les)[[:space:]]+|(a|à|ä|e)-n-)', '', 'i'),
            '^((d[''’"‘´`&©(-]r|dr[''’"‘´`&©(-]|d[''’"‘´`&©(-]|s[''’"‘´`&©(-]|[''’"‘´`&©(-]s|z[''’"‘´`&©(-]|a[''’"‘´`&©(-]|l[''’"‘´`&©(-]|[''’"‘´`&©(-]r)[[:space:]]*|(der|dr|de|die|dia|di|das|dàs|d|s|r|a|à|ä|e|en|ein|eine|ain|la|le|les)[[:space:]]+|(a|à|ä|e)-n-)', '', 'i'
        ) AS r
    ) x
$$;

UPDATE variantes SET cle_forme = cle_forme
WHERE cle_inv IS DISTINCT FROM public.cle_inverse(cle_forme)
   OR parcours_inv IS DISTINCT FROM public.parcours_inverse(cle_forme);
