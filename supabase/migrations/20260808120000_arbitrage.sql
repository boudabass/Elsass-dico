-- ============================================
-- Arbitrage des attestations et recherche publique
-- ============================================
-- Le schéma à deux niveaux existait, mais rien ne faisait passer une
-- attestation dans entrees, et rien ne lisait entrees. Cette migration fournit
-- les deux maillons manquants :
--   - côté admin, une file de candidats au recoupement et une fonction
--     d'arbitrage transactionnelle ;
--   - côté public, une recherche dans les deux sens sur les entrées validées.
--
-- Toutes les fonctions d'arbitrage sont SECURITY DEFINER gardées par
-- is_admin(), même idiome que sources_entree() et mes_contributions(). Le
-- motif est celui déjà documenté dans la migration contributions : une
-- sous-requête placée dans une policy est elle-même soumise au RLS de la table
-- qu'elle interroge, et une garde écrite ainsi échouerait OUVERTE.

-- ============================================
-- Index de regroupement des attestations
-- ============================================
-- L'index trgm existant (idx_attestations_francais_trgm) sert la recherche
-- floue, pas le GROUP BY sur la clé normalisée dont la file d'arbitrage a
-- besoin. Réutilise public.immutable_unaccent, déjà IMMUTABLE.

CREATE INDEX IF NOT EXISTS idx_attestations_francais_normalise
  ON public.attestations (
    public.immutable_unaccent(lower(btrim(francais))),
    contexte
  );

-- ============================================
-- Recherche en alsacien : colonne générée + index
-- ============================================
-- traductions est un tableau JSONB ; l'index GIN posé dessus répond aux
-- opérateurs de conteneur, pas à la recherche floue. On matérialise donc les
-- formes alsaciennes dans une colonne texte générée, indexable en trigrammes.

CREATE OR REPLACE FUNCTION public.alsacien_concatene(traductions JSONB)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT coalesce(string_agg(elem->>'alsacien', ' '), '')
  FROM jsonb_array_elements(traductions) elem
  WHERE elem->>'alsacien' IS NOT NULL
$$;

COMMENT ON FUNCTION public.alsacien_concatene(JSONB) IS
  'Concatène les formes alsaciennes d''un tableau de traductions. IMMUTABLE, donc utilisable dans une colonne générée et un index (même idiome que traductions_regions_valides).';

ALTER TABLE public.entrees
  ADD COLUMN IF NOT EXISTS alsacien_recherche TEXT
  GENERATED ALWAYS AS (public.alsacien_concatene(traductions)) STORED;

COMMENT ON COLUMN public.entrees.alsacien_recherche IS
  'Dérivée de traductions, jamais écrite à la main : support de la recherche alsacien -> français.';

CREATE INDEX IF NOT EXISTS idx_entrees_alsacien_trgm
  ON public.entrees
  USING GIN (public.immutable_unaccent(lower(alsacien_recherche)) extensions.gin_trgm_ops);

-- ============================================
-- File d'arbitrage
-- ============================================
-- Regroupe les attestations qui ne sont rattachées à aucune entrée, par clé
-- normalisée (francais sans accents ni casse) + contexte : c'est exactement la
-- clé d'unicité de entrees (ux_entrees_francais_contexte_normalise), donc deux
-- sources qui écrivent "Bonjour" et "bonjour" tombent bien dans le même
-- candidat, ce qui est le sens même du recoupement de la règle 2.

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
      public.immutable_unaccent(lower(btrim(a.francais))) AS cle,
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
    GROUP BY public.immutable_unaccent(lower(btrim(a.francais))), a.contexte
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
      WHERE public.immutable_unaccent(lower(btrim(e.francais))) = g.cle
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

COMMENT ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER) IS
  'File d''arbitrage : attestations non encore retenues dans une entrée, groupées par clé normalisée + contexte. nb_sources est le vrai score de recoupement au sens de la règle 2 (les votes n''y comptent pas).';

-- Détail d'un seul candidat. Contrairement à candidats_arbitrage, inclut aussi
-- les attestations DÉJÀ retenues dans l'entrée de même clé : sans elles,
-- rouvrir un arbitrage reviendrait à décrocher en silence ce qui l'avait fondé.
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
  WHERE public.immutable_unaccent(lower(btrim(e.francais))) = p_cle
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
  WHERE public.immutable_unaccent(lower(btrim(a.francais))) = p_cle
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
-- Arbitrage proprement dit
-- ============================================
-- Une entrée, ses liens de traçabilité et son score doivent être posés
-- ensemble ou pas du tout : trois appels PostgREST successifs laisseraient la
-- base dans un état où entrees affirme un recoupement que entree_attestations
-- ne prouve pas.

CREATE OR REPLACE FUNCTION public.arbitrer_entree(
  p_francais TEXT,
  p_contexte TEXT,
  p_type public.type_terme,
  p_traductions JSONB,
  p_attestation_ids UUID[],
  p_statut public.statut_entree,
  p_notes TEXT DEFAULT NULL,
  p_entree_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entree_id UUID;
  v_nb_sources INTEGER;
  v_nb_attestations INTEGER;
  v_notes TEXT := nullif(btrim(coalesce(p_notes, '')), '');
  v_francais TEXT := btrim(coalesce(p_francais, ''));
  v_contexte TEXT := btrim(coalesce(p_contexte, ''));
  v_valide_par UUID;
  v_valide_le TIMESTAMPTZ;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Arbitrage réservé aux administrateurs';
  END IF;

  IF v_francais = '' THEN
    RAISE EXCEPTION 'Le français est obligatoire';
  END IF;

  IF jsonb_typeof(p_traductions) <> 'array' THEN
    RAISE EXCEPTION 'traductions doit être un tableau JSON';
  END IF;

  -- Une traduction sans forme alsacienne n'est pas une traduction. Le CHECK de
  -- la table ne vérifie que la forme du tableau et les régions.
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_traductions) elem
    WHERE nullif(btrim(coalesce(elem->>'alsacien', '')), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Chaque traduction doit porter une forme alsacienne';
  END IF;

  IF coalesce(array_length(p_attestation_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Une entrée doit être fondée sur au moins une attestation (règle 3)';
  END IF;

  SELECT count(DISTINCT a.source_id)::INTEGER, count(*)::INTEGER
    INTO v_nb_sources, v_nb_attestations
  FROM public.attestations a
  WHERE a.id = ANY (p_attestation_ids);

  IF v_nb_attestations <> array_length(p_attestation_ids, 1) THEN
    RAISE EXCEPTION 'Attestation inconnue dans la sélection';
  END IF;

  -- Règle 2 de CLAUDE.md, avec l'exception décidée le 07/08/2026 : un admin
  -- peut publier depuis une source unique s'il en juge ainsi, mais alors il
  -- doit écrire pourquoi. La justification est exigée ici, pas seulement dans
  -- l'interface : c'est ce qui distingue le témoignage arbitré d'un locuteur
  -- de la reprise en masse d'une source scrapée.
  IF p_statut = 'valide' AND v_nb_sources < 2 AND v_notes IS NULL THEN
    RAISE EXCEPTION
      'Publication sur source unique : une note d''arbitrage est obligatoire (règle 2)';
  END IF;

  IF p_statut = 'valide' THEN
    v_valide_par := auth.uid();
    v_valide_le := now();
  END IF;

  IF p_entree_id IS NULL THEN
    INSERT INTO public.entrees (
      francais, contexte, type, traductions,
      nb_attestations, statut, notes_arbitrage, valide_par, valide_le
    )
    VALUES (
      v_francais, v_contexte, p_type, p_traductions,
      v_nb_attestations, p_statut, v_notes, v_valide_par, v_valide_le
    )
    RETURNING id INTO v_entree_id;
  ELSE
    UPDATE public.entrees SET
      francais = v_francais,
      contexte = v_contexte,
      type = p_type,
      traductions = p_traductions,
      nb_attestations = v_nb_attestations,
      statut = p_statut,
      notes_arbitrage = v_notes,
      valide_par = v_valide_par,
      valide_le = v_valide_le
    WHERE id = p_entree_id
    RETURNING id INTO v_entree_id;

    IF v_entree_id IS NULL THEN
      RAISE EXCEPTION 'Entrée introuvable : %', p_entree_id;
    END IF;
  END IF;

  -- Traçabilité : on remplace intégralement l'ensemble des liens, pour que
  -- entree_attestations décrive toujours la décision courante et non un
  -- empilement d'arbitrages successifs.
  DELETE FROM public.entree_attestations
  WHERE entree_id = v_entree_id
    AND attestation_id <> ALL (p_attestation_ids);

  INSERT INTO public.entree_attestations (entree_id, attestation_id)
  SELECT v_entree_id, unnest(p_attestation_ids)
  ON CONFLICT DO NOTHING;

  RETURN v_entree_id;
END;
$$;

COMMENT ON FUNCTION public.arbitrer_entree(TEXT, TEXT, public.type_terme, JSONB, UUID[], public.statut_entree, TEXT, UUID) IS
  'Crée ou met à jour une entrée, remplace ses liens de traçabilité et recalcule nb_attestations, en une transaction. Refuse la validation sous 2 sources distinctes sans note d''arbitrage (règle 2 + exception du 07/08/2026).';

-- Liste admin des entrées existantes, pour reprendre un arbitrage.
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
    public.immutable_unaccent(lower(btrim(e.francais))),
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

-- ============================================
-- Recherche publique
-- ============================================
-- Volontairement PAS SECURITY DEFINER : le RLS
-- lecture_publique_entrees_validees est la barrière, et la restriction
-- explicite à statut='valide' évite en plus qu'un contributeur connecté (qui a
-- le droit de lire les brouillons) voie du non-validé sur la page d'accueil.

CREATE OR REPLACE FUNCTION public.rechercher_entrees(
  p_terme TEXT,
  p_limite INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  francais TEXT,
  contexte TEXT,
  type public.type_terme,
  traductions JSONB,
  nb_attestations INTEGER,
  score REAL
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH terme AS (
    SELECT public.immutable_unaccent(lower(btrim(coalesce(p_terme, '')))) AS q
  )
  SELECT
    e.id,
    e.francais,
    e.contexte,
    e.type,
    e.traductions,
    e.nb_attestations,
    greatest(
      similarity(public.immutable_unaccent(lower(e.francais)), terme.q),
      similarity(public.immutable_unaccent(lower(e.alsacien_recherche)), terme.q)
    ) AS pertinence
  FROM public.entrees e, terme
  WHERE terme.q <> ''
    AND e.statut = 'valide'
    AND (
      public.immutable_unaccent(lower(e.francais)) LIKE terme.q || '%'
      OR public.immutable_unaccent(lower(e.alsacien_recherche)) LIKE '%' || terme.q || '%'
      OR public.immutable_unaccent(lower(e.francais)) % terme.q
      OR public.immutable_unaccent(lower(e.alsacien_recherche)) % terme.q
    )
  ORDER BY pertinence DESC, e.francais
  LIMIT least(coalesce(p_limite, 30), 100);
$$;

COMMENT ON FUNCTION public.rechercher_entrees(TEXT, INTEGER) IS
  'Recherche floue dans les deux sens sur les entrées validées uniquement. Non SECURITY DEFINER : le RLS reste la barrière.';

-- ============================================
-- Droits
-- ============================================
-- Les fonctions d'arbitrage portent leur propre garde is_admin(), mais on ne
-- laisse pas anon les appeler pour rien.

REVOKE EXECUTE ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.detail_candidat(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.arbitrer_entree(TEXT, TEXT, public.type_terme, JSONB, UUID[], public.statut_entree, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.entrees_par_statut(public.statut_entree, TEXT, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.candidats_arbitrage(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.detail_candidat(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arbitrer_entree(TEXT, TEXT, public.type_terme, JSONB, UUID[], public.statut_entree, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.entrees_par_statut(public.statut_entree, TEXT, INTEGER, INTEGER) TO authenticated;

GRANT EXECUTE ON FUNCTION public.rechercher_entrees(TEXT, INTEGER) TO anon, authenticated;
