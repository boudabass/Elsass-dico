-- ============================================
-- Décomposition de l'article défini collé (culture_alsace, lexique général)
-- ============================================
-- CLAUDE.md, 02/09/2026 : ~15 600 des 23 851 attestations lexicales de
-- culture_alsace portent l'article défini collé (d'r lohn, s' schloss).
-- Publiées telles quelles, une recherche sur "salaire" ne retrouve pas "lohn".
--
-- Mesure en base (03/09/2026) avant d'écrire quoi que ce soit : le chiffre du
-- 02/09 mélangeait deux populations très différentes.
--   - 12 786 attestations lexicales à UNE SEULE forme alsacienne.
--   - 11 065 attestations (46 %) empilent PLUSIEURS synonymes dans le même
--     champ alsacien, séparés par une virgule ou un point-virgule (ex.
--     "d'r Scheffégreff, d'Antrung."). Décomposer proprement supposerait de
--     d'abord scinder chaque attestation en plusieurs lignes — un chantier de
--     nature différente, explicitement HORS PÉRIMÈTRE ici (décision de John,
--     03/09/2026). Elles ne sont pas touchées : article et
--     alsacien_sans_article restent NULL pour ces lignes.
--
-- Invariant de la table (attestations = copie brute, jamais retouchée) :
-- alsacien n'est PAS modifiée. article et alsacien_sans_article sont des
-- colonnes dérivées, calculées une fois ici ; leur concaténation reconstitue
-- alsacien octet à octet — la CHECK ci-dessous en fait une garantie du
-- schéma, pas seulement une intention de script.
--
-- Règle de reconnaissance (appliquée aux 12 786 lignes à une seule forme) :
--   - "d'r ", "s' ", "d' " (espacés, insensible à la casse en tête) : 5 996
--     lignes, sans ambiguïté possible — l'article est un mot séparé.
--   - "d'"/"s'" collés (sans espace) SEULEMENT quand le caractère suivant est
--     une MAJUSCULE (nom propre à la convention de cette orthographe) :
--     2 890 lignes. Glué + majuscule = article élidé devant un nom
--     ("d'Zitrüsfrucht"). Glué + minuscule reste ambigu : "d'frescha Luft"
--     (article + adjectif, légitime) est indiscernable de "s'esch..."
--     (pronom "es" + verbe, PAS un article) sans analyse grammaticale que ce
--     script ne fait pas. Règle 3 du studio (un doute se signale, il ne se
--     comble pas) : ces 130 lignes ne sont PAS décomposées.
--   - Aucun préfixe reconnu (3 770 lignes, ex. "sech", "en", "uff") ou
--     préfixe hors du périmètre de l'article défini ("z'" = contraction de
--     préposition "zu der", "g'" = préfixe de participe passé, "de " en
--     occurrence unique et douteuse) : non décomposées.
-- Total décomposé : 8 886 / 23 851 attestations lexicales culture_alsace.

ALTER TABLE public.attestations
  ADD COLUMN IF NOT EXISTS article TEXT,
  ADD COLUMN IF NOT EXISTS alsacien_sans_article TEXT;

COMMENT ON COLUMN public.attestations.article IS
  'Article défini collé, isolé de alsacien pour les attestations lexicales à une seule forme (culture_alsace). Conserve son séparateur tel quel (espace de fin pour "d''r "/"s'' "/"d'' ", aucun pour la forme élidée "d''"/"s''") : article || alsacien_sans_article == alsacien est une garantie du schéma (cf. CHECK), pas une convention de script. NULL = non décomposé (attestation à synonymes multiples, ou préfixe absent/ambigu — cf. migration 20260903010000).';
COMMENT ON COLUMN public.attestations.alsacien_sans_article IS
  'Forme alsacienne sans l''article défini collé. NULL tant que article est NULL — ce n''est pas une seconde copie de alsacien, seulement le reste utile quand une décomposition a eu lieu.';

ALTER TABLE public.attestations
  ADD CONSTRAINT chk_article_reconstruction
  CHECK (article IS NULL OR article || alsacien_sans_article = alsacien);

-- ============================================
-- Rétro-remplissage, scopé exactement à ce qui a été mesuré
-- ============================================

WITH classement AS (
  SELECT
    a.id,
    CASE
      WHEN a.alsacien ~ '^[dD]''r '       THEN 4
      WHEN a.alsacien ~ '^[sS]'' '        THEN 3
      WHEN a.alsacien ~ '^[dD]'' '        THEN 3
      WHEN a.alsacien ~ '^[dD]''[A-ZÀ-Ý]' THEN 2
      WHEN a.alsacien ~ '^[sS]''[A-ZÀ-Ý]' THEN 2
      ELSE NULL
    END AS n
  FROM public.attestations a
  JOIN public.sources s ON s.id = a.source_id
  WHERE s.code = 'culture_alsace'
    AND a.type IN ('mot', 'expression')
    AND a.alsacien NOT LIKE '%,%'
    AND a.alsacien NOT LIKE '%;%'
)
UPDATE public.attestations a
SET article = substring(a.alsacien from 1 for c.n),
    alsacien_sans_article = substring(a.alsacien from c.n + 1)
FROM classement c
WHERE a.id = c.id
  AND c.n IS NOT NULL;
