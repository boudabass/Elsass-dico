-- ============================================
-- La clé d'arbitrage ignore la ponctuation finale du français (07/09/2026)
-- ============================================
-- Cette migration fait deux choses sur les mêmes fonctions, pour ne pas les
-- redéfinir deux fois de suite : elle change la clé de groupement (ci-dessous)
-- et elle expose dans chaque variante le signalement d'anomalie de source
-- introduit par 20260907010000 ('anomalies', via anomalies_de()).
--
-- Mesuré en base avant d'écrire, sur les 27 179 attestations : 618 portent une
-- ponctuation finale sur le champ `francais` — 608 de `wiktionnaire_fr`, où le
-- point clôt une définition (« Alphabet. », « Accepter. »), et 10 de
-- `culture_alsace`, dont 9 sont des abréviations de toponymes
-- (« Sainte-Marie-aux-M. ») où le point fait partie du nom.
--
-- Conséquence : la clé de groupement étant lower(btrim(francais)), « accepter »
-- et « accepter. » ne se rencontrent JAMAIS dans la file d'arbitrage, même
-- écrits par deux sources indépendantes. C'est le même défaut que la
-- recontextualisation du 24/08/2026 (les toponymes de `wiktionnaire_fr` portaient
-- « Alsace ; Géographie » en contexte) : la donnée est là, la convention de champ
-- l'empêche de se voir.
--
-- Gain mesuré, ponctuation finale SEULE (les parenthèses ne sont pas touchées,
-- cf. plus bas) : **341 -> 420 candidats à 2 sources ou plus, soit +79**, tous
-- `culture_alsace` × `wiktionnaire_fr`, portant 133 attestations de type `mot`,
-- 40 `prenom`, 2 `expression`. Ce sont des mots du lexique courant — accepter,
-- acheter, aider, aller, apprendre, après-midi, attendre — la cible v1.
--
-- Répartition entre les deux onglets, mesurée et non supposée : deux sources sur
-- le même mot français ne veulent pas dire qu'elles écrivent la même forme
-- alsacienne (distinction du 23/08/2026, jamais à confondre).
--        candidats 2+ sources : 341 -> 420
--          accord de forme    :   0 ->   7   (onglet Recoupées, publiables en lot)
--          divergents         : 341 -> 413   (onglet Divergentes, un par un)
-- Les 7 accords sont « georges », « incolore », « mais », « mardi »,
-- « mulhouse », « sans », « tu » — dont quatre où les deux sources écrivaient
-- déjà rigoureusement la même forme (« ohna » / « ohna. »), et que seule la clé
-- française tenait séparés. L'essentiel du gain va donc à l'arbitrage manuel,
-- ce qui est le résultat attendu : les conventions de graphie des deux sources
-- diffèrent (cf. campagne 5).
--
-- **Zéro fusion abusive mesurée** : aucune des 79 clés ne réunit deux écritures
-- du français qui diffèrent par autre chose que la ponctuation finale (contrôle
-- explicite : « clés réunissant plus de 2 écritures » = 0).
--
-- Ce n'est PAS une réécriture de la donnée (règle 1) : `attestations.francais`
-- n'est pas touché, la clé seule change. C'est exactement le précédent déjà
-- établi côté alsacien — `cleDeForme()` (src/lib/dictionnaire.ts) neutralise
-- « [.;,\s]+$ » pour COMPARER deux formes (« Jüli. » vs « Jüli »), jamais pour
-- les réécrire. Le même raisonnement, appliqué au champ français.
--
-- Ce que la clé ne touche PAS, délibérément :
--   * les PARENTHÈSES. « griffon (vautour fauve) » n'est pas « griffon », et
--     « Bonhomme (le) » porte une précision qui relève du contexte. Les fusionner
--     réunirait des sens distincts — l'erreur du « +13 » du 24/08, transposée au
--     français. Une mesure combinée (parenthèses PUIS ponctuation) portait le
--     gain de 79 à 89 clés : dix de plus, pour un risque sans commune mesure.
--   * l'ACCENTUATION. La clé cesse d'unaccenter depuis le 24/08 (sur/sûr,
--     ville/Villé) et cela ne change pas ici.
--   * la RECHERCHE floue, qui garde `unaccent` — chercher « epreuve » doit
--     trouver « épreuve ».
--
-- Les 9 abréviations de toponymes de `culture_alsace` voient leur clé perdre son
-- point (« sainte-marie-aux-m ») : aucune autre source n'écrit ces formes
-- tronquées, aucune fusion possible, et le `francais` publié reste intact — seule
-- la clé de groupement change.

-- ============================================
-- 1. La clé devient une fonction nommée
-- ============================================
-- Elle était jusqu'ici une expression recopiée dans quatre fonctions, à chaque
-- redéfinition. C'est ainsi que la correction du 24/08 s'est perdue le 03/09,
-- quand entrees_par_statut() a été redéfinie pour exposer nb_sources en
-- recopiant l'ancienne expression (corrigé en 20260907000000). Une fonction
-- nommée rend la prochaine recopie inoffensive : il n'y a plus qu'un endroit
-- où la clé est définie.

CREATE OR REPLACE FUNCTION public.cle_francais(p_francais TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT regexp_replace(
    lower(btrim(coalesce(p_francais, ''))),
    '[.;,[:space:]]+$',
    ''
  );
$$;

COMMENT ON FUNCTION public.cle_francais(TEXT) IS
  'Clé de groupement d''un lemme français pour l''arbitrage : minuscules, espaces extérieurs et ponctuation finale neutralisés. NE désaccentue PAS (sur/sûr sont deux candidats, correctif du 24/08/2026) et NE touche PAS aux parenthèses (« griffon (vautour fauve) » n''est pas « griffon »). Sert à COMPARER, jamais à réécrire : attestations.francais et entrees.francais restent verbatim (règle 1). Pendant exact de cleDeForme() côté alsacien.';

GRANT EXECUTE ON FUNCTION public.cle_francais(TEXT) TO anon, authenticated;

-- ============================================
-- 2. candidats_arbitrage() : groupe sur la nouvelle clé
-- ============================================
-- Repart de la version en vigueur (20260904010000, 4 paramètres). Deux
-- changements seulement : la clé, et le choix du français représentatif.
--
-- `mode() WITHIN GROUP (ORDER BY a.francais)` rendait la forme la plus fréquente
-- du groupe — donc « Abattu. » aussi bien que « abattu ». Puisque le groupe
-- réunit désormais les deux, il faut choisir, et la forme SANS ponctuation
-- finale est celle qu'on publie : c'est celle qu'un visiteur cherchera. Même
-- logique que grouperParForme(), qui préfère la graphie sans ponctuation quand
-- une source l'écrit ainsi. La forme retenue reste toujours écrite par une
-- source — rien n'est fabriqué.
--
-- Signature inchangée : CREATE OR REPLACE suffit, les GRANT sont conservés.

CREATE OR REPLACE FUNCTION public.candidats_arbitrage(
  p_terme TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_type public.type_terme DEFAULT NULL
)
RETURNS TABLE (
  cle TEXT,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  nb_sources INTEGER,
  nb_attestations INTEGER,
  variantes JSONB,
  entree_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_terme TEXT := public.immutable_unaccent(lower(btrim(coalesce(p_terme, ''))));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  RETURN QUERY
  WITH groupes AS (
    SELECT
      public.cle_francais(a.francais) AS cle,
      -- Les formes sans ponctuation finale passent devant (false trie avant
      -- true), l'ordre alphabétique départage. Jamais une forme inventée.
      (array_agg(a.francais ORDER BY (a.francais ~ '[.;,[:space:]]$'), a.francais))[1] AS francais,
      a.contexte AS contexte,
      mode() WITHIN GROUP (ORDER BY a.type) AS type,
      count(DISTINCT a.source_id)::INTEGER AS nb_sources,
      count(*)::INTEGER AS nb_attestations,
      jsonb_agg(
        jsonb_build_object(
          'attestation_id', a.id,
          'alsacien', a.alsacien,
          'article', a.article,
          'alsacien_sans_article', a.alsacien_sans_article,
          'graphie_origine', a.graphie_origine,
          'region', a.region,
          'type', a.type,
          'source_id', s.id,
          'source_nom', s.nom,
          'source_type', s.type,
          'fiabilite', s.fiabilite,
          'reference', a.reference,
          -- Défaut de source signalé à l'extraction (20260907010000), NULL si
          -- la ligne est saine. Signale, ne corrige pas (règle 1).
          'anomalies', public.anomalies_de(a.reference),
          'votes', (
            SELECT count(*)
            FROM public.attestation_votes v
            WHERE v.attestation_id = a.id
          )
        )
        ORDER BY a.created_at
      ) AS variantes
    FROM public.attestations a
    JOIN public.sources s ON s.id = a.source_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.entree_attestations ea WHERE ea.attestation_id = a.id
      )
      AND (
        v_terme = ''
        OR public.immutable_unaccent(lower(a.francais)) LIKE '%' || v_terme || '%'
      )
      AND (p_type IS NULL OR a.type = p_type)
    GROUP BY public.cle_francais(a.francais), a.contexte
  )
  SELECT
    g.cle,
    g.francais,
    g.contexte,
    g.type,
    g.nb_sources,
    g.nb_attestations,
    g.variantes,
    (
      SELECT e.id
      FROM public.entrees e
      WHERE public.cle_francais(e.francais) = g.cle
        AND public.immutable_unaccent(lower(btrim(e.contexte)))
              = public.immutable_unaccent(lower(btrim(g.contexte)))
      LIMIT 1
    )
  FROM groupes g
  ORDER BY g.nb_sources DESC, g.nb_attestations DESC, g.francais
  LIMIT least(coalesce(p_limite, 50), 200)
  OFFSET greatest(coalesce(p_offset, 0), 0);
END;
$$;

COMMENT ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER, public.type_terme) IS
  'File d''arbitrage : attestations non encore retenues dans une entrée, groupées par (cle_francais(français), contexte). Les diacritiques et les parenthèses sont significatifs, la ponctuation finale ne l''est pas — « accepter » et « accepter. » sont un seul candidat depuis le 07/09/2026. nb_sources est le vrai score de recoupement au sens de la règle 2 (les votes n''y comptent pas). p_type filtre par type de terme.';

-- ============================================
-- 3. detail_candidat() : même clé, sinon les liens de la file cassent
-- ============================================
-- C'est la fonction que l'écran de détail appelle avec la clé rendue par la
-- file. Si les deux ne s'accordent pas sur la définition de la clé, chaque lien
-- mène à un candidat vide — précisément le bug corrigé le matin même sur
-- entrees_par_statut(). Repart de la version en vigueur (20260904000000).

CREATE OR REPLACE FUNCTION public.detail_candidat(
  p_cle TEXT,
  p_contexte TEXT DEFAULT ''
)
RETURNS TABLE (
  cle TEXT,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  nb_sources INTEGER,
  nb_attestations INTEGER,
  variantes JSONB,
  entree_id UUID,
  entree JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_contexte TEXT := btrim(coalesce(p_contexte, ''));
  v_entree public.entrees;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  SELECT * INTO v_entree
  FROM public.entrees e
  WHERE public.cle_francais(e.francais) = p_cle
    AND public.immutable_unaccent(lower(btrim(e.contexte))) = public.immutable_unaccent(lower(v_contexte));

  RETURN QUERY
  SELECT
    p_cle,
    coalesce(
      v_entree.francais,
      (array_agg(a.francais ORDER BY (a.francais ~ '[.;,[:space:]]$'), a.francais))[1]
    ),
    v_contexte,
    coalesce(v_entree.type, mode() WITHIN GROUP (ORDER BY a.type)),
    count(DISTINCT a.source_id)::INTEGER,
    count(*)::INTEGER,
    jsonb_agg(
      jsonb_build_object(
        'attestation_id', a.id,
        'alsacien', a.alsacien,
        'article', a.article,
        'alsacien_sans_article', a.alsacien_sans_article,
        'graphie_origine', a.graphie_origine,
        'region', a.region,
        'type', a.type,
        'source_id', s.id,
        'source_nom', s.nom,
        'source_type', s.type,
        'fiabilite', s.fiabilite,
        'reference', a.reference,
        'anomalies', public.anomalies_de(a.reference),
        'votes', (
          SELECT count(*)
          FROM public.attestation_votes v
          WHERE v.attestation_id = a.id
        ),
        'retenue', EXISTS (
          SELECT 1
          FROM public.entree_attestations ea
          WHERE ea.attestation_id = a.id
            AND ea.entree_id IS NOT DISTINCT FROM v_entree.id
        )
      )
      ORDER BY a.created_at
    ),
    v_entree.id,
    CASE WHEN v_entree.id IS NULL THEN NULL ELSE jsonb_build_object(
      'traductions', v_entree.traductions,
      'statut', v_entree.statut,
      'notes_arbitrage', v_entree.notes_arbitrage
    ) END
  FROM public.attestations a
  JOIN public.sources s ON s.id = a.source_id
  WHERE public.cle_francais(a.francais) = p_cle
    AND btrim(a.contexte) = v_contexte
    AND (
      NOT EXISTS (
        SELECT 1 FROM public.entree_attestations ea WHERE ea.attestation_id = a.id
      )
      OR EXISTS (
        SELECT 1 FROM public.entree_attestations ea
        WHERE ea.attestation_id = a.id AND ea.entree_id = v_entree.id
      )
    )
  HAVING count(*) > 0;
END;
$$;

-- ============================================
-- 4. entrees_par_statut() : la clé du lien « Entrées existantes »
-- ============================================
-- Corrigée le matin même (20260907000000) pour cesser de désaccentuer ; elle
-- passe ici à la fonction nommée, pour la même raison et une fois pour toutes.

CREATE OR REPLACE FUNCTION public.entrees_par_statut(
  p_statut public.statut_entree DEFAULT NULL,
  p_terme TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  cle TEXT,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  traductions JSONB,
  nb_attestations INTEGER,
  nb_sources INTEGER,
  statut public.statut_entree,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  -- Le filtre de recherche garde unaccent, la clé non : même distinction qu'en
  -- 20260824120000.
  v_terme TEXT := public.immutable_unaccent(lower(btrim(coalesce(p_terme, ''))));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    public.cle_francais(e.francais),
    e.francais,
    e.contexte,
    e.type,
    e.traductions,
    e.nb_attestations,
    e.nb_sources,
    e.statut,
    e.updated_at
  FROM public.entrees e
  WHERE (p_statut IS NULL OR e.statut = p_statut)
    AND (
      v_terme = ''
      OR public.immutable_unaccent(lower(e.francais)) LIKE '%' || v_terme || '%'
    )
  ORDER BY e.updated_at DESC
  LIMIT least(coalesce(p_limite, 50), 200)
  OFFSET greatest(coalesce(p_offset, 0), 0);
END;
$$;

-- ============================================
-- 5. propositions_orthal_candidat() : quatrième porteuse de la clé
-- ============================================
-- Le profil ed-orthal n'est pas activé et la table est vide, mais laisser cette
-- fonction sur l'ancienne expression rouvrirait la divergence que la fonction
-- nommée vient de fermer. Elle est appelée avec la clé de la file, comme
-- detail_candidat().

CREATE OR REPLACE FUNCTION public.propositions_orthal_candidat(
  p_cle TEXT,
  p_contexte TEXT DEFAULT ''
)
RETURNS TABLE (
  attestation_id UUID,
  graphie_origine TEXT,
  graphie_orthal TEXT,
  regles_appliquees TEXT,
  automate_nom TEXT,
  automate_version TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_contexte TEXT := btrim(coalesce(p_contexte, ''));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  RETURN QUERY
  SELECT
    p.attestation_id,
    a.graphie_origine,
    p.graphie_orthal,
    p.regles_appliquees,
    m.nom,
    m.version,
    p.created_at
  FROM public.propositions_orthal p
  JOIN public.attestations a ON a.id = p.attestation_id
  JOIN public.automates m ON m.code = p.automate_code
  WHERE public.cle_francais(a.francais) = p_cle
    AND btrim(a.contexte) = v_contexte
  ORDER BY a.created_at, p.created_at;
END;
$$;
