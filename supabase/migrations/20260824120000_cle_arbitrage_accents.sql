-- Clé d'arbitrage : ne plus confondre deux mots français distincts
-- ============================================================================
-- candidats_arbitrage() groupait sur immutable_unaccent(lower(btrim(francais))).
-- unaccent y servait à réunir les variantes d'accentuation d'un même mot
-- ('epreuve' / 'Épreuve' dans le scrape initial) ; il réunissait aussi, sans le
-- dire, des mots français DIFFÉRENTS : sur/sûr, ou/où, la/là, comte/comté,
-- tache/tâche, classe/classé, ville/Villé. 31 groupes sont dans ce cas.
--
-- Un tel groupe se présente à l'arbitre comme UN candidat mêlant deux sens sans
-- rapport, dont les traductions alsaciennes n'ont aucune raison de concorder.
-- Aucune entrée publiée n'en est fausse à ce jour — le critère d'accord sur la
-- forme les écarte de fait — mais le lexique général va s'ouvrir et le défaut
-- deviendrait actif : c'est le moment de le corriger, pas après.
--
-- La clé cesse donc d'unaccenter. Elle reste lower(btrim(...)) : la casse et les
-- espaces sont bien du bruit typographique, les diacritiques non — en français
-- ils distinguent des mots, comme en Orthal ils distinguent des sons.
--
-- Ce qui NE change PAS :
--   * la recherche floue (v_terme, LIKE, similarity) garde immutable_unaccent :
--     chercher « epreuve » doit toujours trouver « épreuve ». Elle s'écrit
--     lower(x) sans btrim, elle n'est donc pas touchée par ce correctif.
--   * l'index ux_entrees_francais_contexte_normalise, qui unaccente lui aussi.
--     Conséquence connue et assumée pour l'instant : 'sur' et 'sûr' ne peuvent
--     pas coexister dans entrees sans contexte distinct. Ça ne gêne qu'au moment
--     de publier les deux, et ça se traite alors par le contexte — la doctrine
--     sépare déjà les homonymes ainsi.
--   * la garde des 2 sources de arbitrer_entree() (règle 2), intouchée.
--
-- Vérifié avant écriture, sur les 27 179 attestations et les 169 entrées :
-- aucun accord de forme actuel ne repose sur la fusion par unaccent, et une
-- seule entrée publiée voit sa clé se scinder — « Villé », la commune du
-- Bas-Rhin, aujourd'hui confondue avec le mot « ville ». C'est exactement ce
-- que ce correctif vient séparer.
--
-- Coolify n'applique aucune migration : à passer à la main dans le SQL Editor.

CREATE OR REPLACE FUNCTION public.candidats_arbitrage(
  p_terme TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
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

  -- Le rattachement à une entrée existante se fait après le regroupement :
  -- Postgres refuse une sous-requête corrélée sur une colonne agrégée, même
  -- quand elle reprend mot pour mot l'expression du GROUP BY.
  RETURN QUERY
  WITH groupes AS (
    SELECT
      lower(btrim(a.francais)) AS cle,
      -- Graphie représentative : la plus attestée parmi les sources, et non la
      -- première venue — min() choisirait 'epreuve' plutôt que 'Épreuve'.
      mode() WITHIN GROUP (ORDER BY a.francais) AS francais,
      a.contexte AS contexte,
      mode() WITHIN GROUP (ORDER BY a.type) AS type,
      count(DISTINCT a.source_id)::INTEGER AS nb_sources,
      count(*)::INTEGER AS nb_attestations,
      jsonb_agg(
        jsonb_build_object(
          'attestation_id', a.id,
          'alsacien', a.alsacien,
          'graphie_origine', a.graphie_origine,
          'region', a.region,
          'type', a.type,
          'source_id', s.id,
          'source_nom', s.nom,
          'source_type', s.type,
          'fiabilite', s.fiabilite,
          'reference', a.reference,
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
    GROUP BY lower(btrim(a.francais)), a.contexte
  )
  SELECT
    g.cle,
    g.francais,
    g.contexte,
    g.type,
    g.nb_sources,
    g.nb_attestations,
    g.variantes,
    -- Une attestation neuve peut porter sur un mot déjà publié : sans ce
    -- rappel, l'admin croirait ouvrir un nouveau candidat et se heurterait à
    -- l'unicité (francais, contexte) au moment d'enregistrer.
    (
      SELECT e.id
      FROM public.entrees e
      WHERE lower(btrim(e.francais)) = g.cle
        AND public.immutable_unaccent(lower(btrim(e.contexte)))
              = public.immutable_unaccent(lower(btrim(g.contexte)))
      LIMIT 1
    )
  FROM groupes g
  -- Les candidats déjà recoupés remontent : c'est là qu'est le travail utile.
  ORDER BY g.nb_sources DESC, g.nb_attestations DESC, g.francais
  LIMIT least(coalesce(p_limite, 50), 200)
  OFFSET greatest(coalesce(p_offset, 0), 0);
END;
$$;

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
  WHERE lower(btrim(e.francais)) = p_cle
    AND public.immutable_unaccent(lower(btrim(e.contexte))) = public.immutable_unaccent(lower(v_contexte));

  RETURN QUERY
  SELECT
    p_cle,
    coalesce(v_entree.francais, mode() WITHIN GROUP (ORDER BY a.francais)),
    v_contexte,
    coalesce(v_entree.type, mode() WITHIN GROUP (ORDER BY a.type)),
    count(DISTINCT a.source_id)::INTEGER,
    count(*)::INTEGER,
    jsonb_agg(
      jsonb_build_object(
        'attestation_id', a.id,
        'alsacien', a.alsacien,
        'graphie_origine', a.graphie_origine,
        'region', a.region,
        'type', a.type,
        'source_id', s.id,
        'source_nom', s.nom,
        'source_type', s.type,
        'fiabilite', s.fiabilite,
        'reference', a.reference,
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
  WHERE lower(btrim(a.francais)) = p_cle
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
  statut public.statut_entree,
  updated_at TIMESTAMPTZ
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
  SELECT
    e.id,
    lower(btrim(e.francais)),
    e.francais,
    e.contexte,
    e.type,
    e.traductions,
    e.nb_attestations,
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
  WHERE lower(btrim(a.francais)) = p_cle
    AND btrim(a.contexte) = v_contexte
  ORDER BY a.created_at, p.created_at;
END;
$$;

COMMENT ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER) IS
  'File d''arbitrage : attestations non encore retenues dans une entrée, groupées par (français en minuscules, contexte). Les diacritiques sont significatifs — sur et sûr sont deux candidats, pas un. nb_sources est le vrai score de recoupement au sens de la règle 2 (les votes n''y comptent pas).';
